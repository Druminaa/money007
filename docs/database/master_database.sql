-- =============================================
-- MONEY MANAGER - MASTER DATABASE SCHEMA
-- =============================================
-- Complete database setup for Money Manager application
-- This file contains all tables, functions, triggers, and policies

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================
-- CUSTOM TYPES
-- =============================================

DO $$ BEGIN
  CREATE TYPE transaction_type AS ENUM ('income', 'expense');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE recurring_period AS ENUM ('daily', 'weekly', 'monthly');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE audit_action AS ENUM ('INSERT', 'UPDATE', 'DELETE');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- =============================================
-- CATEGORIES TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  type TEXT CHECK (type IN ('income', 'expense', 'both')) DEFAULT 'both',
  icon TEXT,
  color TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

INSERT INTO categories (name, type, icon, color) VALUES
  ('Salary', 'income', '💼', '#10B981'),
  ('Freelance', 'income', '💻', '#059669'),
  ('Investment', 'income', '📈', '#047857'),
  ('Food', 'expense', '🍔', '#EF4444'),
  ('Transport', 'expense', '🚗', '#F59E0B'),
  ('Utilities', 'expense', '⚡', '#8B5CF6'),
  ('Entertainment', 'expense', '🎬', '#EC4899'),
  ('Healthcare', 'expense', '🏥', '#06B6D4'),
  ('Shopping', 'expense', '🛍️', '#F97316'),
  ('Education', 'expense', '📚', '#3B82F6'),
  ('Other', 'both', '📝', '#6B7280')
ON CONFLICT (name) DO NOTHING;

-- =============================================
-- PROFILES TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" 
  ON profiles FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
  ON profiles FOR UPDATE 
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" 
  ON profiles FOR INSERT 
  WITH CHECK (auth.uid() = id);

CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- =============================================
-- TRANSACTIONS TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  description TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  type TEXT CHECK (type IN ('income', 'expense')) NOT NULL,
  category TEXT NOT NULL,
  date DATE NOT NULL,
  payment_method TEXT CHECK (payment_method IN ('cash', 'card', 'bank')) DEFAULT 'cash',
  recurring BOOLEAN DEFAULT FALSE,
  recurring_period TEXT CHECK (recurring_period IN ('daily', 'weekly', 'monthly')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own transactions" 
  ON transactions FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transactions" 
  ON transactions FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own transactions" 
  ON transactions FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own transactions" 
  ON transactions FOR DELETE 
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category);
CREATE INDEX IF NOT EXISTS idx_transactions_payment_method ON transactions(payment_method);
CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON transactions(user_id, date DESC);

-- =============================================
-- BUDGETS TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS budgets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  category TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  month TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, category, month)
);

ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own budgets" 
  ON budgets FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own budgets" 
  ON budgets FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own budgets" 
  ON budgets FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own budgets" 
  ON budgets FOR DELETE 
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_budgets_user_id ON budgets(user_id);
CREATE INDEX IF NOT EXISTS idx_budgets_month ON budgets(month);
CREATE INDEX IF NOT EXISTS idx_budgets_category ON budgets(category);
CREATE INDEX IF NOT EXISTS idx_budgets_user_month ON budgets(user_id, month);

-- =============================================
-- GOALS TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS goals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  target_amount DECIMAL(10,2) NOT NULL,
  current_amount DECIMAL(10,2) DEFAULT 0,
  deadline DATE NOT NULL,
  category VARCHAR(50) DEFAULT 'savings',
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own goals" 
  ON goals FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own goals" 
  ON goals FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own goals" 
  ON goals FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own goals" 
  ON goals FOR DELETE 
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_goals_user_id ON goals(user_id);
CREATE INDEX IF NOT EXISTS idx_goals_deadline ON goals(deadline);
CREATE INDEX IF NOT EXISTS idx_goals_completed ON goals(completed);
CREATE INDEX IF NOT EXISTS idx_goals_user_deadline ON goals(user_id, deadline);

