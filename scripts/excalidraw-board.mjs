// Generates docs/jev-system-one-trustlens.excalidraw from the board spec (docs/jev-board-spec.md).
// Native Excalidraw elements only. Ten 1600×900 zones laid out left → right, 220 px apart.
import { writeFileSync } from "node:fs";

// ---------- visual tokens ----------
const C = { paper: "#F7F4ED", navy: "#0B2A5B", teal: "#12A39A", orange: "#FF4D00", green: "#2F9E44", red: "#D9485F", ink: "#1C2430", gray: "#7A8494", white: "#FFFFFF",
  navyTint: "#E6EAF2", tealTint: "#E2F3F1", orangeTint: "#FFE9DD", grayTint: "#EEEBE3", greenTint: "#E4F3E7", redTint: "#FBE6EA" };
const ZW = 1600, ZH = 900, GAP = 220;
const FONT = 2; // Helvetica — the Excalidraw sans-serif

let seed = 1;
const els = [];
const base = (type, x, y, w, h, o = {}) => ({
  id: `${type}-${els.length}-${seed++}`, type, x, y, width: w, height: h, angle: 0,
  strokeColor: o.stroke ?? C.navy, backgroundColor: o.bg ?? "transparent", fillStyle: "solid",
  strokeWidth: o.sw ?? 2, strokeStyle: o.dash ?? "solid", roughness: o.rough ?? 1, opacity: o.opacity ?? 100,
  groupIds: o.groups ?? [], frameId: o.frame ?? null, index: null,
  roundness: o.round === false ? null : { type: type === "rectangle" ? 3 : 2 },
  seed: seed * 7919, version: 1, versionNonce: seed * 104729, isDeleted: false, boundElements: null, updated: Date.now(), link: null, locked: o.locked ?? false,
});
let cur = { frame: null, groups: [] };
const add = (e) => { e.frameId ??= cur.frame; if (!e.groupIds.length) e.groupIds = cur.groups; els.push(e); return e; };

const tw = (s, size) => Math.max(...s.split("\n").map((l) => l.length)) * size * 0.56;
const th = (s, size) => s.split("\n").length * size * 1.25;
function text(x, y, str, o = {}) {
  const size = o.size ?? 20, w = tw(str, size), h = th(str, size);
  const align = o.align ?? "left", xx = align === "center" ? x - w / 2 : align === "right" ? x - w : x;
  return add({ ...base("text", xx, y, w, h, { stroke: o.color ?? C.ink, round: false, opacity: o.opacity }), text: str, originalText: str, fontSize: size, fontFamily: o.font ?? FONT, textAlign: align, verticalAlign: "top", baseline: size, containerId: null, lineHeight: 1.25, autoResize: true });
}
const ctext = (cx, cy, str, o = {}) => text(cx, cy - th(str, o.size ?? 20) / 2, str, { ...o, align: "center" });
const rect = (x, y, w, h, o = {}) => add(base("rectangle", x, y, w, h, o));
const ellipse = (x, y, w, h, o = {}) => add(base("ellipse", x, y, w, h, o));
function arrow(x1, y1, x2, y2, o = {}) {
  const e = base("arrow", x1, y1, Math.abs(x2 - x1), Math.abs(y2 - y1), { stroke: o.color ?? C.navy, sw: o.sw ?? 3, dash: o.dash, round: false, rough: o.rough });
  Object.assign(e, { points: [[0, 0], ...(o.via ?? []).map(([vx, vy]) => [vx - x1, vy - y1]), [x2 - x1, y2 - y1]], startBinding: null, endBinding: null, startArrowhead: o.start ?? null, endArrowhead: o.end === null ? null : (o.end ?? "arrow"), elbowed: false, lastCommittedPoint: null });
  add(e);
  if (o.label) ctext((x1 + x2) / 2 + (o.lx ?? 0), (y1 + y2) / 2 + (o.ly ?? -18), o.label, { size: o.lsize ?? 18, color: o.lcolor ?? C.gray });
  return e;
}
const line = (x1, y1, x2, y2, o = {}) => arrow(x1, y1, x2, y2, { ...o, end: null, sw: o.sw ?? 2 });
function card(x, y, w, h, title, o = {}) {
  rect(x, y, w, h, { bg: o.bg ?? C.white, stroke: o.stroke ?? C.navy, sw: o.sw ?? 2, dash: o.dash });
  if (title) text(x + 22, y + 16, title, { size: o.tsize ?? 24, color: o.tcolor ?? C.navy });
}
function chip(cx, cy, label, o = {}) {
  const size = o.size ?? 19, w = tw(label, size) + 30, h = size * 1.25 + 16;
  rect(cx - w / 2, cy - h / 2, w, h, { bg: o.bg ?? C.tealTint, stroke: o.stroke ?? C.teal, sw: 2 });
  ctext(cx, cy, label, { size, color: o.color ?? C.ink });
  return { w, h };
}
function strike(x, y, w, color = C.red) { line(x, y, x + w, y - 6, { color, sw: 3, rough: 1.5 }); }
function circleAround(cx, cy, w, h, color = C.orange) { ellipse(cx - w / 2, cy - h / 2, w, h, { stroke: color, sw: 3, rough: 1.6 }); }

