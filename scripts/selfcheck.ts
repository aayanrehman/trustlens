// Runs before every build. Fails the build if a default question reads a field outside the contract,
// and sanity-checks the scoring math + robots parser.
import assert from "node:assert/strict";
import { DEFAULT_QUESTIONS, validateQuestions, fieldsRead, toSdkQuestions } from "../lib/questions";
import { FIELDS, type Extraction } from "../lib/fields";
import { scoreSite, DEFAULT_THRESHOLDS } from "../lib/scoring";
import { robotsAllows, CHALLENGE_TEST } from "../lib/extract";

const errs = validateQuestions(DEFAULT_QUESTIONS);
assert.deepEqual(errs, [], "default questions violate the field contract:\n" + errs.join("\n"));
assert.ok(fieldsRead(DEFAULT_QUESTIONS).every((f) => (FIELDS as readonly string[]).includes(f)));
assert.deepEqual(validateQuestions([{ ...DEFAULT_QUESTIONS[0], reads: ["raw_html" as never] }]).length, 1, "unknown field must be refused");
assert.equal(Object.keys(toSdkQuestions(DEFAULT_QUESTIONS)).length, 4);

const empty: Extraction = { schema_types: [], has_faq_block: false, meta_title: { text: "", length: 0 }, meta_description: { text: "", length: 0 }, testimonial_text_blocks: [], credential_text_blocks: [], google_business_profile_linked: false, social_links_found: [], page_speed_score: null, mobile_friendly: null, word_count: 0, last_modified_signal: "unknown" };
const worst = scoreSite(empty, {});
assert.equal(worst.grade, "F");
assert.equal(worst.categories.trust.score, 25, "no testimonials → discretion is N/A, credited");
assert.equal(worst.categories.authority.score, 0);

const full: Extraction = { schema_types: ["LocalBusiness", "FAQPage"], has_faq_block: true, meta_title: { text: "x".repeat(50), length: 50 }, meta_description: { text: "y".repeat(120), length: 120 }, testimonial_text_blocks: ["Sarah M. got into Rice with a $20k scholarship — parent"], credential_text_blocks: ["IECA professional member"], google_business_profile_linked: true, social_links_found: ["LinkedIn", "Instagram", "Facebook"], page_speed_score: 100, mobile_friendly: true, word_count: 2000, last_modified_signal: "2026-01-01" };
const best = scoreSite(full, {
  trust_signal_quality: { type: "score", score: 3, legend: { "0": "a", "1": "b", "2": "c", "3": "d" }, probabilities: { "3": 1 }, confidence: 1 },
  discretion_respected: { type: "noul", noul: 0.95 },
  geo_readiness: { type: "score", score: 3, legend: { "0": "a", "1": "b", "2": "c", "3": "d" }, probabilities: { "3": 1 }, confidence: 1 },
  authority_positioning: { type: "choice", choice: "reads_as_recognized_authority", probabilities: {}, confidence: 1 },
});
assert.equal(best.overall, 100); assert.equal(best.grade, "A");
// Thresholds are pure: same inputs, stricter cutoffs → lower grade, zero Jev calls.
assert.equal(scoreSite(full, {}, { ...DEFAULT_THRESHOLDS, grade: { A: 101, B: 101, C: 101, D: 0 } }).grade, "D");

assert.match(scoreSite({ ...empty, page_speed_score: undefined }, {}).categories.seo.issues[0], /measuring/);
assert.equal(scoreSite({ ...full, page_speed_score: null }, {}).categories.seo.score, 100, "unknown speed must not penalize");
// A bot-challenge page must be reported as blocked-with-a-reason, never as a bare HTTP code.
assert.equal(CHALLENGE_TEST("<title>Verifying…</title>"), true); assert.equal(CHALLENGE_TEST("<h1>Welcome</h1>"), false);
assert.equal(robotsAllows({ allow: [], disallow: ["/"] }, "/"), false);
assert.equal(robotsAllows({ allow: ["/about"], disallow: ["/"] }, "/about"), true);
assert.equal(robotsAllows({ allow: [], disallow: ["/private"] }, "/"), true);
import { checkAndReserve, LIMITS } from "../lib/ratelimit";
for (let i = 0; i < LIMITS.sitesPerIpPerHour; i++) assert.equal(checkAndReserve("1.1.1.1", 1).ok, true);
assert.equal(checkAndReserve("1.1.1.1", 1).ok, false, "31st site in an hour must be refused");
assert.equal(checkAndReserve("2.2.2.2", 1).ok, true, "other visitors unaffected");
import { buildReport, jsonLd } from "../lib/report";
const rep = buildReport(empty, {}, "example.com", true);
assert.ok(rep.actions.length >= 8 && rep.actions[0].prerequisite && rep.actions.slice(1).every((r, i, arr) => i === 0 || arr[i - 1].points >= r.points), "prerequisite first, then by points");
assert.ok(rep.after.overall > rep.now.overall && rep.actions.some((a) => a.points > 0), "fixes add points");
assert.equal(buildReport(full, {}, "x.com").actions.filter((r) => r.impact === 3).length, 0, "a full site has no top-impact actions");
JSON.parse(jsonLd("example.com", empty, "home_services"));
console.log("selfcheck ok");
