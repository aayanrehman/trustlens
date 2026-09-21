const API = "https://trustlens-mauve.vercel.app"; // TrustLens server; keys never leave it
const $ = (s) => document.querySelector(s);
const CATS = [["seo", "SEO"], ["geo", "GEO"], ["trust", "Trust"], ["discoverability", "Discoverability"]];
let tab, running = false;

async function currentTab() { const [t] = await chrome.tabs.query({ active: true, currentWindow: true }); return t; }
async function init() { tab = await currentTab(); try { $("#host").textContent = new URL(tab.url).hostname.replace(/^www\./, ""); } catch { $("#host").textContent = ""; } }
chrome.tabs.onActivated.addListener(init); chrome.tabs.onUpdated.addListener((id, info) => { if (info.url) init(); });
init();

function radar(v, size = 200) {
  const cx = size / 2, cy = size / 2, r = size * 0.36, pt = (vals, k) => vals.map((x, i) => { const a = -Math.PI / 2 + i * Math.PI / 2; const rr = Math.max(0, Math.min(100, x)) / 100 * r * k; return `${cx + rr * Math.cos(a)},${cy + rr * Math.sin(a)}`; }).join(" ");
  const L = ["SEO", "GEO", "TRUST", "DISCOVER"], lp = [0, 1, 2, 3].map((i) => { const a = -Math.PI / 2 + i * Math.PI / 2; return [cx + r * 1.24 * Math.cos(a), cy + r * 1.24 * Math.sin(a)]; });
  return `<svg viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">${[25, 50, 75, 100].map((k) => `<polygon points="${pt([k, k, k, k], 1)}" fill="none" stroke="#111" stroke-opacity=".15"/>`).join("")}<polygon points="${pt(v, 1)}" fill="#ff4d00" fill-opacity=".18" stroke="#ff4d00" stroke-width="2" style="animation:pop .4s both;transform-origin:50% 50%"/>${lp.map((p, i) => `<text x="${p[0]}" y="${p[1]}" text-anchor="middle" dominant-baseline="middle" font-size="10" font-family="monospace" fill="#55524b" letter-spacing=".08em">${L[i]}</text>`).join("")}</svg>`;
}
const chips = (x) => [["schema", x.schema_types.length ? x.schema_types.slice(0, 2).join(", ") + (x.schema_types.length > 2 ? ` +${x.schema_types.length - 2}` : "") : "none", x.schema_types.length > 0], ["faq", x.has_faq_block ? "yes" : "no", x.has_faq_block], ["title", `${x.meta_title.length} ch`, x.meta_title.length >= 30 && x.meta_title.length <= 65], ["description", x.meta_description.length ? `${x.meta_description.length} ch` : "missing", x.meta_description.length >= 70 && x.meta_description.length <= 165], ["testimonials", x.testimonial_text_blocks.length, x.testimonial_text_blocks.length > 0], ["credentials", x.credential_text_blocks.length, x.credential_text_blocks.length > 0], ["google profile", x.google_business_profile_linked ? "linked" : "none", x.google_business_profile_linked], ["social", x.social_links_found.join(", ") || "none", x.social_links_found.length > 0], ["mobile", x.mobile_friendly ? "yes" : "no", !!x.mobile_friendly], ["words", x.word_count, x.word_count >= 600], ["speed", x.page_speed_score == null ? "measuring…" : `${x.page_speed_score}/100`, (x.page_speed_score ?? 0) >= 80]].map(([k, v, on], i) => `<span class="chip ${on ? "on" : ""}" style="animation-delay:${i * 60}ms"><span class="eyebrow">${k}</span> ${v}</span>`).join("");
const esc = (s) => String(s).replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));