// ---------- zone scaffold ----------
const zoneX = (i) => i * (ZW + GAP);
function zone(i, name, build) {
  const x = zoneX(i), n = String(i + 1).padStart(2, "0");
  const frame = { ...base("frame", x, 0, ZW, ZH, { stroke: "#bbb", round: false }), name: `${n} ${name}` };
  els.push(frame);
  cur = { frame: frame.id, groups: [`zone-${n}`] };
  text(x + 40, 28, `JEV → ${name.toUpperCase()}`, { size: 17, color: C.gray });
  // zone number on the journey line
  ellipse(x + ZW - 84, 18, 44, 44, { bg: C.navy, stroke: C.navy });
  ctext(x + ZW - 62, 40, n, { size: 20, color: C.white });
  // face-cam safe area guide (delete before final export)
  rect(x + ZW * 0.72, ZH * 0.72, ZW * 0.28, ZH * 0.28, { stroke: C.gray, dash: "dashed", sw: 1, opacity: 18, locked: true, round: false });
  text(x + ZW * 0.72 + 12, ZH * 0.72 + 10, "face-cam safe area (guide — delete before export)", { size: 17, color: C.gray, opacity: 40 });
  build(x);
  cur = { frame: null, groups: [] };
}
// journey line across the top of all zones
for (let i = 0; i < 9; i++) line(zoneX(i) + ZW - 40, 40, zoneX(i + 1) + ZW - 84, 40, { color: C.navy, dash: "dotted", sw: 2 });

// ---------- Zone 01 ----------
zone(0, "The new category", (x) => {
  ctext(x + 800, 130, "JEV IS NOT A CHATBOT", { size: 42, color: C.navy });
  line(x + 728, 165, x + 1035, 165, { color: C.orange, sw: 4, rough: 1.4 }); // underline under NOT A CHATBOT
  card(x + 120, 250, 520, 400, "LLM", { tsize: 28 });
  // speech bubble
  rect(x + 160, 320, 440, 170, { bg: C.grayTint, stroke: C.gray });
  line(x + 200, 490, x + 185, 520, { color: C.gray }); line(x + 185, 520, x + 240, 490, { color: C.gray });
  text(x + 185, 345, "The site looks fairly credible\nbecause it lists several\ntestimonials, although…", { size: 22, color: C.ink });
  text(x + 160, 600, "prose → you parse it → hope it's consistent", { size: 17, color: C.gray });
  ctext(x + 800, 450, "≠", { size: 120, color: C.navy });
  card(x + 960, 250, 520, 400, "JEV", { tsize: 28 });
  chip(x + 1220, 360, "TRUE: 0.83", { bg: C.tealTint, stroke: C.teal, size: 24 });
  chip(x + 1220, 445, "CHOICE: authority", { bg: C.navyTint, stroke: C.navy, size: 24 });
  chip(x + 1220, 530, "SCORE: 2.7 / 4", { bg: C.tealTint, stroke: C.teal, size: 24 });
  text(x + 1000, 600, "typed answers → code uses them directly", { size: 17, color: C.gray });
  ctext(x + 640, 760, "text in  →  typed probabilities out", { size: 24, color: C.ink });
  text(x + 60, 820, "reveal: heading → LLM card → ≠ → Jev card + chips", { size: 17, color: C.gray, opacity: 60 });
});

