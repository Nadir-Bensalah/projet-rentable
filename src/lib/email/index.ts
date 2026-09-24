import "server-only";
import { env } from "@/lib/env";
import { query } from "@/lib/db";
import { renderTemplate, type EmailContent, type TemplateData, type TemplateName } from "./templates";

export interface OutgoingEmail extends EmailContent {
  to: string;
  replyTo?: string;
}

export interface EmailProvider {
  name: string;
  send(msg: OutgoingEmail): Promise<{ id?: string }>;
}

/** Development / test provider: prints the e-mail and keeps it in memory for tests. */
export const sentInMemory: OutgoingEmail[] = [];
const consoleProvider: EmailProvider = {
  name: "console",
  async send(msg) {
    sentInMemory.push(msg);
    if (sentInMemory.length > 200) sentInMemory.shift();
    if (env().NODE_ENV !== "test") {
      console.info(`[email:console] to=${msg.to} subject="${msg.subject}"\n${msg.text}\n`);
    }
    return { id: `console-${Date.now()}` };
  },
};

const resendProvider: EmailProvider = {
  name: "resend",
  async send(msg) {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${env().RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: env().EMAIL_FROM,
        to: [msg.to],
        subject: msg.subject,
        html: msg.html,
        text: msg.text,
        reply_to: msg.replyTo ?? env().EMAIL_REPLY_TO,
      }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) throw new Error(`Resend error ${res.status}: ${(await res.text()).slice(0, 300)}`);
    const body = (await res.json()) as { id?: string };
    return { id: body.id };
  },
};

const smtpProvider: EmailProvider = {
  name: "smtp",
  async send(msg) {
    // Loaded lazily so the dependency is only required when SMTP is configured.
    const nodemailer = await import("nodemailer").catch(() => {
      throw new Error("EMAIL_PROVIDER=smtp requires the 'nodemailer' package (npm i nodemailer)");
    });
    const transport = nodemailer.createTransport(env().SMTP_URL);
    const info = await transport.sendMail({
      from: env().EMAIL_FROM,
      to: msg.to,
      subject: msg.subject,
      html: msg.html,
      text: msg.text,
      replyTo: msg.replyTo ?? env().EMAIL_REPLY_TO,
    });
    return { id: info.messageId };
  },
};

export function emailProvider(): EmailProvider {
  switch (env().EMAIL_PROVIDER) {
    case "resend":
      return resendProvider;
    case "smtp":
      return smtpProvider;
    default:
      return consoleProvider;
  }
}

/**
 * Sends a templated e-mail and logs it. With a dedupeKey, the same e-mail is never
 * sent twice (lifecycle e-mails, webhook retries). Failures are logged, never thrown,
 * so an e-mail outage cannot break sign-up or payment flows.
 */
export async function sendEmail<T extends TemplateName>(
  name: T,
  to: string,
  data: TemplateData[T],
  opts: { userId?: string | null; dedupeKey?: string; replyTo?: string; logAddress?: boolean } = {},
): Promise<boolean> {
  const provider = emailProvider();
  const logged = opts.logAddress === false ? "[supprimé]" : to;
  if (opts.dedupeKey) {
    const claimed = await query(
      `INSERT INTO email_log (user_id, to_address, template, dedupe_key, provider, status)
       VALUES ($1, $2, $3, $4, $5, 'pending') ON CONFLICT (dedupe_key) WHERE dedupe_key IS NOT NULL DO NOTHING RETURNING id`,
      [opts.userId ?? null, logged, name, opts.dedupeKey, provider.name],
    );
    if (!claimed.length) return false;
  }
  const content = renderTemplate(name, data);
  try {
    const { id } = await provider.send({ ...content, to, replyTo: opts.replyTo });
    if (opts.dedupeKey) {
      await query(`UPDATE email_log SET status = 'sent', provider_id = $2 WHERE dedupe_key = $1`, [opts.dedupeKey, id ?? null]);
    } else {
      await query(
        `INSERT INTO email_log (user_id, to_address, template, provider, provider_id, status) VALUES ($1, $2, $3, $4, $5, 'sent')`,
        [opts.userId ?? null, logged, name, provider.name, id ?? null],
      );
    }
    return true;
  } catch (e) {
    const error = e instanceof Error ? e.message.slice(0, 500) : "unknown";
    console.error(`[email] ${name} failed: ${error}`);
    if (opts.dedupeKey) {
      // Release the dedupe key so a later retry can send it.
      await query(`DELETE FROM email_log WHERE dedupe_key = $1`, [opts.dedupeKey]).catch(() => {});
    }
    await query(`INSERT INTO email_log (user_id, to_address, template, provider, status, error) VALUES ($1, $2, $3, $4, 'failed', $5)`, [
      opts.userId ?? null,
      logged,
      name,
      provider.name,
      error,
    ]).catch(() => {});
    return false;
  }
}
