# Supabase Setup Guide for Money Manager

## Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up/login
2. Click "New Project"
3. Choose your organization
4. Fill in project details:
   - **Name**: money-manager
   - **Database Password**: Create a strong password (save it!)
   - **Region**: Choose closest to your location
5. Click "Create new project"
6. Wait for project to be ready (2-3 minutes)

## Step 2: Get Project Credentials

1. In your Supabase dashboard, go to **Settings** → **API**
2. Copy these values:
   - **Project URL** (starts with https://...)
   - **anon public key** (starts with eyJ...)

## Step 3: Install Supabase Client

```bash
npm install @supabase/supabase-js
```

## Step 4: Create Environment File

Create `.env.local` in your project root:

```env
VITE_SUPABASE_URL=your_project_url_here
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

## Step 5: Set Up Database Schema

1. In Supabase dashboard, go to **SQL Editor**
2. Click "New Query"
3. Copy and paste the schema from `supabase-schema.sql`
4. **Remove the first line** (`ALTER DATABASE postgres SET...`) - not needed
5. Click "Run" to execute the schema

## Step 6: Enable Authentication

1. Go to **Authentication** → **Settings**
2. Under **Site URL**, add: `http://localhost:5173`
3. Under **Redirect URLs**, add: `http://localhost:5173/dashboard`
4. Enable **Email** provider (it's enabled by default)

## Step 7: Update AuthContext

Replace the mock authentication in `src/context/AuthContext.tsx`:

```tsx
import { createContext, useContext, useEffect, ReactNode } from 'react'
import { supabase } from '../lib/supabase'
import type { User } from '@supabase/supabase-js'

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<void>
  signup: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => setUser(session?.user ?? null)
    )

    return () => subscription.unsubscribe()
  }, [])

  const login = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }

  const signup = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) throw error
  }

  const logout = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  )
}
```

## Step 8: Test the Setup

1. Start your development server: `npm run dev`
2. Try signing up with a real email
3. Check your email for confirmation link
4. Try logging in after confirmation

## Step 9: Enable Row Level Security (RLS)

The schema already includes RLS policies, but verify in Supabase:

1. Go to **Database** → **Tables**
2. For each table (profiles, transactions, budgets, goals), click the table
3. Go to **RLS** tab and ensure policies are enabled

## Step 10: Production Setup

For production deployment:

1. Update **Site URL** in Authentication settings to your domain
2. Add production domain to **Redirect URLs**
3. Update environment variables in your hosting platform

## Troubleshooting

### Common Issues:

1. **"Invalid API key"**: Check your environment variables
2. **CORS errors**: Ensure Site URL is correctly set
3. **Email not received**: Check spam folder, verify email provider settings
4. **RLS errors**: Ensure user is authenticated and policies are correct

### Useful Supabase Commands:

```sql
-- Check if user exists
SELECT * FROM auth.users;

-- Check profiles table
SELECT * FROM profiles;

-- Reset user password (as admin)
UPDATE auth.users SET email_confirmed_at = NOW() WHERE email = 'user@example.com';
```

## Next Steps

After setup is complete:

1. Test all authentication flows
2. Create some test transactions
3. Verify data persistence
4. Test RLS policies
5. Set up real-time subscriptions (optional)

Your Money Manager app is now connected to Supabase! 🎉