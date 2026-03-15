import { getPool } from "../config/db";

export interface NoteRow {
  id: number;
  user_id: number;
  video_id: number;
  content: string;
  created_at: Date;
  updated_at: Date;
}

export async function getNote(userId: number, videoId: number): Promise<NoteRow | null> {
  const pool = getPool();
  const result = await pool.query(
    "SELECT id, user_id, video_id, content, created_at, updated_at FROM notes WHERE user_id = $1 AND video_id = $2 LIMIT 1",
    [userId, videoId]
  );
  const row = result.rows[0];
  if (!row) return null;
  return {
    id: row.id,
    user_id: row.user_id,
    video_id: row.video_id,
    content: row.content ?? "",
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export async function upsertNote(
  userId: number,
  videoId: number,
  content: string
): Promise<NoteRow> {
  const pool = getPool();
  const result = await pool.query(
    `INSERT INTO notes (user_id, video_id, content)
     VALUES ($1, $2, $3)
     ON CONFLICT (user_id, video_id) DO UPDATE SET
       content = EXCLUDED.content,
       updated_at = NOW()
     RETURNING id, user_id, video_id, content, created_at, updated_at`,
    [userId, videoId, content]
  );
  const row = result.rows[0];
  return {
    id: row.id,
    user_id: row.user_id,
    video_id: row.video_id,
    content: row.content ?? "",
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}
