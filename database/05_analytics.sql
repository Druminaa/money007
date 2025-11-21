-- =============================================
-- ANALYTICS VIEWS & FUNCTIONS - Data Analysis
-- =============================================

-- Create analytics view for dashboard
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

-- Function for expense breakdown by category
CREATE OR REPLACE FUNCTION get_expense_breakdown(user_uuid UUID, start_date DATE, end_date DATE)
RETURNS TABLE(
  category TEXT,
  total_amount DECIMAL,
  transaction_count INTEGER,
  percentage DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  WITH category_totals AS (
    SELECT 
      t.category,
      SUM(t.amount) as total_amount,
      COUNT(*)::INTEGER as transaction_count
    FROM transactions t
    WHERE t.user_id = user_uuid 
      AND t.type = 'expense'
      AND t.date BETWEEN start_date AND end_date
    GROUP BY t.category
  ),
  total_expenses AS (
    SELECT SUM(total_amount) as grand_total
    FROM category_totals
  )
  SELECT 
    ct.category,
    ct.total_amount,
    ct.transaction_count,
    CASE 
      WHEN te.grand_total > 0 THEN ROUND((ct.total_amount / te.grand_total * 100), 2)
      ELSE 0 
    END as percentage
  FROM category_totals ct
  CROSS JOIN total_expenses te
  ORDER BY ct.total_amount DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function for monthly trends
CREATE OR REPLACE FUNCTION get_monthly_trends(user_uuid UUID, months_back INTEGER DEFAULT 12)
RETURNS TABLE(
  month TEXT,
  income DECIMAL,
  expenses DECIMAL,
  net_amount DECIMAL,
  savings_rate DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    TO_CHAR(month_series.month, 'YYYY-MM') as month,
    COALESCE(summary.total_income, 0) as income,
    COALESCE(summary.total_expenses, 0) as expenses,
    COALESCE(summary.net_amount, 0) as net_amount,
    CASE 
      WHEN COALESCE(summary.total_income, 0) > 0 
      THEN ROUND((COALESCE(summary.net_amount, 0) / summary.total_income * 100), 2)
      ELSE 0 
    END as savings_rate
  FROM (
    SELECT DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month' * generate_series(0, months_back - 1)) as month
  ) month_series
  LEFT JOIN user_financial_summary summary 
    ON month_series.month = summary.month 
    AND summary.user_id = user_uuid
  ORDER BY month_series.month DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function for spending patterns by day of week
CREATE OR REPLACE FUNCTION get_spending_patterns(user_uuid UUID, start_date DATE, end_date DATE)
RETURNS TABLE(
  day_of_week INTEGER,
  day_name TEXT,
  avg_amount DECIMAL,
  transaction_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    EXTRACT(DOW FROM t.date)::INTEGER as day_of_week,
    TO_CHAR(t.date, 'Day') as day_name,
    ROUND(AVG(t.amount), 2) as avg_amount,
    COUNT(*)::INTEGER as transaction_count
  FROM transactions t
  WHERE t.user_id = user_uuid 
    AND t.type = 'expense'
    AND t.date BETWEEN start_date AND end_date
  GROUP BY EXTRACT(DOW FROM t.date), TO_CHAR(t.date, 'Day')
  ORDER BY day_of_week;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function for top spending categories
CREATE OR REPLACE FUNCTION get_top_categories(user_uuid UUID, start_date DATE, end_date DATE, limit_count INTEGER DEFAULT 5)
RETURNS TABLE(
  category TEXT,
  total_amount DECIMAL,
  avg_transaction DECIMAL,
  transaction_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.category,
    SUM(t.amount) as total_amount,
    ROUND(AVG(t.amount), 2) as avg_transaction,
    COUNT(*)::INTEGER as transaction_count
  FROM transactions t
  WHERE t.user_id = user_uuid 
    AND t.type = 'expense'
    AND t.date BETWEEN start_date AND end_date
  GROUP BY t.category
  ORDER BY total_amount DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;