// ---------- Zone 02 ----------
zone(1, "Why text costs time", (x) => {
  line(x + 800, 90, x + 800, 620, { color: C.gray, dash: "dashed", sw: 1 });
  text(x + 80, 90, "LLM: SEQUENTIAL", { size: 34, color: C.navy });
  const toks = ["The", "site", "looks", "credible", "because", "…"];
  toks.forEach((t, i) => {
    const cx = x + 130 + i * 112;
    rect(cx - 44, 200, 88, 56, { bg: C.white });
    ctext(cx, 228, t, { size: 20 });
    if (i < toks.length - 1) { arrow(cx + 46, 228, cx + 66, 228, { sw: 2 }); ellipse(cx + 46, 268, 20, 20, { stroke: C.gray, sw: 1.5 }); line(cx + 56, 272, cx + 56, 278, { color: C.gray, sw: 1.5 }); line(cx + 56, 278, cx + 60, 281, { color: C.gray, sw: 1.5 }); }
  });
  text(x + 90, 330, "…one token at a time, then you still have to\nparse the paragraph back into a decision.", { size: 20, color: C.ink });
  rect(x + 90, 420, 620, 60, { bg: C.grayTint, stroke: C.gray });
  text(x + 110, 434, "\"Overall the website appears moderately trustworthy…\"", { size: 19, color: C.gray });
  strike(x + 95, 455, 610);
  text(x + 860, 90, "JEV: PARALLEL DECISIONS", { size: 34, color: C.navy });
  rect(x + 860, 300, 150, 140, { bg: C.navyTint }); ctext(x + 935, 370, "STATE", { size: 24, color: C.navy });
  const qs = ["trust_signal_quality?", "discretion_respected?", "geo_readiness?", "authority_positioning?"];
  const ans = ["SCORE 2.7", "NOUL 0.82", "SCORE 1.9", "CHOICE generic"];
  qs.forEach((q, i) => {
    const y = 190 + i * 100;
    arrow(x + 1010, 370, x + 1080, y + 28, { sw: 2 });
    rect(x + 1080, y, 250, 56, { bg: C.white }); text(x + 1092, y + 15, q, { size: 18 });
    arrow(x + 1330, y + 28, x + 1380, y + 28, { sw: 2, color: C.teal });
    chip(x + 1460, y + 28, ans[i], { size: 18 });
  });
  text(x + 860, 600, "all four evaluated together, one request", { size: 18, color: C.gray });
  rect(x + 590, 640, 420, 64, { bg: C.orangeTint, stroke: C.orange, sw: 3 });
  ctext(x + 800, 672, "No paragraph to generate", { size: 26, color: C.orange });
  text(x + 590, 730, "parallel questions ≠ unlimited understanding", { size: 18, color: C.gray });
});

// ---------- Zone 03 ----------
zone(2, "The price unlock", (x) => {
  ctext(x + 800, 150, "$0.042 / 1M INPUT TOKENS", { size: 42, color: C.navy });
  ctext(x + 800, 215, "OUTPUT: FREE", { size: 34, color: C.teal });
  // scale
  line(x + 300, 470, x + 1100, 470, { color: C.navy, sw: 3 });
  line(x + 700, 470, x + 700, 530, { color: C.navy, sw: 3 });
  line(x + 640, 530, x + 760, 530, { color: C.navy, sw: 3 });
  ellipse(x + 330, 300, 160, 160, { bg: C.grayTint, stroke: C.gray, sw: 3 }); ctext(x + 410, 380, "1 reasoning\ncall", { size: 20, color: C.ink });
  text(x + 300, 480, "one expensive answer", { size: 18, color: C.gray });
  for (let r = 0; r < 3; r++) for (let c = 0; c < 8; c++) ellipse(x + 820 + c * 36, 380 + r * 28, 26, 26, { bg: C.tealTint, stroke: C.teal, sw: 1.5 });
  text(x + 820, 480, "many tiny judgments", { size: 18, color: C.gray });
  // receipt
  card(x + 560, 560, 480, 260, "TRUSTLENS RECEIPT", { tsize: 20, tcolor: C.gray });
  text(x + 590, 610, "2,229 input tokens", { size: 24 });
  text(x + 590, 650, "Jev call: 545 ms", { size: 24 });
  text(x + 590, 700, "Cost: $0.00009", { size: 30, color: C.navy });
  circleAround(x + 745, 717, 180, 62);
  text(x + 590, 770, "Current TypeSafe rate; verify before publishing", { size: 15, color: C.gray });
  text(x + 1100, 620, "per site,\nfour questions,\none call", { size: 20, color: C.gray });
});

