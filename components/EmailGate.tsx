"use client";
import { useEffect, useState } from "react";
import { useConvex } from "convex/react";
import { api } from "@/convex/_generated/api";

// Email opt-in. Unlocks the rest of the report on this device and records a lead in Convex.
export default function EmailGate({ host, scanId, grade, source, onUnlock, compact }: { host: string; scanId?: string; grade?: string; source: string; onUnlock?: () => void; compact?: boolean }) {
  const [email, setEmail] = useState(""); const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle"); const [msg, setMsg] = useState("");
  let convex: ReturnType<typeof useConvex> | null = null; try { convex = useConvex(); } catch { convex = null; } // eslint-disable-line react-hooks/rules-of-hooks
  useEffect(() => { try { if (localStorage.getItem("tl_email")) { setState("done"); onUnlock?.(); } } catch {} }, [onUnlock]);
  async function submit(e: React.FormEvent) {
    e.preventDefault(); if (!convex) return; setState("busy");
    try { await convex.mutation(api.leads.add, { email, host, scanId, grade, source }); try { localStorage.setItem("tl_email", email); } catch {} setState("done"); onUnlock?.(); }
    catch (err) { setState("error"); setMsg((err as Error).message.replace(/^.*Uncaught Error: /, "").split("\n")[0]); }
  }
  if (state === "done") return <p className={`text-sm text-teal ${compact ? "" : "mt-2"}`}>✓ You&rsquo;re in. The full report is unlocked below.</p>;
  return (
    <form onSubmit={submit} className={`flex ${compact ? "flex-col" : "flex-col sm:flex-row"} gap-2`}>
      <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@yourpractice.com" className="flex-1 border border-ink bg-white px-3 py-2 text-sm" aria-label="Email" />
      <button disabled={state === "busy" || !convex} className="bg-ink text-paper px-4 py-2 text-sm hover:bg-accent disabled:opacity-50">{state === "busy" ? "…" : "Unlock the full report"}</button>
      {state === "error" && <span className="text-xs text-scan">{msg}</span>}
    </form>
  );
}
