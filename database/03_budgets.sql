-- =============================================
-- BUDGETS TABLE - Budget Planning & Tracking
-- =============================================

-- Create budgets table
CREATE TABLE IF NOT EXISTS budgets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  category TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  month TEXT NOT NULL, -- Format: YYYY-MM
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, category, month)
);

-- Enable Row Level Security
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Budgets
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

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_budgets_user_id ON budgets(user_id);
CREATE INDEX IF NOT EXISTS idx_budgets_month ON budgets(month);
CREATE INDEX IF NOT EXISTS idx_budgets_category ON budgets(category);
CREATE INDEX IF NOT EXISTS idx_budgets_user_month ON budgets(user_id, month);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_budgets_updated_at ON budgets;
CREATE TRIGGER update_budgets_updated_at 
  BEFORE UPDATE ON budgets 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to get budget vs actual spending
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