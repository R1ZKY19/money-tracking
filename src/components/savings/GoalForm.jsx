import { useState, useMemo, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Target, Upload, Calendar, Clock3, Calculator, CheckCircle2, TrendingUp } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/finance';
import { supabase } from '@/api/supabaseClient';
import { CATEGORIES, DURATIONS, FREQUENCIES, PRIORITIES, FLEXIBILITY, computeDeadlineFromDuration, calcProgress, idealMonthlyDeposit, projectedFundAtDeadline, getMonthsRemaining } from '@/lib/savingGoalCalc';

const TARGET_COLORS = ['#10B981', '#6366F1', '#F59E0B', '#0D4F6D', '#EC4899', '#06B6D4', '#8B5CF6'];

export default function GoalForm({ open, onOpenChange, editing, onSave, accounts }) {
  const today = new Date().toISOString().slice(0, 10);
  const empty = {
    name: '', category: 'lainnya', target_amount: '', initial_amount: '0', current_amount: '0', currency: 'IDR',
    start_date: today, deadline: '', duration_months: '', frequency: 'monthly', deposit_amount: '',
    priority: 'medium', flexibility: 'normal', target_image: '', notes: '',
    color: TARGET_COLORS[0], method: 'date',
    source_account_id: '', source_account_name: '', destination_account_id: '', destination_account_name: '',
  };
  const [form, setForm] = useState(empty);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (editing) {
      setForm({
        ...empty,
        ...editing,
        target_amount: String(editing.target_amount || ''),
        initial_amount: String(editing.initial_amount || 0),
        current_amount: String(editing.current_amount || 0),
        deposit_amount: String(editing.deposit_amount || ''),
        duration_months: editing.duration_months ? String(editing.duration_months) : '',
        method: editing.duration_months ? 'duration' : 'date',
      });
    } else {
      setForm({ ...empty });
    }
  }, [editing, open]);

  const update = (k, v) => setForm(prev => {
    const next = { ...prev, [k]: v };
    if (k === 'duration_months' && v && next.start_date) {
      next.deadline = computeDeadlineFromDuration(next.start_date, parseInt(v, 10));
      next.method = 'duration';
    }
    if (k === 'start_date' && next.duration_months) {
      next.deadline = computeDeadlineFromDuration(v, parseInt(next.duration_months, 10));
    }
    return next;
  });

  const handleImageUpload = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop(); const fName = `goals/${Date.now()}.${fileExt}`; await supabase.storage.from('uploads').upload(fName, file); const { data: uD } = supabase.storage.from('uploads').getPublicUrl(fName); const file_url = uD.publicUrl;
      update('target_image', file_url);
    } catch (e) {
      console.error(e);
    } finally {
      setUploading(false);
    }
  };

  // Live calculation
  const targetNum = parseFloat(form.target_amount) || 0;
  const initialNum = parseFloat(form.initial_amount) || 0;
  const currentNum = parseFloat(form.current_amount) || initialNum;
  const depositNum = parseFloat(form.deposit_amount) || 0;
  const monthsRemaining = getMonthsRemaining(form.deadline);
  const ideal = idealMonthlyDeposit(targetNum, currentNum, monthsRemaining);
  const monthlyDeposit = form.frequency === 'daily' ? depositNum * 30 : form.frequency === 'weekly' ? depositNum * 4.33 : depositNum;
  const projected = projectedFundAtDeadline(currentNum, monthlyDeposit, monthsRemaining);
  const progress = calcProgress(currentNum, targetNum);
  const shortfall = Math.max(0, targetNum - projected);

  const handleSave = () => {
    if (!form.name.trim() || !form.target_amount) return;
    const payload = {
      ...form,
      target_amount: parseFloat(form.target_amount) || 0,
      initial_amount: parseFloat(form.initial_amount) || 0,
      current_amount: parseFloat(form.current_amount) || parseFloat(form.initial_amount) || 0,
      deposit_amount: parseFloat(form.deposit_amount) || 0,
      duration_months: form.method === 'duration' ? parseInt(form.duration_months, 10) || 0 : 0,
    };
    onSave(payload);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white" style={{ background: form.color }}>
              <Target size={15} />
            </div>
            {editing ? 'Edit Target Tabungan' : 'Buat Target Tabungan Baru'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Target image upload */}
          <div className="flex items-center gap-3">
            <div className="w-20 h-20 rounded-2xl border-2 border-dashed border-border flex items-center justify-center overflow-hidden bg-muted/30 shrink-0">
              {form.target_image ? (
                <img src={form.target_image} alt="target" className="w-full h-full object-cover" />
              ) : (
                <label className="cursor-pointer flex flex-col items-center text-muted-foreground">
                  <Upload size={18} />
                  <span className="text-[10px] mt-1">{uploading ? 'Upload...' : 'Foto'}</span>
                  <input type="file" accept="image/*" className="hidden" onChange={e => handleImageUpload(e.target.files?.[0])} />
                </label>
              )}
            </div>
            <div className="flex-1">
              <p className="text-xs font-semibold text-foreground">Foto Target (Opsional)</p>
              <p className="text-[11px] text-muted-foreground">Upload foto rumah, mobil, atau tujuan target untuk motivasi visual.</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Label className="text-xs">Nama Target <span className="text-red-500">*</span></Label>
              <Input value={form.name} onChange={e => update('name', e.target.value)} placeholder="cth: Beli Rumah Idaman" className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">Kategori</Label>
              <Select value={form.category} onValueChange={v => update('category', v)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(CATEGORIES).map(([k, c]) => (
                    <SelectItem key={k} value={k}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Prioritas</Label>
              <Select value={form.priority} onValueChange={v => update('priority', v)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(PRIORITIES).map(([k, l]) => <SelectItem key={k} value={k}>{l}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label className="text-xs">Target Nominal <span className="text-red-500">*</span></Label>
              <Input type="number" value={form.target_amount} onChange={e => update('target_amount', e.target.value)} placeholder="0" className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">Nominal Awal</Label>
              <Input type="number" value={form.initial_amount} onChange={e => update('initial_amount', e.target.value)} placeholder="0" className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">Mata Uang</Label>
              <Select value={form.currency} onValueChange={v => update('currency', v)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['IDR', 'USD', 'SAR', 'JPY', 'EUR'].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Tanggal Mulai</Label>
              <Input type="date" value={form.start_date} onChange={e => update('start_date', e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">Fleksibilitas</Label>
              <Select value={form.flexibility} onValueChange={v => update('flexibility', v)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(FLEXIBILITY).map(([k, l]) => <SelectItem key={k} value={k}>{l}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Metode Target */}
          <div className="rounded-xl border border-border bg-muted/20 p-3 space-y-3">
            <Label className="text-xs font-semibold">Metode Penentuan Target</Label>
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={() => update('method', 'date')}
                className={`flex items-center gap-2 p-2.5 rounded-lg border text-xs font-medium transition-all ${form.method === 'date' ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-card text-muted-foreground'}`}>
                <Calendar size={14} /> Tentukan Tanggal Selesai
              </button>
              <button type="button" onClick={() => update('method', 'duration')}
                className={`flex items-center gap-2 p-2.5 rounded-lg border text-xs font-medium transition-all ${form.method === 'duration' ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-card text-muted-foreground'}`}>
                <Clock3 size={14} /> Tentukan Lama Target
              </button>
            </div>
            {form.method === 'date' ? (
              <div>
                <Label className="text-xs">Tanggal Selesai (Deadline)</Label>
                <Input type="date" value={form.deadline} onChange={e => update('deadline', e.target.value)} className="mt-1" />
              </div>
            ) : (
              <div>
                <Label className="text-xs">Lama Target</Label>
                <Select value={form.duration_months} onValueChange={v => update('duration_months', v)}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Pilih durasi" /></SelectTrigger>
                  <SelectContent>
                    {DURATIONS.map(d => <SelectItem key={d} value={String(d)}>{d} Bulan</SelectItem>)}
                  </SelectContent>
                </Select>
                {form.deadline && <p className="text-[11px] text-emerald-600 mt-1.5">Tanggal selesai otomatis: <strong>{form.deadline}</strong></p>}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Frekuensi Menabung</Label>
              <Select value={form.frequency} onValueChange={v => update('frequency', v)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(FREQUENCIES).map(([k, l]) => <SelectItem key={k} value={k}>{l}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Nominal Setoran / {FREQUENCIES[form.frequency]}</Label>
              <Input type="number" value={form.deposit_amount} onChange={e => update('deposit_amount', e.target.value)} placeholder="0" className="mt-1" />
            </div>
          </div>

          <div>
            <Label className="text-xs">Warna</Label>
            <div className="flex items-center gap-2 mt-1.5">
              <input type="color" value={form.color} onChange={e => update('color', e.target.value)} className="h-9 w-12 rounded-lg cursor-pointer border-0" />
              <div className="flex gap-1.5 flex-wrap">
                {TARGET_COLORS.map(c => (
                  <div key={c} className="w-6 h-6 rounded-full cursor-pointer hover:scale-110 transition-all"
                    style={{ background: c, boxShadow: form.color === c ? `0 0 0 2px white, 0 0 0 3px ${c}` : 'none' }}
                    onClick={() => update('color', c)} />
                ))}
              </div>
            </div>
          </div>

          <div>
            <Label className="text-xs">Catatan Target</Label>
            <Input value={form.notes} onChange={e => update('notes', e.target.value)} placeholder="Catatan tambahan..." className="mt-1" />
          </div>

          {/* Live calculation preview */}
          {targetNum > 0 && form.deadline && (
            <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-3">
              <div className="flex items-center gap-2 text-primary">
                <Calculator size={15} />
                <p className="text-xs font-bold uppercase tracking-wide">Perhitungan Otomatis</p>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <p className="text-muted-foreground">Progress Saat Ini</p>
                  <p className="font-bold text-foreground">{progress.toFixed(1)}%</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Setoran Ideal/Bulan</p>
                  <p className="font-bold text-foreground">{formatCurrency(ideal, form.currency)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Total Dana Saat Deadline</p>
                  <p className={`font-bold ${shortfall > 0 ? 'text-red-500' : 'text-emerald-600'}`}>{formatCurrency(projected, form.currency)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Sisa Bulan</p>
                  <p className="font-bold text-foreground">{monthsRemaining} bulan</p>
                </div>
              </div>
              {shortfall > 0 ? (
                <div className="flex items-start gap-2 text-xs bg-amber-50 border border-amber-200 rounded-lg p-2.5">
                  <TrendingUp size={14} className="text-amber-600 mt-0.5 shrink-0" />
                  <p className="text-amber-800">
                    Dengan setoran {formatCurrency(monthlyDeposit, form.currency)}/bulan, masih terdapat kekurangan <strong>{formatCurrency(shortfall, form.currency)}</strong>.
                    Disarankan setoran <strong>{formatCurrency(ideal, form.currency)}/bulan</strong> agar target tercapai 100%.
                  </p>
                </div>
              ) : (
                <div className="flex items-start gap-2 text-xs bg-emerald-50 border border-emerald-200 rounded-lg p-2.5">
                  <CheckCircle2 size={14} className="text-emerald-600 mt-0.5 shrink-0" />
                  <p className="text-emerald-800">Dengan setoran saat ini, target diperkirakan tercapai tepat waktu!</p>
                </div>
              )}
            </div>
          )}

          <div className="flex gap-2 justify-end pt-1">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Batal</Button>
            <Button onClick={handleSave} className="bg-[#0D4F6D] hover:bg-[#0a3d55]">
              {editing ? 'Simpan Perubahan' : 'Buat Target'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}