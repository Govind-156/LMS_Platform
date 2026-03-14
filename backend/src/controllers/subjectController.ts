import { Request, Response } from "express";
import * as subjectService from "../services/subjectService";

export async function getSubjects(_req: Request, res: Response): Promise<void> {
  try {
    const subjects = await subjectService.getPublishedSubjects();
    res.status(200).json(subjects);
  } catch {
    res.status(500).json({ error: "Failed to fetch subjects" });
  }
}

export async function getSubjectById(req: Request, res: Response): Promise<void> {
  try {
    const subjectId = parseInt(req.params.subjectId, 10);
    if (Number.isNaN(subjectId)) {
      res.status(404).json({ error: "Subject not found" });
      return;
    }
    const subject = await subjectService.getSubjectById(subjectId);
    if (!subject) {
      res.status(404).json({ error: "Subject not found" });
      return;
    }
    res.status(200).json(subject);
  } catch {
    res.status(500).json({ error: "Failed to fetch subject" });
  }
}

export async function getSubjectTree(req: Request, res: Response): Promise<void> {
  try {
    const subjectId = parseInt(req.params.subjectId, 10);
    if (Number.isNaN(subjectId)) {
      res.status(404).json({ error: "Subject not found" });
      return;
    }
    const tree = await subjectService.getSubjectTree(subjectId);
    if (!tree) {
      res.status(404).json({ error: "Subject not found" });
      return;
    }
    res.status(200).json(tree);
  } catch {
    res.status(500).json({ error: "Failed to fetch course tree" });
  }
}
