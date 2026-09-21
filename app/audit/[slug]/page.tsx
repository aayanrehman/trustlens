import type { Metadata } from "next";
import Link from "next/link";
import { decodeShare } from "@/lib/share";
import Radar from "@/components/Radar";
import AuditShare from "./share";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ d?: string }> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { d } = await searchParams; const p = decodeShare(d);
  if (!p) return { title: "TrustLens audit" };
  const og = `/api/og?d=${d}`;
  return { title: `${p.h} scored ${p.g} on TrustLens`, description: `SEO ${p.s[0]} · GEO ${p.s[1]} · Trust ${p.s[2]} · Discoverability ${p.s[3]}`, openGraph: { images: [og] }, twitter: { card: "summary_large_image", images: [og] } };
}

export default async function AuditPage({ params, searchParams }: Props) {
  const { slug } = await params; const { d } = await searchParams; const p = decodeShare(d);
  if (!p) return <main className="mx-auto max-w-3xl px-6 py-20"><h1 className="display text-4xl">No result found for {slug}.</h1><Link href="/" className="underline mt-4 inline-block">Run a scan →</Link></main>;
  const labels = ["SEO", "GEO", "Trust", "Discoverability", "Authority"].slice(0, p.s.length);
  const bad = p.g === "D" || p.g === "F";
  return (
    <main className="mx-auto max-w-5xl px-6 py-14 grid gap-10 md:grid-cols-2 items-center">
      <div className="rise">
        <div className="eyebrow">TrustLens audit · {p.d}</div>
        <h1 className="mono text-2xl mt-2 break-all">{p.h}</h1>
        <div className={`display text-[12rem] leading-none mt-4 ${bad ? "text-accent" : ""}`}>{p.g}</div>
        <div className="mono text-2xl">{p.o}<span className="text-ink-2 text-base">/100 overall</span></div>
        <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-2 max-w-sm">
          {labels.map((l, i) => <div key={l} className="flex justify-between border-b rule py-1"><dt className="eyebrow">{l}</dt><dd className="mono">{p.s[i]}</dd></div>)}
        </dl>
        <div className="mt-8 flex flex-wrap gap-2 text-sm">
          <AuditShare host={p.h} grade={p.g} overall={p.o} auditPath={`/audit/${slug}?d=${d}`} share={d!} />
          <Link href={`/?u=${encodeURIComponent(p.h)}`} className="border border-ink px-4 py-2">Score your site →</Link>
        </div>
      </div>
      <div className="flex justify-center"><Radar values={p.s} size={360} /></div>
    </main>
  );
}
