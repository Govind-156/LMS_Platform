import { Router } from "express";
import { requireAuth } from "../middleware/authMiddleware";
import * as userController from "../controllers/userController";

const router = Router();

router.get("/me/courses", requireAuth, userController.getMyCourses);

export default router;
