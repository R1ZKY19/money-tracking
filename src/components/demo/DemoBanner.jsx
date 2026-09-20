import { useEffect, useState } from 'react';
import { FlaskConical, RotateCcw, LogOut, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { exitDemo, resetDemo } from '@/components/demo/demoSession';
export default function DemoBanner() {
  const [confirm, setConfirm] = useState(false);
  const [notice, setNotice] = useState('');
  useEffect(() => { const show = event => setNotice(event.detail); window.addEventListener('moneyt:demo-notice',show); return () => window.removeEventListener('moneyt:demo-notice',show); }, []);
  return <>
    <section aria-label="Demo Mode" className="sticky top-[62px] z-20 shrink-0 border-b border-border bg-card px-3 py-3 shadow-sm sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3"><span className="rounded-xl bg-accent p-2 text-primary"><FlaskConical size={20}/></span><div><p className="text-xs font-bold tracking-widest text-primary">DEMO MODE</p><p className="text-xs text-muted-foreground">Data fiktif lokal · Production tidak diakses · Integrasi eksternal dinonaktifkan</p></div></div>
        <div className="flex w-full gap-2 sm:w-auto"><Button variant="outline" onClick={()=>setConfirm(true)} className="flex-1 text-xs"><RotateCcw size={14}/>RESET DEMO DATA</Button><Button variant="ghost" onClick={exitDemo} className="text-xs"><LogOut size={14}/>Keluar Demo</Button></div>
      </div>
      {notice && <div role="status" className="mt-3 flex items-start justify-between gap-2 rounded-lg bg-muted p-3 text-xs text-muted-foreground">{notice}<button type="button" onClick={()=>setNotice('')} aria-label="Tutup pemberitahuan"><X size={14}/></button></div>}
    </section>
    <ConfirmDialog open={confirm} onOpenChange={setConfirm} type="custom" title="Reset data demo?" description="Semua perubahan demo di tab ini akan diganti dengan data contoh awal. Data akun asli tidak terpengaruh." confirmLabel="RESET DEMO DATA" onConfirm={resetDemo}/>
  </>;
}