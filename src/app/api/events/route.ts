import { z } from "zod";
import { isClientEvent } from "@/lib/analytics/events";
import { trackServer } from "@/lib/analytics/server";
import { rateLimit } from "@/lib/security/rate-limit";
import { assertSameOrigin, ipHash, readBodyLimited } from "@/lib/security/request";

const primitive = z.union([z.string().max(120), z.number().finite(), z.boolean(), z.null()]);
const schema = z.object({
  name: z.string().max(40),
  anonId: z.string().max(64).optional().nullable(),
  path: z
    .string()
    .max(200)
    .regex(/^\/[A-Za-z0-9\-_/.]*$/)
    .optional()
    .nullable(),
  referrer: z.string().max(300).optional().nullable(),
  utm: z
    .object({
      source: z.string().max(100).nullable().optional(),
      medium: z.string().max(100).nullable().optional(),
      campaign: z.string().max(100).nullable().optional(),
    })
    .optional(),
  props: z.record(z.string().max(40), primitive).optional(),
});

/** First-party analytics intake. Always answers 204 so tracking can never break a page. */
export async function POST(req: Request) {
  try {
    // Beacons are same-origin: anything else is ignored (protects the funnel metrics).
    assertSameOrigin(req);
    const raw = await readBodyLimited(req, 4096);
    const parsed = schema.safeParse(JSON.parse(raw));
    if (!parsed.success || !isClientEvent(parsed.data.name)) return new Response(null, { status: 204 });
    const props = parsed.data.props ?? {};
    if (Object.keys(props).length > 12) return new Response(null, { status: 204 });
    const rl = await rateLimit(`events:${ipHash(req)}`, 300, 3600);
    if (!rl.ok) return new Response(null, { status: 204 });
    // Audience measurement stays anonymous: browser events are never linked to an account
    // (condition of the CNIL consent exemption).
    await trackServer(parsed.data.name, {
      anonId: parsed.data.anonId,
      path: parsed.data.path,
      // Keep only the referring origin, never a full URL with its query string.
      referrer: referrerOrigin(parsed.data.referrer),
      utm: parsed.data.utm,
      props,
    });
  } catch {
    /* swallow */
  }
  return new Response(null, { status: 204 });
}

function referrerOrigin(v: string | null | undefined): string | null {
  if (!v) return null;
  try {
    return new URL(v).origin;
  } catch {
    return null;
  }
}
