// Google PageSpeed Insights — code-computed, never Jev. Best-effort: null on failure.
export async function pageSpeed(url: string): Promise<{ page_speed_score: number | null; error?: string }> {
  const key = process.env.PAGESPEED_API_KEY; // optional: PSI works keyless at low volume, a key raises the quota
  const api = new URL("https://www.googleapis.com/pagespeedonline/v5/runPagespeed");
  api.searchParams.set("url", url);
  api.searchParams.set("strategy", "mobile");
  api.searchParams.set("category", "performance");
  if (key) api.searchParams.set("key", key);
  try {
    const r = await fetch(api, { signal: AbortSignal.timeout(90_000) });
    if (!r.ok) return { page_speed_score: null, error: `PSI HTTP ${r.status}` };
    const j = await r.json();
    const lh = j.lighthouseResult;
    const perf = lh?.categories?.performance?.score;
    return { page_speed_score: typeof perf === "number" ? Math.round(perf * 100) : null };
  } catch (e) {
    return { page_speed_score: null, error: (e as Error).name === "TimeoutError" ? "PSI timed out" : (e as Error).message };
  }
}
