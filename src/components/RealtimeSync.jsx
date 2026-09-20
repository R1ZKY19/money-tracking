import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/api/supabaseClient';
import { useAuth } from '@/lib/AuthContext';

const WATCHED_TABLES = [
  'transactions', 'accounts', 'categories', 'budget_plans',
  'saving_targets', 'debts', 'debt_payments', 'receivables',
  'receivable_payments', 'recurring_transactions', 'app_notifications',
];

export default function RealtimeSync() {
  const qc = useQueryClient();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) return;
    const channels = WATCHED_TABLES.map(table =>
      supabase.channel('rt-' + table)
        .on('postgres_changes', { event: '*', schema: 'public', table }, () => {
          qc.invalidateQueries({ queryKey: [table] });
        })
        .subscribe()
    );
    return () => {
      channels.forEach(ch => supabase.removeChannel(ch));
    };
  }, [isAuthenticated, qc]);

  return null;
}