-- =============================================
-- FIX DAILY FILTERING FUNCTIONS
-- =============================================
-- Run this to fix daily date filtering issues

-- Drop and recreate the main filtering function with proper date handling
DROP FUNCTION IF EXISTS get_transactions_by_period(UUID, TEXT, DATE);

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
      -- For daily, use exact date match
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

-- Update the period summary function as well
DROP FUNCTION IF EXISTS get_period_summary(UUID, TEXT, DATE);

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

-- Create a simple function to get transactions for exact date
CREATE OR REPLACE FUNCTION get_daily_transactions(
  user_uuid UUID,
  target_date DATE
)
RETURNS TABLE(
  id UUID,
  description TEXT,
  amount DECIMAL,
  type TEXT,
  category TEXT,
  date DATE,
  created_at TIMESTAMP WITH TIME ZONE,
  hour_created INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.id,
    t.description,
    t.amount,
    t.type,
    t.category,
    t.date,
    t.created_at,
    EXTRACT(HOUR FROM t.created_at)::INTEGER as hour_created
  FROM transactions t
  WHERE t.user_id = user_uuid
    AND t.date = target_date
  ORDER BY t.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Test function to verify date filtering
CREATE OR REPLACE FUNCTION test_date_filter(
  user_uuid UUID,
  test_date DATE
)
RETURNS TABLE(
  filter_type TEXT,
  transaction_count INTEGER,
  date_range TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    'daily'::TEXT as filter_type,
    COUNT(*)::INTEGER as transaction_count,
    test_date::TEXT as date_range
  FROM transactions t
  WHERE t.user_id = user_uuid AND t.date = test_date
  
  UNION ALL
  
  SELECT 
    'all'::TEXT as filter_type,
    COUNT(*)::INTEGER as transaction_count,
    'all dates'::TEXT as date_range
  FROM transactions t
  WHERE t.user_id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;