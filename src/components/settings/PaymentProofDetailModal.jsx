import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, Clock, ExternalLink } from 'lucide-react';

const STATUS_META = {
  verified: { label: 'Terverifikasi', icon: CheckCircle2, cls: 'badge-success' },
  rejected: { label: 'Ditolak', icon: XCircle, cls: 'badge-danger' },
  pending: { label: 'Menunggu', icon: Clock, cls: 'badge-warning' },
};

const rp = (n) => 'Rp ' + Number(n || 0).toLocaleString('id-ID');

const Row = ({ label, value }) => (
  <div className="flex items-center justify-between py-2 border-b border-border last:border-0">
    <span className="text-xs text-muted-foreground">{label}</span>
    <span className="text-xs font-semibold text-foreground text-right">{value || '-'}</span>
  </div>
);

// Popup detail hasil pembacaan OCR/LLM atas satu bukti transfer.
export default function PaymentProofDetailModal({ proof, open, onOpenChange, onSetStatus }) {
  if (!proof) return null;
  const meta = STATUS_META[proof.status] || STATUS_META.pending;
  const Icon = meta.icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sm">
            Detail Bukti Transfer
            <span className={`${meta.cls} inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold`}>
              <Icon size={9} /> {meta.label}
            </span>
          </DialogTitle>
        </DialogHeader>

        <a href={proof.proof_url} target="_blank" rel="noopener noreferrer" className="block mb-2">
          <img src={proof.proof_url} alt="bukti transfer" className="w-full max-h-64 object-contain rounded-xl border border-border" />
        </a>
        <a href={proof.proof_url} target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-1 text-[10px] text-primary mb-3 hover:underline">
          <ExternalLink size={10} /> Buka gambar penuh
        </a>

        <div className="rounded-xl border border-border px-3">
          <Row label="Pembeli" value={proof.buyer_name} />
          <Row label="Email" value={proof.buyer_email} />
          <Row label="Paket" value={proof.tier_label} />
          <Row label="Wajib Dibayar" value={rp(proof.expected_amount)} />
          <Row label="Terbaca OCR" value={rp(proof.detected_amount)} />
          <Row label="Bank" value={proof.detected_bank} />
          <Row label="No. Rekening Tujuan" value={proof.detected_account} />
          <Row label="Nama Pengirim" value={proof.sender_name} />
          <Row label="Tanggal Transfer" value={proof.detected_date} />
        </div>

        {proof.reason && (
          <p className="text-[11px] text-muted-foreground mt-3 p-2 rounded-lg bg-muted">{proof.reason}</p>
        )}

        {proof.status !== 'verified' && (
          <div className="flex gap-2 mt-3">
            <Button size="sm" variant="outline" className="flex-1" onClick={() => onSetStatus(proof, 'rejected')}>
              <XCircle size={12} className="mr-1" /> Tolak
            </Button>
            <Button size="sm" className="flex-1" onClick={() => onSetStatus(proof, 'verified')}>
              <CheckCircle2 size={12} className="mr-1" /> Setujui Manual
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}