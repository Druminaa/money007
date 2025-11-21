-- =============================================
-- COMPLETE DEPLOYMENT SCRIPT
-- =============================================
-- This file combines all SQL files for easy deployment
-- Copy and paste this entire file into Supabase SQL Editor

-- =============================================
-- SETUP AND EXTENSIONS
-- =============================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create custom types
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

-- Common categories
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

CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

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
  recurring BOOLEAN DEFAULT FALSE,
  recurring_period TEXT CHECK (recurring_period IN ('daily', 'weekly', 'monthly')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own transactions" ON transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own transactions" ON transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own transactions" ON transactions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own transactions" ON transactions FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
CREate INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category);
CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON transactions(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_user_type ON transactions(user_id, type);

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

CREATE POLICY "Users can view own budgets" ON budgets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own budgets" ON budgets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own budgets" ON budgets FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own budgets" ON budgets FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_budgets_user_id ON budgets(user_id);
CREATE INDEX IF NOT EXISTS idx_budgets_month ON budgets(month);

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
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own goals" ON goals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own goals" ON goals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own goals" ON goals FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own goals" ON goals FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_goals_user_id ON goals(user_id);
CREATE INDEX IF NOT EXISTS idx_goals_deadline ON goals(deadline);

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

CREATE POLICY "Users can view own audit logs" ON audit_logs FOR SELECT USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- =============================================
-- FUNCTIONS AND TRIGGERS
-- =============================================

-- Update timestamp function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Profile creation function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Goal completion function
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

-- Create triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

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

DROP TRIGGER IF EXISTS trigger_goal_completion ON goals;
CREATE TRIGGER trigger_goal_completion
  BEFORE UPDATE ON goals
  FOR EACH ROW EXECUTE FUNCTION check_goal_completion();

-- =============================================
-- DATE FILTERING FUNCTIONS
-- =============================================

-- Function to get transactions by date period
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
  -- Calculate date range based on period type
  CASE period_type
    WHEN 'daily' THEN
      start_date := target_date;
      end_date := target_date;
    WHEN 'weekly' THEN
      -- Start from Monday (1) to Sunday (0), adjust for PostgreSQL DOW (0=Sunday)
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

-- Function to get period summary
CREATE OR REPLACE FUNCTION get_period_summary(
  user_uuid UUID,
  period_type TEXT,
  target_date DATE
)
RETURNS TABLE(
  total_income DECIMAL,
  total_expenses DECIMAL,
  net_amount DECIMAL,
  transaction_count INTEGER,
  start_date DATE,
  end_date DATE
) AS $$
DECLARE
  calc_start_date DATE;
  calc_end_date DATE;
BEGIN
  -- Calculate date range
  CASE period_type
    WHEN 'daily' THEN
      calc_start_date := target_date;
      calc_end_date := target_date;
    WHEN 'weekly' THEN
      -- Start from Monday (1) to Sunday (0), adjust for PostgreSQL DOW (0=Sunday)
      calc_start_date := target_date - ((EXTRACT(DOW FROM target_date)::INTEGER + 6) % 7);
      calc_end_date := calc_start_date + 6;
    WHEN 'monthly' THEN
      calc_start_date := DATE_TRUNC('month', target_date)::DATE;
      calc_end_date := (DATE_TRUNC('month', target_date) + INTERVAL '1 month - 1 day')::DATE;
    WHEN 'yearly' THEN
      calc_start_date := DATE_TRUNC('year', target_date)::DATE;
      calc_end_date := (DATE_TRUNC('year', target_date) + INTERVAL '1 year - 1 day')::DATE;
    ELSE
      RAISE EXCEPTION 'Invalid period_type: %', period_type;
  END CASE;

  RETURN QUERY
  SELECT 
    COALESCE(SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END), 0) as total_income,
    COALESCE(SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END), 0) as total_expenses,
    COALESCE(SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE -t.amount END), 0) as net_amount,
    COUNT(*)::INTEGER as transaction_count,
    calc_start_date as start_date,
    calc_end_date as end_date
  FROM transactions t
  WHERE t.user_id = user_uuid
    AND t.date BETWEEN calc_start_date AND calc_end_date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;