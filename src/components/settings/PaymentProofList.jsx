import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { PaymentProof } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { FileImage, CheckCircle2, XCircle, Clock, Trash2, ExternalLink } from 'lucide-react';
import PaymentProofDetailModal from '@/components/settings/PaymentProofDetailModal';

const STATUS_META = {
  verified: { label: 'Terverifikasi', icon: CheckCircle2, cls: 'badge-success' },
  rejected: { label: 'Ditolak', icon: XCircle, cls: 'badge-danger' },
  pending: { label: 'Menunggu', icon: Clock, cls: 'badge-warning' },
};

const rp = (n) => 'Rp ' + Number(n || 0).toLocaleString('id-ID');

// Daftar bukti transfer yang masuk — hanya terlihat oleh Super Master.
export default function PaymentProofList() {
  const qc = useQueryClient();
  const [selected, setSelected] = useState(null);
  const { data: proofs = [] } = useQuery({
    queryKey: ['payment-proofs'],
    queryFn: () => $entity.list('-created_date', 50),
  });

  const remove = async (id) => {
    await PaymentProof.delete(id);
    qc.invalidateQueries({ queryKey: ['payment-proofs'] });
    toast.success('Bukti transfer dihapus');
  };

  const setStatus = async (proof, status) => {
    try {
      await supabase.from('payment_proofs').update({ status, reviewed_at: new Date().toISOString() }).eq('id', proof.id);
      qc.invalidateQueries({ queryKey: ['payment-proofs'] });
      setSelected(null);
      toast.success(status === 'verified' ? 'Bukti transfer disetujui' : 'Bukti transfer ditolak');
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Gagal memproses bukti transfer');
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <h4 className="text-sm font-bold text-foreground flex items-center gap-2 mb-3">
        <FileImage size={14} /> Bukti Transfer Masuk ({proofs.length})
      </h4>

      {proofs.length === 0 ? (
        <p className="text-xs text-muted-foreground py-6 text-center">Belum ada bukti transfer yang dikirim.</p>
      ) : (
        <div className="space-y-2">
          {proofs.map(p => {
            const meta = STATUS_META[p.status] || STATUS_META.pending;
            const Icon = meta.icon;
            return (
              <div key={p.id} className="flex items-center gap-3 p-3 rounded-xl border border-border cursor-pointer hover:bg-muted/40" onClick={() => setSelected(p)}>
                <a href={p.proof_url} target="_blank" rel="noopener noreferrer" className="shrink-0" onClick={(e) => e.stopPropagation()}>
                  <img src={p.proof_url} alt="bukti" className="w-12 h-12 rounded-lg object-cover border border-border" />
                </a>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-foreground truncate">{p.buyer_email}</p>
                  <p className="text-[10px] text-muted-foreground truncate">
                    {p.tier_label} · wajib {rp(p.expected_amount)} · terbaca {rp(p.detected_amount)}
                    {p.detected_bank ? ` · ${p.detected_bank}` : ''}
                  </p>
                  {p.reason && <p className="text-[10px] text-muted-foreground truncate mt-0.5">{p.reason}</p>}
                </div>
                <span className={`${meta.cls} shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold`}>
                  <Icon size={9} /> {meta.label}
                </span>
                <a href={p.proof_url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}
                  className="w-8 h-8 rounded-lg hover:bg-muted flex items-center justify-center shrink-0">
                  <ExternalLink size={12} className="text-muted-foreground" />
                </a>
                <Button variant="ghost" size="icon" className="w-8 h-8 shrink-0" onClick={(e) => { e.stopPropagation(); remove(p.id); }}>
                  <Trash2 size={12} className="text-red-500" />
                </Button>
              </div>
            );
          })}
        </div>
      )}

      <PaymentProofDetailModal
        proof={selected}
        open={!!selected}
        onOpenChange={(o) => !o && setSelected(null)}
        onSetStatus={setStatus}
      />
    </div>
  );
}