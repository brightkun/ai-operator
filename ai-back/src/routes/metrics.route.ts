// Роуты метрик, смонтированы в createApi.ts под префиксом /api/metrics

import { Router } from "express";
import { getMetricsController } from "../controllers/metrics.controller";
import { authMiddleware } from "../middlewares/authMiddleware";

const router = Router();

router.use(authMiddleware);

router.get("/", getMetricsController);

export default router;
