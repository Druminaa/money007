# Money Manager Database Structure

## Overview
Complete Supabase database schema for the Money Manager application with Row Level Security (RLS) policies, triggers, and analytics functions.

## File Structure

### Core Tables
- `00_setup.sql` - Initial setup, extensions, and common utilities
- `01_profiles.sql` - User profiles extending auth.users
- `02_transactions.sql` - Financial transactions management
- `03_budgets.sql` - Budget planning and tracking
- `04_goals.sql` - Financial goals and progress tracking
- `05_analytics.sql` - Analytics views and reporting functions
- `06_audit_logs.sql` - Activity tracking and audit trail

## Installation Order

Execute the SQL files in the following order:

```bash
1. 00_setup.sql      # Database setup and common utilities
2. 01_profiles.sql   # User profiles table
3. 02_transactions.sql # Transactions table
4. 03_budgets.sql    # Budgets table
5. 04_goals.sql      # Goals table
6. 05_analytics.sql  # Analytics functions
7. 06_audit_logs.sql # Audit logging system
```

## Security Features

### Row Level Security (RLS)
- All tables have RLS enabled
- Users can only access their own data
- Policies enforce user_id matching auth.uid()

### Audit Logging
- Automatic tracking of all data changes
- Stores old and new values in JSONB format
- User-specific audit trails

## Key Features

### Transactions
- Income and expense tracking
- Category-based organization
- Recurring transaction support
- Monthly summary functions

### Budgets
- Category-based budget limits
- Automatic spending comparison
- Budget vs actual analysis
- Over-budget alerts

### Goals
- Target amount tracking
- Progress monitoring
- Automatic completion detection
- Deadline management

### Analytics
- Monthly trend analysis
- Expense breakdown by category
- Spending pattern analysis
- Financial summary views

## Functions Available

### Transaction Analytics
- `get_monthly_summary(user_id, month)` - Monthly income/expense summary
- `get_expense_breakdown(user_id, start_date, end_date)` - Category breakdown
- `get_monthly_trends(user_id, months_back)` - Historical trends

### Budget Analysis
- `get_budget_analysis(user_id, month)` - Budget vs actual comparison

### Goal Tracking
- `get_goals_summary(user_id)` - Overall goal progress

### User Activity
- `get_user_activity(user_id, days_back)` - Activity summary

## Usage Examples

### Get Monthly Summary
```sql
SELECT * FROM get_monthly_summary(auth.uid(), '2024-01');
```

### Get Expense Breakdown
```sql
SELECT * FROM get_expense_breakdown(
  auth.uid(), 
  '2024-01-01'::DATE, 
  '2024-01-31'::DATE
);
```

### Get Budget Analysis
```sql
SELECT * FROM get_budget_analysis(auth.uid(), '2024-01');
```

## Indexes

All tables include optimized indexes for:
- User-specific queries (user_id)
- Date-based filtering
- Category grouping
- Performance optimization

## Triggers

### Automatic Timestamps
- `updated_at` fields automatically updated on record changes

### Profile Creation
- Automatic profile creation when new user signs up

### Goal Completion
- Automatic goal completion when target amount reached

### Audit Logging
- Automatic audit trail for all data changes

## Data Types

### Custom Enums
- `transaction_type`: 'income', 'expense'
- `recurring_period`: 'daily', 'weekly', 'monthly'
- `audit_action`: 'INSERT', 'UPDATE', 'DELETE'

### Decimal Precision
- All monetary amounts use DECIMAL(10,2) for precision

## Backup and Migration

### Export Schema
```bash
pg_dump --schema-only your_db > schema_backup.sql
```

### Export Data
```bash
pg_dump --data-only your_db > data_backup.sql
```

## Performance Considerations

- Composite indexes for common query patterns
- Partitioning recommended for large transaction volumes
- Regular VACUUM and ANALYZE for optimal performance
- Consider archiving old audit logs periodically