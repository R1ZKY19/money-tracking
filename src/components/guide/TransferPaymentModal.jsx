import { useState } from 'react';
import { supabase } from '@/api/supabaseClient'; import { PaymentProof } from '@/api/entities';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Copy, Upload, Loader2, CheckCircle2, XCircle, Landmark, ShieldCheck, Clock } from 'lucide-react';
import { usePaymentSetting } from '@/components/guide/usePaymentSetting';
import { formatRp } from '@/components/guide/pricingTiers';
import { useUserRole } from '@/lib/UserRoleContext';

// Modal pembayaran transfer manual: tampilkan rekening, unggah bukti, verifikasi otomatis.
export default function TransferPaymentModal({ tier, open, onClose }) {
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const { accounts, setting } = usePaymentSetting();
  const { refresh } = useUserRole();

  if (!tier) return null;

  const copy = (text) => {
    navigator.clipboard?.writeText(text);
    toast.success('Nomor rekening disalin');
  };

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploading(true);
    setResult(null);
    try {
      // Upload ke Supabase Storage
const fileExt = file.name.split('.').pop(); const fileName = `proofs/${Date.now()}.${fileExt}`; await supabase.storage.from('uploads').upload(fileName, file, { upsert: true }); const { data: urlD } = supabase.storage.from('uploads').getPublicUrl(fileName); const file_url = urlD.publicUrl;
      const res = await PaymentProof.create({ proof_image_url: file_url, status: 'pending' });
      setResult(res.data);
      if (res.data?.status === 'verified') {
        await refresh(); // fitur paket langsung aktif tanpa perlu muat ulang
        toast.success('Pembayaran terverifikasi — akses paket dibuka!');
      }
      else if (res.data?.status === 'pending') toast.info(res.data?.reason || 'Bukti transfer menunggu verifikasi Super Master');
      else toast.error(res.data?.reason || 'Bukti transfer belum sesuai');
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Gagal memverifikasi bukti transfer');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { setResult(null); onClose(); } }}>
      <DialogContent className="sm:max-w-md max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base">Pembayaran {tier.label}</DialogTitle>
        </DialogHeader>

        {result?.status === 'verified' ? (
          <div className="text-center py-6">
            <CheckCircle2 size={54} className="mx-auto text-emerald-600" />
            <p className="mt-3 text-sm font-bold text-foreground">Pembayaran Terverifikasi</p>
            <p className="mt-1.5 text-xs text-muted-foreground">
              Nominal cocok ({formatRp(result.detected_amount)}). Semua fitur {tier.label} sudah aktif dan bisa langsung dipakai.
            </p>
            <Button className="mt-5 w-full" onClick={() => { setResult(null); onClose(); }}>Mulai Pakai Sekarang</Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Nominal */}
            <div className="rounded-2xl p-4 text-white" style={{ background: tier.gradient }}>
              <p className="text-[10px] uppercase tracking-[0.14em] text-white/70">Total Transfer</p>
              <p className="text-2xl font-heading font-bold mt-1">{formatRp(tier.price)}</p>
              <p className="text-[10px] text-white/70 mt-1">{setting?.note || 'Transfer tepat sesuai nominal agar otomatis terverifikasi.'}</p>
            </div>

            {/* Rekening */}
            <div className="space-y-2">
              {accounts.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-3 rounded-xl border border-dashed border-border">
                  Rekening pembayaran belum diatur — hubungi admin.
                </p>
              )}
              {accounts.map((acc) => (
                <div key={acc.number} className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${acc.color}18` }}>
                    <Landmark size={16} style={{ color: acc.color }} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{acc.bank}</p>
                    <p className="text-sm font-bold text-foreground tracking-wide">{acc.number}</p>
                    <p className="text-[10px] text-muted-foreground truncate">a.n. {acc.holder}</p>
                  </div>
                  <Button variant="outline" size="sm" className="shrink-0" onClick={() => copy(acc.number)}>
                    <Copy size={12} /> Salin
                  </Button>
                </div>
              ))}
            </div>

            {result?.status === 'pending' && (
              <div className="flex gap-2.5 p-3 rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800">
                <Clock size={16} className="text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-amber-700 dark:text-amber-400">Menunggu Verifikasi Manual</p>
                  <p className="text-[11px] text-amber-600 dark:text-amber-300 mt-1 leading-relaxed">{result.reason}</p>
                </div>
              </div>
            )}

            {result?.status === 'rejected' && (
              <div className="flex gap-2.5 p-3 rounded-xl border border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800">
                <XCircle size={16} className="text-red-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-red-700 dark:text-red-400">Bukti Belum Sesuai</p>
                  <p className="text-[11px] text-red-600 dark:text-red-300 mt-1 leading-relaxed">{result.reason}</p>
                </div>
              </div>
            )}

            {/* Upload */}
            <label className="block">
              <input type="file" accept="image/*,application/pdf" className="hidden" onChange={handleFile} disabled={uploading} />
              <span className="w-full h-12 rounded-xl border-2 border-dashed border-input flex items-center justify-center gap-2 text-xs font-bold text-foreground cursor-pointer transition-colors hover:bg-muted">
                {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                {uploading ? 'Memeriksa bukti transfer…' : 'Unggah Bukti Transfer'}
              </span>
            </label>

            <p className="flex items-start gap-2 text-[10px] text-muted-foreground leading-relaxed">
              <ShieldCheck size={13} className="shrink-0 mt-0.5" />
              Sistem mencocokkan nominal (harus TEPAT), nomor &amp; nama rekening tujuan, status berhasil, dan tanggal. Jika ada yang tidak sesuai, bukti ditolak; jika kurang jelas, bukti diteruskan ke Super Master untuk diperiksa manual.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}