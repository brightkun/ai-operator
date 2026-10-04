// Роуты сводки дня, смонтированы в createApi.ts под префиксом /api/brief

import { Router } from "express";
import {
  generateBriefSummaryController,
  getBriefController,
} from "../controllers/brief.controller";
import { authMiddleware } from "../middlewares/authMiddleware";
import { aiLimiter } from "../middlewares/rateLimit";
import { validate } from "../middlewares/validate";
import { timeZoneSchema } from "../validators/tasks.validator";

const router = Router();

router.use(authMiddleware);

router.get("/", getBriefController);
router.post("/summary", aiLimiter, validate(timeZoneSchema), generateBriefSummaryController);

export default router;
