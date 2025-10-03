-- 📊 User Database Queries
-- Use these queries after connecting to your SQLite database via SQLTools

-- 1. Show all users (most recent first)
SELECT * FROM users ORDER BY created_at DESC;

-- 2. Count total users
SELECT COUNT(*) as total_users FROM users;

-- 3. Show users created today
SELECT * FROM users 
WHERE date(created_at) = date('now');

-- 4. Show users by email domain
SELECT 
  email,
  name,
  SUBSTR(email, INSTR(email, '@') + 1) as email_domain,
  created_at
FROM users 
ORDER BY email_domain, created_at DESC;

-- 5. Show user creation timeline (by date)
SELECT 
  date(created_at) as creation_date,
  COUNT(*) as users_created
FROM users 
GROUP BY date(created_at)
ORDER BY creation_date DESC;

-- 6. Search for specific user by email or name
-- (Replace 'hello' with the name/email you want to search)
SELECT * FROM users 
WHERE email LIKE '%hello%' OR name LIKE '%hello%';

-- 7. Show table structure
PRAGMA table_info(users);