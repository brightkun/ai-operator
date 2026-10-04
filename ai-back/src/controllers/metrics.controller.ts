import { Request, Response } from "express";
import { getMetricsService } from "../services/metrics.service";

// GET /api/metrics?timeZone= — метрики пользователя за последние 7 дней и за 7 дней до них
export const getMetricsController = async (req: Request, res: Response) => {
  const timeZone = typeof req.query.timeZone === "string" ? req.query.timeZone : undefined;

  const metrics = await getMetricsService(req.userId, timeZone);
  return res.status(200).json(metrics);
};
