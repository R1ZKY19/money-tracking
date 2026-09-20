import { supabase } from '../supabaseClient';

// Helper: get current user id
async function getCurrentUserId() {
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id;
}

// Helper: apply Base44-style filters to a Supabase query
function applyFilters(query, filters = []) {
  for (const filter of filters) {
    const { field, operator, value } = filter;
    switch (operator) {
      case 'eq': query = query.eq(field, value); break;
      case 'ne': query = query.neq(field, value); break;
      case 'gt': query = query.gt(field, value); break;
      case 'gte': query = query.gte(field, value); break;
      case 'lt': query = query.lt(field, value); break;
      case 'lte': query = query.lte(field, value); break;
      case 'like': query = query.ilike(field, `%${value}%`); break;
      case 'in': query = query.in(field, value); break;
      case 'is': query = query.is(field, value); break;
      default: query = query.eq(field, value);
    }
  }
  return query;
}

// Factory: buat entity handler untuk setiap tabel
function createEntity(tableName, { userScoped = true, adminOnly = false } = {}) {
  return {
    async list({ filters = [], sort_by, sort_order = 'asc', limit, offset } = {}) {
      const userId = userScoped ? await getCurrentUserId() : null;
      let query = supabase.from(tableName).select('*');
      if (userScoped && userId) query = query.eq('user_id', userId);
      query = applyFilters(query, filters);
      if (sort_by) query = query.order(sort_by, { ascending: sort_order === 'asc' });
      if (limit) query = query.limit(limit);
      if (offset) query = query.range(offset, offset + (limit || 100) - 1);
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    async get(id) {
      const { data, error } = await supabase.from(tableName).select('*').eq('id', id).single();
      if (error) throw error;
      return data;
    },
    async create(payload) {
      const userId = userScoped ? await getCurrentUserId() : null;
      const insertData = { ...payload };
      if (userScoped && userId) insertData.user_id = userId;
      const { data, error } = await supabase.from(tableName).insert(insertData).select().single();
      if (error) throw error;
      return data;
    },
    async update(id, payload) {
      const { data, error } = await supabase.from(tableName).update(payload).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    async delete(id) {
      const { error } = await supabase.from(tableName).delete().eq('id', id);
      if (error) throw error;
      return { success: true };
    },
    async bulkCreate(items) {
      const userId = userScoped ? await getCurrentUserId() : null;
      const insertData = items.map(item => ({
        ...item,
        ...(userScoped && userId ? { user_id: userId } : {})
      }));
      const { data, error } = await supabase.from(tableName).insert(insertData).select();
      if (error) throw error;
      return data || [];
    },
  };
}

// Semua entity dengan mapping yang benar
export const Account = createEntity('accounts');
export const ActivityLog = createEntity('activity_logs', { userScoped: false });
export const AppNotification = createEntity('app_notifications');
export const ApprovedUser = createEntity('approved_users', { userScoped: false, adminOnly: true });
export const BalanceReconciliation = createEntity('balance_reconciliations');
export const BudgetPlan = createEntity('budget_plans');
export const Category = createEntity('categories');
export const ConsultationMessage = createEntity('consultation_messages', { userScoped: false });
export const ConsultationThread = createEntity('consultation_threads', { userScoped: false });
export const Currency = createEntity('currencies', { userScoped: false });
export const CurrencyRate = createEntity('currency_rates', { userScoped: false });
export const CurrencySetting = createEntity('currency_settings');
export const DataDeletionWarning = createEntity('data_deletion_warnings', { userScoped: false });
export const Debt = createEntity('debts');
export const DebtPayment = createEntity('debt_payments');
export const ExchangeRate = createEntity('exchange_rates', { userScoped: false });
export const ExpenseGoal = createEntity('expense_goals');
export const Feature = createEntity('features', { userScoped: false });
export const FeatureCategory = createEntity('feature_categories', { userScoped: false });
export const FeatureDocumentation = createEntity('feature_documentations', { userScoped: false });
export const FeatureTransaction = createEntity('feature_transactions');
export const LoginRequest = createEntity('login_requests', { userScoped: false });
export const PackageFeature = createEntity('package_features', { userScoped: false });
export const PaymentProof = createEntity('payment_proofs');
export const PaymentSetting = createEntity('payment_settings', { userScoped: false });
export const Permission = createEntity('permissions', { userScoped: false });
export const Receivable = createEntity('receivables');
export const ReceivablePayment = createEntity('receivable_payments');
export const RecurringTransaction = createEntity('recurring_transactions');
export const Role = createEntity('roles', { userScoped: false });
export const RolePermission = createEntity('role_permissions', { userScoped: false });
export const SavingTarget = createEntity('saving_targets');
export const SecurityThrottle = createEntity('security_throttles', { userScoped: false });
export const SubscriptionPackage = createEntity('subscription_packages', { userScoped: false });
export const Transaction = createEntity('transactions');
export const TransactionType = createEntity('transaction_types', { userScoped: false });
export const UsageSession = createEntity('usage_sessions', { userScoped: false });
export const UserFeature = createEntity('user_features', { userScoped: false });

// Profile adalah special (extends auth.users)
export const UserProfile = {
  async list({ filters = [] } = {}) {
    let query = supabase.from('profiles').select('*');
    query = applyFilters(query, filters);
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },
  async get(id) {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', id).single();
    if (error) throw error;
    return data;
  },
  async getMe() {
    const userId = await getCurrentUserId();
    if (!userId) return null;
    const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if (error) throw error;
    return data;
  },
  async update(id, payload) {
    const { data, error } = await supabase.from('profiles').update(payload).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },
  async updateMe(payload) {
    const userId = await getCurrentUserId();
    const { data, error } = await supabase.from('profiles').update(payload).eq('id', userId).select().single();
    if (error) throw error;
    return data;
  },
};

// Default export untuk compatibility
export default {
  Account, ActivityLog, AppNotification, ApprovedUser, BalanceReconciliation,
  BudgetPlan, Category, ConsultationMessage, ConsultationThread, Currency,
  CurrencyRate, CurrencySetting, DataDeletionWarning, Debt, DebtPayment,
  ExchangeRate, ExpenseGoal, Feature, FeatureCategory, FeatureDocumentation,
  FeatureTransaction, LoginRequest, PackageFeature, PaymentProof, PaymentSetting,
  Permission, Receivable, ReceivablePayment, RecurringTransaction, Role,
  RolePermission, SavingTarget, SecurityThrottle, SubscriptionPackage,
  Transaction, TransactionType, UsageSession, UserFeature, UserProfile,
};
