import type { Extraction, JevAnswer } from "./fields";
import { DEFAULT_QUESTIONS, type QuestionDef } from "./questions";

// ---------- All tunable numbers live here. Studio sliders edit a copy of this object at runtime. ----------
export type Thresholds = {
  weights: { seo: number; geo: number; trust: number; authority: number; discoverability: number }; // overall = weighted average
  grade: { A: number; B: number; C: number; D: number }; // minimum overall for each letter; below D = F
  discretion_yes: number; // Noul probability at/above which discretion counts as respected
  min_words: number; // word_count at/above which the content-depth signal is full
};
export const DEFAULT_THRESHOLDS: Thresholds = {
  weights: { seo: 20, geo: 25, trust: 25, authority: 15, discoverability: 15 },
  grade: { A: 85, B: 70, C: 55, D: 40 },
  discretion_yes: 0.6,
  min_words: 600,
};

// Within-category point splits (sum to 100 each).
const SEO = { speed: 50, mobile: 20, title: 15, description: 15 };
const GEO = { readiness: 50, schema: 25, faq: 25 };
const TRUST = { quality: 50, discretion: 25, credentials: 25 };
const DISC = { gbp: 35, social: 35, depth: 15, freshness: 15 };
const AUTH = { positioning: 65, credentials: 20, identity: 15 };

export type Category = "seo" | "geo" | "trust" | "authority" | "discoverability";
export type CategoryResult = { score: number; issues: string[] };
export type Scored = { categories: Record<Category, CategoryResult>; overall: number; grade: "A" | "B" | "C" | "D" | "F" };
const POSITIONING: Record<string, number> = { reads_as_recognized_authority: 1, reads_as_competent_but_generic: 0.5, reads_as_thin_or_unfinished: 0.12 };
export const RADAR_LABELS = ["SEO", "AI Search", "Trust", "Authority", "Discover"];
export const radarValues = (s: Scored) => CATEGORY_ORDER.map((c) => s.categories[c].score);

const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));
const scoreLevel = (a: JevAnswer | undefined) => (a?.type === "score" ? a.score / Math.max(1, Object.keys(a.legend).length - 1) : 0); // 0..1
export const humanize = (k: string) => k.replace(/_/g, " ");
const scoreLabel = (a: JevAnswer | undefined, q?: QuestionDef) => (a?.type === "score" ? humanize(q?.options[Math.round(a.score)]?.key ?? "") : "");

