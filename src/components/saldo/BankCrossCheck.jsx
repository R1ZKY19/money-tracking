import { useState, useMemo, useRef, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { BalanceReconciliation } from '@/api/entities';
import { useAuth } from '@/lib/AuthContext';
import { ScanSearch, AlertTriangle, FileDown, FileText, Printer, Search, X, Settings2, Loader2 } from 'lucide-react';
import SectionCard from '@/components/ui/SectionCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import CrossCheckSummaryCards from '@/components/saldo/CrossCheckSummaryCards';
import CrossCheckTable from '@/components/saldo/CrossCheckTable';
import CrossCheckResultDetail from '@/components/saldo/CrossCheckResultDetail';
import CrossCheckDetailPanel from '@/components/saldo/CrossCheckDetailPanel';
import { exportCrossCheckCSV, exportCrossCheckPDF, printCrossCheckTable } from '@/lib/crossCheckExport';
import { formatCurrency } from '@/lib/utils/finance';

const DEFAULT_TOLERANCE = 50000;
const DEFAULT_WARNING_THRESHOLD = 1000000;

function getDeviceInfo() {
  const ua = navigator.userAgent || '';
  const type = /Mobile|Android|iPhone|iPad/i.test(ua) ? 'Mobile' : 'Desktop';
  const browser = /Edg\//i.test(ua) ? 'Edge' : /Chrome\//i.test(ua) ? 'Chrome' : /Firefox\//i.test(ua) ? 'Firefox' : /Safari\//i.test(ua) ? 'Safari' : 'Browser Lain';
  return `${type} · ${browser}`;
}

export default function BankCrossCheck({ accounts }) {
  const qc = useQueryClient();
  const { user } = useAuth();
  const uid = user?.id;

  const [tolerance, setTolerance] = useState(() => Number(localStorage.getItem('cc_tolerance')) || DEFAULT_TOLERANCE);
  const [warningThreshold, setWarningThreshold] = useState(() => Number(localStorage.getItem('cc_warning_threshold')) || DEFAULT_WARNING_THRESHOLD);
  const [showSettings, setShowSettings] = useState(false);

  const [inputValues, setInputValues] = useState({}); // { accountId: rawDigitsString }
  const [selectedRow, setSelectedRow] = useState(null);
  const [warning, setWarning] = useState(null); // { name, diff, currency }

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [checkedFilter, setCheckedFilter] = useState('all');
  const [staffFilter, setStaffFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');

  const [isCheckingAll, setIsCheckingAll] = useState(false);
  const [checkResults, setCheckResults] = useState(null);
  const ipRef = useRef(null);
  const warnedRef = useRef(new Set());

  const { data: history = [] } = useQuery({
    queryKey: ['balance_reconciliation', uid],
    queryFn: () => uid ? BalanceReconciliation.list() : [],
    enabled: !!uid,
  });

  useEffect(() => {
    localStorage.setItem('cc_tolerance', String(tolerance));
  }, [tolerance]);
  useEffect(() => {
    localStorage.setItem('cc_warning_threshold', String(warningThreshold));
  }, [warningThreshold]);

  const getIp = async () => {
    if (ipRef.current) return ipRef.current;
    try {
      const res = await fetch('https://api.ipify.org?format=json');
      const data = await res.json();
      ipRef.current = data.ip || 'unknown';
    } catch {
      ipRef.current = 'unknown';
    }
    return ipRef.current;
  };

  const persistCheck = async (account, actualBalance) => {
    const systemBalance = account.current_balance || 0;
    const diff = actualBalance - systemBalance;
    const status = diff === 0 ? 'sesuai' : diff > 0 ? 'surplus' : 'minus';
    const ip = await getIp();
    await BalanceReconciliation.create({
      account_id: account.id,
      account_name: account.name,
      balance_before: systemBalance,
      balance_after: actualBalance,
      difference: diff,
      currency: account.currency,
      status,
      admin_name: user?.full_name || user?.email || '—',
      ip_address: ip,
      device: getDeviceInfo(),
    });
    qc.invalidateQueries({ queryKey: ['balance_reconciliation', uid] });

    if (Math.abs(diff) > warningThreshold && !warnedRef.current.has(account.id + '_' + actualBalance)) {
      warnedRef.current.add(account.id + '_' + actualBalance);
      setWarning({ name: account.name, diff, currency: account.currency });
    }
  };

  const handleInputChange = (accountId, rawDigits) => {
    setInputValues(prev => ({ ...prev, [accountId]: rawDigits }));
  };

  const handleCheckAll = async () => {
    const toCheck = rows.filter(r => inputValues[r.account.id] !== undefined);
    if (toCheck.length === 0) return;
    setIsCheckingAll(true);
    for (const r of toCheck) {
      const actual = parseInt(inputValues[r.account.id] || '0', 10) || 0;
      await persistCheck(r.account, actual);
    }
    setCheckResults(toCheck);
    setIsCheckingAll(false);
  };

  const rows = useMemo(() => {
    const today = new Date().toDateString();
    return accounts.filter(a => a.is_active !== false).map(account => {
      const accountHistory = history.filter(h => h.account_id === account.id);
      const latest = accountHistory[0];
      const systemBalance = account.current_balance || 0;

      let actualBalance;
      if (inputValues[account.id] !== undefined) {
        actualBalance = parseInt(inputValues[account.id] || '0', 10) || 0;
      } else if (latest) {
        actualBalance = latest.balance_after;
      }
      const hasActual = actualBalance !== undefined;
      const diff = hasActual ? actualBalance - systemBalance : 0;

      let statusLabel, statusColor;
      if (!hasActual) { statusLabel = 'Belum Dicek'; statusColor = '#94A3B8'; }
      else if (diff === 0) { statusLabel = 'Sesuai'; statusColor = '#10B981'; }
      else if (Math.abs(diff) <= tolerance) { statusLabel = diff > 0 ? 'Selisih Sedikit (Plus)' : 'Selisih Sedikit (Minus)'; statusColor = '#F59E0B'; }
      else { statusLabel = diff > 0 ? 'Selisih Banyak (Plus)' : 'Selisih Banyak (Minus)'; statusColor = '#EF4444'; }

      const lastCheckDate = latest ? new Date(latest.created_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : null;
      const lastCheckTime = latest ? new Date(latest.created_date).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : null;
      const lastStaff = latest?.admin_name || null;
      const checkedToday = latest ? new Date(latest.created_date).toDateString() === today : false;

      return { account, systemBalance, actualBalance, hasActual, diff, statusLabel, statusColor, lastCheckDate, lastCheckTime, lastStaff, checkedToday, latest };
    });
  }, [accounts, inputValues, history, tolerance]);

  const staffOptions = useMemo(() => {
    const set = new Set(history.map(h => h.admin_name).filter(Boolean));
    return Array.from(set);
  }, [history]);

  const filteredRows = useMemo(() => {
    return rows.filter(r => {
      if (search && !r.account.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (statusFilter !== 'all') {
        if (statusFilter === 'sesuai' && !(r.hasActual && r.diff === 0)) return false;
        if (statusFilter === 'surplus' && !(r.hasActual && r.diff > 0)) return false;
        if (statusFilter === 'minus' && !(r.hasActual && r.diff < 0)) return false;
      }
      if (checkedFilter === 'checked' && !r.checkedToday) return false;
      if (checkedFilter === 'unchecked' && r.checkedToday) return false;
      if (staffFilter !== 'all' && r.lastStaff !== staffFilter) return false;
      if (dateFilter && r.lastCheckDate !== new Date(dateFilter).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })) return false;
      return true;
    });
  }, [rows, search, statusFilter, checkedFilter, staffFilter, dateFilter]);

  const summary = useMemo(() => {
    const totalAccounts = rows.length;
    const checkedCount = rows.filter(r => r.checkedToday).length;
    const totalSystem = rows.reduce((s, r) => s + r.systemBalance, 0);
    const totalActual = rows.reduce((s, r) => s + (r.hasActual ? r.actualBalance : r.systemBalance), 0);
    return {
      totalAccounts,
      checkedCount,
      uncheckedCount: totalAccounts - checkedCount,
      totalSystem,
      totalActual,
      totalDiff: totalActual - totalSystem,
      surplusCount: rows.filter(r => r.hasActual && r.diff > 0).length,
      minusCount: rows.filter(r => r.hasActual && r.diff < 0).length,
      matchCount: rows.filter(r => r.hasActual && r.diff === 0).length,
    };
  }, [rows]);

  const clearFilters = () => { setSearch(''); setStatusFilter('all'); setCheckedFilter('all'); setStaffFilter('all'); setDateFilter(''); };
  const hasActiveFilters = search || statusFilter !== 'all' || checkedFilter !== 'all' || staffFilter !== 'all' || dateFilter;

  return (
    <SectionCard
      title={
        <div className="flex items-center gap-2">
          <ScanSearch className="w-4 h-4 text-primary" />
          Cross Check Saldo Bank
        </div>
      }
      subtitle="Rekonsiliasi saldo sistem vs saldo aktual bank secara real-time"
      action={
        <div className="flex items-center gap-1.5 flex-wrap w-full sm:w-auto">
          <Button size="sm" className="h-8 text-xs bg-primary hover:bg-primary/90 flex-1 sm:flex-none min-w-[110px]" onClick={handleCheckAll} disabled={isCheckingAll}>
            {isCheckingAll ? <Loader2 size={13} className="mr-1 animate-spin" /> : <ScanSearch size={13} className="mr-1" />}
            Cek Semua
          </Button>
          <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => setShowSettings(true)}>
            <Settings2 size={13} className="sm:mr-1" /> <span className="hidden sm:inline">Toleransi</span>
          </Button>
          <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => exportCrossCheckCSV(filteredRows)}>
            <FileDown size={13} className="sm:mr-1" /> <span className="hidden sm:inline">Excel</span>
          </Button>
          <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => exportCrossCheckPDF(filteredRows)}>
            <FileText size={13} className="sm:mr-1" /> <span className="hidden sm:inline">PDF</span>
          </Button>
          <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => printCrossCheckTable(filteredRows)}>
            <Printer size={13} className="sm:mr-1" /> <span className="hidden sm:inline">Print</span>
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <CrossCheckSummaryCards summary={summary} />

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[180px]">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Cari nama bank..." value={search} onChange={e => setSearch(e.target.value)} className="pl-8 h-9 text-xs" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-9 text-xs w-[calc(50%-0.25rem)] sm:w-36"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Status</SelectItem>
              <SelectItem value="sesuai">Sesuai</SelectItem>
              <SelectItem value="surplus">Surplus</SelectItem>
              <SelectItem value="minus">Minus</SelectItem>
            </SelectContent>
          </Select>
          <Select value={checkedFilter} onValueChange={setCheckedFilter}>
            <SelectTrigger className="h-9 text-xs w-[calc(50%-0.25rem)] sm:w-36"><SelectValue placeholder="Status Cek" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua</SelectItem>
              <SelectItem value="checked">Sudah Dicek</SelectItem>
              <SelectItem value="unchecked">Belum Dicek</SelectItem>
            </SelectContent>
          </Select>
          <Select value={staffFilter} onValueChange={setStaffFilter}>
            <SelectTrigger className="h-9 text-xs w-[calc(50%-0.25rem)] sm:w-36"><SelectValue placeholder="Staff" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Staff</SelectItem>
              {staffOptions.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
          <Input type="date" value={dateFilter} onChange={e => setDateFilter(e.target.value)} className="h-9 text-xs w-[calc(50%-0.25rem)] sm:w-40" />
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" className="h-9 text-xs text-muted-foreground" onClick={clearFilters}>
              <X size={12} className="mr-1" /> Reset
            </Button>
          )}
        </div>

        <CrossCheckTable
          rows={filteredRows}
          inputValues={inputValues}
          onInputChange={handleInputChange}
          onRowClick={setSelectedRow}
        />

        {checkResults && (
          <CrossCheckResultDetail results={checkResults} onClose={() => setCheckResults(null)} />
        )}
      </div>

      {/* Detail Panel */}
      <CrossCheckDetailPanel
        row={selectedRow}
        history={history}
        open={!!selectedRow}
        onClose={() => setSelectedRow(null)}
      />

      {/* Big discrepancy warning */}
      <Dialog open={!!warning} onOpenChange={v => !v && setWarning(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-600">
              <AlertTriangle size={18} /> Perhatian!
            </DialogTitle>
          </DialogHeader>
          {warning && (
            <div className="space-y-3">
              <p className="text-sm text-foreground">
                Saldo Bank <strong>{warning.name}</strong> memiliki selisih{' '}
                <strong className={warning.diff > 0 ? 'text-amber-600' : 'text-red-500'}>
                  {warning.diff > 0 ? '+' : ''}{formatCurrency(warning.diff, warning.currency)}
                </strong>.
              </p>
              <p className="text-xs text-muted-foreground">Mohon lakukan pengecekan ulang sebelum melanjutkan.</p>
              <div className="flex justify-end pt-1">
                <Button onClick={() => setWarning(null)} className="bg-primary hover:bg-primary/90">Mengerti</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Tolerance settings */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Pengaturan Toleransi Selisih</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Batas Toleransi (Selisih Kecil / Kuning)</label>
              <Input type="number" value={tolerance} onChange={e => setTolerance(Number(e.target.value) || 0)} />
              <p className="text-[11px] text-muted-foreground">Selisih ≤ nilai ini akan ditandai kuning, bukan merah.</p>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Batas Notifikasi Peringatan</label>
              <Input type="number" value={warningThreshold} onChange={e => setWarningThreshold(Number(e.target.value) || 0)} />
              <p className="text-[11px] text-muted-foreground">Popup peringatan muncul jika selisih melebihi nilai ini.</p>
            </div>
            <div className="flex justify-end pt-1">
              <Button onClick={() => setShowSettings(false)} className="bg-primary hover:bg-primary/90">Selesai</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </SectionCard>
  );
}