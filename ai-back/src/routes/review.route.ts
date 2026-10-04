// Роуты недельного обзора, смонтированы в createApi.ts под префиксом /api/review

import { Router } from "express";
import {
  generateReviewSummaryController,
  getReviewController,
} from "../controllers/review.controller";
import { authMiddleware } from "../middlewares/authMiddleware";
import { validate } from "../middlewares/validate";
import { timeZoneSchema } from "../validators/tasks.validator";

const router = Router();

router.use(authMiddleware);

router.get("/", getReviewController);
router.post("/summary", validate(timeZoneSchema), generateReviewSummaryController);

export default router;
