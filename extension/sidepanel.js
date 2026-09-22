const API = "https://trustlens-mauve.vercel.app"; // TrustLens server; keys never leave it
const RATE = 0.042 / 1e6;
const $ = (s) => document.querySelector(s);
const CATS = [["seo", "SEO"], ["geo", "AI Search Visibility"], ["trust", "Trust"], ["authority", "Authority"], ["discoverability", "Discoverability"]];
const LABELS = ["SEO", "AI SEARCH", "TRUST", "AUTHORITY", "DISCOVER"];
let tab = null, running = false;
const esc = (s) => String(s).replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
const scannable = (u) => /^https?:\/\//.test(u || "");

async function init() {
  const [t] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  if (!t) return;
  tab = t;
  let host = ""; try { host = new URL(tab.url).hostname.replace(/^www\./, ""); } catch {}
  $("#host").textContent = host;
  $("#scan").disabled = !scannable(tab.url) || running;
  if (!scannable(tab.url) && !running) $("#out").innerHTML = `<div class="err">Open a website tab (http/https) to scan it.</div>`;
}
chrome.tabs.onActivated.addListener(init);
chrome.tabs.onUpdated.addListener((id, info) => { if (info.status === "complete" && tab && id === tab.id && !running) init(); });
init(); // nothing runs until the Scan button is clicked

// Progress from content.js (the on-page boxing) → live log; the score is held back until boxing finishes.
let boxing = { done: false, ms: 0, total: 0, found: 0 }, pending = null;
chrome.runtime.onMessage.addListener((m, sender) => {
  if (m?.type !== "tl" || !tab || sender.tab?.id !== tab.id) return;
  const log = $("#log"), track = $("#track i"); if (!log) return;
  if (m.stage === "box") { const d = document.createElement("div"); d.className = m.signal ? "sig" : ""; d.textContent = `${m.signal ? "● " : "○ "}${m.label} · ${m.i}/${m.total}`; log.appendChild(d); while (log.children.length > 6) log.firstChild.remove(); if (track) track.style.width = `${(m.i / m.total) * 100}%`; }
  if (m.stage === "boxed") { boxing = { done: true, ms: m.ms, total: m.total, found: m.found }; const d = document.createElement("div"); d.textContent = `✓ read ${m.total} elements · ${m.found} trust signals · ${(m.ms / 1000).toFixed(1)}s`; log.appendChild(d); if (pending) { const p = pending; pending = null; reveal(p.r, p.s); } }
});

