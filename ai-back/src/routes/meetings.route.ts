// Роуты подготовки к встрече, смонтированы в createApi.ts под префиксом /api/meetings

import { Router } from "express";
import {
  generateMeetingPrepController,
  getMeetingController,
} from "../controllers/meetings.controller";
import { authMiddleware } from "../middlewares/authMiddleware";
import { aiLimiter } from "../middlewares/rateLimit";
import { validate } from "../middlewares/validate";
import { timeZoneSchema } from "../validators/tasks.validator";

const router = Router();

router.use(authMiddleware);

router.get("/:id", getMeetingController);
router.post("/:id/prep", aiLimiter, validate(timeZoneSchema), generateMeetingPrepController);

export default router;
