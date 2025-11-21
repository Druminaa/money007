# Fix Supabase Email Confirmation

## Problem
Supabase is not sending confirmation emails after signup.

## Solution Steps

### Step 1: Configure Supabase Authentication Settings

1. Go to your Supabase Dashboard
2. Navigate to **Authentication** → **Settings**
3. Configure these settings:

**Site URL:**
```
http://localhost:5173
```

**Redirect URLs (add both):**
```
http://localhost:5173/confirm
http://localhost:5173/dashboard
```

**Email Confirmations:**
- ✅ Enable email confirmations: **ON**
- ✅ Enable email change confirmations: **ON**

### Step 2: Check Email Templates

1. Go to **Authentication** → **Email Templates**
2. Click on **Confirm signup** template
3. Ensure it's enabled and contains:

**Subject:** `Confirm your signup`

**Body (HTML):**
```html
<h2>Confirm your signup</h2>
<p>Follow this link to confirm your user:</p>
<p><a href="{{ .ConfirmationURL }}">Confirm your mail</a></p>
```

### Step 3: Test Email Delivery

1. Go to **Authentication** → **Users**
2. Check if users appear after signup
3. Look for `email_confirmed_at` field (should be null for unconfirmed)

### Step 4: Manual Email Confirmation (For Testing)

If emails still don't work, manually confirm users:

```sql
-- Run this in SQL Editor to manually confirm a user
UPDATE auth.users 
SET email_confirmed_at = NOW() 
WHERE email = 'your-test-email@example.com';
```

### Step 5: Check Supabase Logs

1. Go to **Logs** → **Auth Logs**
2. Look for email sending errors
3. Check for rate limiting or delivery failures

## Alternative: Disable Email Confirmation (Development Only)

For development, you can skip email confirmation:

1. Go to **Authentication** → **Settings**
2. Turn OFF **"Enable email confirmations"**
3. Users will be automatically confirmed

## Production Email Setup

For production, configure SMTP:

1. Go to **Authentication** → **Settings** → **SMTP Settings**
2. Configure with a service like:
   - **SendGrid** (recommended)
   - **Mailgun**
   - **AWS SES**
   - **Resend**

Example SendGrid setup:
- Host: `smtp.sendgrid.net`
- Port: `587`
- Username: `apikey`
- Password: `your-sendgrid-api-key`