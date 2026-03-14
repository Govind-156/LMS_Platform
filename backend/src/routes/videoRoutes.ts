import { Router } from "express";
import { requireAuth } from "../middleware/authMiddleware";
import * as videoController from "../controllers/videoController";

const router = Router();

router.get("/:videoId", requireAuth, videoController.getVideoById);

export default router;
