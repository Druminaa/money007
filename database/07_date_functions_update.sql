  -- =============================================
  -- UPDATED DATE FILTERING FUNCTIONS
  -- =============================================
  -- Run this to update existing functions with proper daily/weekly calculations

  -- Drop existing functions
  DROP FUNCTION IF EXISTS get_transactions_by_period(UUID, TEXT, DATE);
  DROP FUNCTION IF EXISTS get_period_summary(UUID, TEXT, DATE);

  -- Function to get transactions by date period (UPDATED)
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

  -- Function to get period summary (UPDATED)
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

  -- Function to get daily breakdown for a week
  CREATE OR REPLACE FUNCTION get_daily_breakdown_for_week(
    user_uuid UUID,
    week_start_date DATE
  )
  RETURNS TABLE(
    day_date DATE,
    day_name TEXT,
    total_income DECIMAL,
    total_expenses DECIMAL,
    net_amount DECIMAL,
    transaction_count INTEGER
  ) AS $$
  BEGIN
    RETURN QUERY
    WITH date_series AS (
      SELECT generate_series(
        week_start_date,
        week_start_date + 6,
        '1 day'::interval
      )::DATE as day_date
    ),
    daily_stats AS (
      SELECT 
        t.date,
        SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END) as income,
        SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END) as expenses,
        COUNT(*) as count
      FROM transactions t
      WHERE t.user_id = user_uuid
        AND t.date BETWEEN week_start_date AND week_start_date + 6
      GROUP BY t.date
    )
    SELECT 
      ds.day_date,
      TO_CHAR(ds.day_date, 'Day') as day_name,
      COALESCE(daily_stats.income, 0) as total_income,
      COALESCE(daily_stats.expenses, 0) as total_expenses,
      COALESCE(daily_stats.income, 0) - COALESCE(daily_stats.expenses, 0) as net_amount,
      COALESCE(daily_stats.count, 0)::INTEGER as transaction_count
    FROM date_series ds
    LEFT JOIN daily_stats ON ds.day_date = daily_stats.date
    ORDER BY ds.day_date;
  END;
  $$ LANGUAGE plpgsql SECURITY DEFINER;

  -- Function to get hourly breakdown for a specific day
  CREATE OR REPLACE FUNCTION get_hourly_breakdown_for_day(
    user_uuid UUID,
    target_date DATE
  )
  RETURNS TABLE(
    hour_of_day INTEGER,
    hour_label TEXT,
    total_income DECIMAL,
    total_expenses DECIMAL,
    net_amount DECIMAL,
    transaction_count INTEGER
  ) AS $$
  BEGIN
    RETURN QUERY
    WITH hour_series AS (
      SELECT generate_series(0, 23) as hour_of_day
    ),
    hourly_stats AS (
      SELECT 
        EXTRACT(HOUR FROM t.created_at)::INTEGER as hour,
        SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END) as income,
        SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END) as expenses,
        COUNT(*) as count
      FROM transactions t
      WHERE t.user_id = user_uuid
        AND t.date = target_date
      GROUP BY EXTRACT(HOUR FROM t.created_at)
    )
    SELECT 
      hs.hour_of_day,
      CASE 
        WHEN hs.hour_of_day = 0 THEN '12 AM'
        WHEN hs.hour_of_day < 12 THEN hs.hour_of_day || ' AM'
        WHEN hs.hour_of_day = 12 THEN '12 PM'
        ELSE (hs.hour_of_day - 12) || ' PM'
      END as hour_label,
      COALESCE(hourly_stats.income, 0) as total_income,
      COALESCE(hourly_stats.expenses, 0) as total_expenses,
      COALESCE(hourly_stats.income, 0) - COALESCE(hourly_stats.expenses, 0) as net_amount,
      COALESCE(hourly_stats.count, 0)::INTEGER as transaction_count
    FROM hour_series hs
    LEFT JOIN hourly_stats ON hs.hour_of_day = hourly_stats.hour
    WHERE COALESCE(hourly_stats.count, 0) > 0
    ORDER BY hs.hour_of_day;
  END;
  $$ LANGUAGE plpgsql SECURITY DEFINER;

  -- Function to get daily transactions with time grouping
  CREATE OR REPLACE FUNCTION get_daily_transactions_grouped(
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
    time_group TEXT
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
      CASE 
        WHEN EXTRACT(HOUR FROM t.created_at) BETWEEN 0 AND 5 THEN 'Early Morning (12-6 AM)'
        WHEN EXTRACT(HOUR FROM t.created_at) BETWEEN 6 AND 11 THEN 'Morning (6 AM-12 PM)'
        WHEN EXTRACT(HOUR FROM t.created_at) BETWEEN 12 AND 17 THEN 'Afternoon (12-6 PM)'
        ELSE 'Evening (6 PM-12 AM)'
      END as time_group
    FROM transactions t
    WHERE t.user_id = user_uuid
      AND t.date = target_date
    ORDER BY t.created_at DESC;
  END;
  $$ LANGUAGE plpgsql SECURITY DEFINER;