import { z } from "zod";
import { isClientEvent } from "@/lib/analytics/events";
import { trackServer } from "@/lib/analytics/server";
import { getCurrentUser } from "@/lib/auth/session";
import { rateLimit } from "@/lib/security/rate-limit";
import { ipHash } from "@/lib/security/request";

const primitive = z.union([z.string().max(120), z.number().finite(), z.boolean(), z.null()]);
const schema = z.object({
  name: z.string().max(40),
  anonId: z.string().max(64).optional().nullable(),
  path: z.string().max(200).optional().nullable(),
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
    const raw = await req.text();
    if (raw.length > 4096) return new Response(null, { status: 204 });
    const parsed = schema.safeParse(JSON.parse(raw));
    if (!parsed.success || !isClientEvent(parsed.data.name)) return new Response(null, { status: 204 });
    const props = parsed.data.props ?? {};
    if (Object.keys(props).length > 12) return new Response(null, { status: 204 });
    const rl = await rateLimit(`events:${ipHash(req)}`, 300, 3600);
    if (!rl.ok) return new Response(null, { status: 204 });
    const user = await getCurrentUser().catch(() => null);
    await trackServer(parsed.data.name, {
      userId: user?.id,
      anonId: parsed.data.anonId,
      path: parsed.data.path,
      referrer: parsed.data.referrer,
      utm: parsed.data.utm,
      props,
    });
  } catch {
    /* swallow */
  }
  return new Response(null, { status: 204 });
}