-- =============================================
-- AUDIT LOGS TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  action TEXT CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')) NOT NULL,
  old_values JSONB,
  new_values JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own audit logs" 
  ON audit_logs FOR SELECT 
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_name ON audit_logs(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_table ON audit_logs(user_id, table_name);

-- =============================================
-- USER SETTINGS TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS user_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    currency VARCHAR(10) DEFAULT 'INR' NOT NULL,
    language VARCHAR(10) DEFAULT 'en' NOT NULL,
    date_format VARCHAR(20) DEFAULT 'dd-mm-yyyy' NOT NULL,
    theme VARCHAR(20) DEFAULT 'light' NOT NULL,
    email_notifications BOOLEAN DEFAULT true NOT NULL,
    push_notifications BOOLEAN DEFAULT true NOT NULL,
    budget_alerts BOOLEAN DEFAULT true NOT NULL,
    goal_reminders BOOLEAN DEFAULT true NOT NULL,
    weekly_reports BOOLEAN DEFAULT false NOT NULL,
    two_factor_auth BOOLEAN DEFAULT false NOT NULL,
    login_alerts BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    UNIQUE(user_id)
);

ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own settings" ON user_settings
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings" ON user_settings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own settings" ON user_settings
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own settings" ON user_settings
    FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);

-- =============================================
-- USER PROFILES TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    location VARCHAR(255),
    date_of_birth DATE,
    bio TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    UNIQUE(user_id)
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON user_profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON user_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own profile" ON user_profiles
    FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);

-- =============================================
-- CUSTOM CATEGORIES TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS custom_categories (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  type VARCHAR(10) NOT NULL CHECK (type IN ('income', 'expense')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, name, type)
);

ALTER TABLE custom_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own custom categories" ON custom_categories
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own custom categories" ON custom_categories
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own custom categories" ON custom_categories
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own custom categories" ON custom_categories
  FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_custom_categories_user_id ON custom_categories(user_id);
CREATE INDEX IF NOT EXISTS idx_custom_categories_type ON custom_categories(type);
CREATE INDEX IF NOT EXISTS idx_custom_categories_user_type ON custom_categories(user_id, type);

