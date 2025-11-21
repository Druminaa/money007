-- =============================================
-- MONEY MANAGER DATABASE SETUP
-- =============================================
-- Run this file first to set up the complete database structure
-- Execute files in order: 00_setup.sql → 01_profiles.sql → 02_transactions.sql → etc.

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

-- Common categories for transactions and budgets
CREATE TABLE IF NOT EXISTS categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  type TEXT CHECK (type IN ('income', 'expense', 'both')) DEFAULT 'both',
  icon TEXT,
  color TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default categories
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

-- Function to get categories by type
CREATE OR REPLACE FUNCTION get_categories(category_type TEXT DEFAULT 'both')
RETURNS TABLE(name TEXT, icon TEXT, color TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT c.name, c.icon, c.color
  FROM categories c
  WHERE c.type = category_type OR c.type = 'both'
  ORDER BY c.name;
END;
$$ LANGUAGE plpgsql;

-- Database info and version
CREATE TABLE IF NOT EXISTS db_info (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

INSERT INTO db_info (key, value) VALUES
  ('version', '1.0.0'),
  ('created_at', NOW()::TEXT),
  ('description', 'Money Manager Database Schema')
ON CONFLICT (key) DO UPDATE SET 
  value = EXCLUDED.value,
  updated_at = NOW();