async function scan() {
  if (running) return; running = true; $("#scan").disabled = true; $("#scan").textContent = "Scanning…";
  const out = $("#out"); out.innerHTML = `<div class="status"><span class="eyebrow">fetching robots.txt + homepage<span class="blink">_</span></span><span class="mono" id="cost">$0.0000</span></div><div id="chips" class="chips"></div><div id="res"></div>`;
  try { await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ["content.js"] }); } catch { /* chrome:// pages etc. */ }
  let scored = null, result = null;
  try {
    const res = await fetch(`${API}/api/scan`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ urls: tab.url }) });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || `HTTP ${res.status}`);
    const reader = res.body.getReader(), dec = new TextDecoder(); let buf = "";
    for (;;) {
      const { value, done } = await reader.read(); if (done) break;
      buf += dec.decode(value, { stream: true }); const lines = buf.split("\n"); buf = lines.pop();
      for (const line of lines) {
        if (!line.trim()) continue; const e = JSON.parse(line);
        if (e.type === "stage") $(".status .eyebrow").innerHTML = { fetching: "fetching robots.txt + homepage", extracting: "extracting signals in code", scoring: "asking Jev · 4 questions · 1 request", done: "scored", blocked: "blocked by robots.txt", error: "failed" }[e.stage] + (e.stage === "done" || e.stage === "blocked" || e.stage === "error" ? "" : '<span class="blink">_</span>');
        if (e.type === "extraction") $("#chips").innerHTML = chips(e.extraction);
        if (e.type === "result") { result = e.result; scored = e.scored; render(result, scored); }
        if (e.type === "psi" && result) { result.extraction.page_speed_score = e.page_speed_score; $("#chips").innerHTML = chips(result.extraction); if (e.scored) { scored = e.scored; render(result, scored, true); } }
      }
    }
  } catch (err) { $("#res").innerHTML = `<div class="err">${esc(err.message)}</div>`; }
  running = false; $("#scan").disabled = false; $("#scan").textContent = "Scan again";
}

function render(r, s, quiet) {
  const res = $("#res");
  if (r.status !== "ok" || !s) { res.innerHTML = `<div class="grade"><div class="letter bad">${r.status === "blocked" ? "Skip" : "—"}</div><div style="font-size:12px">${esc(r.reason || "")}</div></div>`; return; }
  const tokens = r.usage?.input_tokens || 0; $("#cost").textContent = `$${(tokens * 0.042 / 1e6).toFixed(4)}`;
  const vals = CATS.map(([k]) => s.categories[k].score);
  const share = btoa(JSON.stringify({ h: r.host, g: s.grade, o: s.overall, s: vals, d: r.scanned_at.slice(0, 10) })).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  const comp = $("#competitors").value.split(/[\n,\s]+/).filter(Boolean).slice(0, 4);
  const compareUrl = `${API}/?go=1&u=${encodeURIComponent([r.host, ...comp].join("\n"))}`;
  res.innerHTML = (r.client_only_shell ? `<div class="warn"><span class="eyebrow" style="color:#ff4d00">crawler-invisible</span> This page ships an empty HTML shell. You see content; most AI crawlers see nothing.</div>` : "") +
    CATS.map(([k, label], i) => `<div class="cat" style="animation-delay:${quiet ? 0 : i * 450}ms"><div class="row"><span class="eyebrow">${label}</span><span class="mono" style="font-size:18px">${s.categories[k].score}</span></div><div class="bar"><i style="width:${s.categories[k].score}%"></i></div>${s.categories[k].issues.length ? `<ul>${s.categories[k].issues.map((m) => `<li>${esc(m)}</li>`).join("")}</ul>` : `<div class="okmsg">No issues flagged.</div>`}</div>`).join("") +
    `<div class="grade" style="animation-delay:${quiet ? 0 : 1900}ms"><div class="letter ${/[DF]/.test(s.grade) ? "bad" : /[AB]/.test(s.grade) ? "good" : ""}">${s.grade}</div><div><div class="eyebrow">Overall</div><div class="mono" style="font-size:26px">${s.overall}<span style="font-size:13px;color:#55524b">/100</span></div><div class="eyebrow">${esc((r.answers?.authority_positioning?.choice || "").replace(/_/g, " "))}</div></div></div>` +
    `<div style="animation:rise .5s both;animation-delay:${quiet ? 0 : 2100}ms">${radar(vals)}<div class="links"><a href="${API}/audit/${encodeURIComponent(r.host)}?d=${share}" target="_blank">Get my score ↗</a><a href="${compareUrl}" target="_blank">${comp.length ? `Compare vs ${comp.length} ↗` : "Open in TrustLens ↗"}</a></div><div class="cost">${tokens.toLocaleString()} input tokens × $0.042/M · model ${esc(r.model || "")} · Jev saw only the field contract, never the page.</div></div>`;
  if (!quiet) setTimeout(() => chrome.scripting.executeScript({ target: { tabId: tab.id }, func: (g, o, shell) => window.__trustlens?.grade(g, o, shell), args: [s.grade, s.overall, !!r.client_only_shell] }).catch(() => {}), 2000);
}
$("#scan").addEventListener("click", scan);
