// Runs inside the page being scanned. Walks the page top to bottom, auto-scrolling, boxing every
// element it recognises (signals in solid orange, everything else dashed), and reports progress to the
// side panel. Pure visuals: the score always comes from the server.
(() => {
  if (window.__trustlens) window.__trustlens.reset();
  const ACC = "#ff4d00", INK = "#111";
  const layer = document.createElement("div");
  layer.id = "trustlens-layer";
  Object.assign(layer.style, { position: "absolute", left: 0, top: 0, width: 0, height: 0, zIndex: 2147483646, pointerEvents: "none", fontFamily: "ui-monospace, Menlo, monospace" });
  document.documentElement.appendChild(layer);

  const banner = document.createElement("div");
  Object.assign(banner.style, { position: "fixed", top: "12px", left: "50%", transform: "translateX(-50%)", zIndex: 2147483647, background: INK, color: "#f6f4ee", padding: "10px 16px", fontSize: "13px", letterSpacing: ".04em", display: "flex", gap: "14px", alignItems: "center", boxShadow: "0 8px 30px rgba(0,0,0,.35)", transition: "background .3s", cursor: "pointer", whiteSpace: "nowrap" });
  banner.innerHTML = `<span style="color:${ACC};font-weight:600">TRUSTLENS</span><span id="tl-msg">scanning…</span><span id="tl-bar" style="width:120px;height:3px;background:rgba(255,255,255,.2)"><i style="display:block;height:100%;width:0;background:${ACC};transition:width .15s"></i></span>`;
  document.documentElement.appendChild(banner);
  banner.addEventListener("click", () => window.__trustlens.reset());
  const say = (m) => { banner.querySelector("#tl-msg").textContent = m; };
  const progress = (p) => { banner.querySelector("#tl-bar i").style.width = `${Math.round(p * 100)}%`; };
  const report = (msg) => { try { chrome.runtime.sendMessage({ type: "tl", ...msg }); } catch {} };

  const CRED = /\b(certified|certification|member of|IECA|HECA|NACAC|founder|years? of experience|former (admissions?|dean|counselor)|admissions officer|licensed|accredited|featured (in|by))\b/i;
  const DEG = /\b(M\.?Ed\.?|Ph\.?D\.?|Ed\.?D\.?|M\.?A\.?|B\.?A\.?|MBA|J\.?D\.?)(?=[\s,.)(]|$)/;
  const rect = (el) => el.getBoundingClientRect();
  const visible = (el) => { const r = rect(el); return r.width > 24 && r.height > 10 && getComputedStyle(el).visibility !== "hidden"; }; // opacity is ignored: scroll-reveal sites start everything at 0
  const text = (el) => (el.innerText || el.alt || "").replace(/\s+/g, " ").trim();
  const taken = new Set();
  const pick = (sel, test, max, opts = {}) => {
    const out = [];
    for (const el of document.querySelectorAll(sel)) {
      if (out.length >= max) break;
      if (!visible(el) || el.closest("#trustlens-layer") || taken.has(el)) continue;
      if (!opts.allowChrome && el.closest("nav,header,footer,form")) continue;
      const t = text(el);
      if ((opts.minLen ?? 15) <= t.length && t.length < (opts.maxLen ?? 900) && (!test || test(t, el)) && !out.some((o) => o.contains(el) || el.contains(o)) && ![...taken].some((o) => o.contains(el) || el.contains(o))) out.push(el);
    }
    out.forEach((e) => taken.add(e));
    return out;
  };

  // Signals first (they claim their elements), then everything else the eye lands on.
  const groups = [
    ["testimonial", true, pick('blockquote, q, [class*="testimonial" i], [id*="testimonial" i], [class*="review" i], [class*="quote" i]', (t, el) => !/head|title|__scroller|__track/i.test(el.className) && el.tagName !== "SECTION", 10)],
    ["credential", true, pick("p, li, h1, h2, h3, h4, span, div", (t, el) => (el.tagName !== "DIV" || (el.children.length <= 2 && t.length < 320)) && (CRED.test(t) || DEG.test(t)), 8)],
    ["social", true, pick('a[href*="linkedin.com"], a[href*="instagram.com"], a[href*="facebook.com"], a[href*="youtube.com"]', null, 6, { allowChrome: true, minLen: 0 })],
    ["google profile", true, pick('a[href*="google.com/maps"], a[href*="g.page"], a[href*="maps.app.goo.gl"], iframe[src*="google.com/maps"], a[href*="google.com/search"]', null, 3, { allowChrome: true, minLen: 0 })],
    ["faq", true, pick("h2, h3, h4, summary, dt", (t) => /\?\s*$/.test(t), 8)],
    ["headline", false, pick("h1, h2", null, 12, { minLen: 3 })],
    ["nav", false, pick("nav a, header a", null, 10, { allowChrome: true, minLen: 2, maxLen: 40 })],
    ["logo", false, pick('header img, nav img, img[alt*="logo" i], [class*="logo" i] img, [class*="featured" i] img, [class*="press" i] img, [class*="partner" i] img', null, 14, { allowChrome: true, minLen: 0 })],
    ["cta", false, pick('a[class*="btn" i], a[class*="button" i], button, a[class*="cta" i]', null, 8, { allowChrome: true, minLen: 2, maxLen: 60 })],
    ["image", false, pick("img, picture, video", (t, el) => rect(el).width > 120 && rect(el).height > 80, 10, { minLen: 0 })],
    ["subhead", false, pick("h3, h4", null, 12, { minLen: 3 })],
    ["copy", false, pick("p, li", null, 18, { minLen: 60 })],
    ["resource", false, pick('a[href$=".pdf"], a[href$=".docx"], a[href*="download" i], a[href*="resource" i]', null, 8, { minLen: 2 })],
  ];
  const schemaCount = document.querySelectorAll('script[type="application/ld+json"]').length;

  const queue = groups.flatMap(([label, signal, els]) => els.map((el) => ({ label, signal, el, top: rect(el).top + scrollY }))).sort((a, b) => a.top - b.top);
  const counts = Object.fromEntries(groups.map(([l, , e]) => [l, e.length]));

  function box({ el, label, signal }) {
    const r = rect(el); const b = document.createElement("div");
    Object.assign(b.style, { position: "absolute", left: `${r.left + scrollX - 4}px`, top: `${r.top + scrollY - 4}px`, width: `${r.width + 8}px`, height: `${r.height + 8}px`, border: signal ? `2px solid ${ACC}` : `1px dashed ${INK}`, boxShadow: signal ? "0 0 0 4px rgba(255,77,0,.15)" : "none", opacity: 0, transform: "scale(.97)", transition: "opacity .22s, transform .22s" });
    const tag = document.createElement("span");
    Object.assign(tag.style, { position: "absolute", left: "-1px", top: "-18px", background: signal ? ACC : INK, color: "#fff", fontSize: "9px", letterSpacing: ".12em", padding: "2px 6px", textTransform: "uppercase", lineHeight: "14px" });
    tag.textContent = label; b.appendChild(tag); layer.appendChild(b);
    requestAnimationFrame(() => { b.style.opacity = 1; b.style.transform = "none"; });
  }

  // Auto-scroll through the page, boxing things as the viewport reaches them.
  let i = 0, stopped = false; const vh = innerHeight; let found = 0;
  const step = () => {
    if (stopped) return;
    if (i >= queue.length) { say(`scanned ${queue.length} elements · ${schemaCount} schema blocks`); progress(1); report({ stage: "boxed", found, total: queue.length }); return; }
    const item = queue[i++];
    const target = Math.max(0, item.top - vh * 0.45);
    if (Math.abs(scrollY - target) > 40) window.scrollTo({ top: target, behavior: "smooth" });
    box(item); if (item.signal) found++;
    say(`${item.label} · ${i}/${queue.length}`); progress(i / queue.length);
    report({ stage: "box", label: item.label, signal: item.signal, i, total: queue.length });
    setTimeout(step, item.signal ? 190 : 110);
  };
  setTimeout(step, 250);

  window.__trustlens = {
    counts, schemaCount,
    grade(g, overall, shell) {
      stopped = true; window.scrollTo({ top: 0, behavior: "smooth" });
      say(shell ? `grade ${g} · ${overall}/100 — crawlers see an EMPTY page` : `grade ${g} · ${overall}/100`); progress(1);
      banner.style.background = g === "F" || g === "D" ? ACC : INK;
    },
    reset() { stopped = true; layer.remove(); banner.remove(); delete window.__trustlens; },
  };
})();
