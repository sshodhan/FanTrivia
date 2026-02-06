-- Add DELETE policies for account reset functionality
-- These allow the service role to delete user data

-- Users: allow deletion
CREATE POLICY "Users can be deleted" ON users FOR DELETE USING (true);

-- Daily answers: allow deletion
CREATE POLICY "Answers can be deleted" ON daily_answers FOR DELETE USING (true);

-- Photo uploads: allow deletion  
CREATE POLICY "Photos can be deleted" ON photo_uploads FOR DELETE USING (true);

-- Photo likes: allow deletion
CREATE POLICY "Likes can be deleted" ON photo_likes FOR DELETE USING (true);
