import type { Metadata } from "next";
export const metadata: Metadata = { title: "TrustLens Chrome extension" };

export default function ExtensionPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 sm:px-6 py-12">
      <div className="eyebrow">Chrome extension · free</div>
      <h1 className="display text-5xl mt-2 leading-tight">Scan the site you&rsquo;re on.</h1>
      <p className="mt-4 text-lg text-ink-2">One click. It reads the whole page, boxes every element it finds, then grades SEO, AI search visibility, trust, authority and discoverability. Built for education consultants.</p>
      <a href="/trustlens-extension.zip" download className="inline-block mt-6 bg-ink text-paper px-5 py-3 hover:bg-accent">Download the extension (.zip)</a>
      <h2 className="display text-2xl mt-10">Install in 30 seconds</h2>
      <ol className="list-decimal pl-6 mt-3 space-y-2">
        <li>Unzip the download.</li>
        <li>In Chrome, open <span className="mono">chrome://extensions</span> and turn on <strong>Developer mode</strong> (top right).</li>
        <li>Click <strong>Load unpacked</strong> and choose the unzipped <span className="mono">trustlens-extension</span> folder.</li>
        <li>Pin TrustLens from the puzzle-piece menu, open any consultant&rsquo;s site, click the icon, click <strong>Scan this page</strong>.</li>
      </ol>
      <p className="mt-8 text-sm text-ink-2">Chrome Web Store listing is in review. <a className="underline" href="/privacy">Privacy policy</a>.</p>
    </main>
  );
}
