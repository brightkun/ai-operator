import { Request, Response } from "express";
import { generateReviewSummaryService, getReviewService } from "../services/review.service";

// GET /api/review?timeZone= — итоги последних 7 дней и сохранённая выжимка
export const getReviewController = async (req: Request, res: Response) => {
  const timeZone = typeof req.query.timeZone === "string" ? req.query.timeZone : undefined;

  const review = await getReviewService(req.userId, timeZone);
  return res.status(200).json(review);
};

// POST /api/review/summary — составить (или обновить) недельную выжимку через AI
export const generateReviewSummaryController = async (req: Request, res: Response) => {
  const summary = await generateReviewSummaryService(req.userId, req.body.timeZone);
  return res.status(200).json({ summary });
};
