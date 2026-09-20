import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, ArrowUpRight, MessageCircle, AlertTriangle } from 'lucide-react';
import { useUserRole } from '@/lib/UserRoleContext';
import { guideHelp, openMoneyAssistant } from '@/components/guide/guideHelp';
export default function FeatureGuideCard({ feature }) {
  const [open, setOpen] = useState(false);
  const { hasModule } = useUserRole();
  const help = guideHelp[feature.id];
  const Icon = feature.icon;
  return <article id={feature.id} className="scroll-mt-6 rounded-xl border border-border bg-card overflow-hidden">
    <button onClick={() => setOpen(!open)} aria-expanded={open} aria-controls={`guide-${feature.id}`} className="w-full flex items-center gap-4 p-5 text-left hover:bg-muted">
      <span className="h-11 w-11 rounded-lg bg-accent text-primary flex items-center justify-center shrink-0"><Icon size={21} /></span>
      <span className="flex-1"><span className="flex gap-3 flex-wrap items-center"><span className="font-semibold text-sm">{feature.title}</span><span className="text-xs text-muted-foreground">{feature.badge}</span></span><span className="block text-sm text-muted-foreground mt-1 leading-relaxed">{feature.desc}</span></span>
      <ChevronDown size={17} className={open ? 'rotate-180 text-primary shrink-0' : 'text-muted-foreground shrink-0'} />
    </button>
    {open && <div id={`guide-${feature.id}`} className="border-t border-border p-5 sm:p-6 space-y-6">
      <div className="grid gap-5 sm:grid-cols-2"><div><h4 className="text-xs uppercase tracking-wider text-primary mb-2">Kegunaan</h4><p className="text-sm leading-relaxed">{feature.what}</p></div><div><h4 className="text-xs uppercase tracking-wider text-primary mb-2">Sebelum mulai</h4><p className="text-sm leading-relaxed text-muted-foreground">{help?.prepare}</p></div></div>
      <section><h4 className="font-semibold text-sm mb-4">Langkah penggunaan</h4><ol className="space-y-3">{feature.howTo.map((step, i) => <li key={i} className="flex gap-3 items-start text-sm leading-relaxed"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-accent text-primary text-xs font-semibold">{i + 1}</span>{step}</li>)}</ol></section>
      {feature.txTypes && <section><h4 className="font-semibold text-sm mb-3">Jenis transaksi & dampaknya</h4><div className="overflow-x-auto rounded-lg border border-border"><table className="w-full text-sm text-left"><thead className="bg-muted"><tr><th className="p-3">Jenis</th><th className="p-3">Perubahan data</th></tr></thead><tbody>{feature.txTypes.map(tx => <tr key={tx.label} className="border-t border-border even:bg-muted"><td className={`p-3 font-medium ${tx.label === 'Pendapatan' ? 'text-success' : tx.label === 'Pengeluaran' ? 'text-destructive' : 'text-foreground'}`}>{tx.label}</td><td className="p-3 text-muted-foreground">{tx.desc}</td></tr>)}</tbody></table></div></section>}
      <div className="grid gap-4 sm:grid-cols-2"><section className="rounded-lg bg-muted p-4"><h4 className="text-xs uppercase tracking-wider text-primary mb-2">Contoh ilustrasi</h4><p className="text-sm leading-relaxed">{help?.example}</p><p className="text-xs mt-3 text-muted-foreground">Hasil: {feature.result}</p></section><section className="rounded-lg border border-warning p-4"><h4 className="flex gap-2 text-sm font-semibold text-warning mb-2"><AlertTriangle size={16} />{help?.issue}</h4><p className="text-sm leading-relaxed">{help?.fix}</p></section></div>
      <details className="text-sm text-muted-foreground"><summary className="cursor-pointer font-medium">Catatan tambahan</summary><ul className="list-disc pl-5 mt-3 space-y-2">{feature.notes?.map(note => <li key={note}>{note}</li>)}</ul></details>
      <div className="flex flex-wrap gap-3 border-t border-border pt-4">{help && hasModule(help.module) && <Link to={help.route} className="inline-flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm">Buka fitur<ArrowUpRight size={15} /></Link>}<button onClick={() => openMoneyAssistant(`Tolong pandu saya menggunakan ${feature.title}, termasuk kesalahan yang perlu dihindari.`)} className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm hover:bg-muted"><MessageCircle size={15} />Tanya asisten</button></div>
    </div>}
  </article>;
}