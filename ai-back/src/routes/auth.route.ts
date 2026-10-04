// Роуты авторизации, смонтированы в createApi.ts под префиксом /api/auth

import { Router } from "express";
import {
  forgotPasswordController,
  googleLoginController,
  loginController,
  logoutController,
  profileController,
  refreshController,
  registerController,
  resetPasswordController,
} from "../controllers/auth.controller";
import { authMiddleware } from "../middlewares/authMiddleware";
import {
  forgotPasswordLimiter,
  googleLoginLimiter,
  loginLimiter,
  refreshLimiter,
  registerLimiter,
  resetPasswordLimiter,
} from "../middlewares/rateLimit";
import { validate } from "../middlewares/validate";
import {
  forgotPasswordSchema,
  googleLoginSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
} from "../validators/auth.validator";

const router = Router();

router.post("/register", registerLimiter, validate(registerSchema), registerController);
router.post("/login", ...loginLimiter, validate(loginSchema), loginController);
router.post("/refresh", refreshLimiter, refreshController);
router.post("/logout", logoutController);
// единственный защищённый роут — требует валидный access-токен в заголовке Authorization
router.get("/profile", authMiddleware, profileController);
router.post("/google", googleLoginLimiter, validate(googleLoginSchema), googleLoginController);
router.post("/forgot-password", ...forgotPasswordLimiter, validate(forgotPasswordSchema), forgotPasswordController);
router.post("/reset-password", resetPasswordLimiter, validate(resetPasswordSchema), resetPasswordController);

export default router;