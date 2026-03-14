import { Router } from "express";
import healthRoutes from "./healthRoutes";
import authRoutes from "./authRoutes";
import subjectRoutes from "./subjectRoutes";
import paymentRoutes from "./paymentRoutes";
import enrollmentRoutes from "./enrollmentRoutes";
import userRoutes from "./userRoutes";
import videoRoutes from "./videoRoutes";
import progressRoutes from "./progressRoutes";
import aiRoutes from "./aiRoutes";

const router = Router();

router.use("/", healthRoutes);
router.use("/auth", authRoutes);
router.use("/subjects", subjectRoutes);
router.use("/payments", paymentRoutes);
router.use("/enrollments", enrollmentRoutes);
router.use("/users", userRoutes);
router.use("/videos", videoRoutes);
router.use("/progress", progressRoutes);
router.use("/ai", aiRoutes);

export default router;
