import { getPool } from "../config/db";

export interface SubjectRow {
  id: number;
  title: string;
  slug: string;
  description: string | null;
  price: number;
  thumbnail: string | null;
  is_published: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface SubjectListItem {
  id: number;
  title: string;
  slug: string;
  description: string | null;
  price: number;
  thumbnail: string | null;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface SectionRow {
  id: number;
  subject_id: number;
  title: string;
  order_index: number;
}

export interface VideoRow {
  id: number;
  section_id: number;
  title: string;
  description: string | null;
  youtube_url: string;
  order_index: number;
  duration_seconds: number;
}

export interface SectionWithVideos {
  id: number;
  subject_id: number;
  title: string;
  order_index: number;
  videos: Array<{
    id: number;
    section_id: number;
    title: string;
    description: string | null;
    youtube_url: string;
    order_index: number;
    duration_seconds: number;
  }>;
}

export interface SubjectTree {
  subject_id: number;
  sections: SectionWithVideos[];
}

function toSubjectListItem(row: Record<string, unknown>): SubjectListItem {
  return {
    id: row.id as number,
    title: row.title as string,
    slug: row.slug as string,
    description: (row.description as string | null) ?? null,
    price: Number(row.price),
    thumbnail: (row.thumbnail as string | null) ?? null,
    is_published: Boolean(row.is_published),
    created_at: row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at),
    updated_at: row.updated_at instanceof Date ? row.updated_at.toISOString() : String(row.updated_at),
  };
}

export async function getPublishedSubjects(): Promise<SubjectListItem[]> {
  const pool = getPool();
  const result = await pool.query(
    "SELECT id, title, slug, description, price, thumbnail, is_published, created_at, updated_at FROM subjects WHERE is_published = true ORDER BY title"
  );
  return result.rows.map(toSubjectListItem);
}

export async function getSubjectById(subjectId: number): Promise<SubjectListItem | null> {
  const pool = getPool();
  const result = await pool.query(
    "SELECT id, title, slug, description, price, thumbnail, is_published, created_at, updated_at FROM subjects WHERE id = $1 AND is_published = true",
    [subjectId]
  );
  const row = result.rows[0];
  if (!row) return null;
  return toSubjectListItem(row);
}

export async function getSubjectTree(subjectId: number): Promise<SubjectTree | null> {
  const pool = getPool();
  const subjectResult = await pool.query(
    "SELECT id FROM subjects WHERE id = $1 AND is_published = true",
    [subjectId]
  );
  if (!subjectResult.rows[0]) return null;

  const sectionsResult = await pool.query(
    "SELECT id, subject_id, title, order_index FROM sections WHERE subject_id = $1 ORDER BY order_index ASC",
    [subjectId]
  );
  const sections = sectionsResult.rows;

  const sectionsWithVideos: SectionWithVideos[] = [];

  for (const section of sections) {
    const videosResult = await pool.query(
      "SELECT id, section_id, title, description, youtube_url, order_index, duration_seconds FROM videos WHERE section_id = $1 ORDER BY order_index ASC",
      [section.id]
    );
    const videos = videosResult.rows;
    sectionsWithVideos.push({
      id: section.id,
      subject_id: section.subject_id,
      title: section.title,
      order_index: section.order_index,
      videos: videos.map((v: Record<string, unknown>) => ({
        id: v.id as number,
        section_id: v.section_id as number,
        title: v.title as string,
        description: (v.description as string | null) ?? null,
        youtube_url: v.youtube_url as string,
        order_index: v.order_index as number,
        duration_seconds: v.duration_seconds as number,
      })),
    });
  }

  return {
    subject_id: subjectId,
    sections: sectionsWithVideos,
  };
}
