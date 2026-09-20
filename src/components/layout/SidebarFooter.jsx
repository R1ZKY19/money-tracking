import React, { useState, useEffect, useRef } from 'react';
import {
  Sun, Moon, LogOut, FileDown, Database,
  FileText, Download, ChevronDown, Activity, Wifi, WifiOff,
  Globe, BadgeCheck, UserCircle, Check
} from 'lucide-react';
import { useLanguage, LANGUAGES } from '@/lib/LanguageContext';
import { useTheme } from '@/lib/ThemeContext';
import { supabase } from '@/api/supabaseClient';
import { Transaction, Account, Debt, Receivable, SavingTarget } from '@/api/entities';
import { cn } from '@/lib/utils';
import { logLogout } from '@/lib/activityLogger';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/AuthContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import LogoutConfirmDialog from '@/components/ui/LogoutConfirmDialog';
import RoleCrest from '@/components/role/RoleCrest';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const MODULES = [
  { key: "Transaction", label: "Transaksi" },
  { key: "Account", label: "Akun/Saldo" },
  { key: "Debt", label: "Hutang" },
  { key: "Receivable", label: "Piutang" },
  { key: "SavingTarget", label: "Tabungan" },
];

function Tooltip({ label, children }) {
  return (
    <div className="relative group/tip">
      {children}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 rounded-lg text-[10px] font-semibold text-white whitespace-nowrap opacity-0 group-hover/tip:opacity-100 pointer-events-none transition-opacity duration-150 z-50"
        style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}>
        {label}
      </div>
    </div>
  );
}

