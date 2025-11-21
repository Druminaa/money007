-- =============================================
-- MONEY MANAGER - MASTER DATABASE SETUP
-- =============================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- 1. PROFILES TABLE
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

CREATE POLICY "Users can manage own profile" ON profiles
  USING (auth.uid() = id);

-- =============================================
-- 2. USER PROFILES TABLE (Extended)
-- =============================================
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  full_name TEXT,
  phone TEXT,
  location TEXT,
  date_of_birth DATE,
  bio TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own user_profile" ON user_profiles
  USING (auth.uid() = user_id);

-- =============================================
-- 3. USER SETTINGS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS user_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  currency TEXT DEFAULT 'INR',
  language TEXT DEFAULT 'en',
  date_format TEXT DEFAULT 'dd-mm-yyyy',
  email_notifications BOOLEAN DEFAULT true,
  push_notifications BOOLEAN DEFAULT true,
  budget_alerts BOOLEAN DEFAULT true,
  goal_reminders BOOLEAN DEFAULT true,
  weekly_reports BOOLEAN DEFAULT false,
  two_factor_auth BOOLEAN DEFAULT false,
  login_alerts BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own settings" ON user_settings
  USING (auth.uid() = user_id);

-- =============================================
-- 4. TRANSACTIONS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  type TEXT CHECK (type IN ('income', 'expense')) NOT NULL,
  category TEXT NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  recurring BOOLEAN DEFAULT false,
  recurring_period TEXT CHECK (recurring_period IN ('daily', 'weekly', 'monthly')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own transactions" ON transactions
  USING (auth.uid() = user_id);

CREATE INDEX idx_transactions_user_date ON transactions(user_id, date DESC);
CREATE INDEX idx_transactions_category ON transactions(category);
CREATE INDEX idx_transactions_type ON transactions(type);

-- =============================================
-- 5. BUDGETS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS budgets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  month TEXT NOT NULL, -- Format: YYYY-MM
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, category, month)
);

ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own budgets" ON budgets
  USING (auth.uid() = user_id);

CREATE INDEX idx_budgets_user_month ON budgets(user_id, month);

-- =============================================
-- 6. GOALS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS goals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  target_amount DECIMAL(12,2) NOT NULL,
  current_amount DECIMAL(12,2) DEFAULT 0,
  deadline DATE,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own goals" ON goals
  USING (auth.uid() = user_id);

CREATE INDEX idx_goals_user_completed ON goals(user_id, completed);

-- =============================================
-- 7. STORAGE BUCKET FOR AVATARS
-- =============================================
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Avatar images are publicly accessible" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'avatars' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update their own avatar" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'avatars' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- =============================================
-- 8. UTILITY FUNCTIONS
-- =============================================

-- Function for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers to all tables
CREATE TRIGGER update_profiles_updated_at 
  BEFORE UPDATE ON profiles 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at 
  BEFORE UPDATE ON user_profiles 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_settings_updated_at 
  BEFORE UPDATE ON user_settings 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at 
  BEFORE UPDATE ON transactions 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_budgets_updated_at 
  BEFORE UPDATE ON budgets 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_goals_updated_at 
  BEFORE UPDATE ON goals 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function for automatic profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  
  INSERT INTO public.user_settings (user_id)
  VALUES (NEW.id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- 9. ANALYTICS FUNCTIONS
-- =============================================

-- Function to get monthly spending by category
CREATE OR REPLACE FUNCTION get_monthly_spending(user_uuid UUID, target_month TEXT)
RETURNS TABLE(category TEXT, total_amount DECIMAL) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.category,
    SUM(t.amount) as total_amount
  FROM transactions t
  WHERE t.user_id = user_uuid 
    AND t.type = 'expense'
    AND TO_CHAR(t.date, 'YYYY-MM') = target_month
  GROUP BY t.category
  ORDER BY total_amount DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get income vs expense summary
CREATE OR REPLACE FUNCTION get_income_expense_summary(user_uuid UUID, target_month TEXT)
RETURNS TABLE(type TEXT, total_amount DECIMAL) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.type,
    SUM(t.amount) as total_amount
  FROM transactions t
  WHERE t.user_id = user_uuid 
    AND TO_CHAR(t.date, 'YYYY-MM') = target_month
  GROUP BY t.type;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;