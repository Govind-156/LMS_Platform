/**
 * Seed the LMS with popular programming and AI courses from YouTube videos.
 * Each video becomes its own course. Structure: Course → Section → Lesson (YouTube video).
 *
 * Auto-generated per course: title (from list), thumbnail (maxresdefault), price ($19–$49).
 *
 * Run: npm run seed:courses
 * Requires DATABASE_URL in backend/.env
 */
import "./load-env";
import { getPool, closePool } from "../src/config/db";

const COURSES: { title: string; url: string }[] = [
  { title: "Docker Full Course", url: "https://www.youtube.com/watch?v=3c-iBn73dDE" },
  { title: "Python Full Course", url: "https://www.youtube.com/watch?v=_uQrJ0TkZlc" },
  { title: "JavaScript Full Course", url: "https://www.youtube.com/watch?v=PkZNo7MFNFg" },
  { title: "TypeScript Full Course", url: "https://www.youtube.com/watch?v=30LWjhZzg50" },
  { title: "Agentic AI", url: "https://www.youtube.com/watch?v=F8NKVhkZZWI" },
  { title: "Generative AI", url: "https://www.youtube.com/watch?v=mEsleV16qdo" },
  { title: "Python with AI", url: "https://www.youtube.com/watch?v=kCc8FmEb1nY" },
];

function extractYouTubeVideoId(url: string): string | null {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : null;
}

/** Thumbnail: https://img.youtube.com/vi/VIDEO_ID/maxresdefault.jpg */
function thumbnailUrl(videoId: string): string {
  return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
}

/** Random price between $19 and $49 (inclusive). */
function randomPrice(): number {
  return Math.floor(19 + Math.random() * (49 - 19 + 1));
}

async function run(): Promise<void> {
  if (!process.env.DATABASE_URL?.trim()) {
    console.error("DATABASE_URL is not set. Add it to backend/.env");
    process.exit(1);
  }
  const pool = getPool();
  try {
    let created = 0;
    for (let i = 0; i < COURSES.length; i++) {
      const { title, url } = COURSES[i];

      const videoId = extractYouTubeVideoId(url);
      if (!videoId) {
        console.warn(`Skipping invalid URL: ${url}`);
        continue;
      }

      const slug = `course-${videoId}-${Date.now()}-${i}`;
      const description = `Learn with this full course. Watch the video and track your progress.`;
      const price = randomPrice();
      const thumbnail = thumbnailUrl(videoId);

      const subjectResult = await pool.query(
        `INSERT INTO subjects (title, slug, description, price, thumbnail, is_published)
         VALUES ($1, $2, $3, $4, $5, true)
         RETURNING id`,
        [title, slug, description, price, thumbnail]
      );
      const subjectId = subjectResult.rows[0].id as number;

      const sectionResult = await pool.query(
        `INSERT INTO sections (subject_id, title, order_index)
         VALUES ($1, $2, 0)
         RETURNING id`,
        [subjectId, "Main"]
      );
      const sectionId = sectionResult.rows[0].id as number;

      await pool.query(
        `INSERT INTO videos (section_id, title, youtube_url, order_index, duration_seconds)
         VALUES ($1, $2, $3, 0, 0)`,
        [sectionId, title, url]
      );

      created++;
      console.log(`Created "${title}" (id ${subjectId}) — $${price}, 1 lesson.`);
    }
    console.log(`Done. Created ${created} courses (one per YouTube video).`);
  } catch (err) {
    console.error("Seed failed:", err);
    process.exit(1);
  } finally {
    await closePool();
  }
}

run();
