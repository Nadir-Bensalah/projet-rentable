import { requireUser } from "@/lib/auth/guard";
import { exportUserData } from "@/lib/auth/service";
import { rateLimit } from "@/lib/security/rate-limit";
import { HttpError, handler } from "@/lib/security/request";

export const GET = handler(async () => {
  const user = await requireUser();
  const rl = await rateLimit(`export:${user.id}`, 10, 3600);
  if (!rl.ok) throw new HttpError(429, "Trop d'exports. Réessayez plus tard.", "rate_limited");
  const data = await exportUserData(user.id);
  return new Response(JSON.stringify(data, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="releveo-mes-donnees-${new Date().toISOString().slice(0, 10)}.json"`,
      "Cache-Control": "no-store",
    },
  });
});
