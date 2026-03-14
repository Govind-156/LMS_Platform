import { getPool } from "../config/db";

export interface VideoProgressRow {
  last_position_seconds: number;
  is_completed: boolean;
}

export async function getProgress(
  userId: number,
  videoId: number
): Promise<VideoProgressRow | null> {
  const pool = getPool();
  const result = await pool.query(
    "SELECT last_position_seconds, is_completed FROM video_progress WHERE user_id = $1 AND video_id = $2 LIMIT 1",
    [userId, videoId]
  );
  const row = result.rows[0];
  if (!row) return null;
  return {
    last_position_seconds: row.last_position_seconds ?? 0,
    is_completed: Boolean(row.is_completed),
  };
}

export interface UpsertProgressInput {
  last_position_seconds: number;
  is_completed: boolean;
}

export async function upsertProgress(
  userId: number,
  videoId: number,
  input: UpsertProgressInput
): Promise<void> {
  const pool = getPool();
  const completedAt = input.is_completed ? new Date() : null;
  await pool.query(
    `INSERT INTO video_progress (user_id, video_id, last_position_seconds, is_completed, completed_at)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (user_id, video_id) DO UPDATE SET
       last_position_seconds = EXCLUDED.last_position_seconds,
       is_completed = EXCLUDED.is_completed,
       completed_at = CASE WHEN EXCLUDED.is_completed = true THEN COALESCE(video_progress.completed_at, NOW()) ELSE NULL END,
       updated_at = NOW()`,
    [userId, videoId, input.last_position_seconds, input.is_completed, completedAt]
  );
}

export async function getSubjectProgress(
  userId: number,
  subjectId: number
): Promise<{ completed: number; total: number }> {
  const pool = getPool();
  const totalResult = await pool.query(
    `SELECT COUNT(v.id)::int AS total FROM videos v
     JOIN sections s ON s.id = v.section_id
     WHERE s.subject_id = $1`,
    [subjectId]
  );
  const total = Number(totalResult.rows[0]?.total ?? 0);
  const completedResult = await pool.query(
    `SELECT COUNT(*)::int AS completed FROM video_progress vp
     JOIN videos v ON v.id = vp.video_id
     JOIN sections s ON s.id = v.section_id
     WHERE s.subject_id = $1 AND vp.user_id = $2 AND vp.is_completed = true`,
    [subjectId, userId]
  );
  const completed = Number(completedResult.rows[0]?.completed ?? 0);
  return { completed, total };
}
