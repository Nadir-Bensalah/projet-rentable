import "server-only";
import { HttpError } from "@/lib/security/request";
import { getCurrentUser, type SessionUser } from "./session";

export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) throw new HttpError(401, "Vous devez être connecté.", "unauthenticated");
  return user;
}
