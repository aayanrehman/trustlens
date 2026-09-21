"use client";
import { useConvex, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

function Stats() {
  const s = useQuery(api.scans.stats);
  if (!s) return null;
  return <span className="eyebrow ml-auto hidden md:inline">all users · {s.allTime.scans.toLocaleString()} sites scanned · ${s.allTime.usd.toFixed(4)} total Jev spend · live</span>;
}
// Only renders inside a ConvexProvider (i.e. when NEXT_PUBLIC_CONVEX_URL is set).
export default function LiveStats() {
  let ok = true; try { useConvex(); } catch { ok = false; }
  return ok ? <Stats /> : null;
}
