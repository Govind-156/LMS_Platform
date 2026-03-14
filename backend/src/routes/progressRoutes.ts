import { Router } from "express";
import { requireAuth } from "../middleware/authMiddleware";
import * as progressController from "../controllers/progressController";

const router = Router();

router.get("/videos/:videoId", requireAuth, progressController.getProgress);
router.post("/videos/:videoId", requireAuth, progressController.upsertProgress);
router.get("/subjects/:subjectId", requireAuth, progressController.getSubjectProgress);

export default router;
