import { recentScans } from "@/lib/db";
export const runtime = "nodejs";
// Last scans for the Studio (only "ok" ones have extractions to re-score).
export async function GET() {
  const rows = await recentScans(5).catch(() => []);
  return Response.json(rows.filter((r) => r.extraction).map((r) => ({ ...r, scanned_at: new Date(r.createdAt).toISOString() })));
}
