import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { decodeShare } from "@/lib/share";
import { radarPoints } from "@/components/Radar";

export const runtime = "nodejs";

// Branded share card: letter grade + radar + site name. 1200×630.
export async function GET(req: NextRequest) {
  const p = decodeShare(req.nextUrl.searchParams.get("d") ?? undefined);
  if (!p) return new Response("bad payload", { status: 400 });
  const size = 420, cx = size / 2, cy = size / 2, r = size * 0.36;
  const pts = radarPoints(p.s, r, cx, cy).map((q) => q.join(",")).join(" ");
  const rings = [25, 50, 75, 100].map((k) => radarPoints([k, k, k, k], r, cx, cy).map((q) => q.join(",")).join(" "));
  const axes = radarPoints([100, 100, 100, 100], r, cx, cy);
  const labels = ["SEO", "GEO", "TRUST", "DISCOVER"];
  const lp = radarPoints([126, 126, 126, 126], r, cx, cy);
  const bad = p.g === "D" || p.g === "F";
  return new ImageResponse(
    (
      <div style={{ width: 1200, height: 630, display: "flex", background: "#f6f4ee", color: "#111", fontFamily: "Georgia, serif", padding: 56 }}>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", flex: 1 }}>
          <div style={{ display: "flex", fontSize: 34 }}><span>Trust</span><span style={{ color: "#ff4d00" }}>Lens</span></div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 300, lineHeight: 0.9, color: bad ? "#ff4d00" : "#111" }}>{p.g}</div>
            <div style={{ fontSize: 28, marginTop: 20, fontFamily: "monospace" }}>{`${p.o}/100 overall`}</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", fontFamily: "monospace" }}>
            <div style={{ fontSize: 30 }}>{p.h}</div>
            <div style={{ fontSize: 18, color: "#55524b", marginTop: 6 }}>{`Scored ${p.d} · SEO ${p.s[0]} · GEO ${p.s[1]} · Trust ${p.s[2]} · Discoverability ${p.s[3]}`}</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center" }}>
          <div style={{ display: "flex", position: "relative", width: size, height: size }}>
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
              {rings.map((pt, i) => <polygon key={i} points={pt} fill="none" stroke="#111" strokeOpacity={0.15} />)}
              {axes.map((a, i) => <line key={i} x1={cx} y1={cy} x2={a[0]} y2={a[1]} stroke="#111" strokeOpacity={0.2} />)}
              <polygon points={pts} fill="#ff4d00" fillOpacity={0.2} stroke="#ff4d00" strokeWidth={3} />
            </svg>
            {lp.map((a, i) => <div key={i} style={{ position: "absolute", left: a[0] - 50, top: a[1] - 10, width: 100, display: "flex", justifyContent: "center", fontSize: 16, fontFamily: "monospace", color: "#55524b" }}>{labels[i]}</div>)}
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
