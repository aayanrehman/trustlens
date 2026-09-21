import type { Metadata } from "next";
import { Fraunces, Inter, JetBrains_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import ConvexClient from "@/components/ConvexClient";
import LiveStats from "@/components/LiveStats";

const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-fraunces", weight: "variable", axes: ["opsz"] });
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const jet = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jet", weight: ["400", "500"] });

export const metadata: Metadata = {
  title: "TrustLens — trust & AI-visibility audit for service businesses",
  description: "Paste a URL. Jev detects the niche, then grades SEO, AI search visibility, trust, authority and discoverability from a strict field contract.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${fraunces.variable} ${inter.variable} ${jet.variable}`}>
      <body className="min-h-screen">
        <header className="border-b rule">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 min-h-14 py-2 flex flex-wrap items-center justify-between gap-x-6 gap-y-1">
            <Link href="/" className="flex items-center gap-3"><img src="/logo-480.png" alt="" className="h-7 w-auto" /><span className="display text-2xl leading-none">Trust<span className="text-teal">Lens</span></span><span className="eyebrow hidden md:inline">for service businesses</span></Link>
            <nav className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
              <Link href="/" className="hover:text-accent">Scan</Link>
              <Link href="/studio" className="hover:text-accent">Classifier Studio</Link>
              {process.env.NEXT_PUBLIC_CONVEX_URL && <Link href="/history" className="hover:text-accent">Live feed</Link>}
              <a href="https://docs.typesafe.ai" target="_blank" rel="noreferrer" className="eyebrow hover:text-accent">Jev by TypeSafe ↗</a>
              {process.env.NEXT_PUBLIC_CONVEX_URL && <ConvexClient><LiveStats /></ConvexClient>}
            </nav>
          </div>
        </header>
        <ConvexClient>{children}</ConvexClient>
      </body>
    </html>
  );
}
