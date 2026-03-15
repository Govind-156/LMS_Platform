import { Response } from "express";
import type { AuthRequest } from "../middleware/authMiddleware";
import * as notesService from "../services/notesService";

export async function getNote(req: AuthRequest, res: Response): Promise<void> {
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
    const note = await notesService.getNote(userId, videoId);
    if (!note) {
      res.status(200).json({ content: "", created_at: null, updated_at: null });
      return;
    }
    res.status(200).json({
      content: note.content,
      created_at: note.created_at.toISOString(),
      updated_at: note.updated_at.toISOString(),
    });
  } catch {
    res.status(500).json({ error: "Failed to fetch note" });
  }
}

export async function saveNote(req: AuthRequest, res: Response): Promise<void> {
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
    const content = typeof req.body?.content === "string" ? req.body.content : "";
    const note = await notesService.upsertNote(userId, videoId, content);
    res.status(200).json({
      content: note.content,
      created_at: note.created_at.toISOString(),
      updated_at: note.updated_at.toISOString(),
    });
  } catch {
    res.status(500).json({ error: "Failed to save note" });
  }
}
