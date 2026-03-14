import { randomBytes } from "crypto";
import { getPool } from "../config/db";

export async function createPayment(userId: number, subjectId: number): Promise<{ payment_id: string }> {
  const pool = getPool();
  const paymentId = randomBytes(16).toString("hex");
  await pool.query(
    "INSERT INTO payments (user_id, subject_id, payment_id, status) VALUES ($1, $2, $3, 'pending')",
    [userId, subjectId, paymentId]
  );
  return { payment_id: paymentId };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function confirmPayment(
  paymentId: string,
  userId: number
): Promise<{ success: boolean; enrollment_created: boolean; error?: string }> {
  const pool = getPool();
  const result = await pool.query(
    "SELECT id, user_id, subject_id, status FROM payments WHERE payment_id = $1 AND user_id = $2",
    [paymentId, userId]
  );
  const row = result.rows[0];
  if (!row) {
    return { success: false, enrollment_created: false, error: "Payment not found" };
  }
  if (row.status === "completed") {
    return { success: true, enrollment_created: false };
  }
  await sleep(2000);
  const subjectId = row.subject_id;
  const existingResult = await pool.query(
    "SELECT id FROM enrollments WHERE user_id = $1 AND subject_id = $2",
    [userId, subjectId]
  );
  if (existingResult.rows.length > 0) {
    await pool.query("UPDATE payments SET status = 'completed' WHERE id = $1", [row.id]);
    return { success: true, enrollment_created: false };
  }
  await pool.query(
    "INSERT INTO enrollments (user_id, subject_id, payment_status, payment_id) VALUES ($1, $2, 'completed', $3)",
    [userId, subjectId, paymentId]
  );
  await pool.query("UPDATE payments SET status = 'completed' WHERE id = $1", [row.id]);
  return { success: true, enrollment_created: true };
}
