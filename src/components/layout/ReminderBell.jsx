import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Bell, Clock, X, Sparkles, PieChart } from 'lucide-react';
import { AppNotification, Debt, Receivable } from '@/api/entities';
import { useAuth } from '@/lib/AuthContext';
import useBudgetAlerts from '@/components/budget/useBudgetAlerts';
import { formatCurrency, formatDate } from '@/lib/utils/finance';

const withinWeek = (item, statusDone) => {
  if (!item.due_date || item.status === statusDone) return false;
  const due = new Date(item.due_date);
  const now = new Date();
  return due >= new Date(now.toDateString()) && due <= new Date(now.getTime() + 7 * 86400000);
};

const READ_KEY = 'moneyt_read_notifications';
const loadRead = () => {
  try { return JSON.parse(localStorage.getItem(READ_KEY) || '[]'); } catch { return []; }
};

export default function ReminderBell() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [readIds, setReadIds] = useState(loadRead);

  const { data: allNotifs = [] } = useQuery({
    queryKey: ['app_notifications'],
    queryFn: () => $entity.list('-created_date', 30),
    enabled: !!user?.id,
  });

  const myEmail = (user?.email || '').toLowerCase();
  const notifications = allNotifs.filter(n => !n.target_email || n.target_email.toLowerCase() === myEmail);
  const unreadNotifs = notifications.filter(n => !readIds.includes(n.id));

  // Tandai semua terbaca saat panel dibuka
  useEffect(() => {
    if (!open || !notifications.length) return;
    const ids = Array.from(new Set([...readIds, ...notifications.map(n => n.id)]));
    setReadIds(ids);
    try { localStorage.setItem(READ_KEY, JSON.stringify(ids.slice(-200))); } catch { /* noop */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, allNotifs.length]);

  const { data: debts = [] } = useQuery({ queryKey: ['debts'], queryFn: () => Debt.list(), enabled: !!user?.id });
  const { data: receivables = [] } = useQuery({ queryKey: ['receivables'], queryFn: () => Receivable.list(), enabled: !!user?.id });

  const items = [
    ...debts.filter(d => withinWeek(d, 'paid')).map(d => ({ ...d, kind: 'Hutang', to: '/hutang' })),
    ...receivables.filter(r => withinWeek(r, 'completed')).map(r => ({ ...r, kind: 'Piutang', to: '/piutang' })),
  ].sort((a, b) => new Date(a.due_date) - new Date(b.due_date));

  const budgetAlerts = useBudgetAlerts();

  const badgeCount = items.length + unreadNotifs.length + budgetAlerts.length;

  return (
    <div className="relative shrink-0">
      <button
        onClick={() => setOpen(v => !v)}
        aria-label={`Notifikasi${badgeCount ? `: ${badgeCount} item` : ''}`}
        className="w-9 h-9 flex items-center justify-center rounded-xl bg-sidebar-accent hover:bg-sidebar-accent/80 text-sidebar-foreground hover:text-sidebar-primary transition-colors relative"
      >
        <Bell size={15} className={badgeCount ? 'text-amber-400' : ''} />
        {badgeCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[17px] h-[17px] px-1 rounded-full bg-amber-500 text-white text-[10px] font-bold flex items-center justify-center border-2 border-sidebar">
            {badgeCount > 9 ? '9+' : badgeCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <button aria-label="Tutup reminder" onClick={() => setOpen(false)} className="fixed inset-0 z-40 cursor-default" />
          <div role="dialog" aria-label="Reminder jatuh tempo" className="absolute right-0 top-11 z-50 w-[300px] max-w-[calc(100vw-2rem)] rounded-2xl border border-border bg-card text-card-foreground shadow-xl overflow-hidden animate-fade-scale">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
              <Bell size={14} className="text-amber-500" />
              <p className="text-xs font-bold uppercase tracking-widest flex-1">Notifikasi</p>
              <button onClick={() => setOpen(false)} aria-label="Tutup" className="text-muted-foreground hover:text-foreground"><X size={14} /></button>
            </div>
            <div className="max-h-[340px] overflow-y-auto divide-y divide-border">
              {notifications.map(n => (
                <div key={n.id} className="flex items-start gap-2.5 px-4 py-3">
                  <Sparkles size={13} className="text-primary mt-0.5 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold">{n.title}</p>
                    {n.message && <p className="text-[10px] text-muted-foreground mt-0.5">{n.message}</p>}
                    <p className="text-[9px] text-muted-foreground/70 mt-0.5">{formatDate(n.created_date)}</p>
                  </div>
                  {!readIds.includes(n.id) && <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />}
                </div>
              ))}
              {budgetAlerts.map(b => (
                <Link key={`budget-${b.name}`} to="/budget" onClick={() => setOpen(false)} className="flex items-start gap-2.5 px-4 py-3 hover:bg-muted/50 transition-colors">
                  <PieChart size={13} className={`mt-0.5 shrink-0 ${b.pct >= 100 ? 'text-red-500' : 'text-orange-500'}`} />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold truncate">{b.name}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      Anggaran {b.pct >= 100 ? 'terlampaui' : 'hampir habis'} · {formatCurrency(b.actual)} / {formatCurrency(b.budget)}
                    </p>
                  </div>
                  <span className={`text-xs font-bold shrink-0 ${b.pct >= 100 ? 'text-red-600' : 'text-orange-600'}`}>{b.pct.toFixed(0)}%</span>
                </Link>
              ))}
              {items.length === 0 && notifications.length === 0 && budgetAlerts.length === 0 ? (
                <p className="px-4 py-8 text-center text-xs text-muted-foreground">Belum ada notifikasi.</p>
              ) : items.map(item => (
                <Link key={`${item.kind}-${item.id}`} to={item.to} onClick={() => setOpen(false)} className="flex items-start gap-2.5 px-4 py-3 hover:bg-muted/50 transition-colors">
                  <Clock size={13} className="text-amber-500 mt-0.5 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold truncate">{item.creditor_name || item.debtor_name || item.kind}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{item.kind} · {formatDate(item.due_date)}</p>
                  </div>
                  <span className="text-xs font-bold text-amber-600 shrink-0">{formatCurrency(item.remaining_amount || item.total_amount)}</span>
                </Link>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}