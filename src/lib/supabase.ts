import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types
export interface Transaction {
  id: string
  user_id: string
  description: string
  amount: number
  type: 'income' | 'expense'
  category: string
  date: string
  recurring?: boolean
  recurring_period?: 'daily' | 'weekly' | 'monthly'
  created_at: string
  updated_at: string
}

export interface Budget {
  id: string
  user_id: string
  category: string
  amount: number
  month: string
  created_at: string
  updated_at: string
}

export interface Goal {
  id: string
  user_id: string
  title: string
  target_amount: number
  current_amount: number
  deadline: string
  completed: boolean
  completed_at?: string
  created_at: string
  updated_at: string
}

export interface Profile {
  id: string
  email: string
  full_name?: string
  avatar_url?: string
  created_at: string
  updated_at: string
}

export interface UserSettings {
  id: string
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
  created_at: string
  updated_at: string
}

export interface UserProfile {
  id: string
  user_id: string
  full_name: string
  phone?: string
  location?: string
  date_of_birth?: string
  bio?: string
  avatar_url?: string
  created_at: string
  updated_at: string
}

export interface CustomCategory {
  id: number
  user_id: string
  name: string
  type: 'income' | 'expense'
  created_at: string
  updated_at: string
}