// ---------- Zone 04 ----------
zone(3, "The three primitives", (x) => {
  ctext(x + 800, 100, "THREE ANSWER SHAPES", { size: 38, color: C.navy });
  rect(x + 700, 160, 200, 70, { bg: C.navyTint }); ctext(x + 800, 195, "ONE STATE", { size: 24, color: C.navy });
  const cx = [x + 280, x + 800, x + 1320];
  cx.forEach((c) => arrow(x + 800, 230, c, 290, { sw: 3 }));
  // A NOUL
  card(x + 60, 290, 460, 400, "NOUL");
  text(x + 82, 330, "Is this condition true?", { size: 20, color: C.gray });
  rect(x + 90, 400, 400, 26, { bg: C.grayTint, stroke: C.gray, sw: 1.5, round: false });
  rect(x + 90, 400, 328, 26, { bg: C.tealTint, stroke: C.teal, sw: 1.5, round: false });
  text(x + 90, 435, "FALSE", { size: 17, color: C.gray }); text(x + 445, 435, "TRUE", { size: 17, color: C.gray });
  line(x + 418, 388, x + 418, 438, { color: C.navy, sw: 3 }); text(x + 340, 460, "0.82 true", { size: 20, color: C.navy });
  text(x + 82, 540, "TrustLens:\nTestimonials preserve\ndiscretion?", { size: 20 });
  // B CHOICE
  card(x + 570, 290, 460, 400, "CHOICE");
  text(x + 592, 330, "Pick one defined option", { size: 20, color: C.gray });
  [["recognized authority", "18%", false], ["competent but generic", "71%", true], ["thin / unfinished", "11%", false]].forEach(([l, p, sel], i) => {
    const y = 395 + i * 62;
    ellipse(x + 600, y, 24, 24, { stroke: sel ? C.teal : C.gray, bg: sel ? C.teal : C.white, sw: 2 });
    if (sel) rect(x + 630, y - 12, 360, 48, { bg: C.tealTint, stroke: C.teal, sw: 1.5 });
    text(x + 640, y - 2, l, { size: 20, color: sel ? C.navy : C.ink }); text(x + 980, y - 2, p, { size: 20, align: "right", color: sel ? C.teal : C.gray });
  });
  text(x + 592, 600, "probabilities sum to 1; confidence = how peaked", { size: 17, color: C.gray });
  // C SCORE
  card(x + 1080, 290, 460, 400, "SCORE");
  text(x + 1102, 330, "Position on levels you describe", { size: 20, color: C.gray });
  line(x + 1120, 430, x + 1500, 430, { color: C.navy, sw: 3 });
  ["none", "generic", "specific", "verifiable"].forEach((l, i) => { const px = x + 1120 + i * 126.6; line(px, 418, px, 442, { color: C.navy, sw: 3 }); ctext(px, 465, l, { size: 17, color: C.gray }); });
  const mx = x + 1120 + 2.7 * 126.6; ellipse(mx - 12, 418, 24, 24, { bg: C.orange, stroke: C.orange }); ctext(mx, 500, "2.7", { size: 22, color: C.orange });
  text(x + 1102, 540, "TrustLens:\nHow specific and verifiable\nis the trust evidence?", { size: 20 });
  rect(x + 300, 730, 1000, 56, { bg: C.navyTint, stroke: C.navy }); ctext(x + 800, 758, "Your code defines the allowed answer space.", { size: 24, color: C.navy });
  text(x + 300, 805, "Typed does not mean infallible.", { size: 18, color: C.red });
  text(x + 60, 860, "reveal one primitive at a time", { size: 17, color: C.gray, opacity: 60 });
});

