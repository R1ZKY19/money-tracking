import { useEffect, useState } from 'react';
import { supabase } from '@/api/supabaseClient';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { KeyRound, Loader2, Mail, Phone, User, Shield, CalendarDays, Send, Copy } from 'lucide-react';

const WA_NUMBER = '6283812595110';

// Panel bantuan reset kata sandi member — hanya dipakai Super Master.
export default function MemberResetPasswordDialog({ member, onClose }) {
  const email = member?.email || '';
  const [info, setInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (!email) return;
    setInfo(null); setSent(false); setLoading(true);
    supabase.from('profiles').select('full_name, phone').eq('email', email).single()
      .then(res => setInfo(res?.data || null))
      .catch(() => setInfo(null))
      .finally(() => setLoading(false));
  }, [email]);

  const sendResetLink = async () => {
    setSending(true);
    try {
      await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` });
      setSent(true);
      toast.success(`Link reset kata sandi dikirim ke ${email}`);
    } catch {
      toast.error('Gagal mengirim link reset. Coba lagi.');
    } finally { setSending(false); }
  };

  const waText = encodeURIComponent(
    `Halo ${info?.member?.full_name || 'Member'}, ini Super Master MONEY TRACKING. Link reset kata sandi sudah dikirim ke email ${email}. Silakan cek inbox/spam lalu buat kata sandi baru.`
  );

  const rows = [
    { icon: User, label: 'Nama Lengkap', value: info?.member?.full_name || '—' },
    { icon: Mail, label: 'Email', value: email },
    { icon: Phone, label: 'WhatsApp', value: info?.member?.phone || 'Belum diisi' },
    { icon: Shield, label: 'Role', value: (info?.member?.role || member?.role || 'staf').replace('_', ' ').toUpperCase() },
    { icon: CalendarDays, label: 'Terdaftar', value: info?.member?.created_date ? new Date(info.member.created_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }) : '—' },
  ];

  return (
    <Dialog open={!!member} onOpenChange={v => { if (!v) onClose(); }}>
      <DialogContent className="max-w-lg p-0 overflow-hidden border-0 shadow-2xl">
        <div className="p-5 text-white" style={{ background: 'linear-gradient(135deg,#1E1B4B 0%,#4F46E5 60%,#818CF8 100%)' }}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2.5 text-white text-base">
              <span className="w-9 h-9 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center">
                <KeyRound size={16} />
              </span>
              Bantu Reset Kata Sandi
            </DialogTitle>
          </DialogHeader>
          <p className="text-white/70 text-xs mt-2 leading-relaxed">
            Sistem tidak menyimpan kata sandi member. Super Master dapat mengirim link reset resmi ke email member.
          </p>
        </div>

        <div className="p-5 space-y-4">
          {loading ? (
            <div className="py-8 flex items-center justify-center"><Loader2 size={20} className="animate-spin text-muted-foreground" /></div>
          ) : (
            <div className="rounded-2xl border border-border divide-y divide-border overflow-hidden">
              {rows.map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-center gap-3 px-4 py-2.5">
                  <Icon size={14} className="text-muted-foreground shrink-0" />
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground w-28 shrink-0">{label}</span>
                  <span className="text-xs font-bold text-foreground truncate">{value}</span>
                </div>
              ))}
            </div>
          )}

          {info && info.found === false && (
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
              Email ini ada di whitelist tetapi belum pernah membuat akun, jadi belum ada kata sandi untuk direset.
            </p>
          )}

          <div className="flex flex-col sm:flex-row gap-2">
            <Button onClick={sendResetLink} disabled={sending} className="flex-1 gap-2 rounded-xl">
              {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              {sent ? 'Kirim Ulang Link Reset' : 'Kirim Link Reset ke Email'}
            </Button>
            <Button variant="outline" asChild className="flex-1 gap-2 rounded-xl">
              <a href={`https://wa.me/?text=${waText}`} target="_blank" rel="noopener noreferrer">
                <Copy size={14} /> Kabari via WhatsApp
              </a>
            </Button>
          </div>

          {sent && (
            <p className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2">
              Link reset aktif sementara. Minta member cek inbox &amp; folder spam, lalu buat kata sandi baru.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}