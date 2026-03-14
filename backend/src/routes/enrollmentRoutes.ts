import { Router } from "express";
import { requireAuth } from "../middleware/authMiddleware";
import * as enrollmentController from "../controllers/enrollmentController";

const router = Router();

router.post("/", requireAuth, enrollmentController.createEnrollment);

export default router;
