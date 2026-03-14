import { Router } from "express";
import * as subjectController from "../controllers/subjectController";

const router = Router();

router.get("/", subjectController.getSubjects);
router.get("/:subjectId/tree", subjectController.getSubjectTree);
router.get("/:subjectId", subjectController.getSubjectById);

export default router;
