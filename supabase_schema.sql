-- ============================================================
-- MONEY-TRACKING: Supabase Schema
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor)
-- ============================================================

-- ─────────────────────────────────────────────
-- UTILITY: updated_at trigger function
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ─────────────────────────────────────────────
-- UTILITY: auto-create profile on signup
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ─────────────────────────────────────────────
-- HELPER MACRO: apply updated_at trigger
-- (called per table below)
-- ─────────────────────────────────────────────

-- ============================================================
-- TABLES
-- ============================================================

-- ── 1. subscription_packages (no FK dep)
CREATE TABLE IF NOT EXISTS public.subscription_packages (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  slug          TEXT UNIQUE NOT NULL,
  description   TEXT,
  price         NUMERIC DEFAULT 0,
  duration_days INT DEFAULT 30,
  is_active     BOOLEAN DEFAULT TRUE,
  is_system     BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);
CREATE TRIGGER trg_subscription_packages_updated_at
  BEFORE UPDATE ON public.subscription_packages
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ── 2. profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id                      UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email                   TEXT,
  full_name               TEXT,
  username                TEXT UNIQUE,
  role                    TEXT DEFAULT 'user',
  telegram_chat_id        TEXT,
  avatar_url              TEXT,
  subscription_package_id UUID REFERENCES public.subscription_packages(id) ON DELETE SET NULL,
  subscription_expires_at TIMESTAMPTZ,
  is_approved             BOOLEAN DEFAULT FALSE,
  created_at              TIMESTAMPTZ DEFAULT NOW(),
  updated_at              TIMESTAMPTZ DEFAULT NOW()
);
CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ── 3. approved_users
CREATE TABLE IF NOT EXISTS public.approved_users (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email       TEXT NOT NULL UNIQUE,
  approved_by TEXT,
  notes       TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── 4. accounts
CREATE TABLE IF NOT EXISTS public.accounts (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name           TEXT NOT NULL,
  type           TEXT,
  balance        NUMERIC DEFAULT 0,
  currency       TEXT DEFAULT 'IDR',
  description    TEXT,
  bank_name      TEXT,
  account_number TEXT,
  color          TEXT,
  icon           TEXT,
  is_active      BOOLEAN DEFAULT TRUE,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);
CREATE TRIGGER trg_accounts_updated_at
  BEFORE UPDATE ON public.accounts
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ── 5. categories
CREATE TABLE IF NOT EXISTS public.categories (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id   UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name      TEXT NOT NULL,
  type      TEXT,
  color     TEXT,
  icon      TEXT,
  is_system BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TRIGGER trg_categories_updated_at
  BEFORE UPDATE ON public.categories
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ── 6. transactions
CREATE TABLE IF NOT EXISTS public.transactions (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  date                     DATE,
  type                     TEXT,
  category_id              UUID,
  category_name            TEXT,
  account_id               UUID,
  account_name             TEXT,
  amount                   NUMERIC DEFAULT 0,
  currency                 TEXT DEFAULT 'IDR',
  description              TEXT,
  reference                TEXT,
  is_import                BOOLEAN DEFAULT FALSE,
  related_id               UUID,
  related_type             TEXT,
  creditor_name            TEXT,
  debtor_name              TEXT,
  due_date                 DATE,
  interest_rate            NUMERIC,
  destination_account_id   UUID,
  destination_account_name TEXT,
  operation_key            TEXT,
  transfer_pair_id         UUID,
  created_at               TIMESTAMPTZ DEFAULT NOW(),
  updated_at               TIMESTAMPTZ DEFAULT NOW()
);
CREATE TRIGGER trg_transactions_updated_at
  BEFORE UPDATE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ── 7. budget_plans
CREATE TABLE IF NOT EXISTS public.budget_plans (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  category_id   UUID,
  category_name TEXT,
  month         INT,
  year          INT,
  amount        NUMERIC DEFAULT 0,
  currency      TEXT DEFAULT 'IDR',
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);
CREATE TRIGGER trg_budget_plans_updated_at
  BEFORE UPDATE ON public.budget_plans
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ── 8. saving_targets
CREATE TABLE IF NOT EXISTS public.saving_targets (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name           TEXT NOT NULL,
  target_amount  NUMERIC DEFAULT 0,
  current_amount NUMERIC DEFAULT 0,
  currency       TEXT DEFAULT 'IDR',
  deadline       DATE,
  description    TEXT,
  color          TEXT,
  icon           TEXT,
  status         TEXT DEFAULT 'active',
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);
CREATE TRIGGER trg_saving_targets_updated_at
  BEFORE UPDATE ON public.saving_targets
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ── 9. debts
CREATE TABLE IF NOT EXISTS public.debts (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  creditor_name      TEXT,
  amount             NUMERIC DEFAULT 0,
  currency           TEXT DEFAULT 'IDR',
  due_date           DATE,
  interest_rate      NUMERIC,
  status             TEXT DEFAULT 'active',
  description        TEXT,
  related_account_id UUID,
  created_at         TIMESTAMPTZ DEFAULT NOW(),
  updated_at         TIMESTAMPTZ DEFAULT NOW()
);
CREATE TRIGGER trg_debts_updated_at
  BEFORE UPDATE ON public.debts
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ── 10. debt_payments
CREATE TABLE IF NOT EXISTS public.debt_payments (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  debt_id      UUID NOT NULL REFERENCES public.debts(id) ON DELETE CASCADE,
  amount       NUMERIC DEFAULT 0,
  payment_date DATE,
  notes        TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ── 11. receivables
CREATE TABLE IF NOT EXISTS public.receivables (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  debtor_name        TEXT,
  amount             NUMERIC DEFAULT 0,
  currency           TEXT DEFAULT 'IDR',
  due_date           DATE,
  interest_rate      NUMERIC,
  status             TEXT DEFAULT 'active',
  description        TEXT,
  related_account_id UUID,
  created_at         TIMESTAMPTZ DEFAULT NOW(),
  updated_at         TIMESTAMPTZ DEFAULT NOW()
);
CREATE TRIGGER trg_receivables_updated_at
  BEFORE UPDATE ON public.receivables
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ── 12. receivable_payments
CREATE TABLE IF NOT EXISTS public.receivable_payments (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  receivable_id  UUID NOT NULL REFERENCES public.receivables(id) ON DELETE CASCADE,
  amount         NUMERIC DEFAULT 0,
  payment_date   DATE,
  notes          TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ── 13. recurring_transactions
CREATE TABLE IF NOT EXISTS public.recurring_transactions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name             TEXT,
  type             TEXT,
  category_id      UUID,
  category_name    TEXT,
  account_id       UUID,
  account_name     TEXT,
  amount           NUMERIC DEFAULT 0,
  currency         TEXT DEFAULT 'IDR',
  frequency        TEXT,
  next_date        DATE,
  last_executed_at TIMESTAMPTZ,
  is_active        BOOLEAN DEFAULT TRUE,
  description      TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);
CREATE TRIGGER trg_recurring_transactions_updated_at
  BEFORE UPDATE ON public.recurring_transactions
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ── 14. activity_logs
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  entity_type TEXT,
  entity_id   UUID,
  action      TEXT,
  old_data    JSONB,
  new_data    JSONB,
  ip_address  TEXT,
  user_agent  TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── 15. app_notifications
CREATE TABLE IF NOT EXISTS public.app_notifications (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title      TEXT,
  message    TEXT,
  type       TEXT DEFAULT 'info',
  is_read    BOOLEAN DEFAULT FALSE,
  action_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── 16. consultation_threads
CREATE TABLE IF NOT EXISTS public.consultation_threads (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title           TEXT,
  status          TEXT DEFAULT 'open',
  last_message_at TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE TRIGGER trg_consultation_threads_updated_at
  BEFORE UPDATE ON public.consultation_threads
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ── 17. consultation_messages
CREATE TABLE IF NOT EXISTS public.consultation_messages (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL REFERENCES public.consultation_threads(id) ON DELETE CASCADE,
  user_id   UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  content   TEXT,
  role      TEXT DEFAULT 'user',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── 18. currency_settings
CREATE TABLE IF NOT EXISTS public.currency_settings (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  base_currency  TEXT DEFAULT 'IDR',
  display_format TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);
CREATE TRIGGER trg_currency_settings_updated_at
  BEFORE UPDATE ON public.currency_settings
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ── 19. exchange_rates
CREATE TABLE IF NOT EXISTS public.exchange_rates (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_currency TEXT NOT NULL,
  to_currency   TEXT NOT NULL,
  rate          NUMERIC NOT NULL,
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ── 20. expense_goals
CREATE TABLE IF NOT EXISTS public.expense_goals (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name           TEXT,
  category_id    UUID,
  category_name  TEXT,
  target_amount  NUMERIC DEFAULT 0,
  current_amount NUMERIC DEFAULT 0,
  period_type    TEXT,
  start_date     DATE,
  end_date       DATE,
  currency       TEXT DEFAULT 'IDR',
  status         TEXT DEFAULT 'active',
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);
CREATE TRIGGER trg_expense_goals_updated_at
  BEFORE UPDATE ON public.expense_goals
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ── 21. balance_reconciliations
CREATE TABLE IF NOT EXISTS public.balance_reconciliations (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  account_id     UUID,
  actual_balance NUMERIC DEFAULT 0,
  system_balance NUMERIC DEFAULT 0,
  difference     NUMERIC DEFAULT 0,
  notes          TEXT,
  reconciled_at  TIMESTAMPTZ,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ── 22. features
CREATE TABLE IF NOT EXISTS public.features (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  slug        TEXT UNIQUE NOT NULL,
  description TEXT,
  category_id UUID,
  is_active   BOOLEAN DEFAULT TRUE,
  is_system   BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE TRIGGER trg_features_updated_at
  BEFORE UPDATE ON public.features
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ── 23. feature_categories
CREATE TABLE IF NOT EXISTS public.feature_categories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  slug        TEXT UNIQUE NOT NULL,
  description TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── 24. package_features
CREATE TABLE IF NOT EXISTS public.package_features (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id UUID NOT NULL REFERENCES public.subscription_packages(id) ON DELETE CASCADE,
  feature_id UUID NOT NULL REFERENCES public.features(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── 25. user_features
CREATE TABLE IF NOT EXISTS public.user_features (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  feature_id     UUID,
  feature_slug   TEXT,
  is_purchased   BOOLEAN DEFAULT FALSE,
  purchased_date DATE,
  expires_date   TIMESTAMPTZ,
  transaction_id TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ── 26. payment_proofs
CREATE TABLE IF NOT EXISTS public.payment_proofs (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  package_id     UUID,
  amount         NUMERIC DEFAULT 0,
  payment_date   DATE,
  proof_image_url TEXT,
  status         TEXT DEFAULT 'pending',
  notes          TEXT,
  reviewed_by    UUID,
  reviewed_at    TIMESTAMPTZ,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ── 27. payment_settings
CREATE TABLE IF NOT EXISTS public.payment_settings (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bank_name      TEXT,
  account_number TEXT,
  account_name   TEXT,
  qr_image_url   TEXT,
  notes          TEXT,
  is_active      BOOLEAN DEFAULT TRUE,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);
CREATE TRIGGER trg_payment_settings_updated_at
  BEFORE UPDATE ON public.payment_settings
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ── 28. login_requests
CREATE TABLE IF NOT EXISTS public.login_requests (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  email        TEXT,
  status       TEXT DEFAULT 'pending',
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  responded_at TIMESTAMPTZ,
  notes        TEXT
);

-- ── 29. usage_sessions
CREATE TABLE IF NOT EXISTS public.usage_sessions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_key      TEXT UNIQUE,
  user_id          UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  user_email       TEXT,
  started_at       TIMESTAMPTZ DEFAULT NOW(),
  last_seen        TIMESTAMPTZ DEFAULT NOW(),
  duration_seconds INT DEFAULT 0,
  is_active        BOOLEAN DEFAULT TRUE,
  revoked          BOOLEAN DEFAULT FALSE,
  ended_reason     TEXT,
  page_path        TEXT,
  user_agent       TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ── 30. security_throttles
CREATE TABLE IF NOT EXISTS public.security_throttles (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID,
  action       TEXT,
  window_start TIMESTAMPTZ DEFAULT NOW(),
  count        INT DEFAULT 1,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ── 31. roles
CREATE TABLE IF NOT EXISTS public.roles (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  slug        TEXT UNIQUE NOT NULL,
  description TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── 32. permissions
CREATE TABLE IF NOT EXISTS public.permissions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  slug        TEXT UNIQUE NOT NULL,
  description TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── 33. role_permissions
CREATE TABLE IF NOT EXISTS public.role_permissions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id       UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ── 34. data_deletion_warnings
CREATE TABLE IF NOT EXISTS public.data_deletion_warnings (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  warning_type TEXT,
  message      TEXT,
  scheduled_for TIMESTAMPTZ,
  is_dismissed BOOLEAN DEFAULT FALSE,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ── 35. transaction_types
CREATE TABLE IF NOT EXISTS public.transaction_types (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL,
  code       TEXT UNIQUE,
  color      TEXT DEFAULT '#0D4F6D',
  icon       TEXT DEFAULT 'Tag',
  is_active  BOOLEAN DEFAULT TRUE,
  is_system  BOOLEAN DEFAULT FALSE,
  user_id    UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TRIGGER trg_transaction_types_updated_at
  BEFORE UPDATE ON public.transaction_types
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ── 36. feature_documentations
CREATE TABLE IF NOT EXISTS public.feature_documentations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_id  UUID NOT NULL REFERENCES public.features(id) ON DELETE CASCADE,
  title       TEXT,
  content     TEXT,
  order_index INT DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE TRIGGER trg_feature_documentations_updated_at
  BEFORE UPDATE ON public.feature_documentations
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ── 37. feature_transactions
CREATE TABLE IF NOT EXISTS public.feature_transactions (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  feature_id UUID,
  action     TEXT,
  metadata   JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── 38. currencies
CREATE TABLE IF NOT EXISTS public.currencies (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code      TEXT UNIQUE NOT NULL,
  name      TEXT,
  symbol    TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── 39. currency_rates
CREATE TABLE IF NOT EXISTS public.currency_rates (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  base_currency   TEXT NOT NULL,
  target_currency TEXT NOT NULL,
  rate            NUMERIC NOT NULL,
  source          TEXT,
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approved_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budget_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saving_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.debts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.debt_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.receivables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.receivable_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recurring_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consultation_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consultation_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.currency_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exchange_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.balance_reconciliations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.features ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.package_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_proofs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.login_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_throttles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_deletion_warnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaction_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_documentations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.currencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.currency_rates ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────
-- HELPER: check if current user is admin
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ─────────────────────────────────────────────
-- POLICIES: profiles
-- ─────────────────────────────────────────────
CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT USING (auth.uid() = id OR public.is_admin());

CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (auth.uid() = id OR public.is_admin());

-- ─────────────────────────────────────────────
-- POLICIES: user-scoped tables
-- (accounts, transactions, categories, budget_plans,
--  saving_targets, debts, debt_payments, receivables,
--  receivable_payments, recurring_transactions,
--  app_notifications, currency_settings, expense_goals,
--  balance_reconciliations, payment_proofs, data_deletion_warnings,
--  user_features, feature_transactions)
-- ─────────────────────────────────────────────

-- accounts
CREATE POLICY "accounts_crud_own" ON public.accounts
  FOR ALL USING (auth.uid() = user_id);

-- transactions
CREATE POLICY "transactions_crud_own" ON public.transactions
  FOR ALL USING (auth.uid() = user_id);

-- categories
CREATE POLICY "categories_crud_own" ON public.categories
  FOR ALL USING (auth.uid() = user_id);

-- budget_plans
CREATE POLICY "budget_plans_crud_own" ON public.budget_plans
  FOR ALL USING (auth.uid() = user_id);

-- saving_targets
CREATE POLICY "saving_targets_crud_own" ON public.saving_targets
  FOR ALL USING (auth.uid() = user_id);

-- debts
CREATE POLICY "debts_crud_own" ON public.debts
  FOR ALL USING (auth.uid() = user_id);

-- debt_payments
CREATE POLICY "debt_payments_crud_own" ON public.debt_payments
  FOR ALL USING (auth.uid() = user_id);

-- receivables
CREATE POLICY "receivables_crud_own" ON public.receivables
  FOR ALL USING (auth.uid() = user_id);

-- receivable_payments
CREATE POLICY "receivable_payments_crud_own" ON public.receivable_payments
  FOR ALL USING (auth.uid() = user_id);

-- recurring_transactions
CREATE POLICY "recurring_transactions_crud_own" ON public.recurring_transactions
  FOR ALL USING (auth.uid() = user_id);

-- app_notifications
CREATE POLICY "app_notifications_crud_own" ON public.app_notifications
  FOR ALL USING (auth.uid() = user_id);

-- currency_settings
CREATE POLICY "currency_settings_crud_own" ON public.currency_settings
  FOR ALL USING (auth.uid() = user_id);

-- expense_goals
CREATE POLICY "expense_goals_crud_own" ON public.expense_goals
  FOR ALL USING (auth.uid() = user_id);

-- balance_reconciliations
CREATE POLICY "balance_reconciliations_crud_own" ON public.balance_reconciliations
  FOR ALL USING (auth.uid() = user_id);

-- payment_proofs
CREATE POLICY "payment_proofs_crud_own" ON public.payment_proofs
  FOR ALL USING (auth.uid() = user_id OR public.is_admin());

-- data_deletion_warnings
CREATE POLICY "data_deletion_warnings_crud_own" ON public.data_deletion_warnings
  FOR ALL USING (auth.uid() = user_id);

-- user_features
CREATE POLICY "user_features_crud_own" ON public.user_features
  FOR ALL USING (auth.uid() = user_id OR public.is_admin());

-- feature_transactions
CREATE POLICY "feature_transactions_crud_own" ON public.feature_transactions
  FOR ALL USING (auth.uid() = user_id);

-- ─────────────────────────────────────────────
-- POLICIES: activity_logs (insert own, admin reads all)
-- ─────────────────────────────────────────────
CREATE POLICY "activity_logs_insert_own" ON public.activity_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "activity_logs_select" ON public.activity_logs
  FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

-- ─────────────────────────────────────────────
-- POLICIES: consultation (user owns thread/messages)
-- ─────────────────────────────────────────────
CREATE POLICY "consultation_threads_crud_own" ON public.consultation_threads
  FOR ALL USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "consultation_messages_crud_own" ON public.consultation_messages
  FOR ALL USING (
    auth.uid() = user_id
    OR public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.consultation_threads ct
      WHERE ct.id = thread_id AND ct.user_id = auth.uid()
    )
  );

-- ─────────────────────────────────────────────
-- POLICIES: admin-only tables
-- ─────────────────────────────────────────────
CREATE POLICY "approved_users_admin_only" ON public.approved_users
  FOR ALL USING (public.is_admin());

CREATE POLICY "payment_settings_select_all" ON public.payment_settings
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "payment_settings_admin_write" ON public.payment_settings
  FOR ALL USING (public.is_admin());

CREATE POLICY "usage_sessions_admin_or_own" ON public.usage_sessions
  FOR ALL USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "security_throttles_admin_or_own" ON public.security_throttles
  FOR ALL USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "login_requests_admin_or_own" ON public.login_requests
  FOR ALL USING (auth.uid() = user_id OR public.is_admin());

-- ─────────────────────────────────────────────
-- POLICIES: public read (authenticated) tables
-- ─────────────────────────────────────────────

-- subscription_packages
CREATE POLICY "subscription_packages_select_all" ON public.subscription_packages
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "subscription_packages_admin_write" ON public.subscription_packages
  FOR ALL USING (public.is_admin());

-- features
CREATE POLICY "features_select_all" ON public.features
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "features_admin_write" ON public.features
  FOR ALL USING (public.is_admin());

-- feature_categories
CREATE POLICY "feature_categories_select_all" ON public.feature_categories
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "feature_categories_admin_write" ON public.feature_categories
  FOR ALL USING (public.is_admin());

-- feature_documentations
CREATE POLICY "feature_documentations_select_all" ON public.feature_documentations
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "feature_documentations_admin_write" ON public.feature_documentations
  FOR ALL USING (public.is_admin());

-- package_features
CREATE POLICY "package_features_select_all" ON public.package_features
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "package_features_admin_write" ON public.package_features
  FOR ALL USING (public.is_admin());

-- currencies
CREATE POLICY "currencies_select_all" ON public.currencies
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "currencies_admin_write" ON public.currencies
  FOR ALL USING (public.is_admin());

-- currency_rates
CREATE POLICY "currency_rates_select_all" ON public.currency_rates
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "currency_rates_admin_write" ON public.currency_rates
  FOR ALL USING (public.is_admin());

-- exchange_rates
CREATE POLICY "exchange_rates_select_all" ON public.exchange_rates
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "exchange_rates_admin_write" ON public.exchange_rates
  FOR ALL USING (public.is_admin());

-- transaction_types
CREATE POLICY "transaction_types_select_all" ON public.transaction_types
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "transaction_types_write" ON public.transaction_types
  FOR ALL USING (auth.uid() = user_id OR public.is_admin());

-- roles & permissions
CREATE POLICY "roles_select_all" ON public.roles
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "roles_admin_write" ON public.roles
  FOR ALL USING (public.is_admin());

CREATE POLICY "permissions_select_all" ON public.permissions
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "permissions_admin_write" ON public.permissions
  FOR ALL USING (public.is_admin());

CREATE POLICY "role_permissions_select_all" ON public.role_permissions
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "role_permissions_admin_write" ON public.role_permissions
  FOR ALL USING (public.is_admin());
