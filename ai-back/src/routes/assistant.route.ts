// Роуты AI-ассистента, смонтированы в createApi.ts под префиксом /api/assistant

import { Router } from "express";
import { assistantChatController } from "../controllers/assistant.controller";
import { authMiddleware } from "../middlewares/authMiddleware";
import { aiLimiter } from "../middlewares/rateLimit";
import { validate } from "../middlewares/validate";
import { assistantChatSchema } from "../validators/assistant.validator";

const router = Router();

router.post("/chat", authMiddleware, aiLimiter, validate(assistantChatSchema), assistantChatController);

export default router;
