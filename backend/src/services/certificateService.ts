import PDFDocument from "pdfkit";
import { getPool } from "../config/db";

const PLATFORM_NAME = "AI Learning Platform";

export interface CertificateRow {
  id: number;
  user_id: number;
  course_id: number;
  issued_at: Date;
  certificate_url: string | null;
}

export interface CertificateWithDetails {
  id: number;
  user_id: number;
  course_id: number;
  issued_at: string;
  certificate_url: string | null;
  user_name: string;
  course_title: string;
}

function toCertificateWithDetails(row: Record<string, unknown>): CertificateWithDetails {
  const issuedAt = row.issued_at;
  const issuedAtStr =
    issuedAt instanceof Date ? issuedAt.toISOString() : String(issuedAt ?? "");
  return {
    id: row.id as number,
    user_id: row.user_id as number,
    course_id: row.course_id as number,
    issued_at: issuedAtStr,
    certificate_url: (row.certificate_url as string | null) ?? null,
    user_name: (row.user_name as string) ?? "",
    course_title: (row.course_title as string) ?? "",
  };
}

/** Get subject_id for a video (used to check course completion after progress update). */
export async function getSubjectIdByVideoId(videoId: number): Promise<number | null> {
  const pool = getPool();
  const result = await pool.query(
    "SELECT s.subject_id FROM videos v JOIN sections s ON s.id = v.section_id WHERE v.id = $1 LIMIT 1",
    [videoId]
  );
  const row = result.rows[0];
  return row ? (row.subject_id as number) : null;
}

/** Ensure a certificate exists for user+course (idempotent). Returns the certificate id. */
export async function ensureCertificate(userId: number, courseId: number): Promise<number | null> {
  const pool = getPool();
  const result = await pool.query(
    `INSERT INTO certificates (user_id, course_id)
     VALUES ($1, $2)
     ON CONFLICT (user_id, course_id) DO UPDATE SET user_id = certificates.user_id
     RETURNING id`,
    [userId, courseId]
  );
  const row = result.rows[0];
  return row ? (row.id as number) : null;
}

/** Get certificate by id with user and course details for PDF. */
export async function getCertificateWithDetails(
  certificateId: number,
  userId: number
): Promise<CertificateWithDetails | null> {
  const pool = getPool();
  const result = await pool.query(
    `SELECT c.id, c.user_id, c.course_id, c.issued_at, c.certificate_url,
            u.name AS user_name, s.title AS course_title
     FROM certificates c
     JOIN users u ON u.id = c.user_id
     JOIN subjects s ON s.id = c.course_id
     WHERE c.id = $1 AND c.user_id = $2`,
    [certificateId, userId]
  );
  const row = result.rows[0];
  if (!row) return null;
  return toCertificateWithDetails(row);
}

/** List all certificates for a user. */
export async function getCertificatesByUserId(userId: number): Promise<CertificateWithDetails[]> {
  const pool = getPool();
  const result = await pool.query(
    `SELECT c.id, c.user_id, c.course_id, c.issued_at, c.certificate_url,
            u.name AS user_name, s.title AS course_title
     FROM certificates c
     JOIN users u ON u.id = c.user_id
     JOIN subjects s ON s.id = c.course_id
     WHERE c.user_id = $1
     ORDER BY c.issued_at DESC`,
    [userId]
  );
  return result.rows.map((r: Record<string, unknown>) => toCertificateWithDetails(r));
}

/** Get certificate for user + course if it exists. */
export async function getCertificateByUserAndCourse(
  userId: number,
  courseId: number
): Promise<CertificateWithDetails | null> {
  const pool = getPool();
  const result = await pool.query(
    `SELECT c.id, c.user_id, c.course_id, c.issued_at, c.certificate_url,
            u.name AS user_name, s.title AS course_title
     FROM certificates c
     JOIN users u ON u.id = c.user_id
     JOIN subjects s ON s.id = c.course_id
     WHERE c.user_id = $1 AND c.course_id = $2`,
    [userId, courseId]
  );
  const row = result.rows[0];
  if (!row) return null;
  return toCertificateWithDetails(row);
}

/** Generate PDF certificate as Buffer. */
export function generateCertificatePdf(details: CertificateWithDetails): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 72 });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const pageWidth = doc.page.width;

    // Decorative top border
    doc
      .rect(50, 50, pageWidth - 100, doc.page.height - 100)
      .lineWidth(3)
      .strokeColor("#1e293b")
      .stroke();

    // Platform name at top
    doc
      .fontSize(14)
      .fillColor("#64748b")
      .text(PLATFORM_NAME, 0, 100, { align: "center", width: pageWidth });

    // Title
    doc
      .fontSize(28)
      .fillColor("#0f172a")
      .text("Certificate of Completion", 0, 140, { align: "center", width: pageWidth });

    // Subtitle
    doc
      .fontSize(14)
      .fillColor("#475569")
      .text("This is to certify that", 0, 200, { align: "center", width: pageWidth });

    // Student name
    doc
      .fontSize(24)
      .fillColor("#0f172a")
      .font("Helvetica-Bold")
      .text(details.user_name, 0, 240, { align: "center", width: pageWidth });
    doc.font("Helvetica");

    // Course line
    doc
      .fontSize(14)
      .fillColor("#475569")
      .text("has successfully completed the course", 0, 290, {
        align: "center",
        width: pageWidth,
      });
    doc
      .fontSize(18)
      .fillColor("#0f172a")
      .font("Helvetica-Bold")
      .text(details.course_title, 0, 320, { align: "center", width: pageWidth });
    doc.font("Helvetica");

    // Date
    const issuedDate = new Date(details.issued_at).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    doc
      .fontSize(12)
      .fillColor("#64748b")
      .text(`Completion Date: ${issuedDate}`, 0, 380, { align: "center", width: pageWidth });

    // Footer
    doc
      .fontSize(10)
      .fillColor("#94a3b8")
      .text(PLATFORM_NAME, 0, doc.page.height - 80, {
        align: "center",
        width: pageWidth,
      });

    doc.end();
  });
}
