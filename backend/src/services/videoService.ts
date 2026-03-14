import { getPool } from "../config/db";
import { isEnrolled } from "./enrollmentService";
import { getSubjectTree } from "./subjectService";

export interface VideoDetail {
  id: number;
  title: string;
  description: string | null;
  youtube_url: string;
  duration_seconds: number;
  section_id: number;
  section_title: string;
  subject_id: number;
  subject_title: string;
  previous_video_id: number | null;
  next_video_id: number | null;
  locked: boolean;
}

export type GetVideoResult =
  | { status: "ok"; data: VideoDetail }
  | { status: "not_found" }
  | { status: "forbidden" };

export async function getVideoById(videoId: number, userId: number): Promise<GetVideoResult> {
  const pool = getPool();
  const result = await pool.query(
    `SELECT v.id, v.title, v.description, v.youtube_url, v.duration_seconds, v.section_id, v.order_index,
            s.title AS section_title, s.subject_id,
            sub.title AS subject_title
     FROM videos v
     JOIN sections s ON s.id = v.section_id
     JOIN subjects sub ON sub.id = s.subject_id
     WHERE v.id = $1`,
    [videoId]
  );
  const row = result.rows[0];
  if (!row) return { status: "not_found" };

  const subjectId = row.subject_id;
  const enrolled = await isEnrolled(userId, subjectId);
  if (!enrolled) return { status: "forbidden" };

  const tree = await getSubjectTree(subjectId);
  if (!tree) return { status: "not_found" };

  const orderedVideoIds: number[] = [];
  for (const section of tree.sections) {
    for (const v of section.videos) {
      orderedVideoIds.push(v.id);
    }
  }

  const currentIndex = orderedVideoIds.indexOf(videoId);
  if (currentIndex === -1) return { status: "not_found" };

  const previousVideoId = currentIndex > 0 ? orderedVideoIds[currentIndex - 1]! : null;
  const nextVideoId =
    currentIndex < orderedVideoIds.length - 1 ? orderedVideoIds[currentIndex + 1]! : null;

  let locked: boolean;
  if (currentIndex === 0) {
    locked = false;
  } else {
    const previousId = orderedVideoIds[currentIndex - 1]!;
    const progressResult = await pool.query(
      "SELECT is_completed FROM video_progress WHERE user_id = $1 AND video_id = $2 LIMIT 1",
      [userId, previousId]
    );
    const completed = progressResult.rows[0]?.is_completed === true;
    locked = !completed;
  }

  const data: VideoDetail = {
    id: row.id,
    title: row.title,
    description: row.description ?? null,
    youtube_url: row.youtube_url,
    duration_seconds: row.duration_seconds,
    section_id: row.section_id,
    section_title: row.section_title,
    subject_id: row.subject_id,
    subject_title: row.subject_title,
    previous_video_id: previousVideoId,
    next_video_id: nextVideoId,
    locked,
  };
  return { status: "ok", data };
}
