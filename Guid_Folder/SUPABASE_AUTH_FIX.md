# Fix Supabase Authentication Issues

## Problem
After signup, users can't login because:
1. Email confirmation is required by default
2. Authentication settings need proper configuration

## Solution Steps

### Step 1: Configure Email Settings in Supabase

1. Go to **Authentication** → **Settings** in your Supabase dashboard
2. Under **User Signups**, set:
   - ✅ **Enable email confirmations**: ON (recommended for production)
   - ✅ **Enable email change confirmations**: ON
3. Under **Site URL**, add: `http://localhost:5173`
4. Under **Redirect URLs**, add: `http://localhost:5173/dashboard`

### Step 2: Configure Email Templates (Optional)

1. Go to **Authentication** → **Email Templates**
2. Customize the **Confirm signup** template if needed
3. The default template works fine for development

### Step 3: For Development Only (Skip Email Confirmation)

If you want to skip email confirmation during development:

1. Go to **Authentication** → **Settings**
2. Under **User Signups**, turn OFF **Enable email confirmations**
3. Users can login immediately after signup

### Step 4: Test the Flow

**With Email Confirmation (Recommended):**
1. User signs up → Gets "Check your email" message
2. User clicks confirmation link in email
3. User can now login successfully

**Without Email Confirmation (Dev Only):**
1. User signs up → Automatically logged in
2. No email confirmation needed

## Updated Schema (No Changes Needed)

Your current schema is correct. The issue is configuration, not database structure.

## Email Provider Setup (Production)

For production, configure a proper email provider:

1. Go to **Authentication** → **Settings** → **SMTP Settings**
2. Configure with services like:
   - SendGrid
   - Mailgun  
   - AWS SES
   - Resend

## Troubleshooting

### User Can't Login After Signup
- Check if email confirmation is enabled
- Look for confirmation email in spam folder
- Verify user exists in **Authentication** → **Users**
- Check if `email_confirmed_at` is null

### No Confirmation Email Received
- Check SMTP settings
- Verify email templates are enabled
- Check Supabase logs for email delivery errors

### Manual Email Confirmation (Dev Only)
If needed, manually confirm a user in SQL Editor:
```sql
UPDATE auth.users 
SET email_confirmed_at = NOW() 
WHERE email = 'user@example.com';
```