export function scoreSite(x: Extraction, answers: Record<string, JevAnswer>, t: Thresholds = DEFAULT_THRESHOLDS, qs: QuestionDef[] = DEFAULT_QUESTIONS): Scored {
  const q = (id: string) => qs.find((d) => d.id === id);
  // --- SEO ---
  const seoIssues: string[] = [];
  let seo = 0;
  // Speed unknown (still measuring, or Google timed out): score the other SEO signals out of 100 instead of counting speed as 0.
  const speedKnown = typeof x.page_speed_score === "number";
  if (x.page_speed_score === undefined) seoIssues.push("PageSpeed: measuring… (Google usually takes 20–60s)");
  else if (x.page_speed_score === null) seoIssues.push("PageSpeed score unavailable — Google could not measure this site in time; SEO scored on the remaining signals.");
  else { seo += (x.page_speed_score / 100) * SEO.speed; if (x.page_speed_score < 50) seoIssues.push(`Mobile PageSpeed score is ${x.page_speed_score}/100 — slow pages lose both visitors and rankings.`); else if (x.page_speed_score < 80) seoIssues.push(`Mobile PageSpeed score is ${x.page_speed_score}/100 — room to improve load time.`); }
  if (x.mobile_friendly) seo += SEO.mobile; else if (x.mobile_friendly === false) seoIssues.push("No mobile viewport configured — the page does not adapt to phones.");
  const tl = x.meta_title.length;
  if (!tl) seoIssues.push("Missing page title.");
  else if (tl < 30 || tl > 65) { seo += SEO.title * 0.5; seoIssues.push(`Page title is ${tl} characters (ideal 30–65).`); }
  else seo += SEO.title;
  const dl = x.meta_description.length;
  if (!dl) seoIssues.push("Missing meta description — search engines and AI assistants have no summary to quote.");
  else if (dl < 70 || dl > 165) { seo += SEO.description * 0.5; seoIssues.push(`Meta description is ${dl} characters (ideal 70–165).`); }
  else seo += SEO.description;

  // --- GEO ---
  const geoIssues: string[] = [];
  const gr = answers.geo_readiness;
  let geo = scoreLevel(gr) * GEO.readiness;
  const strongSchema = x.schema_types.some((s) => ["LocalBusiness", "Service", "FAQPage", "ProfessionalService", "EducationalOrganization"].includes(s));
  const anySchema = x.schema_types.some((s) => ["Organization", "Person", "Review", "WebSite", "WebPage"].includes(s)) || x.schema_types.length > 0;
  if (strongSchema) geo += GEO.schema; else if (anySchema) { geo += GEO.schema * 0.5; geoIssues.push(`Structured data found (${x.schema_types.slice(0, 4).join(", ")}${x.schema_types.length > 4 ? ` +${x.schema_types.length - 4} more` : ""}) but no LocalBusiness, Service, ProfessionalService, or FAQPage schema.`); } else geoIssues.push("No structured data (JSON-LD / schema.org) found — AI assistants and search engines get no machine-readable facts.");
  if (x.has_faq_block) geo += GEO.faq; else geoIssues.push("No FAQ section detected — question-and-answer blocks are what AI assistants most often cite.");
  if (gr?.type === "score" && gr.score < 1.5) geoIssues.push(`Jev rates AI-answer readiness as "${scoreLabel(gr, q("geo_readiness"))}".`);

  // --- Trust ---
  const trustIssues: string[] = [];
  const tq = answers.trust_signal_quality;
  let trust = scoreLevel(tq) * TRUST.quality;
  const hasTestimonials = x.testimonial_text_blocks.length > 0;
  const disc = answers.discretion_respected;
  if (!hasTestimonials) { trust += TRUST.discretion; trustIssues.push("No testimonials or reviews detected on the homepage or about page."); } // N/A: no testimonials → nothing to breach
  else if (disc?.type === "noul") { if (disc.noul >= t.discretion_yes) trust += TRUST.discretion; else trustIssues.push(`Testimonials may identify a specific family (Jev: ${Math.round(disc.noul * 100)}% likely discreet) — consider first names or initials only.`); }
  if (x.credential_text_blocks.length) trust += TRUST.credentials; else trustIssues.push("No credentials found (memberships like IECA/HECA/NACAC, certifications, founder background).");
  if (tq?.type === "score" && tq.score < 1.5) trustIssues.push(`Trust evidence reads as "${scoreLabel(tq, q("trust_signal_quality"))}" — add named outcomes and checkable affiliations.`);

  // --- Discoverability ---
  const discIssues: string[] = [];
  let d = 0;
  if (x.google_business_profile_linked) d += DISC.gbp; else discIssues.push("No Google Business Profile link or map embed found — the #1 local-search signal is missing.");
  const n = x.social_links_found.length;
  d += (Math.min(n, 3) / 3) * DISC.social;
  if (n === 0) discIssues.push("No social profiles linked (LinkedIn, Instagram, Facebook, YouTube)."); else if (n < 3) discIssues.push(`Only ${n} social profile${n > 1 ? "s" : ""} linked (${x.social_links_found.join(", ")}).`);
  d += Math.min(1, x.word_count / t.min_words) * DISC.depth;
  if (x.word_count < t.min_words) discIssues.push(`Thin content: ${x.word_count} words across fetched pages (target ${t.min_words}+).`);
  if (x.last_modified_signal !== "unknown") d += DISC.freshness; else discIssues.push("No freshness signal — no last-modified header or visible update date.");

  if (!speedKnown) seo = (seo / (100 - SEO.speed)) * 100;
  // --- Authority: how the site positions itself, and whether an AI can confirm who is behind it ---
  const authIssues: string[] = [];
  const ap = answers.authority_positioning;
  const pos = ap?.type === "choice" ? POSITIONING[ap.choice] ?? (ap.probabilities.reads_as_recognized_authority ?? 0) : 0;
  let auth = pos * AUTH.positioning;
  if (ap?.type === "choice" && ap.choice === "reads_as_thin_or_unfinished") authIssues.push("Reads as thin or unfinished to an AI — the title and description say little about who you are or what you do.");
  else if (ap?.type === "choice" && ap.choice === "reads_as_competent_but_generic") authIssues.push("Reads competent but generic — name specific, checkable standing (IECA/HECA membership, a former admissions role, a degree, press).");
  if (x.credential_text_blocks.length) auth += AUTH.credentials; else authIssues.push("No credentials on the page for an AI to cite.");
  if (x.schema_types.some((s) => ["Person", "Organization", "ProfessionalService", "LocalBusiness", "EducationalOrganization"].includes(s))) auth += AUTH.identity; else authIssues.push("No Person/Organization structured data — assistants cannot confirm who runs the site.");

  const categories: Record<Category, CategoryResult> = {
    seo: { score: clamp(seo), issues: seoIssues },
    geo: { score: clamp(geo), issues: geoIssues },
    trust: { score: clamp(trust), issues: trustIssues },
    authority: { score: clamp(auth), issues: authIssues },
    discoverability: { score: clamp(d), issues: discIssues },
  };
  const w = { ...DEFAULT_THRESHOLDS.weights, ...t.weights }; // older saved presets may lack a key
  const wsum = CATEGORY_ORDER.reduce((n, c) => n + w[c], 0) || 1;
  const overall = clamp(CATEGORY_ORDER.reduce((n, c) => n + categories[c].score * w[c], 0) / wsum);
  const grade = overall >= t.grade.A ? "A" : overall >= t.grade.B ? "B" : overall >= t.grade.C ? "C" : overall >= t.grade.D ? "D" : "F";
  return { categories, overall, grade };
}

export const CATEGORY_LABELS: Record<Category, string> = { seo: "SEO", geo: "AI Search Visibility", trust: "Trust", authority: "Authority", discoverability: "Discoverability" };
export const CATEGORY_ORDER: Category[] = ["seo", "geo", "trust", "authority", "discoverability"];
