import React, { useState, useMemo, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { format, isToday, isYesterday, formatDistanceToNow } from "date-fns";
import { id as localeId } from "date-fns/locale";
import {
  Shield, LogIn, LogOut, Plus, Pencil, Trash2, CreditCard,
  Eye, Download, Search, Filter, RefreshCw, Globe, Monitor,
  CheckCircle2, XCircle, AlertTriangle, ChevronDown, ChevronUp,
  Clock, Activity, TrendingUp, Database, User, Zap, BarChart2, FileDown
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/AuthContext";

const sanitizeText = (text) => {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
};

const ACTION_CONFIG = {
  login:   { icon: LogIn,      color: "bg-emerald-100 text-emerald-700 border-emerald-200", dot: "bg-emerald-500", label: "Login" },
  logout:  { icon: LogOut,     color: "bg-slate-100 text-slate-600 border-slate-200",       dot: "bg-slate-400",   label: "Logout" },
  create:  { icon: Plus,       color: "bg-blue-100 text-blue-700 border-blue-200",           dot: "bg-blue-500",    label: "Tambah" },
  update:  { icon: Pencil,     color: "bg-amber-100 text-amber-700 border-amber-200",        dot: "bg-amber-500",   label: "Ubah" },
  delete:  { icon: Trash2,     color: "bg-red-100 text-red-700 border-red-200",              dot: "bg-red-500",     label: "Hapus" },
  payment: { icon: CreditCard, color: "bg-purple-100 text-purple-700 border-purple-200",     dot: "bg-purple-500",  label: "Bayar" },
  view:    { icon: Eye,        color: "bg-gray-100 text-gray-600 border-gray-200",           dot: "bg-gray-400",    label: "Lihat" },
  export:  { icon: Download,   color: "bg-teal-100 text-teal-700 border-teal-200",           dot: "bg-teal-500",    label: "Ekspor" },
};

const MODULE_ICONS = {
  auth: LogIn, transaksi: CreditCard, hutang: TrendingUp, piutang: CreditCard,
  tabungan: Database, akun: User, pengaturan: Filter, budget: BarChart2,
};

const STATUS_CONFIG = {
  success: { icon: CheckCircle2, label: "Sukses",      bg: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  failed:  { icon: XCircle,      label: "Gagal",       bg: "bg-red-50 text-red-700 border-red-200" },
  warning: { icon: AlertTriangle,label: "Peringatan",  bg: "bg-amber-50 text-amber-700 border-amber-200" },
};

function formatLogTime(dateStr) {
  const d = new Date(dateStr);
  if (isToday(d)) return `Hari ini ${format(d, 'HH:mm:ss')}`;
  if (isYesterday(d)) return `Kemarin ${format(d, 'HH:mm:ss')}`;
  return format(d, 'dd MMM yyyy HH:mm', { locale: localeId });
}

function TimeAgo({ dateStr }) {
  const ago = formatDistanceToNow(new Date(dateStr), { addSuffix: true, locale: localeId });
  return <span className="text-[10px] text-muted-foreground">{ago}</span>;
}

function LogRow({ log, index }) {
  const [expanded, setExpanded] = useState(false);
  const actionCfg = ACTION_CONFIG[log.action] || ACTION_CONFIG.view;
  const statusCfg = STATUS_CONFIG[log.status] || STATUS_CONFIG.success;
  const ActionIcon = actionCfg.icon;
  const StatusIcon = statusCfg.icon;
  const ModuleIcon = MODULE_ICONS[log.module] || Activity;
  const hasDetail = log.old_value || log.new_value || log.entity_id || log.user_agent;

  return (
    <>
      <tr
        className={`border-b border-border/40 transition-all ${expanded ? "bg-blue-50/30 dark:bg-blue-950/10" : "hover:bg-muted/20"} ${log.status === 'failed' ? 'bg-red-50/20 dark:bg-red-950/10' : ''}`}
        onClick={() => hasDetail && setExpanded(!expanded)}
        style={{ cursor: hasDetail ? "pointer" : "default" }}
      >
        {/* Index */}
        <td className="px-3 py-3 text-xs text-muted-foreground/50 font-mono w-8">{index + 1}</td>

        {/* Time */}
        <td className="px-3 py-3 min-w-[140px]">
          <div className="text-xs font-medium text-foreground">{formatLogTime(log.created_date)}</div>
          <TimeAgo dateStr={log.created_date} />
        </td>

        {/* Action */}
        <td className="px-3 py-3">
          <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-semibold border ${actionCfg.color}`}>
            <div className={`w-1.5 h-1.5 rounded-full ${actionCfg.dot}`} />
            <ActionIcon className="w-3 h-3" />
            {actionCfg.label}
          </span>
        </td>

        {/* Module */}
        <td className="px-3 py-3">
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-foreground px-2 py-1 rounded-lg bg-muted capitalize border border-border">
            <ModuleIcon className="w-3 h-3 text-muted-foreground" />
            {log.module || '—'}
          </span>
        </td>

        {/* Description */}
        <td className="px-3 py-3 max-w-xs">
          <div className="text-sm text-foreground leading-snug">{sanitizeText(log.description)}</div>
          {log.entity_name && (
            <div className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-1">
              <Database className="w-3 h-3" />
              {log.entity_name} {log.entity_id ? `· ID: ${log.entity_id.slice(0, 8)}...` : ''}
            </div>
          )}
        </td>

        {/* IP */}
        <td className="px-3 py-3">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Globe className="w-3 h-3 shrink-0" />
            <span className="font-mono">{log.ip_address || "—"}</span>
          </div>
        </td>

        {/* Status */}
        <td className="px-3 py-3">
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${statusCfg.bg}`}>
            <StatusIcon className="w-3 h-3" />
            {statusCfg.label}
          </span>
        </td>

        {/* Expand */}
        <td className="px-3 py-3 text-center w-8">
          {hasDetail && (
            <div className={`w-5 h-5 rounded-md flex items-center justify-center mx-auto transition-colors ${expanded ? 'bg-primary/10' : 'hover:bg-muted/50'}`}>
              {expanded ? <ChevronUp className="w-3.5 h-3.5 text-primary" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />}
            </div>
          )}
        </td>
      </tr>

      {/* Expanded detail row */}
      {expanded && hasDetail && (
        <tr className="border-b border-border/40">
          <td colSpan={8} className="px-0">
            <div className="bg-slate-50 dark:bg-slate-900/50 border-y border-border/50 px-6 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {log.old_value && (
                  <div>
                    <div className="flex items-center gap-1.5 mb-2">
                      <div className="w-2 h-2 rounded-full bg-red-400" />
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Sebelum Perubahan</p>
                    </div>
                    <pre className="text-xs bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl p-3 overflow-auto max-h-36 text-red-800 dark:text-red-300 font-mono">
                      {(() => {
                        try { return sanitizeText(JSON.stringify(JSON.parse(log.old_value), null, 2)); }
                        catch { return sanitizeText(log.old_value); }
                      })()}
                    </pre>
                  </div>
                )}
                {log.new_value && (
                  <div>
                    <div className="flex items-center gap-1.5 mb-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-400" />
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Setelah Perubahan</p>
                    </div>
                    <pre className="text-xs bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl p-3 overflow-auto max-h-36 text-emerald-800 dark:text-emerald-300 font-mono">
                      {(() => {
                        try { return sanitizeText(JSON.stringify(JSON.parse(log.new_value), null, 2)); }
                        catch { return sanitizeText(log.new_value); }
                      })()}
                    </pre>
                  </div>
                )}
              </div>
              {log.user_agent && (
                <div className="mt-3 pt-3 border-t border-border/40 flex items-start gap-2">
                  <Monitor className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
                  <p className="text-xs text-muted-foreground break-all">{sanitizeText(log.user_agent)}</p>
                </div>
              )}
              {log.entity_id && (
                <div className="mt-2 flex items-center gap-2">
                  <Database className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  <p className="text-xs font-mono text-muted-foreground">Entity ID: {log.entity_id}</p>
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

// Marquee banner text
function MarqueeBanner() {
  const text = "⚠️  PERHATIAN: Log aktivitas otomatis dihapus setelah 30 hari. Silakan simpan / ekspor data Anda sebelum terhapus permanen!  ·  ⚠️  PERHATIAN: Log aktivitas otomatis dihapus setelah 30 hari. Silakan simpan / ekspor data Anda sebelum terhapus permanen!  ·  ";
  return (
    <div className="overflow-hidden rounded-xl border border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-700 py-2">
      <div className="flex whitespace-nowrap" style={{ animation: "marquee 28s linear infinite" }}>
        <span className="text-xs font-semibold text-amber-700 dark:text-amber-400 px-4">{text}</span>
        <span className="text-xs font-semibold text-amber-700 dark:text-amber-400 px-4">{text}</span>
      </div>
      <style>{`
        @keyframes marquee { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
      `}</style>
    </div>
  );
}

export default function AktivitasLog() {
  const [search, setSearch] = useState("");
  const [filterAction, setFilterAction] = useState("all");
  const [filterModule, setFilterModule] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [autoDeleted, setAutoDeleted] = useState(0);
  const PAGE_SIZE = 50;

  const { user } = useAuth();
  const uid = user?.id;
  const qc = useQueryClient();
  
  const { data: logs = [], isLoading, refetch, isFetching } = useQuery({
    queryKey: ["activity-logs", uid],
    queryFn: () => uid ? ActivityLog.list() : [],
    enabled: !!uid
  });

  // Auto-delete logs older than 30 days
  useEffect(() => {
    if (!logs.length) return;
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const old = logs.filter(l => new Date(l.created_date) < thirtyDaysAgo);
    if (old.length === 0) return;
    Promise.all(old.map(l => ActivityLog.delete(l.id))).then(() => {
      setAutoDeleted(old.length);
      qc.invalidateQueries({ queryKey: ["activity-logs"] });
    });
  }, [logs.length]);

  // Export logs to CSV
  const handleExportCSV = () => {
    const headers = ["Waktu", "Aksi", "Modul", "Deskripsi", "IP", "Status"];
    const rows = logs.map(l => [
      l.created_date, l.action, l.module, `"${(l.description || '').replace(/"/g, '""')}"`,
      l.ip_address || '', l.status || 'success'
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `log-aktivitas-${new Date().toISOString().slice(0,10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  const filtered = useMemo(() => {
    return logs.filter(log => {
      const matchSearch = !search || 
        log.description?.toLowerCase().includes(search.toLowerCase()) || 
        log.ip_address?.includes(search) ||
        log.module?.toLowerCase().includes(search.toLowerCase()) ||
        log.entity_name?.toLowerCase().includes(search.toLowerCase());
      const matchAction = filterAction === "all" || log.action === filterAction;
      const matchModule = filterModule === "all" || log.module === filterModule;
      const matchStatus = filterStatus === "all" || log.status === filterStatus;
      return matchSearch && matchAction && matchModule && matchStatus;
    });
  }, [logs, search, filterAction, filterModule, filterStatus]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const modules = useMemo(() => [...new Set(logs.map(l => l.module).filter(Boolean))].sort(), [logs]);

  const stats = useMemo(() => {
    const todayLogs = logs.filter(l => isToday(new Date(l.created_date)));
    const actionCounts = {};
    logs.forEach(l => { actionCounts[l.action] = (actionCounts[l.action] || 0) + 1; });
    return {
      total: logs.length,
      today: todayLogs.length,
      failed: logs.filter(l => l.status === "failed").length,
      logins: logs.filter(l => l.action === "login").length,
      creates: logs.filter(l => l.action === "create").length,
      updates: logs.filter(l => l.action === "update").length,
      deletes: logs.filter(l => l.action === "delete").length,
    };
  }, [logs]);

  return (
    <div className="space-y-5">
      {/* Marquee Banner */}
      <MarqueeBanner />

      {/* Auto-delete notice */}
      {autoDeleted > 0 && (
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
          <Trash2 className="w-4 h-4 shrink-0" />
          {autoDeleted} log berusia &gt;30 hari telah otomatis dihapus.
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #0D4F6D, #10B981)' }}>
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-heading font-bold text-foreground">Log Aktivitas</h1>
            <p className="text-xs text-muted-foreground">Rekam jejak lengkap · Auto-hapus setelah 30 hari</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExportCSV} className="gap-2 border-amber-300 text-amber-700 hover:bg-amber-50">
            <FileDown className="w-3.5 h-3.5" />
            Simpan CSV
          </Button>
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching} className="gap-2">
            <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {[
          { label: "Total", value: stats.total, color: "bg-blue-50 border-blue-200 text-blue-700", icon: Activity },
          { label: "Hari Ini", value: stats.today, color: "bg-emerald-50 border-emerald-200 text-emerald-700", icon: Clock },
          { label: "Login", value: stats.logins, color: "bg-green-50 border-green-200 text-green-700", icon: LogIn },
          { label: "Tambah", value: stats.creates, color: "bg-blue-50 border-blue-200 text-blue-600", icon: Plus },
          { label: "Ubah", value: stats.updates, color: "bg-amber-50 border-amber-200 text-amber-700", icon: Pencil },
          { label: "Hapus", value: stats.deletes, color: "bg-orange-50 border-orange-200 text-orange-700", icon: Trash2 },
          { label: "Gagal", value: stats.failed, color: "bg-red-50 border-red-200 text-red-700", icon: XCircle },
        ].map(s => {
          const SIcon = s.icon;
          return (
            <div key={s.label} className={`rounded-xl p-3 border ${s.color} flex items-center gap-2`}>
              <SIcon className="w-4 h-4 shrink-0 opacity-70" />
              <div>
                <p className="text-lg font-bold leading-none">{s.value}</p>
                <p className="text-[10px] opacity-70 mt-0.5">{s.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center p-3 bg-card rounded-xl border border-border">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Cari deskripsi, modul, IP..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="pl-9 h-8 text-xs" />
        </div>
        <select value={filterAction} onChange={e => { setFilterAction(e.target.value); setPage(1); }}
          className="h-8 px-2.5 rounded-lg border border-input bg-background text-xs focus:outline-none focus:ring-1 focus:ring-ring">
          <option value="all">Semua Aksi</option>
          {Object.entries(ACTION_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <select value={filterModule} onChange={e => { setFilterModule(e.target.value); setPage(1); }}
          className="h-8 px-2.5 rounded-lg border border-input bg-background text-xs focus:outline-none focus:ring-1 focus:ring-ring">
          <option value="all">Semua Modul</option>
          {modules.map(m => <option key={m} value={m} className="capitalize">{m}</option>)}
        </select>
        <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1); }}
          className="h-8 px-2.5 rounded-lg border border-input bg-background text-xs focus:outline-none focus:ring-1 focus:ring-ring">
          <option value="all">Semua Status</option>
          <option value="success">Sukses</option>
          <option value="failed">Gagal</option>
          <option value="warning">Peringatan</option>
        </select>
        <span className="text-xs text-muted-foreground ml-1">{filtered.length} dari {logs.length} log</span>
      </div>

      {/* Table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="flex items-center justify-center py-16 gap-3">
            <RefreshCw className="w-5 h-5 animate-spin text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Memuat log...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Shield className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p className="text-sm font-medium">Tidak ada log ditemukan</p>
            {search && <p className="text-xs mt-1 opacity-60">Coba ubah filter atau kata kunci pencarian</p>}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-muted/50 border-b border-border">
                    {["#", "Waktu", "Aksi", "Modul", "Deskripsi", "IP Address", "Status", ""].map(h => (
                      <th key={h} className="px-3 py-3 text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((log, i) => <LogRow key={log.id} log={log} index={(page - 1) * PAGE_SIZE + i} />)}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/20">
                <span className="text-xs text-muted-foreground">Halaman {page} dari {totalPages} · {filtered.length} total log</span>
                <div className="flex gap-1">
                  <Button variant="outline" size="sm" className="h-7 text-xs" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>← Prev</Button>
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    const p = page <= 3 ? i + 1 : page - 2 + i;
                    if (p < 1 || p > totalPages) return null;
                    return (
                      <Button key={p} variant={page === p ? 'default' : 'outline'} size="sm" className={`h-7 w-7 text-xs p-0 ${page === p ? 'bg-[#0D4F6D]' : ''}`} onClick={() => setPage(p)}>{p}</Button>
                    );
                  })}
                  <Button variant="outline" size="sm" className="h-7 text-xs" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next →</Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}