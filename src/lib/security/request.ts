import "server-only";
import { NextResponse } from "next/server";
import { z } from "zod";
import { env } from "@/lib/env";
import { sha256 } from "./tokens";

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
    public code = "error",
    public headers: Record<string, string> = {},
  ) {
    super(message);
  }
}

/**
 * CSRF defence for state-changing requests: the Origin (or Referer) must be exactly
 * the configured APP_URL origin (plus optional EXTRA_ALLOWED_ORIGINS). The Host header
 * is never trusted for this decision.
 */
export function assertSameOrigin(req: Request) {
  const allowed = new Set([new URL(env().APP_URL).origin, ...extraOrigins()]);
  const origin = req.headers.get("origin");
  const referer = req.headers.get("referer");
  const source = origin ?? (referer ? safeOrigin(referer) : null);
  if (!source) throw new HttpError(403, "Origine de la requête manquante.", "csrf");
  if (!allowed.has(source)) throw new HttpError(403, "Origine de la requête non autorisée.", "csrf");
}

function extraOrigins(): string[] {
  return (process.env.EXTRA_ALLOWED_ORIGINS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => safeOrigin(s))
    .filter((s): s is string => !!s);
}

function safeOrigin(url: string): string | null {
  try {
    return new URL(url).origin;
  } catch {
    return null;
  }
}

/**
 * Client IP as seen by our reverse proxy. The left-most X-Forwarded-For entries can be
 * forged by the client, so we read the entry appended by the trusted proxy hop(s).
 * TRUSTED_PROXY_HOPS=0 means "no proxy": forwarding headers are ignored entirely
 * (the app must then sit behind a proxy for per-IP limits to be meaningful).
 */
export function clientIp(req: Request): string {
  const hops = Number(process.env.TRUSTED_PROXY_HOPS ?? "1");
  if (!Number.isFinite(hops) || hops <= 0) return "direct";
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) {
    const parts = fwd
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const ip = parts[Math.max(0, parts.length - hops)];
    if (ip && ip.length <= 64) return ip;
  }
  return "unknown";
}

/** IPs are only ever stored hashed (salted with a key derived from the app secret). */
export function ipHash(req: Request): string {
  return sha256(`${deriveKey("ip-hash")}:${clientIp(req)}`).slice(0, 32);
}

/** Purpose-specific key derived from AUTH_SECRET (never reuse the raw secret across purposes). */
export function deriveKey(purpose: string): string {
  return sha256(`releveo:${purpose}:${env().AUTH_SECRET}`);
}

/**
 * Reads the request body as text while enforcing a byte limit on the stream itself,
 * so a chunked request without Content-Length cannot make us buffer megabytes.
 */
export async function readBodyLimited(req: Request, maxBytes: number): Promise<string> {
  const len = Number(req.headers.get("content-length") ?? "0");
  if (len > maxBytes) throw new HttpError(413, "Requête trop volumineuse.", "too_large");
  if (!req.body) return "";
  const reader = req.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > maxBytes) {
        await reader.cancel().catch(() => {});
        throw new HttpError(413, "Requête trop volumineuse.", "too_large");
      }
      chunks.push(value);
    }
  } catch (e) {
    if (e instanceof HttpError) throw e;
    throw new HttpError(400, "Requête invalide.", "bad_request");
  }
  const buf = new Uint8Array(total);
  let off = 0;
  for (const c of chunks) {
    buf.set(c, off);
    off += c.byteLength;
  }
  return new TextDecoder().decode(buf);
}

export async function readJson<T extends z.ZodType>(req: Request, schema: T, maxBytes = 32 * 1024): Promise<z.infer<T>> {
  const raw = await readBodyLimited(req, maxBytes);
  let data: unknown;
  try {
    data = JSON.parse(raw || "{}");
  } catch {
    throw new HttpError(400, "JSON invalide.", "bad_json");
  }
  const parsed = schema.safeParse(data);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    throw new HttpError(422, first?.message ?? "Données invalides.", "validation");
  }
  return parsed.data;
}

export function json(data: unknown, init: number | ResponseInit = 200) {
  const initObj = typeof init === "number" ? { status: init } : init;
  return NextResponse.json(data, {
    ...initObj,
    headers: { "Cache-Control": "no-store", ...(initObj.headers ?? {}) },
  });
}

/** Wraps a route handler: consistent JSON errors, no stack traces leaked to clients. */
export function handler<A extends unknown[]>(fn: (req: Request, ...args: A) => Promise<Response>) {
  return async (req: Request, ...args: A): Promise<Response> => {
    try {
      return await fn(req, ...args);
    } catch (e) {
      if (e instanceof HttpError) {
        return json({ error: e.message, code: e.code }, { status: e.status, headers: e.headers });
      }
      console.error("[api] unhandled error", e);
      return json({ error: "Une erreur inattendue est survenue. Réessayez dans un instant.", code: "internal" }, 500);
    }
  };
}