// ---------- Zone 05 ----------
zone(4, "TrustLens starts without AI", (x) => {
  ctext(x + 800, 95, "BEFORE ANY AI: DETERMINISTIC CODE", { size: 36, color: C.navy });
  // browser
  rect(x + 60, 200, 360, 260, { bg: C.white }); rect(x + 60, 200, 360, 40, { bg: C.grayTint, round: false });
  [0, 1, 2].forEach((i) => ellipse(x + 78 + i * 20, 212, 14, 14, { bg: C.gray, stroke: C.gray }));
  text(x + 150, 210, "consultantwebsite.com", { size: 17, color: C.ink });
  [270, 300, 330, 360, 390].forEach((y, i) => rect(x + 85, y, 200 + (i % 2) * 90, 14, { bg: C.grayTint, stroke: C.grayTint, round: false }));
  // robots checkpoint
  rect(x + 470, 130, 170, 50, { bg: C.greenTint, stroke: C.green }); ctext(x + 555, 155, "robots.txt ✓", { size: 19, color: C.green });
  arrow(x + 555, 180, x + 555, 250, { sw: 2, color: C.green });
  arrow(x + 420, 330, x + 480, 330, { sw: 3 });
  rect(x + 480, 250, 150, 160, { bg: C.navyTint }); ctext(x + 555, 330, "FETCH", { size: 24, color: C.navy });
  arrow(x + 630, 330, x + 700, 330, { sw: 3 });
  card(x + 700, 220, 220, 90, "Homepage", { tsize: 20 }); card(x + 700, 330, 220, 100, "About /\nTestimonials", { tsize: 20 });
  text(x + 700, 445, "two pages max", { size: 17, color: C.gray });
  arrow(x + 920, 330, x + 990, 330, { sw: 3 });
  // funnel
  line(x + 990, 200, x + 1230, 200, { sw: 3 }); line(x + 990, 200, x + 1070, 460, { sw: 3 }); line(x + 1230, 200, x + 1150, 460, { sw: 3 }); line(x + 1070, 460, x + 1150, 460, { sw: 3 });
  ctext(x + 1110, 300, "DETERMINISTIC\nEXTRACTOR", { size: 20, color: C.navy });
  text(x + 1040, 370, "{ code }", { size: 18, color: C.gray });
  arrow(x + 1110, 460, x + 1110, 520, { sw: 3 });
  const chips = ["schema types", "FAQ present", "title", "description", "testimonials", "credentials", "Google profile", "social links", "mobile viewport", "word count", "freshness", "PageSpeed"];
  chips.forEach((c, i) => chip(x + 640 + (i % 4) * 172, 520 + Math.floor(i / 4) * 60, c, { bg: C.white, stroke: C.navy, color: C.navy, size: 18 }));
  // orange scanner line: sweeps the browser window, then lands on the extracted chips
  arrow(x + 70, 300, x + 1156, 492, { color: C.orange, sw: 3, dash: "dashed", via: [[x + 400, 300], [x + 400, 470], [x + 1156, 470]], end: "arrow", rough: 1.4 });
  rect(x + 60, 600, 560, 64, { bg: C.orangeTint, stroke: C.orange, sw: 3 }); ctext(x + 340, 632, "Jev never sees raw HTML.", { size: 26, color: C.orange });
  text(x + 60, 690, "12 fields, computed in code. This is the whole input.", { size: 18, color: C.gray });
});

