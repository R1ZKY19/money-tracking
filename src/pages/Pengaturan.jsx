import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Category, ExchangeRate, ExpenseGoal, SavingTarget } from '@/api/entities';
import { supabase } from '@/api/supabaseClient';
import {
  Settings, Plus, Pencil, Trash2, Tag, TrendingUp, TrendingDown,
  PiggyBank, CreditCard, DollarSign, Percent, Loader2,
  Star, Target, Clock, AlertTriangle, CheckCircle, Send, Link,
  CheckCircle2, Mail, ChevronRight, Wallet, Globe, Zap, Shield,
  Bell, Users, ArrowRight, Crown, Gem, BadgeCheck, User2, Calendar,
  Lock, Sparkles, Receipt, UserCog
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatDate, formatCurrency, CURRENCIES } from '@/lib/utils/finance';
import { useAuth } from '@/lib/AuthContext';
import { useUserRole } from '@/lib/UserRoleContext';
import { appParams } from '@/lib/app-params';
import { logCreate, logUpdate, logDelete } from '@/lib/activityLogger';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import EmailApprovalManager from '@/components/EmailApprovalManager';
import TelegramTabContent from '@/components/settings/TelegramTabContent';
import ExecutiveAccessPanel from '@/components/settings/ExecutiveAccessPanel';
import LoginApprovalPanel from '@/components/settings/LoginApprovalPanel';
import PaymentSettingPanel from '@/components/settings/PaymentSettingPanel';
import PaymentProofList from '@/components/settings/PaymentProofList';
import DailyUsagePanel from '@/components/settings/DailyUsagePanel';
import SettingsMobileNav from '@/components/settings/SettingsMobileNav';

const OWNER_EMAIL = 'rizkykucuk19@gmail.com';

const CATEGORY_TYPES = [
  { value: 'income',  label: 'Pendapatan', icon: TrendingUp,  color: 'text-emerald-700 bg-emerald-100' },
  { value: 'expense', label: 'Pengeluaran', icon: TrendingDown, color: 'text-red-700 bg-red-100' },
];

const PRESET_COLORS = ['#0D4F6D','#10B981','#6366F1','#F59E0B','#EC4899','#06B6D4','#EF4444','#8B5CF6','#14B8A6','#F97316'];

const NAV_TABS = [
  { id: 'kategori',      label: 'Kategori',      icon: Tag,          desc: 'Pemasukan & Pengeluaran', color: '#0D4F6D' },
  { id: 'tabungan',      label: 'Tabungan',       icon: PiggyBank,    desc: 'Kategori & Target',      module: 'Tabungan', color: '#6366F1' },
  { id: 'bunga',         label: 'Bunga',          icon: Percent,      desc: 'Default Hutang & Piutang', module: 'bunga', color: '#F59E0B' },
  { id: 'mata_uang',     label: 'Mata Uang',      icon: Globe,        desc: 'Kurs & Konversi', color: '#10B981' },
  { id: 'telegram',      label: 'Telegram',       icon: Send,         desc: 'Bot & Notifikasi',       module: 'telegram', color: '#0088CC' },
  { id: 'akses_member',  label: 'Manajemen Akses', icon: UserCog,     desc: 'Role & Whitelist Member',  adminOnly: true, color: '#EC4899' },
  { id: 'login_approval',label: 'Persetujuan Login', icon: Lock,      desc: 'Setujui / Tolak Login',  adminOnly: true, color: '#F97316' },
  { id: 'pembayaran',   label: 'Pembayaran',     icon: Wallet,       desc: 'Rekening & Harga Paket', adminOnly: true, color: '#059669' },
  { id: 'bukti_transfer',label: 'Bukti Transfer', icon: Receipt,      desc: 'Verifikasi Transfer Masuk', adminOnly: true, color: '#0891B2' },
  { id: 'sesi_harian',  label: 'Sesi Harian',    icon: Clock,        desc: 'Jam Online Member / Hari', adminOnly: true, color: '#0EA5E9' },
];

const ROLE_META = {
  super_master: { label: 'SUPER MASTER', icon: Crown, gradient: 'from-amber-400 to-yellow-600', color: '#D97706', bg: 'bg-amber-50 dark:bg-amber-900/20', border: 'border-amber-300' },
  master_1:     { label: 'MASTER I',     icon: Gem,   gradient: 'from-indigo-500 to-violet-600', color: '#4F46E5', bg: 'bg-indigo-50 dark:bg-indigo-900/20', border: 'border-indigo-300' },
  master_2:     { label: 'MASTER II',    icon: BadgeCheck, gradient: 'from-cyan-500 to-sky-600', color: '#0891B2', bg: 'bg-cyan-50 dark:bg-cyan-900/20', border: 'border-cyan-300' },
  staf:         { label: 'STAF',         icon: Users, gradient: 'from-emerald-500 to-teal-600', color: '#059669', bg: 'bg-emerald-50 dark:bg-emerald-900/20', border: 'border-emerald-300' },
  admin:        { label: 'ADMIN',        icon: Shield, gradient: 'from-rose-500 to-red-600', color: '#DC2626', bg: 'bg-rose-50 dark:bg-rose-900/20', border: 'border-rose-300' },
};