-- =============================================
-- DATABASE INFO TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS db_info (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

INSERT INTO db_info (key, value) VALUES
  ('version', '1.0.0'),
  ('created_at', NOW()::TEXT),
  ('description', 'Money Manager Database Schema')
ON CONFLICT (key) DO UPDATE SET 
  value = EXCLUDED.value,
  updated_at = NOW();

-- =============================================
-- STORAGE SETUP
-- =============================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;

CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "User Upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars');
CREATE POLICY "User Update" ON storage.objects FOR UPDATE USING (bucket_id = 'avatars');
CREATE POLICY "User Delete" ON storage.objects FOR DELETE USING (bucket_id = 'avatars');

-- =============================================
-- UTILITY FUNCTIONS
-- =============================================

-- Function for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function for automatic profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get categories by type
CREATE OR REPLACE FUNCTION get_categories(category_type TEXT DEFAULT 'both')
RETURNS TABLE(name TEXT, icon TEXT, color TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT c.name, c.icon, c.color
  FROM categories c
  WHERE c.type = category_type OR c.type = 'both'
  ORDER BY c.name;
END;
$$ LANGUAGE plpgsql;

-- Function to automatically mark goals as completed
CREATE OR REPLACE FUNCTION check_goal_completion()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.current_amount >= NEW.target_amount AND OLD.completed = FALSE THEN
    NEW.completed = TRUE;
    NEW.completed_at = NOW();
  END IF;
  
  IF NEW.current_amount < NEW.target_amount AND OLD.completed = TRUE THEN
    NEW.completed = FALSE;
    NEW.completed_at = NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to create audit log entries
CREATE OR REPLACE FUNCTION create_audit_log()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_TABLE_NAME NOT IN ('transactions', 'budgets', 'goals', 'profiles') THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  DECLARE
    user_uuid UUID;
  BEGIN
    IF TG_OP = 'DELETE' THEN
      user_uuid := OLD.user_id;
    ELSE
      user_uuid := NEW.user_id;
    END IF;

    IF TG_TABLE_NAME = 'profiles' THEN
      IF TG_OP = 'DELETE' THEN
        user_uuid := OLD.id;
      ELSE
        user_uuid := NEW.id;
      END IF;
    END IF;

    INSERT INTO audit_logs (
      user_id,
      table_name,
      record_id,
      action,
      old_values,
      new_values
    ) VALUES (
      user_uuid,
      TG_TABLE_NAME,
      CASE 
        WHEN TG_OP = 'DELETE' THEN OLD.id
        ELSE NEW.id
      END,
      TG_OP,
      CASE 
        WHEN TG_OP IN ('UPDATE', 'DELETE') THEN row_to_json(OLD)
        ELSE NULL
      END,
      CASE 
        WHEN TG_OP IN ('INSERT', 'UPDATE') THEN row_to_json(NEW)
        ELSE NULL
      END
    );
  END;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- ANALYTICS FUNCTIONS
-- =============================================

-- Function to get monthly summary
CREATE OR REPLACE FUNCTION get_monthly_summary(user_uuid UUID, target_month TEXT)
RETURNS TABLE(
  total_income DECIMAL,
  total_expenses DECIMAL,
  net_amount DECIMAL,
  transaction_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as total_income,
    COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as total_expenses,
    COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END), 0) as net_amount,
    COUNT(*)::INTEGER as transaction_count
  FROM transactions 
  WHERE user_id = user_uuid 
    AND date >= (target_month || '-01')::DATE 
    AND date < (target_month || '-01')::DATE + INTERVAL '1 month';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get budget analysis
CREATE OR REPLACE FUNCTION get_budget_analysis(user_uuid UUID, target_month TEXT)
RETURNS TABLE(
  category TEXT,
  budget_amount DECIMAL,
  spent_amount DECIMAL,
  remaining_amount DECIMAL,
  percentage_used DECIMAL,
  status TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    b.category,
    b.amount as budget_amount,
    COALESCE(t.spent, 0) as spent_amount,
    b.amount - COALESCE(t.spent, 0) as remaining_amount,
    CASE 
      WHEN b.amount > 0 THEN ROUND((COALESCE(t.spent, 0) / b.amount * 100), 2)
      ELSE 0 
    END as percentage_used,
    CASE 
      WHEN COALESCE(t.spent, 0) > b.amount THEN 'over_budget'
      WHEN COALESCE(t.spent, 0) > b.amount * 0.8 THEN 'warning'
      ELSE 'on_track'
    END as status
  FROM budgets b
  LEFT JOIN (
    SELECT 
      category,
      SUM(amount) as spent
    FROM transactions 
    WHERE user_id = user_uuid 
      AND type = 'expense'
      AND date >= (target_month || '-01')::DATE 
      AND date < (target_month || '-01')::DATE + INTERVAL '1 month'
    GROUP BY category
  ) t ON b.category = t.category
  WHERE b.user_id = user_uuid AND b.month = target_month
  ORDER BY b.category;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get goals summary
CREATE OR REPLACE FUNCTION get_goals_summary(user_uuid UUID)
RETURNS TABLE(
  total_goals INTEGER,
  completed_goals INTEGER,
  active_goals INTEGER,
  overdue_goals INTEGER,
  total_target_amount DECIMAL,
  total_current_amount DECIMAL,
  overall_progress DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::INTEGER as total_goals,
    COUNT(CASE WHEN completed = TRUE THEN 1 END)::INTEGER as completed_goals,
    COUNT(CASE WHEN completed = FALSE AND deadline >= CURRENT_DATE THEN 1 END)::INTEGER as active_goals,
    COUNT(CASE WHEN completed = FALSE AND deadline < CURRENT_DATE THEN 1 END)::INTEGER as overdue_goals,
    COALESCE(SUM(target_amount), 0) as total_target_amount,
    COALESCE(SUM(current_amount), 0) as total_current_amount,
    CASE 
      WHEN SUM(target_amount) > 0 THEN ROUND((SUM(current_amount) / SUM(target_amount) * 100), 2)
      ELSE 0 
    END as overall_progress
  FROM goals 
  WHERE user_id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get transactions by period
CREATE OR REPLACE FUNCTION get_transactions_by_period(
  user_uuid UUID,
  period_type TEXT,
  target_date DATE
)
RETURNS TABLE(
  id UUID,
  description TEXT,
  amount DECIMAL,
  type TEXT,
  category TEXT,
  date DATE,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
DECLARE
  start_date DATE;
  end_date DATE;
BEGIN
  CASE period_type
    WHEN 'daily' THEN
      start_date := target_date;
      end_date := target_date;
    WHEN 'weekly' THEN
      start_date := target_date - ((EXTRACT(DOW FROM target_date)::INTEGER + 6) % 7);
      end_date := start_date + 6;
    WHEN 'monthly' THEN
      start_date := DATE_TRUNC('month', target_date)::DATE;
      end_date := (DATE_TRUNC('month', target_date) + INTERVAL '1 month - 1 day')::DATE;
    WHEN 'yearly' THEN
      start_date := DATE_TRUNC('year', target_date)::DATE;
      end_date := (DATE_TRUNC('year', target_date) + INTERVAL '1 year - 1 day')::DATE;
    ELSE
      RAISE EXCEPTION 'Invalid period_type: %', period_type;
  END CASE;

  RETURN QUERY
  SELECT 
    t.id,
    t.description,
    t.amount,
    t.type,
    t.category,
    t.date,
    t.created_at
  FROM transactions t
  WHERE t.user_id = user_uuid
    AND t.date BETWEEN start_date AND end_date
  ORDER BY t.date DESC, t.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- ANALYTICS VIEWS
-- =============================================

CREATE OR REPLACE VIEW user_financial_summary AS
SELECT 
  t.user_id,
  DATE_TRUNC('month', t.date) as month,
  SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END) as total_income,
  SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END) as total_expenses,
  SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE -t.amount END) as net_amount,
  COUNT(*) as transaction_count
FROM transactions t
GROUP BY t.user_id, DATE_TRUNC('month', t.date);

-- =============================================
-- TRIGGERS
-- =============================================

-- Trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Triggers for updated_at columns
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at 
  BEFORE UPDATE ON profiles 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_transactions_updated_at ON transactions;
CREATE TRIGGER update_transactions_updated_at 
  BEFORE UPDATE ON transactions 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_budgets_updated_at ON budgets;
CREATE TRIGGER update_budgets_updated_at 
  BEFORE UPDATE ON budgets 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_goals_updated_at ON goals;
CREATE TRIGGER update_goals_updated_at 
  BEFORE UPDATE ON goals 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_settings_updated_at ON user_settings;
CREATE TRIGGER update_user_settings_updated_at 
    BEFORE UPDATE ON user_settings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at 
    BEFORE UPDATE ON user_profiles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger for goal completion
DROP TRIGGER IF EXISTS trigger_goal_completion ON goals;
CREATE TRIGGER trigger_goal_completion
  BEFORE UPDATE ON goals
  FOR EACH ROW EXECUTE FUNCTION check_goal_completion();

-- Audit triggers
DROP TRIGGER IF EXISTS audit_transactions ON transactions;
CREATE TRIGGER audit_transactions
  AFTER INSERT OR UPDATE OR DELETE ON transactions
  FOR EACH ROW EXECUTE FUNCTION create_audit_log();

DROP TRIGGER IF EXISTS audit_budgets ON budgets;
CREATE TRIGGER audit_budgets
  AFTER INSERT OR UPDATE OR DELETE ON budgets
  FOR EACH ROW EXECUTE FUNCTION create_audit_log();

DROP TRIGGER IF EXISTS audit_goals ON goals;
CREATE TRIGGER audit_goals
  AFTER INSERT OR UPDATE OR DELETE ON goals
  FOR EACH ROW EXECUTE FUNCTION create_audit_log();

DROP TRIGGER IF EXISTS audit_profiles ON profiles;
CREATE TRIGGER audit_profiles
  AFTER INSERT OR UPDATE OR DELETE ON profiles
  FOR EACH ROW EXECUTE FUNCTION create_audit_log();

-- Custom categories trigger
CREATE OR REPLACE FUNCTION update_custom_categories_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_custom_categories_updated_at
  BEFORE UPDATE ON custom_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_custom_categories_updated_at();

-- =============================================
-- COMPLETION MESSAGE
-- =============================================

DO $$
BEGIN
  RAISE NOTICE 'Money Manager database schema created successfully!';
  RAISE NOTICE 'Version: 1.0.0';
  RAISE NOTICE 'Tables: profiles, transactions, budgets, goals, audit_logs, user_settings, user_profiles, custom_categories, categories';
  RAISE NOTICE 'All RLS policies, indexes, and triggers have been applied.';
END $$;