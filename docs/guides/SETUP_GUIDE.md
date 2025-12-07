# Money Manager - Complete Setup Guide

## 📋 Table of Contents
1. [Prerequisites](#prerequisites)
2. [Installation](#installation)
3. [Supabase Setup](#supabase-setup)
4. [Environment Configuration](#environment-configuration)
5. [Database Schema](#database-schema)
6. [Storage Setup](#storage-setup)
7. [Running the Application](#running-the-application)
8. [Deployment](#deployment)
9. [Troubleshooting](#troubleshooting)

---

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Supabase account (free tier works)
- Git

---

## Installation

### 1. Clone the Repository
```bash
git clone <repository-url>
cd money-manager
```

### 2. Install Dependencies
```bash
npm install
```

---

## Supabase Setup

### 1. Create Supabase Project

1. Go to https://app.supabase.com
2. Click **New Project**
3. Fill in:
   - **Name**: money-manager
   - **Database Password**: (save this securely)
   - **Region**: Choose closest to you
4. Click **Create new project**
5. Wait 2-3 minutes for setup

### 2. Get API Keys

1. Go to **Settings** → **API**
2. Copy these values:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon public** key

---

## Environment Configuration

### Create `.env.local` file in project root:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

Replace with your actual values from Supabase.

---

## Database Schema

### 1. Go to Supabase SQL Editor

Dashboard → SQL Editor → New Query

### 2. Run This Complete Schema:

```sql
-- ============================================
-- TRANSACTIONS TABLE
-- ============================================
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  category TEXT NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  payment_method TEXT CHECK (payment_method IN ('cash', 'card', 'bank')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own transactions"
ON transactions FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transactions"
ON transactions FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own transactions"
ON transactions FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own transactions"
ON transactions FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Index
CREATE INDEX idx_transactions_user_date ON transactions(user_id, date DESC);

-- ============================================
-- BUDGETS TABLE
-- ============================================
CREATE TABLE budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  category TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  period TEXT NOT NULL CHECK (period IN ('monthly', 'yearly')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own budgets"
ON budgets FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own budgets"
ON budgets FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own budgets"
ON budgets FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own budgets"
ON budgets FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- ============================================
-- GOALS TABLE
-- ============================================
CREATE TABLE goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  name TEXT NOT NULL,
  target_amount DECIMAL(10, 2) NOT NULL,
  current_amount DECIMAL(10, 2) DEFAULT 0,
  deadline DATE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own goals"
ON goals FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own goals"
ON goals FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own goals"
ON goals FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own goals"
ON goals FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- ============================================
-- USER PROFILES TABLE
-- ============================================
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users UNIQUE NOT NULL,
  full_name TEXT,
  phone TEXT,
  location TEXT,
  date_of_birth DATE,
  bio TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own profile"
ON user_profiles FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
ON user_profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
ON user_profiles FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Auto-create profile trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (user_id, full_name)
  VALUES (new.id, new.raw_user_meta_data->>'full_name');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- USER SETTINGS TABLE
-- ============================================
CREATE TABLE user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users UNIQUE NOT NULL,
  currency TEXT DEFAULT 'INR',
  language TEXT DEFAULT 'en',
  date_format TEXT DEFAULT 'dd-mm-yyyy',
  theme TEXT DEFAULT 'light',
  email_notifications BOOLEAN DEFAULT true,
  push_notifications BOOLEAN DEFAULT true,
  budget_alerts BOOLEAN DEFAULT true,
  goal_reminders BOOLEAN DEFAULT true,
  weekly_reports BOOLEAN DEFAULT false,
  two_factor_auth BOOLEAN DEFAULT false,
  login_alerts BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own settings"
ON user_settings FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings"
ON user_settings FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own settings"
ON user_settings FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- ============================================
-- CUSTOM CATEGORIES TABLE
-- ============================================
CREATE TABLE custom_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  icon TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE custom_categories ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own categories"
ON custom_categories FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own categories"
ON custom_categories FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own categories"
ON custom_categories FOR DELETE
TO authenticated
USING (auth.uid() = user_id);
```

### 3. Click **Run** to execute

---

## Storage Setup

### 1. Create Storage Bucket

1. Go to **Storage** in Supabase dashboard
2. Click **New bucket**
3. Configure:
   - **Name**: `avatars`
   - **Public bucket**: Toggle **ON**
4. Click **Create bucket**

### 2. Add Storage Policies

Go to **Storage** → **avatars** → **Policies** → **New Policy** → **For full customization**

Run these policies:

```sql
-- Public read access
CREATE POLICY "Public read access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'avatars' );

-- Authenticated users can upload
CREATE POLICY "Authenticated upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'avatars' AND auth.role() = 'authenticated' );

-- Authenticated users can update
CREATE POLICY "Authenticated update"
ON storage.objects FOR UPDATE
TO authenticated
USING ( bucket_id = 'avatars' AND auth.role() = 'authenticated' );

-- Authenticated users can delete
CREATE POLICY "Authenticated delete"
ON storage.objects FOR DELETE
TO authenticated
USING ( bucket_id = 'avatars' AND auth.role() = 'authenticated' );
```

---

## Running the Application

### Development Mode

```bash
npm run dev
```

Open http://localhost:5173

### Build for Production

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

---

## Deployment

### Deploy to Netlify

1. **Push to GitHub**
```bash
git add .
git commit -m "Initial commit"
git push origin main
```

2. **Connect to Netlify**
   - Go to https://app.netlify.com
   - Click **Add new site** → **Import an existing project**
   - Choose **GitHub** and select your repository
   - Configure:
     - **Build command**: `npm run build`
     - **Publish directory**: `dist`
   - Add environment variables:
     - `VITE_SUPABASE_URL`
     - `VITE_SUPABASE_ANON_KEY`
   - Click **Deploy site**

3. **Configure Redirects**
   - Already configured in `public/_redirects`
   - Ensures SPA routing works

### Deploy to Vercel

1. **Install Vercel CLI**
```bash
npm i -g vercel
```

2. **Deploy**
```bash
vercel
```

3. **Add Environment Variables**
```bash
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY
```

4. **Deploy to Production**
```bash
vercel --prod
```

---

## Troubleshooting

### Issue: "Failed to fetch" in Settings

**Solution**: The app uses localStorage for settings. No action needed.

### Issue: "new row violates row-level security policy"

**Solution**: 
1. Check RLS policies are created
2. Verify user is authenticated
3. Run the complete schema again

### Issue: Photo upload fails

**Solution**:
1. Verify `avatars` bucket exists and is PUBLIC
2. Check storage policies are added
3. Verify environment variables are set
4. Check browser console for errors

### Issue: Transactions not saving

**Solution**:
1. Check `transactions` table exists
2. Verify RLS policies are enabled
3. Check user is authenticated
4. Look at browser console for errors

### Issue: Login/Signup not working

**Solution**:
1. Verify Supabase URL and key in `.env.local`
2. Check email confirmation is disabled in Supabase:
   - Go to **Authentication** → **Providers** → **Email**
   - Toggle OFF "Confirm email"
3. Restart dev server after changing `.env.local`

### Issue: Build fails

**Solution**:
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm run build
```

---

## Features Overview

✅ **Authentication**: Sign up, Login, Logout, Password Reset
✅ **Dashboard**: Overview of finances with charts
✅ **Transactions**: Add, edit, delete income/expense with payment methods
✅ **Budget**: Set and track category budgets
✅ **Goals**: Create and monitor financial goals
✅ **Analytics**: Visual charts and insights
✅ **Borrow & Loan**: Track money borrowed and lent
✅ **Settings**: Profile, preferences, notifications, security
✅ **Export**: PDF and CSV export functionality
✅ **Responsive**: Works on mobile, tablet, and desktop

---

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Routing**: React Router DOM
- **Icons**: Lucide React
- **Backend**: Supabase (Auth + Database + Storage)
- **State**: Zustand + Context API
- **Charts**: Recharts
- **PDF**: jsPDF

---

## Project Structure

```
money-manager/
├── src/
│   ├── components/        # Reusable components
│   ├── context/          # React contexts
│   ├── hooks/            # Custom hooks
│   ├── lib/              # Supabase config
│   ├── pages/            # Page components
│   ├── services/         # API services
│   ├── types/            # TypeScript types
│   ├── utils/            # Utility functions
│   ├── App.tsx           # Main app
│   └── main.tsx          # Entry point
├── public/               # Static assets
├── docs/                 # Documentation
├── .env.local           # Environment variables
└── package.json         # Dependencies
```

---

## Support

For issues or questions:
1. Check this guide first
2. Review browser console for errors
3. Check Supabase dashboard for data
4. Verify all environment variables are set

---

## License

MIT License

---

**Setup Complete! 🎉**

Your Money Manager app is now ready to use. Start by creating an account and adding your first transaction!
