// Zod-схемы тел запросов для auth-роутов. Подключаются через middleware validate().

import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Имя должно быть не короче 2 символов"),
  email: z.email("Некорректный email"),
  password: z.string().min(6, "Пароль должен быть не короче 6 символов"),
});

export const loginSchema = z.object({
  email: z.email("Некорректный email"),
  password: z.string().min(1, "Пароль обязателен"),
});

export const googleLoginSchema = z.object({
  idToken: z.string().min(1, "idToken обязателен"),
});

export const forgotPasswordSchema = z.object({
  email: z.email("Некорректный email"),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, "token обязателен"),
  password: z.string().min(6, "Пароль должен быть не короче 6 символов"),
});
