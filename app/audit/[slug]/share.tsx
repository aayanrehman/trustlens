"use client";
import { useState } from "react";
import ShareWidget from "@/components/ShareWidget";
export default function AuditShare(p: { host: string; grade: string; overall: number; auditPath: string; share: string }) {
  const [open, setOpen] = useState(false);
  return <>
    <button onClick={() => setOpen(true)} className="bg-ink text-paper px-4 py-2 hover:bg-accent">Share this score</button>
    {open && <ShareWidget {...p} onClose={() => setOpen(false)} />}
  </>;
}
