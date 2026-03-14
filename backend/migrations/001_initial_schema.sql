-- LMS Initial Schema (PostgreSQL / Supabase)
-- Same structure as PRD. Run against your Supabase (or any Postgres) database.

-- Users
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (email)
);
CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);

-- Subjects (courses)
CREATE TABLE IF NOT EXISTS subjects (
  id SERIAL PRIMARY KEY,
  title VARCHAR(500) NOT NULL,
  slug VARCHAR(500) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  thumbnail VARCHAR(1000) DEFAULT NULL,
  is_published BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (slug)
);
CREATE INDEX IF NOT EXISTS idx_subjects_is_published ON subjects (is_published);

-- Sections (within a course)
CREATE TABLE IF NOT EXISTS sections (
  id SERIAL PRIMARY KEY,
  subject_id INTEGER NOT NULL REFERENCES subjects (id) ON DELETE CASCADE,
  title VARCHAR(500) NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_sections_subject_id ON sections (subject_id);
CREATE INDEX IF NOT EXISTS idx_sections_subject_order ON sections (subject_id, order_index);

-- Videos (lessons within a section)
CREATE TABLE IF NOT EXISTS videos (
  id SERIAL PRIMARY KEY,
  section_id INTEGER NOT NULL REFERENCES sections (id) ON DELETE CASCADE,
  title VARCHAR(500) NOT NULL,
  description TEXT,
  youtube_url VARCHAR(1000) NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  duration_seconds INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_videos_section_id ON videos (section_id);
CREATE INDEX IF NOT EXISTS idx_videos_section_order ON videos (section_id, order_index);

-- Enrollments
CREATE TABLE IF NOT EXISTS enrollments (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  subject_id INTEGER NOT NULL REFERENCES subjects (id) ON DELETE CASCADE,
  payment_status VARCHAR(50) NOT NULL DEFAULT 'pending',
  payment_id VARCHAR(255) DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, subject_id)
);
CREATE INDEX IF NOT EXISTS idx_enrollments_user_id ON enrollments (user_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_subject_id ON enrollments (subject_id);

-- Video progress (per user per video)
CREATE TABLE IF NOT EXISTS video_progress (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  video_id INTEGER NOT NULL REFERENCES videos (id) ON DELETE CASCADE,
  last_position_seconds INTEGER NOT NULL DEFAULT 0,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, video_id)
);
CREATE INDEX IF NOT EXISTS idx_video_progress_user_id ON video_progress (user_id);
CREATE INDEX IF NOT EXISTS idx_video_progress_video_id ON video_progress (video_id);

-- Refresh tokens (for JWT refresh)
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  token_hash VARCHAR(255) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens (user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token_hash ON refresh_tokens (token_hash);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires_at ON refresh_tokens (expires_at);
