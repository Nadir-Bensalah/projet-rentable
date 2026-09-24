import { queryOne } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await queryOne("SELECT 1");
    return Response.json({ status: "ok" }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ status: "degraded", database: "unreachable" }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
