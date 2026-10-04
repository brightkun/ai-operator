// Базовые защитные заголовки. Бэкенд отдаёт только JSON, поэтому политика строгая:
// ничего не встраивается, не рисуется во фрейме и не должно угадываться по содержимому.

import { NextFunction, Request, Response } from "express";
import { config } from "../config/env";

export const securityHeaders = (req: Request, res: Response, next: NextFunction) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("Content-Security-Policy", "default-src 'none'; frame-ancestors 'none'");
  res.setHeader("Cross-Origin-Resource-Policy", "same-site");
  // ответы с данными пользователя не должны оседать в общих кэшах
  res.setHeader("Cache-Control", "no-store");

  if (config.cookieSecure) {
    res.setHeader("Strict-Transport-Security", "max-age=15552000; includeSubDomains");
  }

  next();
};
