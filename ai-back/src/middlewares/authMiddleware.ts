// Middleware для защищённых роутов (например, /profile).
// Достаёт access-токен из заголовка "Authorization: Bearer <token>",
// проверяет его и кладёт userId в req, чтобы контроллер знал, чей это запрос.

import { NextFunction, Request, Response } from "express";
import { apiErrors } from "../utils/apiErrors";
import { verifyAccessToken } from "../utils/jwt";

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  // заголовка нет или он не в формате "Bearer <token>"
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw apiErrors.unauthorized("Не авторизован");
  }

  const token = authHeader.split(" ")[1];

  if (!token) {
    throw apiErrors.unauthorized("Не авторизован");
  }

  try {
    // если токен невалиден или истёк — verifyAccessToken бросит исключение
    const payload = verifyAccessToken(token);
    req.userId = payload.userId;
    next();
  } catch {
    throw apiErrors.unauthorized("Невалидный или истёкший токен");
  }
};