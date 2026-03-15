import { Router } from "express";
import { requireAuth } from "../middleware/authMiddleware";
import * as notesController from "../controllers/notesController";

const router = Router();

router.get("/videos/:videoId", requireAuth, notesController.getNote);
router.put("/videos/:videoId", requireAuth, notesController.saveNote);

export default router;
