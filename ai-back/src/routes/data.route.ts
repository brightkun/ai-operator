// Роуты данных, смонтированы в createApi.ts под префиксом /api. Все требуют авторизации.

import { Router } from "express";
import {
  calendarEventsController,
  driveFilesController,
  emailsController,
  syncController,
} from "../controllers/data.controller";
import {
  clientEventController,
  emailAssistController,
} from "../controllers/emailAssist.controller";
import { authMiddleware } from "../middlewares/authMiddleware";
import { validate } from "../middlewares/validate";
import { clientEventSchema, emailAssistSchema } from "../validators/emailAssist.validator";

const router = Router();

router.use(authMiddleware);

router.post("/sync", syncController);
router.get("/emails", emailsController);
router.post("/emails/:id/assist", validate(emailAssistSchema), emailAssistController);
router.post("/events", validate(clientEventSchema), clientEventController);
router.get("/calendar/events", calendarEventsController);
router.get("/drive/files", driveFilesController);

export default router;
