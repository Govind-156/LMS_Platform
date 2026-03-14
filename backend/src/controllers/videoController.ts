import { Response } from "express";
import type { AuthRequest } from "../middleware/authMiddleware";
import * as videoService from "../services/videoService";

export async function getVideoById(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const videoId = parseInt(req.params.videoId, 10);
    if (!Number.isInteger(videoId) || videoId < 1) {
      res.status(404).json({ error: "Video not found" });
      return;
    }
    const result = await videoService.getVideoById(videoId, userId);
    if (result.status === "not_found") {
      res.status(404).json({ error: "Video not found" });
      return;
    }
    if (result.status === "forbidden") {
      res.status(403).json({ error: "You must be enrolled in this course to access this lesson" });
      return;
    }
    res.status(200).json(result.data);
  } catch {
    res.status(500).json({ error: "Failed to fetch video" });
  }
}
