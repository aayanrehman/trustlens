// Runs inside the page being scanned. Finds the same signals the server extracts and boxes them
// on screen, one by one, then shows the grade. Pure visuals: the score always comes from the server.
(() => {
  if (window.__trustlens) { window.__trustlens.reset(); }
  const ACC = "#ff4d00";
  const layer = document.createElement("div");
  layer.id = "trustlens-layer";
  Object.assign(layer.style, { position: "absolute", left: 0, top: 0, width: "0", height: "0", zIndex: 2147483646, pointerEvents: "none", fontFamily: "ui-monospace, Menlo, monospace" });
  document.documentElement.appendChild(layer);

  const banner = document.createElement("div");
  Object.assign(banner.style, { position: "fixed", top: "12px", left: "50%", transform: "translateX(-50%)", zIndex: 2147483647, background: "#111", color: "#f6f4ee", padding: "10px 16px", fontSize: "13px", letterSpacing: ".04em", display: "flex", gap: "14px", alignItems: "center", boxShadow: "0 8px 30px rgba(0,0,0,.35)", transition: "all .3s" });
  banner.innerHTML = `<span style="color:${ACC};font-weight:600">TRUSTLENS</span><span id="tl-msg">scanning…</span>`;
  document.documentElement.appendChild(banner);
  const say = (m) => { const el = banner.querySelector("#tl-msg"); if (el) el.textContent = m; };

  const CRED = /\b(certified|certification|member of|IECA|HECA|NACAC|founder|years? of experience|former (admissions?|dean|counselor)|admissions officer|licensed|accredited)\b/i;
  const DEG = /\b(M\.?Ed\.?|Ph\.?D\.?|Ed\.?D\.?|M\.?A\.?|B\.?A\.?|MBA|J\.?D\.?)(?=[\s,.)(]|$)/; // case-sensitive: "Med School" is not an M.Ed
  const visible = (el) => { const r = el.getBoundingClientRect(); return r.width > 40 && r.height > 12 && getComputedStyle(el).visibility !== "hidden"; }; // rendered anywhere in the document, not just the viewport
  const text = (el) => (el.innerText || "").replace(/\s+/g, " ").trim();
  const pick = (sel, test, max) => { const out = []; for (const el of document.querySelectorAll(sel)) { if (out.length >= max) break; if (!visible(el) || el.closest("nav,header,footer,form,#trustlens-layer")) continue; const t = text(el); if (t.length > 15 && t.length < 900 && (!test || test(t, el)) && !out.some((o) => o.contains(el) || el.contains(o))) out.push(el); } return out; };

  const groups = [
    ["testimonial", pick('blockquote, q, [class*="testimonial" i], [id*="testimonial" i], [class*="review" i], [class*="quote" i]', (t, el) => !/head|title|__scroller|__track/i.test(el.className) && el.tagName !== "SECTION", 8)],
    ["credential", pick("p, li, h1, h2, h3, h4, span, div", (t, el) => (el.children.length <= 2) && (CRED.test(t) || DEG.test(t)), 8)],
    ["social", [...document.querySelectorAll('a[href*="linkedin.com"], a[href*="instagram.com"], a[href*="facebook.com"], a[href*="youtube.com"]')].filter(visible).slice(0, 6)],
    ["google profile", [...document.querySelectorAll('a[href*="google.com/maps"], a[href*="g.page"], a[href*="maps.app.goo.gl"], iframe[src*="google.com/maps"]')].filter(visible).slice(0, 2)],
    ["faq", pick("h2, h3, h4, summary, dt", (t) => /\?\s*$/.test(t), 6)],
  ];
  const schemaCount = document.querySelectorAll('script[type="application/ld+json"]').length;
  const desc = document.querySelector('meta[name="description"]')?.content || "";

  let i = 0; const boxes = [];
  function box(el, label) {
    const r = el.getBoundingClientRect(); const b = document.createElement("div");
    Object.assign(b.style, { position: "absolute", left: `${r.left + scrollX - 4}px`, top: `${r.top + scrollY - 4}px`, width: `${r.width + 8}px`, height: `${r.height + 8}px`, border: `2px solid ${ACC}`, boxShadow: `0 0 0 4px rgba(255,77,0,.15)`, opacity: 0, transform: "scale(.96)", transition: "opacity .25s, transform .25s" });
    const tag = document.createElement("span");
    Object.assign(tag.style, { position: "absolute", left: "-2px", top: "-20px", background: ACC, color: "#fff", fontSize: "10px", letterSpacing: ".12em", padding: "2px 6px", textTransform: "uppercase" });
    tag.textContent = label; b.appendChild(tag); layer.appendChild(b); boxes.push(b);
    requestAnimationFrame(() => { b.style.opacity = 1; b.style.transform = "none"; });
  }
  const queue = groups.flatMap(([label, els]) => els.map((el) => [label, el]));
  const tick = () => { if (i >= queue.length) return; const [label, el] = queue[i++]; box(el, label); say(`found ${label} · ${i}/${queue.length}`); setTimeout(tick, 140); };
  setTimeout(tick, 300);

  window.__trustlens = {
    counts: Object.fromEntries(groups.map(([l, e]) => [l, e.length])), schemaCount, descLength: desc.length,
    grade(g, overall, shell) { say(shell ? `grade ${g} · ${overall}/100 — crawler sees an EMPTY page` : `grade ${g} · ${overall}/100`); banner.style.background = g === "F" || g === "D" ? ACC : "#111"; },
    reset() { layer.remove(); banner.remove(); },
  };
  banner.addEventListener("click", () => window.__trustlens.reset());
  banner.style.pointerEvents = "auto"; banner.style.cursor = "pointer";
})();
