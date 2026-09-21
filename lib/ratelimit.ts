// Spend guard. ponytail: in-memory, so counters are per server instance and reset on cold start;
// move to Vercel KV / Upstash if the link goes wide. Good enough to stop a script from draining credits.
import { USD_PER_INPUT_TOKEN } from "./jev";

export const LIMITS = {
  sitesPerIpPerHour: 30,
  usdPerDay: 3, // total Jev spend this instance may make in a rolling 24h window
  tokensPerSiteEstimate: 2500, // typical request; used to reserve budget before the call returns
};

const perIp = new Map<string, number[]>(); // ip → timestamps of site scans in the last hour
let spend: { at: number; usd: number }[] = [];
const HOUR = 3_600_000, DAY = 86_400_000;

export function checkAndReserve(ip: string, sites: number): { ok: true } | { ok: false; reason: string } {
  const now = Date.now();
  const recent = (perIp.get(ip) ?? []).filter((t) => now - t < HOUR);
  if (recent.length + sites > LIMITS.sitesPerIpPerHour) return { ok: false, reason: `Rate limit: ${LIMITS.sitesPerIpPerHour} sites per hour per visitor. Try again later.` };
  spend = spend.filter((s) => now - s.at < DAY);
  const spent = spend.reduce((n, s) => n + s.usd, 0);
  const reserve = sites * LIMITS.tokensPerSiteEstimate * USD_PER_INPUT_TOKEN;
  if (spent + reserve > LIMITS.usdPerDay) return { ok: false, reason: `Daily budget reached ($${LIMITS.usdPerDay}). Scans resume tomorrow.` };
  perIp.set(ip, [...recent, ...Array(sites).fill(now)]);
  spend.push({ at: now, usd: reserve });
  return { ok: true };
}
/** Replace the estimate with what a request actually cost. */
export function settle(tokens: number) { const now = Date.now(); spend.push({ at: now, usd: tokens * USD_PER_INPUT_TOKEN - LIMITS.tokensPerSiteEstimate * USD_PER_INPUT_TOKEN }); }
export const clientIp = (req: Request) => req.headers.get("x-forwarded-for")?.split(",")[0].trim() || req.headers.get("x-real-ip") || "unknown";
