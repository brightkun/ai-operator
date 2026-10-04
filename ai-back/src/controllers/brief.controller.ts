import { Request, Response } from "express";
import { generateBriefSummaryService, getBriefService } from "../services/brief.service";

// GET /api/brief?timeZone=Asia/Bishkek — сводка дня: события, непрочитанные, задачи и сохранённая выжимка
export const getBriefController = async (req: Request, res: Response) => {
  const timeZone = typeof req.query.timeZone === "string" ? req.query.timeZone : undefined;

  const brief = await getBriefService(req.userId, timeZone);
  return res.status(200).json(brief);
};

// POST /api/brief/summary — составить (или обновить) выжимку «что главное» через AI
export const generateBriefSummaryController = async (req: Request, res: Response) => {
  const summary = await generateBriefSummaryService(req.userId, req.body.timeZone);
  return res.status(200).json({ summary });
};
