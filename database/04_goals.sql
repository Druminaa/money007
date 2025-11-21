-- =============================================
-- GOALS TABLE - Financial Goals Tracking
-- =============================================

-- Create goals table
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

-- Enable Row Level Security
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Goals
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

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_goals_user_id ON goals(user_id);
CREATE INDEX IF NOT EXISTS idx_goals_deadline ON goals(deadline);
CREATE INDEX IF NOT EXISTS idx_goals_completed ON goals(completed);
CREATE INDEX IF NOT EXISTS idx_goals_user_deadline ON goals(user_id, deadline);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_goals_updated_at ON goals;
CREATE TRIGGER update_goals_updated_at 
  BEFORE UPDATE ON goals 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically mark goals as completed
CREATE OR REPLACE FUNCTION check_goal_completion()
RETURNS TRIGGER AS $$
BEGIN
  -- Auto-complete goal if current amount reaches target
  IF NEW.current_amount >= NEW.target_amount AND OLD.completed = FALSE THEN
    NEW.completed = TRUE;
    NEW.completed_at = NOW();
  END IF;
  
  -- Unmark completion if amount drops below target
  IF NEW.current_amount < NEW.target_amount AND OLD.completed = TRUE THEN
    NEW.completed = FALSE;
    NEW.completed_at = NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for goal completion
DROP TRIGGER IF EXISTS trigger_goal_completion ON goals;
CREATE TRIGGER trigger_goal_completion
  BEFORE UPDATE ON goals
  FOR EACH ROW EXECUTE FUNCTION check_goal_completion();

-- Function to get goal progress summary
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