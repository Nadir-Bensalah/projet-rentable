import { queryOne } from "@/lib/db";
import { configurationProblems } from "@/lib/env";

export const dynamic = "force-dynamic";

const noStore = { "Cache-Control": "no-store" };

export async function GET() {
  // Only the count is exposed: problem details may name configuration keys.
  const problems = configurationProblems();
  if (problems.length) {
    console.error("[health] configuration problems:\n- " + problems.join("\n- "));
    return Response.json({ status: "degraded", configuration: "invalid", problems: problems.length }, { status: 503, headers: noStore });
  }
  try {
    await queryOne("SELECT 1");
    return Response.json({ status: "ok" }, { headers: noStore });
  } catch {
    return Response.json({ status: "degraded", database: "unreachable" }, { status: 503, headers: noStore });
  }
}