// ---------- Zone 06 ----------
zone(5, "The field contract", (x) => {
  ctext(x + 800, 95, "THE FIELD CONTRACT", { size: 38, color: C.navy });
  // raw pile
  rect(x + 80, 200, 440, 420, { bg: C.grayTint, stroke: C.gray, rough: 1.6 });
  text(x + 100, 212, "RAW WEBSITE", { size: 24, color: C.gray });
  ["<div class=\"hero\">", "<nav>…</nav>", "<style>.btn{…}</style>", "<script src=…>", "cookie banner", "<footer>…</footer>", "tracking pixels"].forEach((t, i) => { const y = 260 + i * 46; text(x + 110, y, t, { size: 19, color: C.gray }); strike(x + 105, y + 14, tw(t, 19) + 10); });
  rect(x + 80, 640, 300, 44, { bg: C.orangeTint, stroke: C.orange, sw: 2 }); ctext(x + 230, 662, "irrelevant text lowers accuracy", { size: 17, color: C.orange });
  arrow(x + 520, 410, x + 640, 410, { sw: 3 });
  // gate
  rect(x + 640, 260, 60, 300, { bg: C.navy, stroke: C.navy, round: false }); rect(x + 800, 260, 60, 300, { bg: C.navy, stroke: C.navy, round: false });
  ctext(x + 750, 235, "JSON SCHEMA", { size: 22, color: C.navy });
  text(x + 650, 170, "only approved fields pass", { size: 18, color: C.teal });
  arrow(x + 700, 410, x + 800, 410, { sw: 3, color: C.teal, end: null }); arrow(x + 860, 410, x + 960, 410, { sw: 3, color: C.teal });
  // clean card
  card(x + 960, 240, 560, 340, null);
  text(x + 990, 265, "{\n  schemaTypes,\n  faqPresent,\n  description,\n  testimonials,\n  credentials,\n  googleProfile\n}", { size: 24, color: C.navy, font: 3 });
  text(x + 1300, 300, "← just the fields\n   the questions\n   declared", { size: 18, color: C.gray });
  ["Question declares fields it reads", "Build fails on undeclared fields", "Send only what the judgment needs"].forEach((r, i) => { const y = 640 + i * 44; text(x + 640, y, "✓", { size: 24, color: C.green }); text(x + 680, y + 2, r, { size: 21 }); });
});

// ---------- Zone 07 ----------
zone(6, "One Jev call, four judgments", (x) => {
  ctext(x + 800, 95, "ONE CALL, FOUR JUDGMENTS", { size: 38, color: C.navy });
  card(x + 60, 220, 300, 360, null);
  text(x + 80, 240, "{\n schemaTypes,\n faqPresent,\n description,\n testimonials,\n credentials,\n googleProfile\n}", { size: 20, color: C.navy, font: 3 });
  text(x + 80, 590, "narrow state", { size: 17, color: C.gray });
  // Jev box
  rect(x + 560, 180, 480, 460, { bg: C.navyTint, sw: 3 }); ctext(x + 800, 215, "jev-latest", { size: 28, color: C.navy });
  const lanes = [["trust_signal_quality", "SCORE", "2.7 / 4 · conf 0.78"], ["discretion_respected", "NOUL", "0.82 true"], ["geo_readiness", "SCORE", "1.9 / 3 · conf 0.95"], ["authority_positioning", "CHOICE", "generic · 71%"]];
  lanes.forEach(([q, kind, ans], i) => {
    const y = 285 + i * 85;
    arrow(x + 360, 400, x + 560, y, { sw: 2 });
    rect(x + 580, y - 22, 300, 44, { bg: C.white }); text(x + 592, y - 11, q, { size: 18 });
    chip(x + 960, y, kind, { size: 16, bg: C.tealTint });
    arrow(x + 1040, y, x + 1110, y, { sw: 2, color: C.teal });
    rect(x + 1110, y - 22, 400, 44, { bg: C.white, stroke: C.teal }); text(x + 1122, y - 11, `${kind}: ${ans}`, { size: 18, color: C.navy });
  });
  // stopwatch + tokens
  ellipse(x + 580, 660, 34, 34, { stroke: C.gray, sw: 2 }); line(x + 597, 677, x + 597, 666, { color: C.gray }); line(x + 597, 677, x + 605, 681, { color: C.gray });
  text(x + 625, 665, "545 ms", { size: 20, color: C.gray }); text(x + 740, 665, "2,229 tokens · $0.00009", { size: 20, color: C.gray });
  text(x + 1110, 590, "four typed answers, in parallel", { size: 17, color: C.gray });
  rect(x + 500, 730, 600, 56, { bg: C.navyTint }); ctext(x + 800, 758, "Jev judges. Code calculates.", { size: 26, color: C.navy });
});

