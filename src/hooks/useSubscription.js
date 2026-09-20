import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/api/supabaseClient';

const TABLE_MAP = {
  Transaction: 'transactions',
  Account: 'accounts',
  Category: 'categories',
  BudgetPlan: 'budget_plans',
  SavingTarget: 'saving_targets',
  Debt: 'debts',
  DebtPayment: 'debt_payments',
  Receivable: 'receivables',
  ReceivablePayment: 'receivable_payments',
  RecurringTransaction: 'recurring_transactions',
  ActivityLog: 'activity_logs',
  AppNotification: 'app_notifications',
};

export default function useSubscription(entityName, callback) {
  const qc = useQueryClient();
  const table = TABLE_MAP[entityName] || (entityName ? entityName.toLowerCase() + 's' : 'transactions');

  useEffect(() => {
    const ch = supabase.channel('sub-' + table + '-' + Date.now())
      .on('postgres_changes', { event: '*', schema: 'public', table }, (payload) => {
        qc.invalidateQueries({ queryKey: [table] });
        if (callback) callback(payload);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(ch);
    };
  }, [table, qc, callback]);
}