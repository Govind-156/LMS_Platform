-- Certificates: one per user per course when all lessons are completed
CREATE TABLE IF NOT EXISTS certificates (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  course_id INTEGER NOT NULL REFERENCES subjects (id) ON DELETE CASCADE,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  certificate_url VARCHAR(1000) DEFAULT NULL,
  UNIQUE (user_id, course_id)
);
CREATE INDEX IF NOT EXISTS idx_certificates_user_id ON certificates (user_id);
CREATE INDEX IF NOT EXISTS idx_certificates_course_id ON certificates (course_id);
