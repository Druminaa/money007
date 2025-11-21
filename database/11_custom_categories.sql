-- Custom Categories Table
-- This table stores user-defined custom categories for transactions

CREATE TABLE IF NOT EXISTS custom_categories (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  type VARCHAR(10) NOT NULL CHECK (type IN ('income', 'expense')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure unique category names per user and type
  UNIQUE(user_id, name, type)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_custom_categories_user_id ON custom_categories(user_id);
CREATE INDEX IF NOT EXISTS idx_custom_categories_type ON custom_categories(type);
CREATE INDEX IF NOT EXISTS idx_custom_categories_user_type ON custom_categories(user_id, type);

-- Enable RLS (Row Level Security)
ALTER TABLE custom_categories ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own custom categories" ON custom_categories
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own custom categories" ON custom_categories
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own custom categories" ON custom_categories
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own custom categories" ON custom_categories
  FOR DELETE USING (auth.uid() = user_id);

-- Create trigger for updated_at
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