// Checkpoint: scan N URLs, print extracted fields and Jev answers side by side. No UI.
import { scanSite } from "../lib/scan";
import { scoreSite } from "../lib/scoring";
import { USD_PER_INPUT_TOKEN } from "../lib/jev";

const urls = process.argv.slice(2);
if (!urls.length) { console.error("usage: tsx scripts/checkpoint.ts <url> [url...]"); process.exit(1); }
const results = await Promise.all(urls.map((u) => scanSite(u, undefined, (e) => { if (e.type === "stage") console.error(`[${u}] ${e.stage}`); })));
let tokens = 0;
for (const r of results) {
  console.log("\n==============================", r.url, "==============================");
  console.log("status:", r.status, r.reason ?? "", "| pages:", r.pages_fetched.join(" , "));
  if (r.extraction) console.log("EXTRACTED FIELDS (code):\n" + JSON.stringify(r.extraction, null, 2));
  if (r.answers) { console.log("JEV ANSWERS (" + r.model + "):\n" + JSON.stringify(r.answers, null, 2)); console.log("usage:", r.usage); tokens += r.usage?.input_tokens ?? 0; }
  if (r.extraction && r.answers) { const s = scoreSite(r.extraction, r.answers); console.log("SCORE (code):", JSON.stringify({ grade: s.grade, overall: s.overall, seo: s.categories.seo.score, geo: s.categories.geo.score, trust: s.categories.trust.score, disc: s.categories.discoverability.score }), "\nissues:", JSON.stringify(Object.fromEntries(Object.entries(s.categories).map(([k, v]) => [k, v.issues])), null, 1)); }
}
console.log(`\nTOTAL input tokens: ${tokens} → cost $${(tokens * USD_PER_INPUT_TOKEN).toFixed(4)}`);
