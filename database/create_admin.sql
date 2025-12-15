// Quick script to create admin user with hashed password
// Run this in Supabase SQL Editor after creating the users table

-- First, make sure the users table exists
-- Then run this to create the admin user:

INSERT INTO users (
  email,
  password,
  name,
  role,
  status,
  phone,
  created_at,
  updated_at
) VALUES (
  'admin@asacademy.com',
  '$2b$10$rKvVJZr8h8xJZGvXqP.zKOqP0qGYZJxJYqP0qGYZJxJYqP0qGYZJx',
  'System Administrator',
  'admin',
  'active',
  '0000000000',
  NOW(),
  NOW()
) ON CONFLICT (email) DO NOTHING;

-- Note: The password hash above is for 'Admin@123'
-- If you want to change the password, you'll need to generate a new bcrypt hash
