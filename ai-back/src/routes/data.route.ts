// Роуты данных, смонтированы в createApi.ts под префиксом /api. Все требуют авторизации.

import { Router } from "express";
import {
  calendarEventsController,
  driveFilesController,
  emailsController,
  syncController,
} from "../controllers/data.controller";
import { authMiddleware } from "../middlewares/authMiddleware";

const router = Router();

router.use(authMiddleware);

router.post("/sync", syncController);
router.get("/emails", emailsController);
router.get("/calendar/events", calendarEventsController);
router.get("/drive/files", driveFilesController);

export default router;