// ---------- Zone 08 ----------
zone(7, "Scoring stays in code", (x) => {
  ctext(x + 800, 95, "SCORING STAYS IN CODE", { size: 38, color: C.navy });
  // rails
  line(x + 60, 180, x + 1000, 180, { color: C.teal, sw: 4 }); text(x + 60, 145, "JEV JUDGMENTS", { size: 20, color: C.teal });
  line(x + 60, 230, x + 1000, 230, { color: C.navy, sw: 4 }); text(x + 60, 245, "CODE-EXTRACTED FACTS", { size: 20, color: C.navy });
  // mixer
  rect(x + 120, 300, 880, 300, { bg: C.white });
  const sl = ["SEO", "AI Search\nVisibility", "Trust", "Authority", "Discover-\nability"], vals = [78, 57, 87, 100, 77];
  sl.forEach((l, i) => {
    const sx = x + 210 + i * 170;
    line(sx, 330, sx, 520, { color: C.gray, sw: 3 });
    rect(sx - 22, 520 - vals[i] * 1.8 - 10, 44, 20, { bg: C.navy, stroke: C.navy });
    ctext(sx, 555, l, { size: 16, color: C.ink }); text(sx + 32, 520 - vals[i] * 1.8 - 12, String(vals[i]), { size: 18, color: C.navy });
    arrow(sx - 30, 180, sx - 12, 296, { color: C.teal, sw: 2 }); arrow(sx + 30, 230, sx + 12, 296, { color: C.navy, sw: 2 });
  });
  arrow(x + 1000, 450, x + 1080, 450, { sw: 3 });
  rect(x + 1080, 400, 200, 100, { bg: C.navyTint }); ctext(x + 1180, 435, "weighted", { size: 20, color: C.navy }); ctext(x + 1180, 465, "average", { size: 20, color: C.navy });
  arrow(x + 1280, 450, x + 1350, 450, { sw: 3 });
  ctext(x + 1450, 420, "78 / 100", { size: 26, color: C.navy }); ctext(x + 1450, 490, "B", { size: 96, color: C.navy });
  // threshold slider
  text(x + 120, 640, "threshold slider", { size: 18, color: C.gray });
  line(x + 300, 652, x + 700, 652, { color: C.gray, sw: 3 }); rect(x + 520, 640, 18, 26, { bg: C.orange, stroke: C.orange });
  text(x + 720, 640, "B → B+", { size: 24, color: C.navy }); text(x + 840, 645, "zero AI calls", { size: 18, color: C.teal });
  // do-not badge
  ellipse(x + 120, 700, 64, 64, { stroke: C.red, sw: 3 }); line(x + 130, 710, x + 174, 754, { color: C.red, sw: 3 });
  text(x + 200, 718, "No arithmetic inside Jev", { size: 20, color: C.red });
});

