import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://oespmnkmdzhigvbyxyyk.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9lc3BtbmttZHpoaWd2Ynl4eXlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM1MjUyNjMsImV4cCI6MjA3OTEwMTI2M30.yP0gNuT6kkawrXGRDFn6SFdvbK-ZSr_frkCiFnZ9Ac8'

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)