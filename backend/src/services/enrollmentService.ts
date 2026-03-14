import { getPool } from "../config/db";

export interface EnrolledCourse {
  id: number;
  title: string;
  slug: string;
  description: string | null;
  price: number;
  thumbnail: string | null;
  subject_id: number;
}

export async function createEnrollment(
  userId: number,
  subjectId: number,
  options?: { payment_status?: string; payment_id?: string }
): Promise<{ created: boolean; error?: string }> {
  const pool = getPool();
  const paymentStatus = options?.payment_status ?? "completed";
  const paymentId = options?.payment_id ?? null;
  try {
    await pool.query(
      "INSERT INTO enrollments (user_id, subject_id, payment_status, payment_id) VALUES ($1, $2, $3, $4)",
      [userId, subjectId, paymentStatus, paymentId]
    );
    return { created: true };
  } catch (err: unknown) {
    const code = err && typeof err === "object" && "code" in err ? (err as { code: string }).code : "";
    if (code === "23505") {
      return { created: false, error: "Already enrolled" };
    }
    throw err;
  }
}

export async function getEnrolledCourses(userId: number): Promise<EnrolledCourse[]> {
  const pool = getPool();
  const result = await pool.query(
    `SELECT s.id AS subject_id, s.title, s.slug, s.description, s.price, s.thumbnail
     FROM enrollments e
     JOIN subjects s ON s.id = e.subject_id
     WHERE e.user_id = $1
     ORDER BY e.created_at DESC`,
    [userId]
  );
  return result.rows.map((r: Record<string, unknown>) => ({
    id: r.subject_id as number,
    title: r.title as string,
    slug: r.slug as string,
    description: (r.description as string | null) ?? null,
    price: Number(r.price),
    thumbnail: (r.thumbnail as string | null) ?? null,
    subject_id: r.subject_id as number,
  }));
}

export async function isEnrolled(userId: number, subjectId: number): Promise<boolean> {
  const pool = getPool();
  const result = await pool.query(
    "SELECT 1 FROM enrollments WHERE user_id = $1 AND subject_id = $2 LIMIT 1",
    [userId, subjectId]
  );
  return result.rows.length > 0;
}