// ---------- Zone 09 ----------
zone(8, "Where Convex fits", (x) => {
  ctext(x + 800, 95, "WHERE CONVEX FITS", { size: 38, color: C.navy });
  // cylinder
  ellipse(x + 660, 330, 280, 60, { bg: C.tealTint, stroke: C.teal, sw: 3 });
  rect(x + 660, 360, 280, 180, { bg: C.tealTint, stroke: C.teal, sw: 3, round: false });
  ellipse(x + 660, 510, 280, 60, { bg: C.tealTint, stroke: C.teal, sw: 3 });
  line(x + 660, 360, x + 660, 540, { color: C.teal, sw: 3 }); line(x + 940, 360, x + 940, 540, { color: C.teal, sw: 3 });
  ctext(x + 800, 440, "CONVEX", { size: 26, color: C.navy }); ctext(x + 800, 475, "PERSISTENCE +\nLIVE STATE", { size: 17, color: C.gray });
  const cards = [["scans + results", x + 320, 240], ["question configurations / presets", x + 320, 400], ["history feed", x + 320, 560], ["rate limits + spend counter", x + 1200, 400], ["leads", x + 1200, 540]];
  cards.forEach(([l, cx, cy]) => { const w = tw(l, 19) + 40; rect(cx - w / 2, cy - 26, w, 52, { bg: C.white, stroke: C.teal }); ctext(cx, cy, l, { size: 19 }); const left = cx < x + 800; line(cx + (left ? w / 2 : -w / 2), cy, left ? x + 660 : x + 940, Math.max(365, Math.min(cy, 520)), { color: C.teal, sw: 2 }); });
  // app server sits between Convex and Jev — Jev only ever talks to the app
  rect(x + 1060, 170, 240, 90, { bg: C.navyTint }); ctext(x + 1180, 215, "APP SERVER", { size: 22, color: C.navy });
  arrow(x + 1100, 260, x + 930, 345, { sw: 3, start: "arrow", label: "App ↔ Convex", lx: 60, ly: -8 });
  rect(x + 1360, 170, 180, 90, { bg: C.white, sw: 3 }); ctext(x + 1450, 215, "JEV", { size: 26, color: C.navy });
  arrow(x + 1300, 200, x + 1360, 200, { sw: 3, label: "state", ly: -26, lsize: 16 }); arrow(x + 1360, 232, x + 1300, 232, { sw: 3, color: C.teal, label: "answers", ly: 14, lsize: 16 });
  text(x + 620, 600, "The app assembles the state Jev receives.\n(no Convex → Jev arrow — on purpose)", { size: 18, color: C.gray });
  rect(x + 80, 680, 560, 90, { bg: C.white, stroke: C.gray, dash: "dashed" }); text(x + 100, 692, "Classifier Studio edits config →\nretest last five scans without refetching", { size: 19, color: C.ink });
});

// ---------- Zone 10 ----------
zone(9, "From judgment to lead magnet", (x) => {
  ctext(x + 800, 95, "FROM JUDGMENT TO LEAD MAGNET", { size: 38, color: C.navy });
  const stages = ["Chrome extension /\npaste URL", "Free grade +\nfive scores", "Shareable\ncard", "Fix-it report +\nemail unlock", "Talk to\nWaterfall Growth"];
  stages.forEach((s, i) => {
    const sx = x + 80 + i * 300, h = 200 - i * 22, y = 320 - h / 2;
    rect(sx, y, 240, h, { bg: i === 4 ? C.navy : C.white, stroke: C.navy, sw: 2 });
    ctext(sx + 120, y + h / 2, s, { size: 19, color: i === 4 ? C.white : C.ink });
    if (i < 4) arrow(sx + 240, 320, sx + 300, 320, { sw: 3 });
  });
  arrow(x + 800, 430, x + 200, 430, { sw: 2, color: C.teal, via: [[x + 800, 470], [x + 200, 470]], label: "social distribution", ly: 52, lcolor: C.teal });
  text(x + 80, 620, "CHEAP JUDGMENT\n+ NICHE EXPERTISE\n+ SHAREABLE SCORE\n= LEAD MAGNET", { size: 26, color: C.navy, font: 3 });
  rect(x + 620, 630, 300, 52, { bg: C.orangeTint, stroke: C.orange, sw: 3 }); ctext(x + 770, 656, "Built in about one day", { size: 21, color: C.orange });
  text(x + 620, 720, "Jev makes judgment cheap.\nThe workflow makes it useful.", { size: 24, color: C.ink });
});

// ---------- write ----------
const doc = { type: "excalidraw", version: 2, source: "trustlens/scripts/excalidraw-board.mjs", elements: els, appState: { viewBackgroundColor: C.paper, gridSize: null, currentItemFontFamily: FONT }, files: {} };
writeFileSync(new URL("../docs/jev-system-one-trustlens.excalidraw", import.meta.url), JSON.stringify(doc));
console.log(`${els.length} elements, ${els.filter((e) => e.type === "frame").length} frames`);
