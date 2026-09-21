export default function TopBar({ queued, answers, tokens, active }: { queued: number; answers: number; tokens: number; active: boolean }) {
  const cost = (tokens * 0.042) / 1_000_000;
  const Item = ({ label, value }: { label: string; value: string }) => (
    <div className="flex items-baseline gap-2"><span className="eyebrow">{label}</span><span className="mono text-sm">{value}</span></div>
  );
  return (
    <div className={`border-b rule ${active ? "bg-ink text-paper" : ""}`}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 h-10 flex items-center gap-6 sm:gap-10 overflow-x-auto">
        <Item label="Sites queued" value={String(queued)} />
        <Item label="Answers scored" value={String(answers)} />
        <Item label="Cost so far" value={`$${cost.toFixed(4)}`} />
        <span className="eyebrow ml-auto hidden sm:inline">{tokens.toLocaleString()} input tokens × $0.042 / M</span>
      </div>
    </div>
  );
}