const WORLD_CURRENCIES = [
  { country:'Amerika Serikat', code:'USD', symbol:'$',   name:'US Dollar',         flag:'🇺🇸', decimals:2 },
  { country:'Euro (Eropa)',    code:'EUR', symbol:'€',   name:'Euro',              flag:'🇪🇺', decimals:2 },
  { country:'Inggris',         code:'GBP', symbol:'£',   name:'British Pound',     flag:'🇬🇧', decimals:2 },
  { country:'Jepang',          code:'JPY', symbol:'¥',   name:'Japanese Yen',      flag:'🇯🇵', decimals:0 },
  { country:'Arab Saudi',      code:'SAR', symbol:'SAR', name:'Saudi Riyal',       flag:'🇸🇦', decimals:2 },
  { country:'Singapura',       code:'SGD', symbol:'S$',  name:'Singapore Dollar',  flag:'🇸🇬', decimals:2 },
  { country:'Malaysia',        code:'MYR', symbol:'RM',  name:'Ringgit Malaysia',  flag:'🇲🇾', decimals:2 },
  { country:'Australia',       code:'AUD', symbol:'A$',  name:'Australian Dollar', flag:'🇦🇺', decimals:2 },
  { country:'China',           code:'CNY', symbol:'¥',   name:'Chinese Yuan',      flag:'🇨🇳', decimals:2 },
  { country:'Korea Selatan',   code:'KRW', symbol:'₩',   name:'Korean Won',        flag:'🇰🇷', decimals:0 },
  { country:'Uni Emirat Arab', code:'AED', symbol:'AED', name:'UAE Dirham',        flag:'🇦🇪', decimals:2 },
  { country:'Thailand',        code:'THB', symbol:'฿',   name:'Thai Baht',         flag:'🇹🇭', decimals:2 },
  { country:'Hong Kong',       code:'HKD', symbol:'HK$', name:'Hong Kong Dollar',  flag:'🇭🇰', decimals:2 },
  { country:'India',           code:'INR', symbol:'₹',   name:'Indian Rupee',      flag:'🇮🇳', decimals:2 },
  { country:'Taiwan',          code:'TWD', symbol:'NT$', name:'New Taiwan Dollar', flag:'🇹🇼', decimals:2 },
  { country:'Swiss',           code:'CHF', symbol:'CHF', name:'Swiss Franc',       flag:'🇨🇭', decimals:2 },
  { country:'Kanada',          code:'CAD', symbol:'C$',  name:'Canadian Dollar',   flag:'🇨🇦', decimals:2 },
  { country:'Filipina',        code:'PHP', symbol:'₱',   name:'Philippine Peso',   flag:'🇵🇭', decimals:2 },
  { country:'Vietnam',         code:'VND', symbol:'₫',   name:'Vietnamese Dong',   flag:'🇻🇳', decimals:0 },
  { country:'Qatar',           code:'QAR', symbol:'QR',  name:'Qatari Riyal',      flag:'🇶🇦', decimals:2 },
];

