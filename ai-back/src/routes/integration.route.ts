// Роуты интеграций, смонтированы в createApi.ts под префиксом /api/integrations

import { Router } from "express";
import {
  connectGoogleController,
  disconnectController,
  googleCallbackController,
  listEmailsController,
  statusController,
} from "../controllers/googleIntegration.controller";
import { authMiddleware } from "../middlewares/authMiddleware";

const router = Router();

router.get("/google/connect", authMiddleware, connectGoogleController);
// без authMiddleware: сюда переходит браузер по редиректу от Google, а не наш фронт
router.get("/google/callback", googleCallbackController);
router.get("/google/status", authMiddleware, statusController);
router.delete("/google", authMiddleware, disconnectController);
router.get("/google/emails", authMiddleware, listEmailsController);

export default router;
