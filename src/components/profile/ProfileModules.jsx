import { LayoutGrid, Check } from 'lucide-react';

// Daftar modul yang bisa diakses — grid rapi & responsif.
export default function ProfileModules({ modules = [] }) {
  return (
    <section className="rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <LayoutGrid size={14} />
          </span>
          Modul yang dapat diakses
        </h3>
        <span className="shrink-0 rounded-full border border-border bg-muted/50 px-2.5 py-1 text-[11px] font-semibold text-muted-foreground">
          {modules.length} modul
        </span>
      </div>

      {modules.length ? (
        <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {modules.map((name) => (
            <div
              key={name}
              className="flex min-w-0 items-center gap-2 rounded-xl border border-border/70 bg-muted/30 px-3 py-2 transition-colors hover:border-primary/30 hover:bg-primary/5"
            >
              <Check size={13} className="shrink-0 text-success" />
              <span className="truncate text-xs font-medium text-foreground">{name}</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-4 rounded-xl border border-dashed border-border px-3 py-4 text-center text-sm text-muted-foreground">
          Belum ada modul yang diberikan.
        </p>
      )}

      <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
        Hak akses dikelola administrator.
      </p>
    </section>
  );
}