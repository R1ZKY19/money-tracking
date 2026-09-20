import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Repeat, Loader2 } from 'lucide-react';
import { FREQUENCIES, DAYS_ID, nextDueDate } from '@/lib/recurring';
import { formatDate } from '@/lib/utils/finance';

const TYPES = [
  { value: 'income', label: 'Pendapatan (gaji, bonus)' },
  { value: 'expense', label: 'Pengeluaran (tagihan, cicilan)' },
  { value: 'saving', label: 'Tabungan rutin' },
];

const emptyForm = {
  name: '', type: 'expense', category_id: '', category_name: '', account_id: '', account_name: '',
  amount: '', currency: 'IDR', frequency: 'monthly', day_of_week: 1, day_of_month: 1,
  start_date: new Date().toISOString().slice(0, 10), end_date: '', description: '', is_active: true,
};

export default function RecurringForm({ open, onClose, editing, accounts, categories, onSubmit, saving }) {
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setError('');
    setForm(editing
      ? { ...emptyForm, ...editing, amount: String(editing.amount ?? ''), end_date: editing.end_date || '', day_of_week: editing.day_of_week ?? 1, day_of_month: editing.day_of_month ?? 1 }
      : emptyForm);
  }, [open, editing]);

  const cats = categories.filter(c => form.type === 'saving' ? true : c.type === form.type);

  const submit = () => {
    const amount = parseFloat(form.amount) || 0;
    if (!form.name.trim()) return setError('Nama transaksi rutin wajib diisi.');
    if (amount <= 0) return setError('Nominal harus lebih dari 0.');
    if (!form.account_id) return setError('Pilih rekening sumber.');
    if (!form.start_date) return setError('Tanggal mulai wajib diisi.');
    if (form.end_date && form.end_date < form.start_date) return setError('Tanggal berakhir tidak boleh sebelum tanggal mulai.');
    setError('');
    onSubmit({
      ...form, name: form.name.trim(), amount,
      day_of_week: form.frequency === 'weekly' ? Number(form.day_of_week) : undefined,
      day_of_month: ['monthly', 'quarterly'].includes(form.frequency) ? Number(form.day_of_month) : undefined,
      end_date: form.end_date || undefined,
    });
  };

  const preview = nextDueDate({ ...form, last_created_date: editing?.last_created_date });

  return (
    <Dialog open={open} onOpenChange={v => { if (!v && !saving) onClose(); }}>
      <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto rounded-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <span className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center"><Repeat size={16} className="text-primary" /></span>
            {editing ? 'Edit Transaksi Rutin' : 'Transaksi Rutin Baru'}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2 space-y-1.5">
            <Label className="text-xs font-bold">Nama <span className="text-red-500">*</span></Label>
            <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Gaji bulanan / Tagihan listrik / Cicilan mobil" className="h-10 rounded-xl" />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold">Jenis <span className="text-red-500">*</span></Label>
            <Select value={form.type} onValueChange={v => setForm({ ...form, type: v, category_id: '', category_name: '' })}>
              <SelectTrigger className="h-10 rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent>{TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold">Kategori</Label>
            <Select value={form.category_id || ''} onValueChange={v => { const c = categories.find(c => c.id === v); setForm({ ...form, category_id: v || '', category_name: c?.name || '' }); }}>
              <SelectTrigger className="h-10 rounded-xl"><SelectValue placeholder="Pilih kategori..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value={null}>— Tanpa kategori —</SelectItem>
                {cats.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold">Rekening <span className="text-red-500">*</span></Label>
            <Select value={form.account_id} onValueChange={v => { const a = accounts.find(a => a.id === v); setForm({ ...form, account_id: v, account_name: a?.name || '', currency: a?.currency || form.currency }); }}>
              <SelectTrigger className="h-10 rounded-xl"><SelectValue placeholder="Pilih rekening..." /></SelectTrigger>
              <SelectContent>{accounts.filter(a => a.is_active !== false).map(a => <SelectItem key={a.id} value={a.id}>{a.name} · {a.currency}</SelectItem>)}</SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold">Nominal <span className="text-red-500">*</span></Label>
            <div className="relative">
              <span className="absolute inset-y-0 left-3 flex items-center text-xs font-bold text-muted-foreground">{form.currency}</span>
              <Input type="number" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} placeholder="0" className="h-10 pl-12 rounded-xl font-heading font-bold" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold">Frekuensi <span className="text-red-500">*</span></Label>
            <Select value={form.frequency} onValueChange={v => setForm({ ...form, frequency: v })}>
              <SelectTrigger className="h-10 rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent>{FREQUENCIES.map(f => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>

          {form.frequency === 'weekly' && (
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">Hari</Label>
              <Select value={String(form.day_of_week)} onValueChange={v => setForm({ ...form, day_of_week: Number(v) })}>
                <SelectTrigger className="h-10 rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>{DAYS_ID.map((d, i) => <SelectItem key={i} value={String(i)}>{d}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          )}

          {['monthly', 'quarterly'].includes(form.frequency) && (
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">Tanggal dalam bulan</Label>
              <Input type="number" min={1} max={31} value={form.day_of_month} onChange={e => setForm({ ...form, day_of_month: e.target.value })} className="h-10 rounded-xl" />
            </div>
          )}

          <div className="space-y-1.5">
            <Label className="text-xs font-bold">Mulai <span className="text-red-500">*</span></Label>
            <Input type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} className="h-10 rounded-xl" />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold">Berakhir (opsional)</Label>
            <Input type="date" value={form.end_date} min={form.start_date} onChange={e => setForm({ ...form, end_date: e.target.value })} className="h-10 rounded-xl" />
          </div>

          <div className="sm:col-span-2 space-y-1.5">
            <Label className="text-xs font-bold">Keterangan</Label>
            <Textarea rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Catatan singkat..." className="rounded-xl resize-none" />
          </div>

          <div className="sm:col-span-2 flex items-center justify-between p-3 rounded-xl border border-border bg-muted/30">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Jadwal berikutnya</p>
              <p className="text-sm font-semibold text-foreground">{preview ? formatDate(preview) : 'Tidak ada jadwal aktif'}</p>
            </div>
            <button type="button" onClick={() => setForm({ ...form, is_active: !form.is_active })}
              className={`h-8 px-3 rounded-lg text-[11px] font-bold border transition-colors ${form.is_active ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-900/20' : 'bg-muted text-muted-foreground border-border'}`}>
              {form.is_active ? 'Aktif' : 'Nonaktif'}
            </button>
          </div>
        </div>

        {error && <p className="text-xs text-red-600 bg-red-50 dark:bg-red-900/20 border border-red-200 rounded-xl px-3 py-2">{error}</p>}

        <div className="flex justify-end gap-2 pt-2 border-t border-border">
          <Button variant="outline" onClick={onClose} disabled={saving} className="rounded-xl">Batal</Button>
          <Button onClick={submit} disabled={saving} className="rounded-xl">
            {saving && <Loader2 size={14} className="animate-spin mr-1.5" />}{editing ? 'Simpan Perubahan' : 'Simpan'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}