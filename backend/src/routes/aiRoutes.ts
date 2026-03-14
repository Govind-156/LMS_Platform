import { Router } from "express";
import { requireAuth } from "../middleware/authMiddleware";
import * as aiController from "../controllers/aiController";

const router = Router();

router.post("/chat", requireAuth, aiController.chat);

export default router;
