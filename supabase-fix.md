# Fix Supabase Signup Issue

## Steps to fix in Supabase Dashboard:

1. Go to **Authentication** → **Settings**
2. **Disable email confirmations**:
   - Turn OFF "Enable email confirmations"
3. **Set Site URL**:
   - Add `http://localhost:3000`
4. **Enable signup**:
   - Make sure "Enable email signup" is ON

## Test signup with:
- Email: test@test.com  
- Password: 123456

The signup should work immediately without email confirmation.