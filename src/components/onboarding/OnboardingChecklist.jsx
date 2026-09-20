import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle2, Circle, X, Rocket } from 'lucide-react';
import { Account, BudgetPlan, Transaction } from '@/api/entities';
import { useAuth } from '@/lib/AuthContext';

const KEY = 'moneyt_onboarding_dismissed';

export default function OnboardingChecklist() {
  const { user } = useAuth();
  const uid = user?.id;
  const [hidden, setHidden] = useState(() => localStorage.getItem(KEY) === '1');

  const { data: counts } = useQuery({
    queryKey: ['onboarding-counts', uid],
    enabled: !!uid && !hidden,
    staleTime: 60000,
    queryFn: async () => {
      const [accounts, txns, budgets] = await Promise.all([
        Account.list(),
        Transaction.list(),
        BudgetPlan.list(),
      ]);
      return { accounts: accounts.length, txns: txns.length, budgets: budgets.length };
    },
  });

  if (hidden || !counts) return null;

  const steps = [
    { done: counts.accounts > 0, label: 'Tambahkan rekening & saldo awal', to: '/saldo' },
    { done: counts.txns > 0, label: 'Catat transaksi pertama', to: '/transaksi' },
    { done: counts.budgets > 0, label: 'Susun anggaran bulan ini', to: '/budget' },
  ];

  if (steps.every(s => s.done)) return null;

  const dismiss = () => {
    localStorage.setItem(KEY, '1');
    setHidden(true);
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-sm animate-fade-up">
      <div className="flex items-center gap-2 mb-3">
        <Rocket size={15} className="text-primary" />
        <p className="text-xs font-bold uppercase tracking-widest flex-1">Langkah Awal</p>
        <button onClick={dismiss} aria-label="Sembunyikan panduan awal" className="text-muted-foreground hover:text-foreground">
          <X size={14} />
        </button>
      </div>
      <div className="grid gap-2 sm:grid-cols-3">
        {steps.map(s => (
          <Link
            key={s.label}
            to={s.to}
            className="flex items-center gap-2 rounded-xl border border-border px-3 py-2.5 hover:bg-muted/50 transition-colors"
          >
            {s.done
              ? <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
              : <Circle size={16} className="text-muted-foreground shrink-0" />}
            <span className={`text-xs ${s.done ? 'text-muted-foreground line-through' : 'font-semibold'}`}>{s.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}