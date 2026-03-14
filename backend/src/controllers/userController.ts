import { Response } from "express";
import type { AuthRequest } from "../middleware/authMiddleware";
import * as enrollmentService from "../services/enrollmentService";

export async function getMyCourses(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const courses = await enrollmentService.getEnrolledCourses(userId);
    res.status(200).json(courses);
  } catch {
    res.status(500).json({ error: "Failed to fetch courses" });
  }
}
