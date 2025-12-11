import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://oespmnkmdzhigvbyxyyk.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9lc3BtbmttZHpoaWd2Ynl4eXlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM1MjUyNjMsImV4cCI6MjA3OTEwMTI2M30.yP0gNuT6kkawrXGRDFn6SFdvbK-ZSr_frkCiFnZ9Ac8'

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export interface Transaction {
  id: string
  user_id: string
  amount: number
  type: 'income' | 'expense'
  category: string
  description: string
  date: string
  payment_method?: 'cash' | 'card' | 'bank'
  recurring?: boolean
  recurring_period?: 'daily' | 'weekly' | 'monthly'
  created_at?: string
  updated_at?: string
}

export interface Budget {
  id: string
  user_id: string
  category: string
  amount: number
  period: string
  start_date: string
  end_date: string
  created_at?: string
  updated_at?: string
}

export interface Goal {
  id: string
  user_id: string
  name: string
  target_amount: number
  current_amount: number
  deadline: string
  status: string
  created_at?: string
  updated_at?: string
}

export interface UserSettings {
  user_id: string
  currency: string
  language: string
  date_format: string
  theme: string
  email_notifications: boolean
  push_notifications: boolean
  budget_alerts: boolean
  goal_reminders: boolean
  weekly_reports: boolean
  two_factor_auth: boolean
  login_alerts: boolean
}

export interface UserProfile {
  user_id: string
  full_name: string
  phone: string
  location: string
  date_of_birth: string
  bio: string
  avatar_url: string
}