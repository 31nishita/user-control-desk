# Supabase Connection Guide for VS Code

## Your Supabase Project Details:
- **URL**: https://isiddstwiwphhopnqsbi.supabase.co
- **Project Reference**: isiddstwiwphhopnqsbi
- **Anon Key**: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (from your .env file)

## Database Connection Details:
- **Host**: aws-0-ap-south-1.pooler.supabase.com
- **Port**: 6543 (transaction mode) or 5432 (session mode)
- **Database**: postgres
- **Username**: postgres.isiddstwiwphhopnqsbi
- **Password**: [Your Supabase database password - check your Supabase dashboard]

## Steps to Connect:

### Method 1: Using SQLTools Extension (Installed)
1. Open VS Code
2. Press `Ctrl+Shift+P` to open Command Palette
3. Type "SQLTools: Connect" and select it
4. Choose "Supabase - user-control-desk"
5. Enter your database password when prompted

### Method 2: Using Supabase Dashboard
1. Go to: https://supabase.com/dashboard/project/isiddstwiwphhopnqsbi
2. Navigate to: Settings > Database
3. Look for "Connection pooling" or "Direct connection"
4. Copy the connection string

### Method 3: Install Database Client
You can also install one of these database clients:
- **DBeaver** (Free): https://dbeaver.io/download/
- **pgAdmin** (PostgreSQL focused): https://www.pgadmin.org/download/
- **TablePlus** (Paid but nice UI): https://tableplus.com/

## Viewing Your Users Table:
Once connected, you can run these SQL queries to see your user data:

```sql
-- View all profiles (if you have profiles table)
SELECT * FROM profiles;

-- View auth users (system table)
SELECT * FROM auth.users;

-- Count total users
SELECT COUNT(*) as total_users FROM auth.users;
```

## Environment Variables Needed:
Make sure these are in your .env file:
```
VITE_SUPABASE_URL=https://isiddstwiwphhopnqsbi.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlzaWRkc3R3aXdwaGhvcG5xc2JpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkyMTQ2NTUsImV4cCI6MjA3NDc5MDY1NX0.FBO1nS5lBvb94b6QUxJua15h7cg49b43d3vyTNuqgwM

# Add these if you have them:
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```