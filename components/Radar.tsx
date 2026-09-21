// N-axis radar (5 by default: SEO, GEO, Trust, Discoverability, Authority). Pure SVG, no chart library.
export function radarPoints(values: number[], r: number, cx: number, cy: number) {
  return values.map((v, i) => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / values.length;
    const rr = (Math.max(0, Math.min(100, v)) / 100) * r;
    return [cx + rr * Math.cos(a), cy + rr * Math.sin(a)] as const;
  });
}
const DEFAULT_LABELS = ["SEO", "GEO", "Trust", "Discover", "Authority"];

export default function Radar({ values, labels = DEFAULT_LABELS, size = 220, animate = true, accent = "var(--accent)", ink = "currentColor" }: { values: number[]; labels?: string[]; size?: number; animate?: boolean; accent?: string; ink?: string }) {
  const cx = size / 2, cy = size / 2, r = size * 0.34;
  const rings = [25, 50, 75, 100];
  const full = (k: number) => values.map(() => k);
  const axes = radarPoints(full(100), r, cx, cy);
  const pts = radarPoints(values, r, cx, cy);
  const labelPts = radarPoints(full(128), r, cx, cy);
  const LABELS = labels;
  return (
    <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} role="img" aria-label={`Radar: ${LABELS.map((l, i) => `${l} ${Math.round(values[i])}`).join(", ")}`}>
      {rings.map((k) => <polygon key={k} points={radarPoints(full(k), r, cx, cy).map((p) => p.join(",")).join(" ")} fill="none" stroke={ink} strokeOpacity={0.15} strokeWidth={1} />)}
      {axes.map((p, i) => <line key={i} x1={cx} y1={cy} x2={p[0]} y2={p[1]} stroke={ink} strokeOpacity={0.2} strokeWidth={1} />)}
      <polygon points={pts.map((p) => p.join(",")).join(" ")} fill={accent} fillOpacity={0.18} stroke={accent} strokeWidth={2} strokeLinejoin="round" className={animate ? "pop" : undefined} style={{ transformOrigin: "50% 50%" }} />
      {pts.map((p, i) => <circle key={i} cx={p[0]} cy={p[1]} r={3.5} fill={accent} />)}
      {labelPts.map((p, i) => <text key={i} x={p[0]} y={p[1]} textAnchor="middle" dominantBaseline="middle" fontSize={11} fontFamily="ui-monospace, monospace" fill={ink} fillOpacity={0.7} letterSpacing="0.08em">{LABELS[i].toUpperCase()}</text>)}
    </svg>
  );
}
