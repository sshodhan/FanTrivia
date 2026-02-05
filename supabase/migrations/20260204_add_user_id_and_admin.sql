-- Migration: Add user_id and is_admin columns to users table
-- Date: 2026-02-04
-- Description: Adds secure user identification and admin access control

-- ============================================
-- 1. ADD NEW COLUMNS TO USERS TABLE
-- ============================================

-- Add user_id column (will become new primary key)
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS user_id TEXT;

-- Add is_admin column for admin access control
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT false;

-- ============================================
-- 2. POPULATE user_id FOR EXISTING USERS
-- ============================================

-- Generate user_id for existing users: username (no spaces/special chars) + _ + 4 random digits
UPDATE public.users 
SET user_id = REPLACE(REPLACE(REPLACE(username, ' ', ''), '''', ''), '-', '') || '_' || LPAD(FLOOR(RANDOM()*10000)::TEXT, 4, '0')
WHERE user_id IS NULL;

-- ============================================
-- 3. ADD CONSTRAINTS
-- ============================================

-- Make user_id NOT NULL after populating
ALTER TABLE public.users ALTER COLUMN user_id SET NOT NULL;

-- Add unique constraint on user_id
ALTER TABLE public.users ADD CONSTRAINT users_user_id_unique UNIQUE (user_id);

-- Add unique constraint on username (if not already exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'users_username_unique'
  ) THEN
    ALTER TABLE public.users ADD CONSTRAINT users_username_unique UNIQUE (username);
  END IF;
END $$;

-- ============================================
-- 4. CREATE INDEX FOR FASTER LOOKUPS
-- ============================================

CREATE INDEX IF NOT EXISTS idx_users_user_id ON public.users(user_id);
CREATE INDEX IF NOT EXISTS idx_users_username ON public.users(username);
CREATE INDEX IF NOT EXISTS idx_users_is_admin ON public.users(is_admin) WHERE is_admin = true;

-- ============================================
-- 5. UPDATE FOREIGN KEY REFERENCES (if needed)
-- ============================================

-- Note: The following updates the foreign key references from username to user_id
-- Only run this section if you want to migrate existing related tables

-- For daily_answers table (if it references username)
-- ALTER TABLE daily_answers DROP CONSTRAINT IF EXISTS daily_answers_username_fkey;
-- ALTER TABLE daily_answers ADD COLUMN IF NOT EXISTS user_id TEXT;
-- UPDATE daily_answers da SET user_id = (SELECT user_id FROM users WHERE username = da.username);
-- ALTER TABLE daily_answers ADD CONSTRAINT daily_answers_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE;

-- For photo_uploads table (if it references username)
-- ALTER TABLE photo_uploads DROP CONSTRAINT IF EXISTS photo_uploads_username_fkey;
-- ALTER TABLE photo_uploads ADD COLUMN IF NOT EXISTS user_id TEXT;
-- UPDATE photo_uploads pu SET user_id = (SELECT user_id FROM users WHERE username = pu.username);
-- ALTER TABLE photo_uploads ADD CONSTRAINT photo_uploads_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE;

-- For photo_likes table (if it references username)
-- ALTER TABLE photo_likes DROP CONSTRAINT IF EXISTS photo_likes_username_fkey;
-- ALTER TABLE photo_likes ADD COLUMN IF NOT EXISTS user_id TEXT;
-- UPDATE photo_likes pl SET user_id = (SELECT user_id FROM users WHERE username = pl.username);
-- ALTER TABLE photo_likes ADD CONSTRAINT photo_likes_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE;

-- ============================================
-- 6. GRANT ADMIN ACCESS (manual step)
-- ============================================

-- To make a user an admin, run:
-- UPDATE public.users SET is_admin = true WHERE username = 'YOUR_USERNAME';

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Check new schema
-- SELECT column_name, data_type, is_nullable, column_default 
-- FROM information_schema.columns 
-- WHERE table_name = 'users' AND table_schema = 'public'
-- ORDER BY ordinal_position;

-- Check user_id values
-- SELECT username, user_id, is_admin FROM public.users LIMIT 10;
