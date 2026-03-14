import { Response } from "express";
import type { AuthRequest } from "../middleware/authMiddleware";
import * as paymentService from "../services/paymentService";

export async function createPayment(req: AuthRequest, res: Response): Promise<void> {
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
    const result = await paymentService.createPayment(userId, subjectId);
    res.status(201).json(result);
  } catch {
    res.status(500).json({ error: "Failed to create payment" });
  }
}

export async function confirmPayment(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const paymentId = req.body?.payment_id;
    if (!paymentId || typeof paymentId !== "string") {
      res.status(400).json({ error: "payment_id is required" });
      return;
    }
    const result = await paymentService.confirmPayment(paymentId, userId);
    if (!result.success) {
      res.status(400).json({ error: result.error ?? "Payment confirmation failed" });
      return;
    }
    res.status(200).json({
      status: "success",
      enrollment_created: result.enrollment_created,
    });
  } catch {
    res.status(500).json({ error: "Payment confirmation failed" });
  }
}