function radar(v, size = 220) {
  const n = v.length, cx = size / 2, cy = size / 2, r = size * 0.32;
  const P = (vals) => vals.map((x, i) => { const a = -Math.PI / 2 + (i * 2 * Math.PI) / n; const rr = (Math.max(0, Math.min(100, x)) / 100) * r; return [cx + rr * Math.cos(a), cy + rr * Math.sin(a)]; });
  const pts = (vals) => P(vals).map((p) => p.join(",")).join(" ");
  const lp = v.map((_, i) => { const a = -Math.PI / 2 + (i * 2 * Math.PI) / n; return [cx + r * 1.32 * Math.cos(a), cy + r * 1.32 * Math.sin(a)]; });
  return `<svg viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">${[25, 50, 75, 100].map((k) => `<polygon points="${pts(v.map(() => k))}" fill="none" stroke="#0b1220" stroke-opacity=".15"/>`).join("")}${P(v.map(() => 100)).map((p) => `<line x1="${cx}" y1="${cy}" x2="${p[0]}" y2="${p[1]}" stroke="#0b1220" stroke-opacity=".2"/>`).join("")}<polygon points="${pts(v)}" fill="#0b2a5b" fill-opacity=".18" stroke="#0b2a5b" stroke-width="2" style="animation:pop .4s both;transform-origin:50% 50%"/>${P(v).map((p) => `<circle cx="${p[0]}" cy="${p[1]}" r="3.5" fill="#12a39a"/>`).join("")}${lp.map((p, i) => `<text x="${p[0]}" y="${p[1]}" text-anchor="middle" dominant-baseline="middle" font-size="9" font-family="monospace" fill="#4b5567" letter-spacing=".08em">${LABELS[i]}</text>`).join("")}</svg>`;
}
const chips = (x) => [["schema", x.schema_types.length ? x.schema_types.slice(0, 2).join(", ") + (x.schema_types.length > 2 ? ` +${x.schema_types.length - 2}` : "") : "none", x.schema_types.length > 0], ["faq", x.has_faq_block ? "yes" : "no", x.has_faq_block], ["title", `${x.meta_title.length} ch`, x.meta_title.length >= 30 && x.meta_title.length <= 65], ["description", x.meta_description.length ? `${x.meta_description.length} ch` : "missing", x.meta_description.length >= 70 && x.meta_description.length <= 165], ["testimonials", x.testimonial_text_blocks.length, x.testimonial_text_blocks.length > 0], ["credentials", x.credential_text_blocks.length, x.credential_text_blocks.length > 0], ["google profile", x.google_business_profile_linked ? "linked" : "none", x.google_business_profile_linked], ["social", x.social_links_found.join(", ") || "none", x.social_links_found.length > 0], ["mobile", x.mobile_friendly ? "yes" : "no", !!x.mobile_friendly], ["words", x.word_count, x.word_count >= 600], ["speed", x.page_speed_score == null ? "measuring…" : `${x.page_speed_score}/100`, (x.page_speed_score ?? 0) >= 80]].map(([k, v, on], i) => `<span class="chip ${on ? "on" : ""}" style="animation-delay:${i * 60}ms"><span class="eyebrow">${k}</span> ${esc(v)}</span>`).join("");

let t0 = 0, result = null, scored = null, injected = false;
async function scan() {
  if (running || !tab || !scannable(tab.url)) return;
  running = true; t0 = Date.now(); result = scored = pending = null; boxing = { done: false, ms: 0, total: 0, found: 0 };
  const btn = $("#scan"); btn.disabled = true; btn.textContent = "Scanning…"; btn.classList.add("live");
  $("#out").innerHTML = `<div class="status"><span class="eyebrow" id="stage">reading the page<span class="blink">_</span></span><span class="mono" id="cost">$0.00000</span></div><div class="track" id="track"><i></i></div><div class="log" id="log"><div>injecting scanner into the page…</div></div><div id="niche" class="chips"></div><div id="chips" class="chips"></div><div id="res"></div>`;
  try { await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ["content.js"] }); injected = true; } catch (e) { injected = false; boxing.done = true; $("#log").innerHTML = `<div>could not draw on this page (${esc(e.message)})</div>`; }
  try {
    const res = await fetch(`${API}/api/scan`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ urls: tab.url, source: "extension" }) });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || `HTTP ${res.status}`);
    const reader = res.body.getReader(), dec = new TextDecoder(); let buf = "";
    for (;;) {
      const { value, done } = await reader.read(); if (done) break;
      buf += dec.decode(value, { stream: true }); const lines = buf.split("\n"); buf = lines.pop();
      for (const line of lines) {
        if (!line.trim()) continue; const e = JSON.parse(line);
        if (e.type === "stage" && !result) $("#stage").innerHTML = ({ fetching: "server: fetching robots.txt + homepage", extracting: "server: extracting 12 signals in code", detecting: "Jev: what kind of business is this?", scoring: "server: asking Jev · 4 questions · 1 call", done: "server done", blocked: "blocked by robots.txt", error: "failed" }[e.stage]) + (/done|blocked|error/.test(e.stage) ? "" : '<span class="blink">_</span>');
        if (e.type === "extraction") $("#chips").innerHTML = chips(e.extraction);
        if (e.type === "niche") { const d = document.createElement("div"); d.className = "sig"; d.textContent = `◆ niche auto-detected: ${e.niche.label} (${Math.round(e.niche.confidence * 100)}%) — questions re-phrased`; $("#log").appendChild(d); $("#niche").innerHTML = `<span class="chip on" style="border-color:#0b2a5b"><span class="eyebrow">niche</span> ${esc(e.niche.label)} · ${Math.round(e.niche.confidence * 100)}%</span>`; }
        if (e.type === "result") { result = e.result; scored = e.scored; result.scanId = e.scanId; if (boxing.done) reveal(result, scored); else { pending = { r: result, s: scored }; $("#stage").innerHTML = 'server done · still reading the page<span class="blink">_</span>'; setTimeout(() => { if (pending) { const p = pending; pending = null; reveal(p.r, p.s); } }, 20000); } }
        if (e.type === "psi" && result) { result.extraction.page_speed_score = e.page_speed_score; $("#chips").innerHTML = chips(result.extraction); if (e.scored) { scored = e.scored; if (!pending) reveal(result, scored, true); else pending = { r: result, s: scored }; } }
      }
    }
  } catch (err) { $("#res").innerHTML = `<div class="err">${esc(err.message)}</div>`; }
  // Safety net: never leave the panel silent if the stream ended without a result for this tab.
  if (!result && !$("#res").innerHTML) $("#res").innerHTML = `<div class="warn" style="margin-top:16px"><div class="eyebrow" style="color:#ff4d00">no result</div><p style="margin:6px 0 0;font-size:13px;color:#4b5567">The server closed the connection before scoring this page. Try again.</p></div>`;
  running = false; btn.disabled = false; btn.textContent = "Scan again"; btn.classList.remove("live");
}

