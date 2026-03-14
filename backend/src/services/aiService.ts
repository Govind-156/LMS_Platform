import Groq from "groq-sdk";
import { getPool } from "../config/db";
import { config } from "../config/env";
import { isEnrolled } from "./enrollmentService";

export interface VideoContext {
  videoTitle: string;
  videoDescription: string | null;
  sectionTitle: string;
  subjectTitle: string;
}

export async function getVideoContextForUser(
  videoId: number,
  userId: number
): Promise<VideoContext | null> {
  const pool = getPool();
  const result = await pool.query(
    `SELECT v.title AS video_title, v.description AS video_description,
            s.title AS section_title, sub.title AS subject_title, s.subject_id
     FROM videos v
     JOIN sections s ON s.id = v.section_id
     JOIN subjects sub ON sub.id = s.subject_id
     WHERE v.id = $1`,
    [videoId]
  );
  const row = result.rows[0];
  if (!row) return null;
  const enrolled = await isEnrolled(userId, row.subject_id);
  if (!enrolled) return null;
  return {
    videoTitle: row.video_title,
    videoDescription: row.video_description ?? null,
    sectionTitle: row.section_title,
    subjectTitle: row.subject_title,
  };
}

function buildSystemPrompt(ctx: VideoContext): string {
  const parts = [
    "You are a helpful tutor for a student watching a lesson in an online course.",
    "Use the following context about the current lesson to answer the student's questions accurately and concisely.",
    "",
    "Course: " + ctx.subjectTitle,
    "Section: " + ctx.sectionTitle,
    "Lesson: " + ctx.videoTitle,
  ];
  if (ctx.videoDescription) {
    parts.push("", "Lesson description:", ctx.videoDescription);
  }
  parts.push(
    "",
    "Answer based on this context. If the question is outside the lesson scope, say so briefly and suggest they rewatch the relevant part or ask their instructor."
  );
  return parts.join("\n");
}

export async function chat(
  userId: number,
  videoId: number,
  question: string
): Promise<{ answer: string }> {
  const context = await getVideoContextForUser(videoId, userId);
  if (!context) {
    throw new Error("VIDEO_NOT_FOUND_OR_ACCESS_DENIED");
  }

  if (!config.groqApiKey) {
    throw new Error("AI_SERVICE_NOT_CONFIGURED");
  }

  const groq = new Groq({ apiKey: config.groqApiKey });
  const systemPrompt = buildSystemPrompt(context);
  const userContent = question.trim();

  try {
    const completion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userContent },
      ],
      model: config.groqModel,
    });

    const text = completion.choices[0]?.message?.content?.trim();
    if (text == null || text === "") {
      throw new Error("AI_NO_RESPONSE");
    }

    return { answer: text };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    const code = err && typeof err === "object" && "code" in err ? (err as { code: number }).code : undefined;
    if (code === 429 || msg.includes("429") || /rate limit|resource_exhausted|quota/i.test(msg)) {
      const e = new Error("RATE_LIMIT") as Error & { status?: number };
      e.status = 429;
      throw e;
    }
    if (code === 401 || /invalid.*api.*key|authentication|unauthorized/i.test(msg)) {
      throw new Error("AI_SERVICE_NOT_CONFIGURED");
    }
    throw err;
  }
}
