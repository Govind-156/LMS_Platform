import { Response } from "express";
import type { AuthRequest } from "../middleware/authMiddleware";
import * as aiService from "../services/aiService";

const AI_THROTTLE_MS = 3000;
const lastAiRequestByUser = new Map<number, number>();

export async function chat(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const now = Date.now();
    const last = lastAiRequestByUser.get(userId);
    if (last != null && now - last < AI_THROTTLE_MS) {
      res.status(429).json({
        error: "AI tutor is busy. Please try again in a few seconds.",
      });
      return;
    }
    lastAiRequestByUser.set(userId, now);

    const videoId = typeof req.body?.video_id === "number" ? req.body.video_id : parseInt(req.body?.video_id, 10);
    const question = typeof req.body?.question === "string" ? req.body.question.trim() : "";
    if (!Number.isInteger(videoId) || videoId < 1) {
      res.status(400).json({ error: "video_id is required and must be a positive integer" });
      return;
    }
    if (!question || question.length > 4000) {
      res.status(400).json({ error: "question is required and must be at most 4000 characters" });
      return;
    }
    const result = await aiService.chat(userId, videoId, question);
    res.status(200).json(result);
  } catch (err) {
    console.error("[AI chat error]", err);
    const message = err instanceof Error ? err.message : "AI_CHAT_FAILED";
    if (message === "VIDEO_NOT_FOUND_OR_ACCESS_DENIED") {
      res.status(403).json({ error: "You do not have access to this lesson" });
      return;
    }
    if (message === "AI_SERVICE_NOT_CONFIGURED") {
      res.status(503).json({ error: "AI tutor is not configured" });
      return;
    }
    if (message === "AI_NO_RESPONSE") {
      res.status(502).json({ error: "AI did not return a response" });
      return;
    }
    const status = err && typeof err === "object" && "status" in err ? (err as { status: number }).status : undefined;
    if (status === 429) {
      res.status(429).json({ error: "AI tutor is busy. Please try again in a few seconds." });
      return;
    }
    const safeMessage =
      err instanceof Error ? err.message : "Failed to get AI response";
    const isKnown = /^(VIDEO_NOT_FOUND|AI_SERVICE|AI_NO_RESPONSE|RATE_LIMIT)/.test(safeMessage);
    res.status(500).json({
      error: isKnown ? "Failed to get AI response" : safeMessage,
    });
  }
}
