-- Reset all course data (run manually when you want to wipe courses).
-- Order respects foreign keys. Does NOT touch users or refresh_tokens.
--
-- Option 1: Run the Node script (recommended)
--   npm run reset:courses
--
-- Option 2: Run this SQL manually (e.g. Supabase SQL Editor or psql)
--   psql $DATABASE_URL -f scripts/sql/reset-course-data.sql

DELETE FROM video_progress;
DELETE FROM videos;
DELETE FROM sections;
DELETE FROM payments;
DELETE FROM enrollments;
DELETE FROM subjects;
