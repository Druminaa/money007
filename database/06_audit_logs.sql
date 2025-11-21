-- =============================================
-- AUDIT LOGS TABLE - Activity Tracking
-- =============================================

-- Create audit_logs table for tracking changes
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

-- Enable Row Level Security
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Audit Logs
CREATE POLICY "Users can view own audit logs" 
  ON audit_logs FOR SELECT 
  USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_name ON audit_logs(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_table ON audit_logs(user_id, table_name);

-- Function to create audit log entries
CREATE OR REPLACE FUNCTION create_audit_log()
RETURNS TRIGGER AS $$
BEGIN
  -- Only log for tables we care about
  IF TG_TABLE_NAME NOT IN ('transactions', 'budgets', 'goals', 'profiles') THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  -- Get user_id from the record
  DECLARE
    user_uuid UUID;
  BEGIN
    IF TG_OP = 'DELETE' THEN
      user_uuid := OLD.user_id;
    ELSE
      user_uuid := NEW.user_id;
    END IF;

    -- Handle profiles table (user_id is actually id)
    IF TG_TABLE_NAME = 'profiles' THEN
      IF TG_OP = 'DELETE' THEN
        user_uuid := OLD.id;
      ELSE
        user_uuid := NEW.id;
      END IF;
    END IF;

    -- Insert audit log
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

-- Create audit triggers for all main tables
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

-- Function to get user activity summary
CREATE OR REPLACE FUNCTION get_user_activity(user_uuid UUID, days_back INTEGER DEFAULT 30)
RETURNS TABLE(
  date DATE,
  total_actions INTEGER,
  inserts INTEGER,
  updates INTEGER,
  deletes INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    DATE(al.created_at) as date,
    COUNT(*)::INTEGER as total_actions,
    COUNT(CASE WHEN al.action = 'INSERT' THEN 1 END)::INTEGER as inserts,
    COUNT(CASE WHEN al.action = 'UPDATE' THEN 1 END)::INTEGER as updates,
    COUNT(CASE WHEN al.action = 'DELETE' THEN 1 END)::INTEGER as deletes
  FROM audit_logs al
  WHERE al.user_id = user_uuid 
    AND al.created_at >= CURRENT_DATE - INTERVAL '1 day' * days_back
  GROUP BY DATE(al.created_at)
  ORDER BY date DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;