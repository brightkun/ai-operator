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
import { validate } from "../middlewares/validate";
import {
  forgotPasswordSchema,
  googleLoginSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
} from "../validators/auth.validator";

const router = Router();

router.post("/register", validate(registerSchema), registerController);
router.post("/login", validate(loginSchema), loginController);
router.post("/refresh", refreshController);
router.post("/logout", logoutController);
// единственный защищённый роут — требует валидный access-токен в заголовке Authorization
router.get("/profile", authMiddleware, profileController);
router.post("/google", validate(googleLoginSchema), googleLoginController);
router.post("/forgot-password", validate(forgotPasswordSchema), forgotPasswordController);
router.post("/reset-password", validate(resetPasswordSchema), resetPasswordController);

export default router;