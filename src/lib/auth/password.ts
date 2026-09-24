import { randomBytes, scrypt as scryptCb, timingSafeEqual, type ScryptOptions } from "node:crypto";

// OWASP-recommended scrypt parameters (N=2^15, r=8, p=3) — ~32 MiB per hash.
const N = 2 ** 15;
const R = 8;
const P = 3;
const KEYLEN = 32;
const MAXMEM = 64 * 1024 * 1024;

function scrypt(password: string, salt: Buffer, keylen: number, opts: ScryptOptions): Promise<Buffer> {
  return new Promise((resolve, reject) =>
    scryptCb(password.normalize("NFKC"), salt, keylen, opts, (err, key) => (err ? reject(err) : resolve(key))),
  );
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await scrypt(password, salt, KEYLEN, { N, r: R, p: P, maxmem: MAXMEM });
  return `scrypt$${N}$${R}$${P}$${salt.toString("base64url")}$${key.toString("base64url")}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split("$");
  if (parts.length !== 6 || parts[0] !== "scrypt") return false;
  const [, n, r, p, saltB64, keyB64] = parts;
  const expected = Buffer.from(keyB64, "base64url");
  const key = await scrypt(password, Buffer.from(saltB64, "base64url"), expected.length, {
    N: Number(n),
    r: Number(r),
    p: Number(p),
    maxmem: MAXMEM,
  });
  return key.length === expected.length && timingSafeEqual(key, expected);
}

/** A precomputed hash used to keep login timing constant when the e-mail is unknown. */
let dummyHash: Promise<string> | undefined;
export function dummyPasswordHash() {
  if (!dummyHash) dummyHash = hashPassword(randomBytes(16).toString("hex"));
  return dummyHash;
}

export const PASSWORD_MIN = 10;
export const PASSWORD_MAX = 200;

export function passwordProblem(password: string, email?: string): string | null {
  if (password.length < PASSWORD_MIN) return `Le mot de passe doit contenir au moins ${PASSWORD_MIN} caractères.`;
  if (password.length > PASSWORD_MAX) return "Le mot de passe est trop long.";
  if (email && password.toLowerCase().includes(email.split("@")[0].toLowerCase()) && email.split("@")[0].length >= 4) {
    return "Le mot de passe ne doit pas contenir votre adresse e-mail.";
  }
  const common = ["motdepasse", "password", "azertyuiop", "1234567890", "0123456789", "qwertyuiop", "azerty1234"];
  if (common.some((c) => password.toLowerCase().includes(c))) return "Ce mot de passe est trop courant.";
  return null;
}
