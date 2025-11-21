// Debug script to test Supabase connection
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://lrogqplkdftckqxxpvor.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxyb2dxcGxrZGZ0Y2txeHhwdm9yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMxOTE3ODksImV4cCI6MjA3ODc2Nzc4OX0.YKXvg_hVrL3uX9SqY6hhqkotuQOvmmc5EjCQLI-7Ixw'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testSignup() {
  try {
    console.log('Testing Supabase connection...')
    
    const { data, error } = await supabase.auth.signUp({
      email: 'test@example.com',
      password: 'testpassword123'
    })
    
    console.log('Signup result:', { data, error })
    
    if (error) {
      console.error('Signup error:', error.message)
    } else {
      console.log('Signup successful!')
    }
  } catch (err) {
    console.error('Connection error:', err)
  }
}

testSignup()