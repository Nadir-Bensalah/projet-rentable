import { z } from "zod";
import { passwordProblem } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";
import { signup } from "@/lib/auth/service";
import { rateLimit } from "@/lib/security/rate-limit";
import { HttpError, assertSameOrigin, handler, ipHash, json, readJson } from "@/lib/security/request";

const schema = z.object({
  email: z.string().trim().max(254).email("Adresse e-mail invalide."),
  password: z.string().max(200),
  name: z.string().trim().max(80).optional().nullable(),
  marketingOptIn: z.boolean().optional(),
  acceptTerms: z.literal(true, { message: "Vous devez accepter les conditions d'utilisation." }),
  referralCode: z.string().trim().max(20).optional().nullable(),
  firstTouch: z
    .object({
      source: z.string().max(100).nullable().optional(),
      medium: z.string().max(100).nullable().optional(),
      campaign: z.string().max(100).nullable().optional(),
      landing: z.string().max(200).nullable().optional(),
    })
    .optional()
    .nullable(),
});

export const POST = handler(async (req) => {
  assertSameOrigin(req);
  const ip = ipHash(req);
  const rl = await rateLimit(`signup:${ip}`, 8, 3600);
  if (!rl.ok)
    throw new HttpError(429, "Trop de tentatives. Réessayez plus tard.", "rate_limited", { "Retry-After": String(rl.retryAfter) });
  const body = await readJson(req, schema);
  const problem = passwordProblem(body.password, body.email);
  if (problem) throw new HttpError(422, problem, "weak_password");
  const res = await signup({
    email: body.email,
    password: body.password,
    name: body.name,
    marketingOptIn: body.marketingOptIn,
    referralCode: body.referralCode?.toUpperCase(),
    firstTouch: body.firstTouch ?? null,
  });
  if (res.existed || !res.user) {
    throw new HttpError(
      409,
      "Un compte existe déjà avec cette adresse. Connectez-vous ou réinitialisez votre mot de passe.",
      "email_taken",
    );
  }
  await createSession(res.user.id, { userAgent: req.headers.get("user-agent"), ipHash: ip });
  return json({ ok: true, user: { id: res.user.id, email: res.user.email, emailVerified: false } }, 201);
});