export default function Pengaturan() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const { role, hasModule } = useUserRole();
  const isStaf = role === 'staf';
  const canTelegram = hasModule('Pengaturan Telegram');
  const canBunga    = hasModule('Pengaturan Bunga');
  const uid = user?.id;

  const [mainTab, setMainTab] = useState('kategori');
  const [catTypeFilter, setCatTypeFilter] = useState('expense');

  // Category
  const [showCatDialog, setShowCatDialog]   = useState(false);
  const [editingCat, setEditingCat]         = useState(null);
  const [catForm, setCatForm]               = useState({ name:'', type:'expense', color:'#0D4F6D', icon:'Tag' });

  // Exchange rate
  const [showRateDialog, setShowRateDialog] = useState(false);
  const [editingRate, setEditingRate]       = useState(null);
  const [rateForm, setRateForm]             = useState({ from_currency:'USD', to_currency:'IDR', rate:'', notes:'' });

  // Saving target
  const [showTargetDialog, setShowTargetDialog] = useState(false);
  const [editingTarget, setEditingTarget]       = useState(null);
  const [targetForm, setTargetForm]             = useState({ name:'', target_amount:'', current_amount:'0', currency:'IDR', deadline:'', notes:'', color:'#10B981' });

  // Interest
  const [defaultDebtInterest,       setDefaultDebtInterest]       = useState('0');
  const [defaultReceivableInterest, setDefaultReceivableInterest] = useState('0');

  // Custom currency
  const [customCurrencies, setCustomCurrencies] = useState(() => {
    try { return JSON.parse(localStorage.getItem('fincat_custom_currencies') || '[]'); } catch { return []; }
  });
  const [showCurrDialog,      setShowCurrDialog]      = useState(false);
  const [selectedCountryCode, setSelectedCountryCode] = useState('');
  const [addingCurrency,      setAddingCurrency]      = useState(false);

  // Telegram
  const [telegramChatId,   setTelegramChatId]   = useState('');
  const [telegramSaving,   setTelegramSaving]   = useState(false);
  const [telegramLinked,   setTelegramLinked]   = useState(false);
  const [webhookStatus,    setWebhookStatus]    = useState(null);
  const [webhookLoading,   setWebhookLoading]   = useState(false);

  // Confirm
  const [confirm, setConfirm]         = useState({ open:false, type:'save', title:'', desc:'', onConfirm:null, loading:false });
  const [savingStatus, setSavingStatus] = useState(null);

  useEffect(() => {
    if (user?.telegram_chat_id) { setTelegramChatId(user.telegram_chat_id); setTelegramLinked(true); }
  }, [user]);

  const { data: categories   = [] } = useQuery({ queryKey:['categories'],             queryFn: () => Category.list() });
  const { data: rates        = [] } = useQuery({ queryKey:['exchangeRates'],           queryFn: () => ExchangeRate.list() });
  const { data: savingTargets= [] } = useQuery({ queryKey:['saving_targets', uid],    queryFn: () => uid ? SavingTarget.list() : [], enabled: !!uid });

  const showConfirm = (opts) => setConfirm({ loading:false, ...opts, open:true });
  const closeConfirm = () => setConfirm(c => ({ ...c, open:false }));

  // ─── CATEGORY ───
  const openCreateCat = (type = catTypeFilter) => { setEditingCat(null); setCatForm({ name:'', type, color:'#0D4F6D', icon:'Tag' }); setShowCatDialog(true); };
  const openEditCat   = (c) => { setEditingCat(c); setCatForm({ name:c.name, type:c.type, color:c.color||'#0D4F6D', icon:c.icon||'Tag' }); setShowCatDialog(true); };
  const saveCat = () => {
    showConfirm({
      type: editingCat ? 'update' : 'save',
      title: editingCat ? 'Simpan Perubahan?' : 'Tambah Kategori?',
      desc: `Kategori "${catForm.name}"`,
      onConfirm: async () => {
        setSavingStatus('kategori'); setConfirm(c => ({ ...c, loading:true }));
        if (editingCat) {
          await Category.update(editingCat.id, catForm);
        } else {
          const isSaving = catForm.type === 'saving';
          const newName  = catForm.name;
          const newColor = catForm.color;
          await Category.create(catForm);
          qc.invalidateQueries({ queryKey:['categories'] });
          qc.invalidateQueries({ queryKey:['budget-data'] });
          closeConfirm(); setShowCatDialog(false); setSavingStatus(null);
          if (isSaving) {
            setEditingTarget(null);
            setTargetForm({ name:newName, target_amount:'', current_amount:'0', currency:'IDR', deadline:'', notes:'', color: newColor || '#10B981' });
            setShowTargetDialog(true);
          }
          return;
        }
        qc.invalidateQueries({ queryKey:['categories'] });
        qc.invalidateQueries({ queryKey:['budget-data'] });
        closeConfirm(); setShowCatDialog(false); setSavingStatus(null);
      },
    });
  };
  const deleteCat = (id, name, type) => {
    showConfirm({
      type: 'delete', title: 'Hapus Kategori?',
      desc: `Kategori "${name}" akan dihapus permanen${type === 'saving' ? ' beserta target tabungan terkait' : ''}.`,
      onConfirm: async () => {
        setSavingStatus('kategori'); setConfirm(c => ({ ...c, loading:true }));
        try {
          await Category.delete(id);
          if (type === 'saving') {
            const [relatedTargets, goals] = await Promise.all([
              SavingTarget.list(),
              ExpenseGoal.list(),
            ]);
            await Promise.all([
              ...relatedTargets.filter(t => t.name === name).map(t => SavingTarget.delete(t.id)),
              ...goals.filter(g => g.category_name === name).map(g => ExpenseGoal.delete(g.id)),
            ]);
            qc.invalidateQueries({ queryKey:['saving_targets', uid] });
          }
          qc.invalidateQueries({ queryKey:['categories'] });
          qc.invalidateQueries({ queryKey:['budget-data'] });
        } catch (err) { toast.error(`Gagal: ${err?.message}`); }
        finally { closeConfirm(); setSavingStatus(null); }
      },
    });
  };

  // ─── EXCHANGE RATE (manual only — fitur ambil kurs otomatis/online dihapus) ───
  const openCreateRate = () => { setEditingRate(null); setRateForm({ from_currency:'USD', to_currency:'IDR', rate:'', notes:'' }); setShowRateDialog(true); };
  const openEditRate   = (r) => { setEditingRate(r); setRateForm({ from_currency:r.from_currency, to_currency:r.to_currency, rate:String(r.rate), notes:r.notes||'' }); setShowRateDialog(true); };
  const saveRate = () => {
    const payload = { ...rateForm, rate: parseFloat(rateForm.rate) || 0 };
    showConfirm({
      type: editingRate ? 'update' : 'save',
      title: editingRate ? 'Simpan Perubahan Kurs?' : 'Tambah Kurs?',
      desc: `1 ${rateForm.from_currency} = ${rateForm.rate} ${rateForm.to_currency}`,
      onConfirm: async () => {
        setConfirm(c => ({ ...c, loading:true }));
        if (editingRate) await ExchangeRate.update(editingRate.id, payload);
        else             await ExchangeRate.create(payload);
        qc.invalidateQueries({ queryKey:['exchangeRates'] });
        closeConfirm(); setShowRateDialog(false);
      },
    });
  };
  const deleteRate = (id, from, to) => {
    showConfirm({
      type:'delete', title:'Hapus Kurs?', desc:`Kurs ${from} → ${to} akan dihapus.`,
      onConfirm: async () => {
        setConfirm(c => ({ ...c, loading:true }));
        try { await ExchangeRate.delete(id); qc.invalidateQueries({ queryKey:['exchangeRates'] }); }
        catch (err) { console.error(err); }
        finally { closeConfirm(); }
      },
    });
  };

  // ─── SAVING TARGET ───
  const openCreateTarget = () => { setEditingTarget(null); setTargetForm({ name:'', target_amount:'', current_amount:'0', currency:'IDR', deadline:'', notes:'', color:'#10B981' }); setShowTargetDialog(true); };
  const openEditTarget   = (t) => { setEditingTarget(t); setTargetForm({ name:t.name, target_amount:String(t.target_amount), current_amount:String(t.current_amount||0), currency:t.currency||'IDR', deadline:t.deadline||'', notes:t.notes||'', color:t.color||'#10B981' }); setShowTargetDialog(true); };
  const saveTarget = () => {
    if (!targetForm.name.trim() || !targetForm.target_amount) return;
    const payload = { ...targetForm, target_amount: parseFloat(targetForm.target_amount)||0, current_amount: parseFloat(targetForm.current_amount)||0 };
    showConfirm({
      type: editingTarget ? 'update' : 'save',
      title: editingTarget ? 'Simpan Target?' : 'Tambah Target?',
      desc: `Target "${targetForm.name}"`,
      onConfirm: async () => {
        setSavingStatus('tabungan'); setConfirm(c => ({ ...c, loading:true }));
        if (editingTarget) { await SavingTarget.update(editingTarget.id, payload); logUpdate('tabungan', `target "${targetForm.name}"`, editingTarget, payload); }
        else               { await SavingTarget.create(payload); logCreate('tabungan', `target "${targetForm.name}"`); }
        qc.invalidateQueries({ queryKey:['saving_targets', uid] });
        closeConfirm(); setShowTargetDialog(false); setSavingStatus(null);
      },
    });
  };
  const deleteTarget = (id, name) => {
    showConfirm({
      type:'delete', title:'Hapus Target?', desc:`Target "${name}" akan dihapus permanen.`,
      onConfirm: async () => {
        setSavingStatus('tabungan'); setConfirm(c => ({ ...c, loading:true }));
        try { await SavingTarget.delete(id); logDelete('tabungan', `target "${name}"`); qc.invalidateQueries({ queryKey:['saving_targets', uid] }); }
        catch (err) { console.error(err); }
        finally { closeConfirm(); setSavingStatus(null); }
      },
    });
  };
  const getDeadlineStatus = (deadline) => {
    if (!deadline) return null;
    const diff = Math.ceil((new Date(deadline) - new Date()) / (1000*60*60*24));
    if (diff < 0)   return { label:`Terlewat ${Math.abs(diff)} hari`, color:'text-red-500', icon: AlertTriangle };
    if (diff <= 30) return { label:`${diff} hari lagi`,               color:'text-amber-600', icon: Clock };
    return             { label:`${diff} hari lagi`,               color:'text-muted-foreground', icon: Clock };
  };

  // ─── CUSTOM CURRENCY ───
  const saveCustomCurrency = async () => {
    const entry = WORLD_CURRENCIES.find(c => c.code === selectedCountryCode);
    if (!entry) return;
    setAddingCurrency(true);
    try {
      const updated = [...customCurrencies.filter(c => c.code !== entry.code), { code:entry.code, symbol:entry.symbol, name:entry.name, flag:entry.flag, decimals:entry.decimals }];
      setCustomCurrencies(updated);
      localStorage.setItem('fincat_custom_currencies', JSON.stringify(updated));
      setShowCurrDialog(false); setSelectedCountryCode('');
    } catch (err) { alert(`Error: ${err?.message}`); }
    finally { setAddingCurrency(false); }
  };
  const deleteCustomCurrency = (code) => {
    const updated = customCurrencies.filter(c => c.code !== code);
    setCustomCurrencies(updated);
    localStorage.setItem('fincat_custom_currencies', JSON.stringify(updated));
  };

  // ─── TELEGRAM ───
  const saveTelegramLink = async () => {
    setTelegramSaving(true);
    try {
      const id = telegramChatId.trim();
      if (!id) throw new Error('ID kosong');
      if (!/^\d+$/.test(id)) throw new Error('ID harus angka');
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (currentUser?.id) {
        await supabase.from('profiles').update({ telegram_chat_id: id }).eq('id', currentUser.id);
      }
      setTelegramLinked(true);
      toast.success('Telegram berhasil dihubungkan');
    } catch (err) { alert(`Error: ${err.message}`); }
    finally { setTelegramSaving(false); }
  };
  const unlinkTelegram = async () => {
    setTelegramSaving(true);
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (currentUser?.id) {
        await supabase.from('profiles').update({ telegram_chat_id: '' }).eq('id', currentUser.id);
      }
      setTelegramChatId('');
      setTelegramLinked(false);
      toast.success('Telegram berhasil diputuskan');
    } catch (err) { alert(`Error: ${err.message}`); }
    finally { setTelegramSaving(false); }
  };
  const checkWebhook = async () => {
    setWebhookLoading(true);
    try {
      setWebhookStatus({ url: 'Supabase Edge Function', is_active: true });
    } catch (err) { alert(`Error: ${err.message}`); }
    finally { setWebhookLoading(false); }
  };
  const setWebhook = async () => {
    setWebhookLoading(true);
    try {
      setWebhookStatus({ url: `${window.location.origin}/api/telegram`, is_active: true });
      toast.success('Webhook tersimpan');
    } catch (err) { alert(`Error: ${err.message}`); }
    finally { setWebhookLoading(false); }
  };

  // ─── Visible tabs ───
  const visibleTabs = NAV_TABS.filter(t => {
    if (t.adminOnly) return user?.email?.toLowerCase() === OWNER_EMAIL;
    if (t.module === 'bunga')    return canBunga;
    if (t.module === 'telegram') return canTelegram;
    if (t.module === 'Tabungan') return hasModule('Tabungan');
    return true;
  });

  const activeTab = visibleTabs.find(t => t.id === mainTab) || visibleTabs[0];

  const roleMeta = ROLE_META[role] || ROLE_META['staf'];
  const RoleIcon = roleMeta.icon;

  return (
    <div className="min-h-screen bg-background">
      {/* Saving overlay */}
      {savingStatus && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-40">
          <div className="flex flex-col items-center gap-3 bg-card p-6 rounded-2xl shadow-2xl border border-border">
            <Loader2 className="w-7 h-7 text-primary animate-spin" />
            <p className="text-sm font-semibold text-foreground">Menyimpan...</p>
          </div>
        </div>
      )}

      {/* ── USER PROFILE BANNER ── */}
      <div className="mb-5 rounded-2xl overflow-hidden shadow-xl relative"
        style={{ background: 'linear-gradient(135deg, #0D1117 0%, #161B22 100%)', border: '1px solid rgba(255,255,255,0.08)' }}>
        {/* Top accent line */}
        <div className="h-1 w-full" style={{ background: `linear-gradient(90deg, ${roleMeta.color}, ${roleMeta.color}60, transparent)` }} />
        {/* Background glow */}
        <div className="absolute top-0 right-0 w-64 h-full rounded-full blur-3xl opacity-10 pointer-events-none"
          style={{ background: roleMeta.color, transform: 'translate(30%, 0)' }} />
        {/* Big decorative icon bg */}
        <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-[0.04] pointer-events-none">
          <RoleIcon size={100} color="white" />
        </div>
        <div className="relative z-10 p-4 sm:p-5 flex flex-row items-center gap-3.5 sm:gap-5">
          {/* Avatar */}
          <div className="relative shrink-0">
            <div className="absolute -inset-1 rounded-full blur-md opacity-50" style={{ background: `linear-gradient(135deg, ${roleMeta.color}, ${roleMeta.color}50)` }} />
            <div className="relative w-12 h-12 sm:w-16 sm:h-16 rounded-full overflow-hidden flex items-center justify-center border-2"
              style={{ background: `linear-gradient(135deg, ${roleMeta.color}, ${roleMeta.color}80)`, borderColor: roleMeta.color }}>
              {user?.avatar_url
                ? <img src={user.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                : <RoleIcon size={26} className="text-white" />}
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 bg-emerald-400"
              style={{ borderColor: '#0D1117', boxShadow: '0 0 6px rgba(52,211,153,0.8)' }} />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <h2 className="text-sm sm:text-lg font-black text-white tracking-tight truncate">
                {(user?.full_name || user?.email?.split('@')[0] || 'Pengguna').toUpperCase()}
              </h2>
              <BadgeCheck size={16} style={{ color: roleMeta.color }} />
            </div>
            <p className="text-white/40 text-xs mb-2.5">{user?.email || '—'}</p>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black text-white"
                style={{ background: `linear-gradient(135deg, ${roleMeta.color}, ${roleMeta.color}80)`, boxShadow: `0 2px 10px ${roleMeta.color}40` }}>
                <RoleIcon size={10} /> {roleMeta.label}
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                ● Aktif
              </span>
              <span className="text-[10px] text-white/30 flex items-center gap-1">
                <Calendar size={9} />
                {user?.created_date ? new Date(user.created_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
              </span>
            </div>
          </div>

          {/* Info stats row */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="text-right hidden sm:block">
              <p className="text-[10px] text-white/30 uppercase tracking-widest font-bold">Pengaturan</p>
              <div className="flex items-center gap-1.5 mt-1">
                <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: roleMeta.color + '20' }}>
                  <Settings size={12} style={{ color: roleMeta.color }} />
                </div>
                <p className="text-xs font-bold text-white">Konfigurasi Akun</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:gap-5 items-stretch md:items-start">
        {/* ── SIDEBAR NAV ── */}
        <aside className="hidden md:flex flex-col gap-1.5 w-56 shrink-0">
          {visibleTabs.map(tab => {
            const Icon = tab.icon;
            const isActive = mainTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setMainTab(tab.id)}
                className={`group flex items-center gap-3 w-full text-left px-3.5 py-3 rounded-2xl transition-all duration-200 border ${
                  isActive
                    ? 'shadow-md border-transparent text-white'
                    : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground border-transparent hover:border-border/50 bg-card'
                }`}
                style={isActive ? { background: `linear-gradient(135deg, ${tab.color}, ${tab.color}cc)`, boxShadow: `0 4px 16px ${tab.color}30` } : {}}
              >
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-all ${isActive ? 'bg-white/20' : 'bg-muted group-hover:bg-background'}`}>
                  <Icon size={15} className={isActive ? 'text-white' : ''} style={!isActive ? { color: tab.color } : {}} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-bold truncate ${isActive ? 'text-white' : 'text-foreground'}`}>{tab.label}</p>
                  <p className={`text-[10px] truncate mt-0.5 ${isActive ? 'text-white/70' : 'text-muted-foreground'}`}>{tab.desc}</p>
                </div>
                {isActive && <ChevronRight size={12} className="text-white/70 shrink-0" />}
              </button>
            );
          })}
        </aside>

        {/* ── MOBILE TOP NAV ── */}
        <SettingsMobileNav tabs={visibleTabs} activeId={activeTab?.id} onSelect={setMainTab} />

        {/* ── CONTENT PANEL ── */}
        <div className="flex-1 min-w-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={mainTab}
              initial={{ opacity:0, y:8 }}
              animate={{ opacity:1, y:0 }}
              exit={{ opacity:0, y:-8 }}
              transition={{ duration:0.18 }}
            >

              {/* ════════ KATEGORI ════════ */}
              {mainTab === 'kategori' && (
                <div className="space-y-4">
                  {/* Section header */}
                  <div className="flex items-center gap-3 p-4 rounded-2xl border border-primary/20 bg-primary/5">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <Tag size={18} className="text-primary" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-foreground">Kategori Transaksi</h3>
                      <p className="text-xs text-muted-foreground">{categories.filter(c => c.type !== 'saving').length} kategori aktif — Pemasukan & Pengeluaran</p>
                    </div>
                  </div>
                  {/* Sub-tabs */}
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex gap-1 bg-muted/50 p-1 rounded-xl">
                      {CATEGORY_TYPES.filter(t => isStaf ? true : true).map(t => (
                        <button
                          key={t.value}
                          onClick={() => setCatTypeFilter(t.value)}
                          className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${catTypeFilter === t.value ? 'bg-white dark:bg-card shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>
                    <Button onClick={() => openCreateCat(catTypeFilter)} size="sm" className="bg-primary hover:bg-primary/90 h-8 text-xs">
                      <Plus size={13} className="mr-1" /> Tambah
                    </Button>
                  </div>

                  {/* Category cards */}
                  {CATEGORY_TYPES.filter(t => t.value === catTypeFilter).map(typeConfig => {
                    const cats = categories.filter(c => c.type === typeConfig.value);
                    return (
                      <div key={typeConfig.value}>
                        {cats.length === 0 ? (
                          <div className="flex flex-col items-center justify-center py-16 rounded-2xl border-2 border-dashed border-border text-center">
                            <Tag size={32} className="text-muted-foreground/30 mb-3" />
                            <p className="text-sm text-muted-foreground mb-3">Belum ada kategori {typeConfig.label.toLowerCase()}</p>
                            <Button onClick={() => openCreateCat(typeConfig.value)} variant="outline" size="sm">Tambah Sekarang</Button>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                            {cats.map(cat => (
                              <div key={cat.id} className="group flex items-center gap-3 p-3 rounded-xl border border-border bg-card hover:shadow-md transition-all hover:border-primary/20">
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-sm" style={{ background: cat.color || '#0D4F6D' }}>
                                  {cat.name[0]?.toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-semibold truncate">{cat.name}</p>
                                  <div className="flex items-center gap-1 mt-0.5">
                                    {cat.is_favorite && <Star size={10} className="fill-amber-400 text-amber-400" />}
                                    <span className="text-[10px] text-muted-foreground">{typeConfig.label}</span>
                                  </div>
                                </div>
                                <div className="flex gap-0.5 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                                  <button
                                    onClick={async () => { setSavingStatus('kategori'); await Category.update(cat.id, { ...cat, is_favorite: !cat.is_favorite }); qc.invalidateQueries({ queryKey:['categories'] }); setSavingStatus(null); }}
                                    className="w-7 h-7 rounded-lg hover:bg-muted flex items-center justify-center"
                                  >
                                    <Star size={12} className={cat.is_favorite ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground'} />
                                  </button>
                                  <button onClick={() => openEditCat(cat)} className="w-7 h-7 rounded-lg hover:bg-muted flex items-center justify-center">
                                    <Pencil size={12} className="text-muted-foreground" />
                                  </button>
                                  <button onClick={() => deleteCat(cat.id, cat.name, cat.type)} className="w-7 h-7 rounded-lg hover:bg-red-50 flex items-center justify-center">
                                    <Trash2 size={12} className="text-red-400" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* ════════ TABUNGAN ════════ */}
              {mainTab === 'tabungan' && (
                <div className="space-y-5">
                  {/* Section header */}
                  <div className="flex items-center gap-3 p-4 rounded-2xl border border-indigo-200 bg-indigo-50 dark:bg-indigo-950/20">
                    <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center shrink-0">
                      <PiggyBank size={18} className="text-indigo-600" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-indigo-900 dark:text-indigo-200">Tabungan & Target</h3>
                      <p className="text-xs text-indigo-700 dark:text-indigo-400">{savingTargets.length} target aktif · {categories.filter(c => c.type === 'saving').length} kategori tabungan</p>
                    </div>
                  </div>
                  {/* Kategori tabungan */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-foreground text-sm">Kategori Tabungan</h3>
                        <p className="text-xs text-muted-foreground">{categories.filter(c => c.type === 'saving').length} kategori</p>
                      </div>
                      <Button onClick={() => { setEditingCat(null); setCatForm({ name:'', type:'saving', color:'#6366F1', icon:'Tag' }); setShowCatDialog(true); }} size="sm" className="bg-indigo-600 hover:bg-indigo-700 h-8 text-xs">
                        <Plus size={13} className="mr-1" /> Tambah
                      </Button>
                    </div>
                    {categories.filter(c => c.type === 'saving').length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12 rounded-2xl border-2 border-dashed border-border">
                        <PiggyBank size={32} className="text-muted-foreground/30 mb-3" />
                        <p className="text-sm text-muted-foreground">Belum ada kategori tabungan</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                        {categories.filter(c => c.type === 'saving').map(cat => (
                          <div key={cat.id} className="group flex items-center gap-3 p-3 rounded-xl border border-border bg-card hover:shadow-md transition-all hover:border-indigo-200">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0" style={{ background: cat.color || '#6366F1' }}>
                              {cat.name[0]?.toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold truncate">{cat.name}</p>
                              <span className="text-[10px] text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded-full">Tabungan</span>
                            </div>
                            <div className="flex gap-0.5 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                              <button onClick={() => openEditCat(cat)} className="w-7 h-7 rounded-lg hover:bg-muted flex items-center justify-center"><Pencil size={12} className="text-muted-foreground" /></button>
                              <button onClick={() => deleteCat(cat.id, cat.name, 'saving')} className="w-7 h-7 rounded-lg hover:bg-red-50 flex items-center justify-center"><Trash2 size={12} className="text-red-400" /></button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Target tabungan */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-foreground text-sm">Target Tabungan</h3>
                        <p className="text-xs text-muted-foreground">{savingTargets.length} target</p>
                      </div>
                      <Button onClick={openCreateTarget} size="sm" className="bg-emerald-600 hover:bg-emerald-700 h-8 text-xs">
                        <Plus size={13} className="mr-1" /> Tambah
                      </Button>
                    </div>
                    {savingTargets.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12 rounded-2xl border-2 border-dashed border-border">
                        <Target size={32} className="text-muted-foreground/30 mb-3" />
                        <p className="text-sm text-muted-foreground mb-3">Belum ada target</p>
                        <Button onClick={openCreateTarget} variant="outline" size="sm">Buat Target Pertama</Button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {savingTargets.map(t => {
                          const pct = Math.min(100, t.target_amount > 0 ? ((t.current_amount||0)/t.target_amount)*100 : 0);
                          const ds  = getDeadlineStatus(t.deadline);
                          return (
                            <div key={t.id} className="rounded-2xl border border-border bg-card overflow-hidden hover:shadow-md transition-all">
                              <div className="h-1" style={{ background: t.color || '#10B981' }} />
                              <div className="p-4">
                                <div className="flex items-start justify-between mb-3">
                                  <div className="flex items-center gap-2.5">
                                    <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold shrink-0" style={{ background: t.color || '#10B981' }}>
                                      {t.name[0]?.toUpperCase()}
                                    </div>
                                    <div>
                                      <p className="font-semibold text-sm">{t.name}</p>
                                      {ds && (
                                        <span className={`inline-flex items-center gap-1 text-[10px] ${ds.color}`}>
                                          <ds.icon size={9} />{ds.label}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex gap-0.5">
                                    <button onClick={() => openEditTarget(t)} className="w-7 h-7 rounded-lg hover:bg-muted flex items-center justify-center"><Pencil size={12} className="text-muted-foreground" /></button>
                                    <button onClick={() => deleteTarget(t.id, t.name)} className="w-7 h-7 rounded-lg hover:bg-red-50 flex items-center justify-center"><Trash2 size={12} className="text-red-400" /></button>
                                  </div>
                                </div>
                                <div className="space-y-1.5">
                                  <div className="flex justify-between text-xs">
                                    <span className="text-muted-foreground">{formatCurrency(t.current_amount||0, t.currency)}</span>
                                    <span className="font-bold" style={{ color: t.color || '#10B981' }}>{pct.toFixed(0)}%</span>
                                  </div>
                                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                                    <div className="h-full rounded-full transition-all" style={{ width:`${pct}%`, background: t.color || '#10B981' }} />
                                  </div>
                                  <p className="text-xs text-right text-muted-foreground">Target: <span className="font-semibold text-foreground">{formatCurrency(t.target_amount||0, t.currency)}</span></p>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ════════ BUNGA ════════ */}
              {mainTab === 'bunga' && (
                <div className="space-y-4">
                  {/* Section header */}
                  <div className="flex items-center gap-3 p-4 rounded-2xl border border-amber-200 bg-amber-50 dark:bg-amber-950/20">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center shrink-0">
                      <Percent size={18} className="text-amber-600" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-amber-900 dark:text-amber-200">Pengaturan Bunga Default</h3>
                      <p className="text-xs text-amber-700 dark:text-amber-400">Nilai default saat membuat hutang atau piutang baru</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                      { label:'Bunga Hutang', color:'amber', value:defaultDebtInterest, onChange:setDefaultDebtInterest,
                        onSave:() => { localStorage.setItem('defaultDebtInterest', defaultDebtInterest); toast.success('Bunga hutang disimpan'); },
                        desc:'Diterapkan otomatis saat membuat hutang baru' },
                      { label:'Bunga Piutang', color:'teal', value:defaultReceivableInterest, onChange:setDefaultReceivableInterest,
                        onSave:() => { localStorage.setItem('defaultReceivableInterest', defaultReceivableInterest); toast.success('Bunga piutang disimpan'); },
                        desc:'Diterapkan otomatis saat membuat piutang baru' },
                    ].map(({ label, color, value, onChange, onSave, desc }) => (
                      <div key={label} className="rounded-2xl border border-border bg-card overflow-hidden">
                        <div className={`px-4 py-3 border-b border-border bg-${color}-50 dark:bg-${color}-950/20 flex items-center gap-3`}>
                          <div className={`w-8 h-8 rounded-xl bg-${color}-100 dark:bg-${color}-900/40 flex items-center justify-center`}>
                            <Percent size={15} className={`text-${color}-600`} />
                          </div>
                          <div>
                            <p className={`font-semibold text-sm text-${color}-900 dark:text-${color}-200`}>{label}</p>
                            <p className={`text-[10px] text-${color}-700 dark:text-${color}-400`}>per bulan (%)</p>
                          </div>
                        </div>
                        <div className="p-4 space-y-3">
                          <div className="flex items-center gap-2">
                            <Input type="number" value={value} onChange={e => onChange(e.target.value)} placeholder="0" step="0.01" min="0" className="flex-1" />
                            <span className={`px-3 py-2 rounded-xl border border-border text-sm font-bold text-${color}-600 bg-${color}-50 dark:bg-${color}-950/20`}>%</span>
                          </div>
                          <p className="text-xs text-muted-foreground">{desc}</p>
                          <Button onClick={onSave} className={`w-full h-9 text-sm bg-${color}-600 hover:bg-${color}-700 text-white`}>
                            Simpan
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 text-xs text-blue-800 dark:text-blue-300">
                    💡 Bunga ini bersifat informasi — tidak mempengaruhi data hutang/piutang yang sudah ada.
                  </div>
                </div>
              )}

              {/* ════════ MATA UANG ════════ */}
              {mainTab === 'mata_uang' && (
                <div className="space-y-5">
                  {/* Section header */}
                  <div className="flex items-center gap-3 p-4 rounded-2xl border border-emerald-200 bg-emerald-50 dark:bg-emerald-950/20">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center shrink-0">
                      <Globe size={18} className="text-emerald-600" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-emerald-900 dark:text-emerald-200">Mata Uang & Kurs</h3>
                      <p className="text-xs text-emerald-700 dark:text-emerald-400">Kelola mata uang aktif dan nilai tukar ke IDR</p>
                    </div>
                  </div>
                  {/* Mata uang aktif */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-sm">Mata Uang Aktif</h3>
                        <p className="text-xs text-muted-foreground">IDR (default) + {customCurrencies.length} tambahan</p>
                      </div>
                      <Button size="sm" className="bg-primary hover:bg-primary/90 h-8 text-xs" onClick={() => { setSelectedCountryCode(''); setShowCurrDialog(true); }}>
                        <Plus size={13} className="mr-1" /> Tambah
                      </Button>
                    </div>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
                      <div className="p-3 rounded-2xl border-2 border-primary/30 bg-primary/5 text-center">
                        <span className="text-2xl">🇮🇩</span>
                        <p className="font-bold text-sm text-primary mt-1.5">IDR</p>
                        <p className="text-[10px] text-muted-foreground">Default</p>
                      </div>
                      {customCurrencies.map(c => (
                        <div key={c.code} className="group p-3 rounded-2xl border border-border bg-card text-center relative hover:border-primary/30 transition-colors">
                          <span className="text-2xl">{c.flag || '🌍'}</span>
                          <p className="font-bold text-sm text-primary mt-1.5">{c.code}</p>
                          <p className="text-[10px] text-muted-foreground">{c.symbol}</p>
                          <button onClick={() => deleteCustomCurrency(c.code)} className="absolute top-1 right-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity w-5 h-5 flex items-center justify-center rounded-full bg-red-100 hover:bg-red-200">
                            <Trash2 size={9} className="text-red-500" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Kurs */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-sm">Kurs Nilai Tukar</h3>
                        <p className="text-xs text-muted-foreground">1 mata uang = ? IDR</p>
                      </div>
                      <Button size="sm" className="bg-primary hover:bg-primary/90 h-8 text-xs" onClick={openCreateRate}>
                        <Plus size={12} className="mr-1" /> Tambah Kurs
                      </Button>
                    </div>
                    {rates.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12 rounded-2xl border-2 border-dashed border-border">
                        <Globe size={32} className="text-muted-foreground/30 mb-3" />
                        <p className="text-sm text-muted-foreground mb-1">Belum ada kurs</p>
                        <p className="text-xs text-muted-foreground">Klik "Tambah Kurs" untuk mengisi manual</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                        {rates.map(r => (
                          <div key={r.id} className="group p-3.5 rounded-2xl border border-border bg-card hover:shadow-md transition-all hover:border-primary/20">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-bold text-sm">{r.from_currency}</span>
                              <div className="flex gap-0.5 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                                <button onClick={() => openEditRate(r)} className="w-6 h-6 rounded-md hover:bg-muted flex items-center justify-center"><Pencil size={11} className="text-muted-foreground" /></button>
                                <button onClick={() => deleteRate(r.id, r.from_currency, r.to_currency)} className="w-6 h-6 rounded-md hover:bg-red-50 flex items-center justify-center"><Trash2 size={11} className="text-red-400" /></button>
                              </div>
                            </div>
                            <p className="text-[10px] text-muted-foreground">1 {r.from_currency} =</p>
                            <p className="font-bold text-primary text-sm">Rp {new Intl.NumberFormat('id-ID').format(r.rate)}</p>
                            {r.notes && <p className="text-[10px] text-muted-foreground mt-1 truncate">{r.notes}</p>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ════════ TELEGRAM ════════ */}
              {mainTab === 'telegram' && (
                <>
                  <div className="flex items-center gap-3 p-4 rounded-2xl border mb-4" style={{ borderColor: '#0088CC40', background: '#0088CC08' }}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: '#0088CC20' }}>
                      <Send size={18} style={{ color: '#0088CC' }} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-foreground">Integrasi Telegram Bot</h3>
                      <p className="text-xs text-muted-foreground">Hubungkan akun & terima notifikasi real-time di Telegram</p>
                    </div>
                    {user?.telegram_chat_id && (
                      <span className="ml-auto inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200 shrink-0">
                        <CheckCircle2 size={9} /> Terhubung
                      </span>
                    )}
                  </div>
                  <TelegramTabContent
                  user={user}
                  telegramChatId={telegramChatId}
                  setTelegramChatId={setTelegramChatId}
                  telegramLinked={telegramLinked}
                  setTelegramLinked={setTelegramLinked}
                  telegramSaving={telegramSaving}
                  saveTelegramLink={saveTelegramLink}
                  unlinkTelegram={unlinkTelegram}
                  webhookStatus={webhookStatus}
                  webhookLoading={webhookLoading}
                  setWebhook={setWebhook}
                  checkWebhook={checkWebhook}
                />
                </>
              )}

              {/* ════════ MANAJEMEN AKSES MEMBER ════════ */}
              {mainTab === 'akses_member' && user?.email?.toLowerCase() === OWNER_EMAIL && (
                <ExecutiveAccessPanel>
                  <EmailApprovalManager />
                </ExecutiveAccessPanel>
              )}

              {/* ════════ PERSETUJUAN LOGIN ════════ */}
              {mainTab === 'login_approval' && user?.email?.toLowerCase() === OWNER_EMAIL && (
                <LoginApprovalPanel />
              )}

              {/* ════════ PEMBAYARAN ════════ */}
              {mainTab === 'pembayaran' && user?.email?.toLowerCase() === OWNER_EMAIL && (
                <PaymentSettingPanel />
              )}

              {/* ════════ BUKTI TRANSFER MASUK ════════ */}
              {mainTab === 'bukti_transfer' && user?.email?.toLowerCase() === OWNER_EMAIL && (
                <PaymentProofList />
              )}

              {/* ════════ SESI PENGGUNAAN HARIAN ════════ */}
              {mainTab === 'sesi_harian' && user?.email?.toLowerCase() === OWNER_EMAIL && (
                <DailyUsagePanel />
              )}

            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* ─── DIALOGS ─── */}
      <Dialog open={showCatDialog} onOpenChange={setShowCatDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>{editingCat ? 'Edit Kategori' : 'Tambah Kategori'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Nama Kategori</Label><Input className="mt-1.5" value={catForm.name} onChange={e => setCatForm({ ...catForm, name:e.target.value })} placeholder="e.g. Makan & Minum" /></div>
            <div>
              <Label>Jenis</Label>
              <Select value={catForm.type} onValueChange={v => setCatForm({ ...catForm, type:v })}>
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORY_TYPES.filter(t => isStaf ? (t.value === 'income' || t.value === 'expense') : true).map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  {!isStaf && <SelectItem value="saving">Tabungan</SelectItem>}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Warna</Label>
              <div className="flex flex-wrap gap-2 mt-1.5">
                {PRESET_COLORS.map(c => (
                  <div key={c} className="w-7 h-7 rounded-full cursor-pointer transition-transform hover:scale-110 ring-offset-2" style={{ background:c, outline: catForm.color === c ? `3px solid ${c}` : 'none', outlineOffset:'2px' }} onClick={() => setCatForm({ ...catForm, color:c })} />
                ))}
                <input type="color" value={catForm.color} onChange={e => setCatForm({ ...catForm, color:e.target.value })} className="w-7 h-7 rounded-full cursor-pointer border-none" />
              </div>
            </div>
            <div className="flex gap-2 justify-end pt-1">
              <Button variant="outline" onClick={() => setShowCatDialog(false)}>Batal</Button>
              <Button onClick={saveCat} className="bg-primary hover:bg-primary/90">Simpan</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showCurrDialog} onOpenChange={v => { setShowCurrDialog(v); if (!v) setSelectedCountryCode(''); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Tambah Mata Uang</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Negara / Mata Uang</Label>
              <Select value={selectedCountryCode} onValueChange={setSelectedCountryCode}>
                <SelectTrigger className="mt-1.5"><SelectValue placeholder="— Pilih negara —" /></SelectTrigger>
                <SelectContent className="max-h-72">
                  {WORLD_CURRENCIES.filter(w => !customCurrencies.find(c => c.code === w.code)).map(w => (
                    <SelectItem key={w.code} value={w.code}>{w.flag} {w.country} ({w.code})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedCountryCode && (() => {
              const entry = WORLD_CURRENCIES.find(c => c.code === selectedCountryCode);
              if (!entry) return null;
              return (
                <div className="p-3 rounded-xl bg-muted/40 border border-border">
                  <p className="font-semibold text-sm">{entry.flag} {entry.name}</p>
                  <p className="text-xs text-muted-foreground mt-1">Kode: <strong>{entry.code}</strong> · Simbol: <strong>{entry.symbol}</strong></p>
                  <p className="text-xs text-blue-600 mt-1.5">Kurs otomatis diambil dari internet.</p>
                </div>
              );
            })()}
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowCurrDialog(false)}>Batal</Button>
              <Button onClick={saveCustomCurrency} disabled={!selectedCountryCode || addingCurrency} className="bg-primary hover:bg-primary/90">
                {addingCurrency ? <><Loader2 size={13} className="animate-spin mr-1.5" />Menyimpan...</> : 'Tambah'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showTargetDialog} onOpenChange={setShowTargetDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editingTarget ? 'Edit Target' : 'Tambah Target Tabungan'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Nama Target</Label><Input className="mt-1.5" value={targetForm.name} onChange={e => setTargetForm({ ...targetForm, name:e.target.value })} placeholder="e.g. Dana Darurat" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Target Nominal</Label><Input className="mt-1.5" type="number" value={targetForm.target_amount} onChange={e => setTargetForm({ ...targetForm, target_amount:e.target.value })} placeholder="0" /></div>
              <div><Label>Sudah Terkumpul</Label><Input className="mt-1.5" type="number" value={targetForm.current_amount} onChange={e => setTargetForm({ ...targetForm, current_amount:e.target.value })} placeholder="0" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Mata Uang</Label>
                <Select value={targetForm.currency} onValueChange={v => setTargetForm({ ...targetForm, currency:v })}>
                  <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.keys(CURRENCIES).map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Deadline</Label><Input className="mt-1.5" type="date" value={targetForm.deadline} onChange={e => setTargetForm({ ...targetForm, deadline:e.target.value })} /></div>
            </div>
            <div>
              <Label>Warna</Label>
              <div className="flex flex-wrap gap-2 mt-1.5">
                {PRESET_COLORS.map(c => (
                  <div key={c} className="w-7 h-7 rounded-full cursor-pointer hover:scale-110 transition-transform" style={{ background:c, outline: targetForm.color === c ? `3px solid ${c}` : 'none', outlineOffset:'2px' }} onClick={() => setTargetForm({ ...targetForm, color:c })} />
                ))}
                <input type="color" value={targetForm.color} onChange={e => setTargetForm({ ...targetForm, color:e.target.value })} className="w-7 h-7 rounded-full cursor-pointer border-none" />
              </div>
            </div>
            <div><Label>Catatan</Label><Input className="mt-1.5" value={targetForm.notes} onChange={e => setTargetForm({ ...targetForm, notes:e.target.value })} placeholder="Opsional" /></div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowTargetDialog(false)}>Batal</Button>
              <Button onClick={saveTarget} className="bg-primary hover:bg-primary/90" disabled={!targetForm.name.trim() || !targetForm.target_amount}>Simpan</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showRateDialog} onOpenChange={setShowRateDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>{editingRate ? 'Edit Kurs' : 'Tambah Kurs Manual'}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Dari</Label>
                <Select value={rateForm.from_currency} onValueChange={v => setRateForm({ ...rateForm, from_currency:v })}>
                  <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.keys(CURRENCIES).filter(c => c !== 'IDR').map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Ke</Label>
                <Select value={rateForm.to_currency} onValueChange={v => setRateForm({ ...rateForm, to_currency:v })}>
                  <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.keys(CURRENCIES).map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div><Label>1 {rateForm.from_currency} = ? {rateForm.to_currency}</Label><Input className="mt-1.5" type="number" value={rateForm.rate} onChange={e => setRateForm({ ...rateForm, rate:e.target.value })} placeholder="Contoh: 16500" /></div>
            <div><Label>Catatan</Label><Input className="mt-1.5" value={rateForm.notes} onChange={e => setRateForm({ ...rateForm, notes:e.target.value })} placeholder="Sumber, tanggal, dll" /></div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowRateDialog(false)}>Batal</Button>
              <Button onClick={saveRate} disabled={!rateForm.rate} className="bg-primary hover:bg-primary/90">Simpan</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirm.open}
        onOpenChange={v => setConfirm(c => ({ ...c, open:v }))}
        title={confirm.title}
        description={confirm.desc}
        type={confirm.type}
        onConfirm={confirm.onConfirm}
        loading={confirm.loading}
      />
    </div>
  );
}