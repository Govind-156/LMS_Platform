import { Router } from "express";
import { requireAuth } from "../middleware/authMiddleware";
import * as certificateController from "../controllers/certificateController";

const router = Router();

router.get("/", requireAuth, certificateController.listMyCertificates);
router.get("/course/:courseId", requireAuth, certificateController.getCertificateByCourse);
router.get("/:certificateId/download", requireAuth, certificateController.downloadCertificate);

export default router;
