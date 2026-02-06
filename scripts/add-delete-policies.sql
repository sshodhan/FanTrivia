-- Add DELETE policies for account reset functionality
-- These allow the service role to delete user data
-- Uses DROP IF EXISTS + CREATE to be idempotent

-- Users: allow deletion
DROP POLICY IF EXISTS "Users can be deleted" ON users;
CREATE POLICY "Users can be deleted" ON users FOR DELETE USING (true);

-- Daily answers: allow deletion
DROP POLICY IF EXISTS "Answers can be deleted" ON daily_answers;
CREATE POLICY "Answers can be deleted" ON daily_answers FOR DELETE USING (true);

-- Photo uploads: allow deletion  
DROP POLICY IF EXISTS "Photos can be deleted" ON photo_uploads;
CREATE POLICY "Photos can be deleted" ON photo_uploads FOR DELETE USING (true);

-- Photo likes: already has a DELETE policy ("Users can unlike photos"), no action needed
