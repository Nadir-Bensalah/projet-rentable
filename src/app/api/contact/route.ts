import { z } from "zod";
import { env } from "@/lib/env";
import { getCurrentUser } from "@/lib/auth/session";
import { query } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { rateLimit } from "@/lib/security/rate-limit";
import { HttpError, assertSameOrigin, handler, ipHash, json, readJson } from "@/lib/security/request";

const schema = z.object({
  email: z.string().trim().max(254).email("Adresse e-mail invalide."),
  topic: z.enum(["question", "facturation", "releve-non-reconnu", "partenariat", "donnees-personnelles", "autre"]),
  message: z.string().trim().min(10, "Votre message est trop court.").max(5000, "Votre message est trop long."),
  website: z.string().max(0).optional(), // honeypot
});

const TOPIC_LABELS: Record<string, string> = {
  question: "Question sur le produit",
  facturation: "Facturation et abonnement",
  "releve-non-reconnu": "Relevé mal lu",
  partenariat: "Cabinet / partenariat",
  "donnees-personnelles": "Données personnelles",
  autre: "Autre",
};

export const POST = handler(async (req) => {
  assertSameOrigin(req);
  const rl = await rateLimit(`contact:${ipHash(req)}`, 5, 3600);
  if (!rl.ok) throw new HttpError(429, "Vous avez envoyé plusieurs messages. Réessayez plus tard.", "rate_limited");
  const body = await readJson(req, schema, 16 * 1024);
  const user = await getCurrentUser();
  await query(`INSERT INTO contact_messages (user_id, email, topic, message) VALUES ($1, $2, $3, $4)`, [
    user?.id ?? null,
    body.email,
    body.topic,
    body.message,
  ]);
  await sendEmail(
    "support_message",
    env().SUPPORT_EMAIL,
    { from: body.email, topic: TOPIC_LABELS[body.topic] ?? body.topic, message: body.message },
    { replyTo: body.email },
  );
  return json({ ok: true });
});
