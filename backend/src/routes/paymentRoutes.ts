import { Router } from "express";
import { requireAuth } from "../middleware/authMiddleware";
import * as paymentController from "../controllers/paymentController";

const router = Router();

router.post("/create", requireAuth, paymentController.createPayment);
router.post("/confirm", requireAuth, paymentController.confirmPayment);

export default router;
