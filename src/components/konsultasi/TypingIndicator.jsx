export default function TypingIndicator({ label }) {
  return (
    <div className="flex items-center gap-2 px-1 py-1.5">
      <div className="flex items-center gap-1 rounded-2xl rounded-bl-md border border-border bg-muted px-3 py-2">
        {[0, 150, 300].map(d => (
          <span
            key={d}
            className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60 animate-bounce"
            style={{ animationDelay: `${d}ms`, animationDuration: '900ms' }}
          />
        ))}
      </div>
      <span className="text-[10px] text-muted-foreground">{label} sedang menulis…</span>
    </div>
  );
}