export default function SidebarFooter({ currentUser, roleCfg, role, RoleIcon, onOpenProfil }) {
  const { lang, setLangDirect, currentLang } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();
  const uid = user?.id;

  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [lastSync, setLastSync] = useState(new Date());
  const [syncText, setSyncText] = useState('Baru saja');
  const [showExportModal, setShowExportModal] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showLiveData, setShowLiveData] = useState(false);
  const [showLangPicker, setShowLangPicker] = useState(false);
  const [exporting, setExporting] = useState(false);
  const langRef = useRef(null);

  const [exportFormat, setExportFormat] = useState('xlsx');
  const [exportStartDate, setExportStartDate] = useState('');
  const [exportEndDate, setExportEndDate] = useState('');
  const [exportCategory, setExportCategory] = useState('all');

  const { data: txs = [] } = useQuery({
    queryKey: ['transactions', uid],
    queryFn: () => uid ? Transaction.list() : [],
    enabled: !!uid,
  });
  const { data: activeUsers = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => supabase.from('profiles').select('*').then(res => res.data || []),
    enabled: user?.role === 'admin' || user?.role === 'super_master',
  });

  useEffect(() => {
    const up = () => setIsOnline(true);
    const dn = () => setIsOnline(false);
    window.addEventListener('online', up);
    window.addEventListener('offline', dn);
    return () => { window.removeEventListener('online', up); window.removeEventListener('offline', dn); };
  }, []);

  useEffect(() => {
    const iv = setInterval(() => {
      const diff = Math.floor((new Date() - lastSync) / 1000);
      if (diff < 5) setSyncText('Baru saja');
      else if (diff < 60) setSyncText(`${diff}d lalu`);
      else setSyncText(`${Math.floor(diff / 60)}m lalu`);
    }, 5000);
    return () => clearInterval(iv);
  }, [lastSync]);

  // Close lang picker on outside click
  useEffect(() => {
    const handler = (e) => {
      if (langRef.current && !langRef.current.contains(e.target)) {
        setShowLangPicker(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const doExport = async () => {
    setExporting(true);
    try {
      const entityMap = {
        Transaction,
        Account,
        Debt,
        Receivable,
        SavingTarget
      };
      const allData = {};
      await Promise.all(
        MODULES.map(async ({ key, label }) => {
          try {
            const entity = entityMap[key];
            let rows = entity ? await entity.list({ limit: 5000 }) : [];
            if (key === 'Transaction' && exportStartDate && exportEndDate)
              rows = rows.filter(r => r.date >= exportStartDate && r.date <= exportEndDate);
            allData[label] = rows;
          } catch { allData[label] = []; }
        })
      );
      const dateStr = new Date().toISOString().slice(0, 10);
      const blob = new Blob([JSON.stringify(allData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = `moneytracking-backup-${dateStr}.json`; a.click();
      URL.revokeObjectURL(url);
      setLastSync(new Date());
      setShowExportModal(false);
    } catch (e) {
      console.error(e);
      alert('Gagal melakukan export data');
    } finally {
      setExporting(false);
    }
  };

  const handleLogout = async () => {
    try { await logLogout(); } catch {}
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  return (
    <>
      {/* ── TOP DIVIDER ── */}
      <div className="mb-2" style={{ height: '1px', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.10), transparent)' }} />

      {/* ── LIVE DATA + PROFILE ROW ── */}
      <div className="flex items-stretch gap-2 mb-2">
        {/* Live Data Card */}
        <button
          onClick={() => setShowLiveData(!showLiveData)}
          className="flex-1 rounded-xl overflow-hidden transition-all duration-200 group text-left"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <div className="flex items-center gap-2 px-2.5 py-2">
            <div className="relative shrink-0">
              {isOnline
                ? <Wifi size={12} className="text-emerald-400" />
                : <WifiOff size={12} className="text-red-400" />
              }
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[9.5px] font-semibold text-white/55 leading-none">Data Langsung</p>
              <p className={cn('text-[8.5px] mt-0.5 font-medium', isOnline ? 'text-emerald-400' : 'text-red-400')}>
                {isOnline ? `● Online` : '○ Offline'}
              </p>
            </div>
            <ChevronDown size={10} className={cn('text-white/25 shrink-0 transition-transform duration-200', showLiveData && 'rotate-180')} />
          </div>
        </button>

        {/* Profile Card (mini) */}
        {currentUser && (
          <button
            onClick={onOpenProfil}
            className="flex items-center gap-2 px-2.5 py-2 rounded-xl transition-all duration-200 group hover:bg-white/8"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <div className="relative shrink-0">
              <RoleCrest role={role} size="sm">
                {currentUser.avatar_url
                  ? <img src={currentUser.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                  : RoleIcon ? <RoleIcon size={13} className="text-white" /> : <UserCircle size={13} className="text-white" />
                }
              </RoleCrest>
              <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border border-[#0a3347]"
                style={{ background: roleCfg?.dot || '#34D399' }} />
            </div>
            <div className="min-w-0 hidden sm:block">
              <p className="text-white/70 text-[9px] font-semibold truncate leading-none max-w-[64px]">
                {currentUser.full_name?.split(' ')[0] || currentUser.email?.split('@')[0]}
              </p>
              <p className="text-white/35 text-[8px] mt-0.5">{roleCfg?.label || 'USER'}</p>
            </div>
          </button>
        )}
      </div>

      {/* ── LIVE DATA EXPANDED PANEL ── */}
      {showLiveData && (
        <div className="mb-2 rounded-xl overflow-hidden"
          style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="grid grid-cols-3 divide-x divide-white/5">
            {[
              { label: 'Status', value: isOnline ? 'Online' : 'Offline', color: isOnline ? '#34D399' : '#F87171' },
              { label: 'Records', value: txs.length, color: '#93C5FD' },
              { label: 'Users', value: activeUsers.length || 1, color: '#A78BFA' },
            ].map(({ label, value, color }) => (
              <div key={label} className="flex flex-col items-center justify-center py-2 px-1">
                <p className="text-[8px] text-white/30 uppercase tracking-wider font-semibold">{label}</p>
                <p className="text-[11px] font-bold mt-0.5" style={{ color }}>{value}</p>
              </div>
            ))}
          </div>
          <div className="px-3 py-1.5 flex items-center justify-between border-t border-white/5">
            <span className="text-[8.5px] text-white/25 flex items-center gap-1">
              <Activity size={8} /> Sync: {syncText}
            </span>
            <span className={cn('text-[8.5px] font-semibold', isOnline ? 'text-emerald-400' : 'text-red-400')}>
              {isOnline ? '✓ Connected' : '✗ Disconnected'}
            </span>
          </div>
        </div>
      )}

      {/* ── ACTION ROW ── */}
      <div className="flex items-center justify-between rounded-xl px-1.5 py-1"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>

        {/* Export */}
        <Tooltip label="Export Data">
          <button onClick={() => setShowExportModal(true)}
            className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg hover:bg-white/8 transition-all group">
            <FileDown size={13} className="text-white/40 group-hover:text-emerald-400 transition-colors" />
            <span className="text-[10px] text-white/40 group-hover:text-white/75 font-medium transition-colors">Export</span>
          </button>
        </Tooltip>

        <div className="flex items-center gap-0.5">

          {/* ── LANGUAGE PICKER ── */}
          <div className="relative" ref={langRef}>
            <Tooltip label="Pilih Bahasa">
              <button
                onClick={() => setShowLangPicker(v => !v)}
                className="h-7 px-2 rounded-lg hover:bg-white/8 flex items-center gap-1 transition-all group"
              >
                <span className="text-[12px] leading-none">{currentLang?.flag || '🌐'}</span>
                <span className="text-[9px] font-bold text-white/40 group-hover:text-sky-400 transition-colors uppercase">{lang}</span>
                <ChevronDown size={9} className={cn('text-white/25 transition-transform duration-150', showLangPicker && 'rotate-180')} />
              </button>
            </Tooltip>

            {/* Dropdown picker */}
            {showLangPicker && (
              <div
                className="absolute bottom-full right-0 mb-2 rounded-2xl overflow-hidden z-50 min-w-[160px]"
                style={{
                  background: 'hsl(var(--sidebar-background))',
                  border: '1px solid rgba(255,255,255,0.12)',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                }}
              >
                <div className="px-3 py-2 border-b border-white/8">
                  <p className="text-[9px] font-black uppercase tracking-widest text-white/40">Pilih Bahasa</p>
                </div>
                {LANGUAGES.map(l => (
                  <button
                    key={l.code}
                    onClick={() => { setLangDirect(l.code); setShowLangPicker(false); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 transition-all hover:bg-white/8 group"
                  >
                    <span className="text-[14px] leading-none">{l.flag}</span>
                    <div className="flex-1 text-left">
                      <p className={cn('text-[11px] font-semibold leading-tight', lang === l.code ? 'text-sky-300' : 'text-white/70 group-hover:text-white/90')}>
                        {l.native}
                      </p>
                      <p className="text-[9px] text-white/30">{l.label}</p>
                    </div>
                    {lang === l.code && <Check size={11} className="text-sky-400 shrink-0" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Theme */}
          <Tooltip label={theme === 'dark' ? 'Mode Terang' : 'Mode Gelap'}>
            <button onClick={toggleTheme}
              className="w-7 h-7 rounded-lg hover:bg-white/8 flex items-center justify-center transition-all group">
              {theme === 'dark'
                ? <Sun size={13} className="text-white/40 group-hover:text-amber-400 transition-colors" />
                : <Moon size={13} className="text-white/40 group-hover:text-indigo-400 transition-colors" />
              }
            </button>
          </Tooltip>

          {/* Logout */}
          <Tooltip label="Keluar">
            <button onClick={() => setShowLogoutConfirm(true)}
              className="w-7 h-7 rounded-lg hover:bg-red-500/15 flex items-center justify-center transition-all group">
              <LogOut size={13} className="text-white/40 group-hover:text-red-400 transition-colors" />
            </button>
          </Tooltip>
        </div>
      </div>

      {/* ── EXPORT MODAL ── */}
      <Dialog open={showExportModal} onOpenChange={setShowExportModal}>
        <DialogContent className="max-w-md bg-card border-border rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2.5 text-lg font-heading font-bold">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Download className="w-5 h-5 text-primary" />
              </div>
              Export Data Keuangan
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-5 py-4">
            <div className="space-y-2">
              <Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Format File</Label>
              <div className="grid grid-cols-3 gap-2">
                {['xlsx', 'pdf', 'json'].map(fmt => (
                  <div key={fmt} onClick={() => setExportFormat(fmt)}
                    className={cn('cursor-pointer border rounded-xl p-3 flex flex-col items-center gap-1.5 transition-all',
                      exportFormat === fmt ? 'border-primary bg-primary/5 ring-1 ring-primary/20' : 'border-border hover:bg-muted/50')}>
                    {fmt === 'xlsx' && <FileDown className={cn('w-5 h-5', exportFormat === fmt ? 'text-primary' : 'text-muted-foreground')} />}
                    {fmt === 'pdf' && <FileText className={cn('w-5 h-5', exportFormat === fmt ? 'text-primary' : 'text-muted-foreground')} />}
                    {fmt === 'json' && <Database className={cn('w-5 h-5', exportFormat === fmt ? 'text-primary' : 'text-muted-foreground')} />}
                    <span className={cn('text-xs font-semibold uppercase', exportFormat === fmt ? 'text-primary' : 'text-muted-foreground')}>{fmt}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Tanggal Awal</Label>
                <Input type="date" value={exportStartDate} onChange={e => setExportStartDate(e.target.value)} className="rounded-xl h-10" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Tanggal Akhir</Label>
                <Input type="date" value={exportEndDate} onChange={e => setExportEndDate(e.target.value)} className="rounded-xl h-10" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Kategori Data</Label>
              <Select value={exportCategory} onValueChange={setExportCategory}>
                <SelectTrigger className="h-10 rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Kategori</SelectItem>
                  <SelectItem value="income">Pendapatan Saja</SelectItem>
                  <SelectItem value="expense">Pengeluaran Saja</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button variant="outline" onClick={() => setShowExportModal(false)} className="rounded-xl px-6">Batal</Button>
            <Button onClick={doExport} disabled={exporting} className="rounded-xl px-8 bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20">
              {exporting ? 'Memproses...' : 'Export Sekarang'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── LOGOUT CONFIRM ── */}
      <LogoutConfirmDialog
        open={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={handleLogout}
        userName={currentUser?.full_name || currentUser?.email?.split('@')[0] || 'Pengguna'}
      />

      <style>{`
        @keyframes liveGlow {
          0%, 100% { transform: scale(1); opacity: 0.3; }
          50%       { transform: scale(2.5); opacity: 0; }
        }
      `}</style>
    </>
  );
}