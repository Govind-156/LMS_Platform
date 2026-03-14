import { Response } from "express";
import type { AuthRequest } from "../middleware/authMiddleware";
import * as progressService from "../services/progressService";

export async function getSubjectProgress(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const subjectId = parseInt(req.params.subjectId, 10);
    if (!Number.isInteger(subjectId) || subjectId < 1) {
      res.status(400).json({ error: "Invalid subject id" });
      return;
    }
    const progress = await progressService.getSubjectProgress(userId, subjectId);
    res.status(200).json(progress);
  } catch {
    res.status(500).json({ error: "Failed to fetch progress" });
  }
}

export async function getProgress(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const videoId = parseInt(req.params.videoId, 10);
    if (!Number.isInteger(videoId) || videoId < 1) {
      res.status(400).json({ error: "Invalid video id" });
      return;
    }
    const progress = await progressService.getProgress(userId, videoId);
    if (!progress) {
      res.status(200).json({ last_position_seconds: 0, is_completed: false });
      return;
    }
    res.status(200).json(progress);
  } catch {
    res.status(500).json({ error: "Failed to fetch progress" });
  }
}

export async function upsertProgress(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const videoId = parseInt(req.params.videoId, 10);
    if (!Number.isInteger(videoId) || videoId < 1) {
      res.status(400).json({ error: "Invalid video id" });
      return;
    }
    const { last_position_seconds, is_completed } = req.body ?? {};
    const position =
      typeof last_position_seconds === "number" && last_position_seconds >= 0
        ? Math.floor(last_position_seconds)
        : 0;
    const completed = Boolean(is_completed);
    await progressService.upsertProgress(userId, videoId, {
      last_position_seconds: position,
      is_completed: completed,
    });
    res.status(200).json({ last_position_seconds: position, is_completed: completed });
  } catch {
    res.status(500).json({ error: "Failed to save progress" });
  }
}
