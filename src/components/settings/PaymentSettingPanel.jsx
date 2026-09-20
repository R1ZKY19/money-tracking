import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { PaymentSetting } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Plus, Trash2, Save, Landmark, Loader2, Wallet } from 'lucide-react';
import AccountLogo from '@/components/ui/AccountLogo';
import { BANKS } from '@/lib/bankData';

const TIER_FIELDS = [
  { key: 'price_STAF', label: 'Harga Paket Staf' },
  { key: 'price_MASTER_2', label: 'Harga Paket Master II' },
  { key: 'price_MASTER_1', label: 'Harga Paket Master I' },
];

const EMPTY_ACCOUNT = { bank: '', number: '', holder: '', color: '#0B4EA2', is_active: true };

// Panel Super Master: atur rekening tujuan, harga paket, dan pantau bukti transfer.
export default function PaymentSettingPanel() {
  const qc = useQueryClient();
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);

  const { data: setting, isLoading } = useQuery({
    queryKey: ['payment-setting'],
    queryFn: async () => (await PaymentSetting.list())?.[0] || null,
  });

  useEffect(() => {
    setForm({
      accounts: setting?.accounts?.length ? setting.accounts : [{ ...EMPTY_ACCOUNT }],
      price_STAF: setting?.price_STAF ?? 600000,
      price_MASTER_2: setting?.price_MASTER_2 ?? 1000000,
      price_MASTER_1: setting?.price_MASTER_1 ?? 1300000,
      note: setting?.note || '',
    });
  }, [setting]);

  if (isLoading || !form) {
    return <div className="flex justify-center py-16"><Loader2 className="animate-spin text-primary" /></div>;
  }

  const setAccount = (i, patch) =>
    setForm(f => ({ ...f, accounts: f.accounts.map((a, idx) => (idx === i ? { ...a, ...patch } : a)) }));

  const save = async () => {
    setSaving(true);
    try {
      const payload = {
        accounts: form.accounts.filter(a => a.bank?.trim() && a.number?.trim()),
        price_STAF: Number(form.price_STAF) || 0,
        price_MASTER_2: Number(form.price_MASTER_2) || 0,
        price_MASTER_1: Number(form.price_MASTER_1) || 0,
        note: form.note,
      };
      if (setting?.id) await PaymentSetting.update(setting.id, payload);
      else await PaymentSetting.create(payload);
      qc.invalidateQueries({ queryKey: ['payment-setting'] });
      toast.success('Pengaturan pembayaran disimpan');
    } catch (e) {
      toast.error(e?.message || 'Gagal menyimpan');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3 p-4 rounded-2xl border border-emerald-200 bg-emerald-50 dark:bg-emerald-950/20">
        <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center shrink-0">
          <Wallet size={18} className="text-emerald-600" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-emerald-900 dark:text-emerald-200">Pembayaran & Rekening</h3>
          <p className="text-xs text-emerald-700 dark:text-emerald-400">Atur rekening tujuan, jenis bank, nama pemilik, dan harga tiap paket</p>
        </div>
      </div>

      {/* Rekening */}
      <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-bold text-foreground flex items-center gap-2"><Landmark size={14} /> Rekening Tujuan</h4>
          <Button size="sm" variant="outline" className="h-8 text-xs"
            onClick={() => setForm(f => ({ ...f, accounts: [...f.accounts, { ...EMPTY_ACCOUNT }] }))}>
            <Plus size={12} className="mr-1" /> Tambah
          </Button>
        </div>

        {form.accounts.map((acc, i) => (
          <div key={i} className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-end p-3 rounded-xl border border-border bg-muted/30">
            <div className="sm:col-span-1 flex justify-center pb-1">
              <AccountLogo account={{ name: acc.bank, color: acc.color }} size={36} />
            </div>
            <div className="sm:col-span-3">
              <Label className="text-[10px]">Jenis Bank (logo otomatis)</Label>
              <Input className="mt-1 h-9" list={`bank-options-${i}`} value={acc.bank}
                onChange={e => setAccount(i, { bank: e.target.value })} placeholder="BCA / BRI / DANA" />
              <datalist id={`bank-options-${i}`}>
                {BANKS.map(b => <option key={b.id} value={b.name}>{b.fullName || b.name}</option>)}
              </datalist>
            </div>
            <div className="sm:col-span-3">
              <Label className="text-[10px]">Nomor Rekening</Label>
              <Input className="mt-1 h-9" value={acc.number} onChange={e => setAccount(i, { number: e.target.value })} placeholder="1234567890" />
            </div>
            <div className="sm:col-span-2">
              <Label className="text-[10px]">Nama Pemilik</Label>
              <Input className="mt-1 h-9" value={acc.holder} onChange={e => setAccount(i, { holder: e.target.value })} placeholder="Nama sesuai rekening" />
            </div>
            <div className="sm:col-span-1">
              <Label className="text-[10px]">Warna</Label>
              <input type="color" value={acc.color || '#0B4EA2'} onChange={e => setAccount(i, { color: e.target.value })}
                className="mt-1 h-9 w-full rounded-md border border-input bg-transparent" />
            </div>
            <div className="sm:col-span-1 flex gap-1">
              <button onClick={() => setAccount(i, { is_active: acc.is_active === false })}
                className={`h-9 flex-1 rounded-md text-[10px] font-bold border ${acc.is_active === false ? 'border-border text-muted-foreground' : 'border-emerald-300 text-emerald-700 bg-emerald-50 dark:bg-emerald-900/20'}`}>
                {acc.is_active === false ? 'OFF' : 'ON'}
              </button>
              <button onClick={() => setForm(f => ({ ...f, accounts: f.accounts.filter((_, idx) => idx !== i) }))}
                className="h-9 w-9 rounded-md flex items-center justify-center hover:bg-red-50">
                <Trash2 size={13} className="text-red-500" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Harga paket */}
      <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
        <h4 className="text-sm font-bold text-foreground">Harga Paket (Nominal Wajib Transfer)</h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {TIER_FIELDS.map(({ key, label }) => (
            <div key={key}>
              <Label className="text-[10px]">{label}</Label>
              <Input className="mt-1 h-9" type="number" value={form[key]}
                onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} />
            </div>
          ))}
        </div>
        <div>
          <Label className="text-[10px]">Catatan di Halaman Pembayaran</Label>
          <Input className="mt-1 h-9" value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
            placeholder="Contoh: Transfer tepat nominal agar otomatis terverifikasi" />
        </div>
        <Button onClick={save} disabled={saving} className="w-full sm:w-auto h-9 text-xs">
          {saving ? <Loader2 size={13} className="animate-spin mr-1.5" /> : <Save size={13} className="mr-1.5" />} Simpan Pengaturan
        </Button>
      </div>
    </div>
  );
}