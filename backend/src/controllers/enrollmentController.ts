import { Response } from "express";
import type { AuthRequest } from "../middleware/authMiddleware";
import * as enrollmentService from "../services/enrollmentService";

export async function createEnrollment(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const subjectId = Number(req.body?.subject_id);
    if (!Number.isInteger(subjectId) || subjectId < 1) {
      res.status(400).json({ error: "subject_id is required and must be a positive integer" });
      return;
    }
    const result = await enrollmentService.createEnrollment(userId, subjectId);
    if (result.error && !result.created) {
      res.status(409).json({ error: result.error });
      return;
    }
    res.status(201).json({ enrollment_created: true });
  } catch {
    res.status(500).json({ error: "Failed to create enrollment" });
  }
}
