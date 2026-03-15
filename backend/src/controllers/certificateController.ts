import { Response } from "express";
import type { AuthRequest } from "../middleware/authMiddleware";
import * as certificateService from "../services/certificateService";

export async function listMyCertificates(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const certificates = await certificateService.getCertificatesByUserId(userId);
    res.status(200).json(certificates);
  } catch {
    res.status(500).json({ error: "Failed to fetch certificates" });
  }
}

export async function getCertificateByCourse(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const courseId = parseInt(req.params.courseId, 10);
    if (!Number.isInteger(courseId) || courseId < 1) {
      res.status(400).json({ error: "Invalid course id" });
      return;
    }
    const certificate = await certificateService.getCertificateByUserAndCourse(userId, courseId);
    if (!certificate) {
      res.status(404).json({ error: "Certificate not found" });
      return;
    }
    res.status(200).json(certificate);
  } catch {
    res.status(500).json({ error: "Failed to fetch certificate" });
  }
}

export async function downloadCertificate(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const certificateId = parseInt(req.params.certificateId, 10);
    if (!Number.isInteger(certificateId) || certificateId < 1) {
      res.status(400).json({ error: "Invalid certificate id" });
      return;
    }
    const details = await certificateService.getCertificateWithDetails(certificateId, userId);
    if (!details) {
      res.status(404).json({ error: "Certificate not found" });
      return;
    }
    const pdfBuffer = await certificateService.generateCertificatePdf(details);
    const filename = `certificate-${details.course_title.replace(/[^a-z0-9]/gi, "-").toLowerCase()}.pdf`;
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Content-Length", String(pdfBuffer.length));
    res.send(pdfBuffer);
  } catch {
    res.status(500).json({ error: "Failed to generate certificate" });
  }
}
