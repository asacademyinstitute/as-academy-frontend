-- Fix Missing Phone Numbers in Users Table

-- 1. Check which users have empty/null phone numbers
SELECT id, name, email, phone, role
FROM users
WHERE phone IS NULL OR phone = '' OR phone = 'null';

-- 2. Update specific user's phone number (replace with actual email and phone)
UPDATE users
SET phone = '1234567890'  -- Replace with actual phone number
WHERE email = 'saad123@gmail.com';

-- 3. Update ALL users with empty phone to a default value
UPDATE users
SET phone = '0000000000'
WHERE phone IS NULL OR phone = '' OR phone = 'null';

-- 4. Verify the update
SELECT id, name, email, phone, role
FROM users
WHERE email = 'saad123@gmail.com';
