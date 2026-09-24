import { getCurrentUser } from "@/lib/auth/session";
import { loadAccountView } from "@/lib/account-view";
import { handler, json } from "@/lib/security/request";

export const GET = handler(async () => {
  const user = await getCurrentUser();
  if (!user) return json({ authenticated: false });
  return json({ authenticated: true, account: await loadAccountView(user) });
});
