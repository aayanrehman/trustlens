import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { decodeShare } from "@/lib/share";
import { radarPoints } from "@/components/Radar";

export const runtime = "nodejs";
const NAVY = "#0b2a5b", TEAL = "#12a39a", INK = "#0b1220", PAPER = "#f5f7fb", SCAN = "#ff4d00";

// Branded share card, 1200×630: logo, favicon + domain, letter grade, five category numbers, pentagon.
export async function GET(req: NextRequest) {
  const p = decodeShare(req.nextUrl.searchParams.get("d") ?? undefined);
  if (!p) return new Response("bad payload", { status: 400 });
  const origin = req.nextUrl.origin;
  const size = 400, cx = size / 2, cy = size / 2, r = size * 0.33;
  const full = (k: number) => p.s.map(() => k);
  const pts = radarPoints(p.s, r, cx, cy).map((q) => q.join(",")).join(" ");
  const rings = [25, 50, 75, 100].map((k) => radarPoints(full(k), r, cx, cy).map((q) => q.join(",")).join(" "));
  const axes = radarPoints(full(100), r, cx, cy);
  const labels = ["SEO", "AI SEARCH", "TRUST", "AUTHORITY", "DISCOVER"].slice(0, p.s.length);
  const lp = radarPoints(full(130), r, cx, cy);
  const bad = p.g === "D" || p.g === "F";
  const cats = [["SEO", p.s[0]], ["AI search", p.s[1]], ["Trust", p.s[2]], ["Authority", p.s[3]], ["Discover", p.s[4]]].filter(([, v]) => v != null) as [string, number][];
  return new ImageResponse(
    (
      <div style={{ width: 1200, height: 630, display: "flex", flexDirection: "column", background: PAPER, color: INK, fontFamily: "Georgia, serif", padding: "44px 56px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <img src={`${origin}/logo-480.png`} width={88} height={44} alt="" />
            <div style={{ display: "flex", fontSize: 34 }}><span>Trust</span><span style={{ color: TEAL }}>Lens</span></div>
          </div>
          <div style={{ display: "flex", fontSize: 16, fontFamily: "monospace", color: "#4b5567", letterSpacing: 2 }}>TRUST & AI-VISIBILITY AUDIT · SERVICE BUSINESSES</div>
        </div>
        <div style={{ display: "flex", flex: 1, marginTop: 10 }}>
          <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <img src={`https://www.google.com/s2/favicons?domain=${encodeURIComponent(p.h)}&sz=64`} width={40} height={40} alt="" style={{ borderRadius: 8, background: "#fff" }} />
              <div style={{ display: "flex", fontSize: 40, fontFamily: "monospace" }}>{p.h}</div>
            </div>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 28 }}>
              <div style={{ display: "flex", fontSize: 250, lineHeight: 0.85, color: bad ? SCAN : NAVY }}>{p.g}</div>
              <div style={{ display: "flex", flexDirection: "column", paddingBottom: 14 }}>
                <div style={{ display: "flex", fontSize: 46, fontFamily: "monospace" }}>{`${p.o}/100`}</div>
                <div style={{ display: "flex", fontSize: 18, color: "#4b5567", fontFamily: "monospace" }}>{`overall · scanned ${p.d}`}</div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              {cats.map(([l, v]) => (
                <div key={l} style={{ display: "flex", flexDirection: "column", border: `1px solid ${v >= 70 ? TEAL : v < 40 ? SCAN : "#c9d1de"}`, padding: "8px 14px", minWidth: 96 }}>
                  <div style={{ display: "flex", fontSize: 12, fontFamily: "monospace", color: "#4b5567", letterSpacing: 2 }}>{l.toUpperCase()}</div>
                  <div style={{ display: "flex", fontSize: 30, fontFamily: "monospace" }}>{String(v)}</div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center" }}>
            <div style={{ display: "flex", position: "relative", width: size, height: size }}>
              <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                {rings.map((pt, i) => <polygon key={i} points={pt} fill="none" stroke={INK} strokeOpacity={0.15} />)}
                {axes.map((a, i) => <line key={i} x1={cx} y1={cy} x2={a[0]} y2={a[1]} stroke={INK} strokeOpacity={0.2} />)}
                <polygon points={pts} fill={NAVY} fillOpacity={0.18} stroke={NAVY} strokeWidth={3} />
                {radarPoints(p.s, r, cx, cy).map((q, i) => <circle key={i} cx={q[0]} cy={q[1]} r={5} fill={TEAL} />)}
              </svg>
              {lp.map((a, i) => <div key={i} style={{ position: "absolute", left: a[0] - 50, top: a[1] - 10, width: 100, display: "flex", justifyContent: "center", fontSize: 14, fontFamily: "monospace", color: "#4b5567", letterSpacing: 1 }}>{labels[i]}</div>)}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 15, fontFamily: "monospace", color: "#4b5567", marginTop: 18 }}>
          <span>Scored by TypeSafe&apos;s Jev from 12 code-extracted signals — never the raw page.</span>
          <span>trustlens-mauve.vercel.app</span>
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