function reveal(r, s, quiet) {
  const res = $("#res");
  $("#stage").textContent = "scored";
  if (r.status !== "ok" || !s) {
    const blocked = r.status === "blocked";
    res.innerHTML = `<div class="warn" style="margin-top:16px"><div class="eyebrow" style="color:#ff4d00">${blocked ? "cannot be scanned" : "scan failed"}</div>
      <div style="font-size:15px;margin-top:6px">${blocked ? "This page is closed to crawlers." : "Something went wrong reading this page."}</div>
      <p style="margin:8px 0 0;font-size:13px;color:#4b5567">${esc(r.reason || "No reason given.")}</p></div>
      <div class="links"><button class="fill" id="retry">Try again</button></div>`;
    const b = $("#retry"); if (b) b.onclick = scan;
    return;
  }
  const tokens = r.usage?.input_tokens || 0, cost = tokens * RATE; $("#cost").textContent = `$${cost.toFixed(5)}`;
  const vals = CATS.map(([k]) => s.categories[k]?.score ?? 0);
  const share = btoa(JSON.stringify({ h: r.host, g: s.grade, o: s.overall, s: vals, d: r.scanned_at.slice(0, 10) })).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  const auditUrl = r.scanId ? `${API}/audit/${r.scanId}` : `${API}/audit/${encodeURIComponent(r.host)}?d=${share}`;
  const comp = $("#competitors").value.split(/[\n,\s]+/).filter(Boolean).slice(0, 4);
  const compareUrl = `${API}/?go=1&u=${encodeURIComponent([r.host, ...comp].join("\n"))}`;
  const wall = Date.now() - t0, lat = r.latency_ms || {};
  res.innerHTML = (r.niche ? `<div class="hint" style="margin-top:10px"><span class="eyebrow" style="color:#0b2a5b">auto-detected niche</span> ${esc(r.niche.label)} — scored against what ${esc((r.niche.label || "").toLowerCase())} clients and AI assistants look for.</div>` : "") + (r.client_only_shell ? `<div class="warn"><span class="eyebrow" style="color:#ff4d00">crawler-invisible</span> This page ships an empty HTML shell. You see content; most AI crawlers see nothing.</div>` : "") +
    CATS.map(([k, label], i) => `<div class="cat" style="animation-delay:${quiet ? 0 : i * 450}ms"><div class="row"><span class="eyebrow">${label}</span><span class="mono" style="font-size:18px">${s.categories[k]?.score ?? "—"}</span></div><div class="bar"><i style="width:${s.categories[k]?.score ?? 0}%"></i></div>${(s.categories[k]?.issues || []).length ? `<ul>${s.categories[k].issues.map((m) => `<li>${esc(m)}</li>`).join("")}</ul>` : `<div class="okmsg">No issues flagged.</div>`}</div>`).join("") +
    `<div class="grade" style="animation-delay:${quiet ? 0 : 2300}ms"><div class="letter ${/[DF]/.test(s.grade) ? "bad" : /[AB]/.test(s.grade) ? "good" : ""}">${s.grade}</div><div><div class="eyebrow">Overall</div><div class="mono" style="font-size:26px">${s.overall}<span style="font-size:13px;color:#4b5567">/100</span></div><div class="eyebrow">${esc((r.answers?.authority_positioning?.choice || "").replace(/_/g, " "))}</div></div></div>` +
    `<div style="animation:rise .5s both;animation-delay:${quiet ? 0 : 2500}ms">${radar(vals)}<div class="links"><button class="fill" id="share">Share my score</button>${r.scanId ? `<a href="${auditUrl}#report" target="_blank">Fix-it report ↗</a>` : ""}<a href="${compareUrl}" target="_blank">${comp.length ? `Compare vs ${comp.length} ↗` : "Open in TrustLens ↗"}</a></div>
    <div class="meter">
      <span class="k">page read (boxing)</span><span>${boxing.total ? `${boxing.total} elements · ${(boxing.ms / 1000).toFixed(1)}s` : "—"}</span>
      <span class="k">server fetch + extract</span><span>${lat.fetch != null ? `${lat.fetch} ms` : "—"}</span>
      <span class="k">Jev · 4 questions · 1 call</span><span>${lat.jev != null ? `${lat.jev} ms` : "—"}</span>
      <span class="k">total wall time</span><span>${(wall / 1000).toFixed(1)}s</span>
      <span class="k">input tokens</span><span>${tokens.toLocaleString()}</span>
      <span class="k">rate</span><span>$0.042 per million</span>
      <span class="total"><b>cost of this scan</b><b>$${cost.toFixed(5)}</b></span>
    </div>
    <div class="hint">model ${esc(r.model || "")} · Jev saw only the 12-field contract, never the page.</div></div>`;
  $("#share").onclick = () => sheet(r.host, s.grade, s.overall, auditUrl, share);
  if (!quiet && injected) setTimeout(() => chrome.scripting.executeScript({ target: { tabId: tab.id }, func: (g, o, shell) => window.__trustlens?.grade(g, o, shell), args: [s.grade, s.overall, !!r.client_only_shell] }).catch(() => {}), 2300);
}

function sheet(host, grade, overall, url, share) {
  const text = `${host} scored ${grade} (${overall}/100) on TrustLens — SEO, AI search visibility, trust, authority and discoverability, judged by AI.`;
  $("#sheet").innerHTML = `<div class="sheet"><div><div style="display:flex;justify-content:space-between"><span class="eyebrow">Share your score</span><button id="close" style="border:0;background:none;font-size:18px">×</button></div><img src="${API}/api/og?d=${share}" alt=""><div class="grid2"><a href="https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}" target="_blank">Post on LinkedIn</a><a href="https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}" target="_blank">Post on X</a><button id="copy">Copy link</button><a href="${API}/api/og?d=${share}" download="trustlens-${host}.png">Download PNG</a></div></div></div>`;
  $("#close").onclick = () => ($("#sheet").innerHTML = "");
  $("#sheet .sheet").onclick = (e) => { if (e.target === e.currentTarget) $("#sheet").innerHTML = ""; };
  $("#copy").onclick = async () => { await navigator.clipboard.writeText(url); $("#copy").textContent = "Copied ✓"; };
}
$("#scan").addEventListener("click", scan);
