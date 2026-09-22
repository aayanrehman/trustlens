import * as cheerio from "cheerio";
import type { Extraction } from "./fields";

export const UA = "TrustLensBot/0.1 (+https://trustlens.vercel.app; site audit)";
const BROWSER_UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128 Safari/537.36";
const FETCH_TIMEOUT_MS = 12_000;
const MAX_BLOCK = 500;
const MAX_BLOCKS = 10;

async function get(url: string, timeout = FETCH_TIMEOUT_MS) {
  return fetch(url, { headers: { "user-agent": UA, accept: "text/html,*/*;q=0.8" }, redirect: "follow", signal: AbortSignal.timeout(timeout) });
}

// ---------- robots.txt (minimal: User-agent groups, Disallow/Allow prefixes, longest match wins) ----------
type Rules = { allow: string[]; disallow: string[] };
export async function loadRobots(origin: string): Promise<Rules> {
  const empty = { allow: [], disallow: [] };
  try {
    const r = await get(`${origin}/robots.txt`, 6000);
    if (!r.ok) return empty;
    const text = await r.text();
    const groups: { agents: string[]; rules: Rules }[] = [];
    let cur: { agents: string[]; rules: Rules } | null = null;
    let lastWasAgent = false;
    for (const raw of text.split(/\r?\n/)) {
      const line = raw.replace(/#.*$/, "").trim();
      if (!line) continue;
      const m = line.match(/^([a-z-]+)\s*:\s*(.*)$/i);
      if (!m) continue;
      const key = m[1].toLowerCase(), val = m[2].trim();
      if (key === "user-agent") {
        if (!cur || !lastWasAgent) { cur = { agents: [], rules: { allow: [], disallow: [] } }; groups.push(cur); }
        cur.agents.push(val.toLowerCase());
        lastWasAgent = true;
      } else if (cur && (key === "allow" || key === "disallow")) {
        if (val) cur.rules[key].push(val);
        lastWasAgent = false;
      } else lastWasAgent = false;
    }
    const mine = groups.find((g) => g.agents.some((a) => "trustlensbot".startsWith(a) && a !== "*"));
    const star = groups.find((g) => g.agents.includes("*"));
    return (mine ?? star)?.rules ?? empty;
  } catch { return empty; }
}
export function robotsAllows(rules: Rules, path: string) {
  const match = (p: string) => {
    const re = new RegExp("^" + p.split("*").map((s) => s.replace(/[.+?^${}()|[\]\\]/g, "\\$&")).join(".*") + (p.endsWith("$") ? "" : ""));
    return re.test(path);
  };
  const best = (list: string[]) => list.filter(match).reduce((a, b) => (b.length > a.length ? b : a), "");
  const a = best(rules.allow), d = best(rules.disallow);
  if (!d) return true;
  return a.length >= d.length;
}

// ---------- helpers ----------
const clean = (s: string) => s.replace(/\s+/g, " ").trim();
const cap = (s: string) => (s.length > MAX_BLOCK ? s.slice(0, MAX_BLOCK) + "…" : s);
const JUNK_RE = /validation purposes|<img |required\)|cookie|privacy policy/i;
function uniq(list: string[], max = MAX_BLOCKS) {
  const cleaned = [...new Set(list.map(clean).filter((c) => c.length >= 20 && !JUNK_RE.test(c)))];
  // Prefer leaf blocks: drop any block that contains another block (it is a container).
  const leaves = cleaned.filter((c) => !cleaned.some((o) => o !== c && c.includes(o)));
  return leaves.slice(0, max).map(cap);
}
function walkTypes(node: unknown, out: Set<string>) {
  if (Array.isArray(node)) return node.forEach((n) => walkTypes(n, out));
  if (!node || typeof node !== "object") return;
  const o = node as Record<string, unknown>;
  const t = o["@type"];
  if (typeof t === "string") out.add(t);
  else if (Array.isArray(t)) t.forEach((x) => typeof x === "string" && out.add(x));
  for (const v of Object.values(o)) if (v && typeof v === "object") walkTypes(v, out);
}

