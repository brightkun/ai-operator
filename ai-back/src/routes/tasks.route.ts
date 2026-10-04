// Роуты задач, смонтированы в createApi.ts под префиксом /api/tasks

import { Router } from "express";
import {
  createTaskController,
  extractTasksController,
  listTasksController,
  updateTaskController,
} from "../controllers/tasks.controller";
import { authMiddleware } from "../middlewares/authMiddleware";
import { aiLimiter } from "../middlewares/rateLimit";
import { validate } from "../middlewares/validate";
import { createTaskSchema, timeZoneSchema, updateTaskSchema } from "../validators/tasks.validator";

const router = Router();

router.use(authMiddleware);

router.get("/", listTasksController);
router.post("/", validate(createTaskSchema), createTaskController);
router.post("/extract", aiLimiter, validate(timeZoneSchema), extractTasksController);
router.patch("/:id", validate(updateTaskSchema), updateTaskController);

export default router;
