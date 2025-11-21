-- =============================================
-- TRANSACTIONS TABLE - Transaction Management
-- =============================================

-- Create transactions table
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

-- Enable Row Level Security
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Transactions
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

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category);
CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON transactions(user_id, date DESC);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_transactions_updated_at ON transactions;
CREATE TRIGGER update_transactions_updated_at 
  BEFORE UPDATE ON transactions 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

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