const TESTIMONIAL_SEL = 'blockquote, q, [class*="testimonial" i], [id*="testimonial" i], [class*="review" i], [class*="quote" i], [itemprop="reviewBody"]';
const CRED_RE = /\b(certified|certification|member of|IECA|HECA|NACAC|WACAC|founder|years? (of experience|in business)|former (admissions?|dean|counselor|prosecutor|clerk)|admissions officer|licensed|license #?\s?\d|insured|accredited|award-winning|featured in|board.certified|fiduciary|bar admitted|admitted to the bar)\b/i;
const DEGREE_RE_EXTRA = /\b(CFP|CPA|CFA|LMFT|LCSW|PsyD|ICF|DDS|DMD|RN|Esq\.?|J\.?D\.?)\b/;
const DEGREE_RE = /\b(M\.?Ed\.?|Ph\.?D\.?|Ed\.?D\.?|M\.?A\.?|B\.?A\.?|M\.?S\.?|J\.?D\.?|MBA)\b(?=[\s,.)(]|$)/; // case-sensitive on purpose: "Med School" must not match M.Ed
const isCredential = (t: string) => CRED_RE.test(t) || DEGREE_RE.test(t) || DEGREE_RE_EXTRA.test(t);
const SOCIAL: [string, RegExp][] = [["LinkedIn", /linkedin\.com/i], ["Instagram", /instagram\.com/i], ["Facebook", /facebook\.com/i], ["YouTube", /(youtube\.com|youtu\.be)/i]];
const GBP_RE = /(google\.com\/maps|maps\.app\.goo\.gl|g\.page\/|business\.google\.com|search\.google\.com\/local|goo\.gl\/maps|google\.com\/search\?.*ludocid)/i;
const ABOUT_RE = /\b(about|our story|who we are|meet|team|testimonial|review|success stories|results)\b/i;

function extractPage($: cheerio.CheerioAPI, headers: Headers) {
  const types = new Set<string>();
  $('script[type="application/ld+json"]').each((_, el) => { try { walkTypes(JSON.parse($(el).text()), types); } catch {} });
  $("[itemtype]").each((_, el) => { const t = ($(el).attr("itemtype") ?? "").split("/").pop(); if (t) types.add(t); });

  const questionHeadings = $("h2, h3, h4, summary, dt, [class*='faq' i] [class*='question' i]").filter((_, el) => /\?\s*$/.test(clean($(el).text()))).length;
  const has_faq = types.has("FAQPage") || questionHeadings >= 3;

  const hrefs: string[] = [];
  $("a[href]").each((_, el) => { hrefs.push($(el).attr("href") ?? ""); });
  $("iframe[src]").each((_, el) => { hrefs.push($(el).attr("src") ?? ""); });
  const gbp = hrefs.some((h) => GBP_RE.test(h)) || $('[class*="google-review" i], [class*="elfsight-google" i], [class*="gmb" i], [data-google-place-id]').length > 0;
  const social = SOCIAL.filter(([, re]) => hrefs.some((h) => re.test(h))).map(([n]) => n);
  const navLinks: { text: string; href: string }[] = [];
  $("nav a[href], header a[href], [role='navigation'] a[href], a[href]").each((_, el) => { navLinks.push({ text: clean($(el).text()), href: $(el).attr("href") ?? "" }); });
  const mobile_viewport = /width\s*=\s*device-width/i.test($('meta[name="viewport"]').attr("content") ?? "");

  // Client-only apps ship an empty shell to crawlers. Detect before we strip scripts.
  const bodyChildren = $("body").children().not("script, noscript, style, link").length;
  const client_only_shell = bodyChildren <= 2 && $('script[type="module"], script[src*="/_next/"], script[src*="/assets/index-"]').length > 0 && clean($("body").text()).split(" ").filter(Boolean).length < 30;

  // Text extraction: drop things that are never testimonials or credentials.
  $("script, style, noscript, svg, form, nav, header, footer, [role='navigation'], [aria-hidden='true']").remove();

  const testimonials: string[] = [];
  $(TESTIMONIAL_SEL).each((_, el) => { const t = clean($(el).text()); if (t) { testimonials.push(t); } });
  // Quoted paragraphs with an attribution-ish tail ("— Sarah", "said", "parent")
  $("p, li, div").each((_, el) => {
    if ($(el).children().length > 3) return;
    const t = clean($(el).text());
    if (t.length > 40 && t.length < 800 && /^[“"']|[”"']\s*[—–-]?\s*\w/.test(t) && /(—|–|said|parent|student|class of|mom|dad|family)/i.test(t)) testimonials.push(t);
  });

  const credentials: string[] = [];
  $("p, li, h1, h2, h3, h4, span, div").each((_, el) => {
    if ($(el).children().length > 2) return;
    const t = clean($(el).text());
    if (t.length > 15 && t.length < 600 && isCredential(t)) credentials.push(t);
  });

  const bodyText = clean($("body").text());
  const word_count = bodyText ? bodyText.split(" ").length : 0;

  let lastMod = headers.get("last-modified") ?? $('meta[property="article:modified_time"]').attr("content") ?? $('meta[name="last-modified"]').attr("content") ?? "";
  if (!lastMod) { const m = bodyText.match(/(last updated|updated on|last modified)[:\s]+([A-Za-z]{3,9}\.? \d{1,2},? \d{4}|\d{4}-\d{2}-\d{2}|\d{1,2}\/\d{1,2}\/\d{2,4})/i); if (m) lastMod = m[2]; }
  if (!lastMod) { const m = $('script[type="application/ld+json"]').text().match(/"dateModified"\s*:\s*"([^"]+)"/); if (m) lastMod = m[1]; }

  return { types: [...types], has_faq, testimonials, credentials, gbp, social, word_count, lastMod, navLinks, mobile_viewport, client_only_shell };
}

// Anti-bot interstitials (proof-of-work, Cloudflare, "checking your browser") answer every
// non-browser client with a challenge page. AI crawlers hit exactly the same wall, so this is a
// finding, not a crash.
const CHALLENGE_RE = /(Verifying…|Just a moment|Checking your browser|cf-browser-verification|__cf_chl|challenge-platform|pow-wrap|Enable JavaScript and cookies to continue)/i;
export const CHALLENGE_TEST = (body: string) => CHALLENGE_RE.test(body);
const isChallenge = (res: Response, body: string) =>
  (res.status === 503 || res.status === 403 || res.status === 429) && (CHALLENGE_RE.test(body) || /pow_nc=|cf_clearance=/.test(res.headers.get("set-cookie") ?? ""));

export type FetchOutcome =
  | { status: "blocked"; reason: string }
  | { status: "error"; reason: string }
  | { status: "ok"; pages: string[]; client_only_shell: boolean; extraction: Omit<Extraction, "page_speed_score"> };

export async function fetchAndExtract(input: string): Promise<FetchOutcome> {
  let u: URL;
  try { u = new URL(/^https?:\/\//i.test(input) ? input : `https://${input}`); } catch { return { status: "error", reason: "Not a valid URL" }; }
  const rules = await loadRobots(u.origin);
  if (!robotsAllows(rules, u.pathname || "/")) return { status: "blocked", reason: "robots.txt disallows fetching this page for our crawler — skipped, not scored" };

  let res: Response;
  try {
    res = await get(u.href);
    if ([403, 406, 429, 503].includes(res.status)) res = await fetch(u.href, { headers: { "user-agent": BROWSER_UA, accept: "text/html,application/xhtml+xml", "accept-language": "en-US,en;q=0.9" }, redirect: "follow", signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
  } catch (e) { return { status: "error", reason: `Could not reach the site: ${(e as Error).name === "TimeoutError" ? "no response within 12 seconds" : (e as Error).message}` }; }
  const html = await res.text().catch(() => "");
  if (!res.ok) {
    if (isChallenge(res, html)) return { status: "blocked", reason: "This site sits behind a bot-protection challenge that only a real browser with JavaScript can pass. TrustLens is blocked — and so are the AI crawlers behind ChatGPT, Perplexity and Claude. Ask your host to allow-list reputable crawlers, or this site cannot be cited by AI assistants at all." };
    return { status: "error", reason: `The site answered with HTTP ${res.status}${res.status >= 500 ? " (server error — try again in a moment)" : ""}.` };
  }
  const $ = cheerio.load(html);
  const home = extractPage($, res.headers);
  const meta_title = clean($("title").first().text() || $('meta[property="og:title"]').attr("content") || "");
  const meta_description = clean($('meta[name="description"]').attr("content") || $('meta[property="og:description"]').attr("content") || "");
  const pages = [res.url || u.href];

  // One secondary page: About / Testimonials, linked from the nav, same origin, allowed by robots.
  const finalOrigin = new URL(pages[0]).origin;
  const candidate = home.navLinks.find((l) => ABOUT_RE.test(l.text)) ?? home.navLinks.find((l) => ABOUT_RE.test(l.href));
  let second: ReturnType<typeof extractPage> | null = null;
  if (candidate) {
    try {
      const cu = new URL(candidate.href, pages[0]);
      if (cu.origin === finalOrigin && cu.href !== pages[0] && robotsAllows(rules, cu.pathname)) {
        const r2 = await get(cu.href);
        if (r2.ok) { second = extractPage(cheerio.load(await r2.text()), r2.headers); pages.push(cu.href); }
      }
    } catch { /* secondary page is best-effort */ }
  }

  const merged = (a: string[], b?: string[]) => uniq([...a, ...(b ?? [])]);
  return {
    status: "ok",
    pages,
    client_only_shell: home.client_only_shell,
    extraction: {
      mobile_friendly: home.mobile_viewport,
      schema_types: [...new Set([...home.types, ...(second?.types ?? [])])],
      has_faq_block: home.has_faq || !!second?.has_faq,
      meta_title: { text: meta_title, length: meta_title.length },
      meta_description: { text: meta_description, length: meta_description.length },
      testimonial_text_blocks: merged(home.testimonials, second?.testimonials),
      credential_text_blocks: merged(home.credentials, second?.credentials),
      google_business_profile_linked: home.gbp || !!second?.gbp,
      social_links_found: [...new Set([...home.social, ...(second?.social ?? [])])],
      word_count: home.word_count + (second?.word_count ?? 0),
      last_modified_signal: home.lastMod || second?.lastMod || "unknown",
    },
  };
}
