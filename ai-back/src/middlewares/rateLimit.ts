// Ограничение частоты запросов: фиксированное окно, счётчики в памяти процесса.
// Для одного сервера этого достаточно; при нескольких инстансах счётчики нужно вынести в общее хранилище.

import { NextFunction, Request, Response } from "express";
import { apiErrors } from "../utils/apiErrors";

interface IRateLimitOptions {
  windowMs: number;
  max: number;
  // чей это лимит: по умолчанию IP; для AI-запросов — пользователь, для входа — email
  key?: (req: Request) => string | null;
  message?: string;
  // чтобы разные лимиты не делили счётчики
  name: string;
}

const MAX_BUCKETS = 50_000;

export const rateLimit = ({ windowMs, max, key, message, name }: IRateLimitOptions) => {
  const buckets = new Map<string, { count: number; resetAt: number }>();

  const sweep = setInterval(() => {
    const now = Date.now();
    for (const [id, bucket] of buckets) {
      if (bucket.resetAt <= now) buckets.delete(id);
    }
  }, Math.max(windowMs, 60_000));
  sweep.unref();

  return (req: Request, res: Response, next: NextFunction) => {
    const owner = key ? key(req) : (req.ip ?? "unknown");
    // нет ключа (например, в теле нет email) — этот лимит не применяется, остальные работают
    if (owner === null) return next();

    const id = `${name}:${owner}`;
    const now = Date.now();
    let bucket = buckets.get(id);

    if (!bucket || bucket.resetAt <= now) {
      // защита памяти от потока уникальных ключей: при переполнении начинаем с чистого листа
      if (buckets.size >= MAX_BUCKETS) buckets.clear();
      bucket = { count: 0, resetAt: now + windowMs };
      buckets.set(id, bucket);
    }

    bucket.count += 1;

    if (bucket.count > max) {
      const retryAfter = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));
      res.setHeader("Retry-After", String(retryAfter));
      const minutes = Math.ceil(retryAfter / 60);
      return next(
        apiErrors.tooManyRequests(
          message ?? `Слишком много запросов. Попробуйте через ${minutes <= 1 ? "минуту" : `${minutes} мин`}.`,
        ),
      );
    }

    next();
  };
};

const emailOf = (req: Request) => (typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : null);

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;

// Вход и регистрация: перебор паролей и создание аккаунтов пачками
export const loginLimiter = [
  rateLimit({ name: "login-ip", windowMs: 15 * MINUTE, max: 20 }),
  // тот же email с разных адресов (подбор пароля ботнетом)
  rateLimit({ name: "login-email", windowMs: 15 * MINUTE, max: 10, key: emailOf }),
];
export const registerLimiter = rateLimit({ name: "register", windowMs: HOUR, max: 10 });
export const refreshLimiter = rateLimit({ name: "refresh", windowMs: 15 * MINUTE, max: 120 });
export const googleLoginLimiter = rateLimit({ name: "google-login", windowMs: 15 * MINUTE, max: 30 });

// Письма со ссылкой сброса: нельзя заспамить чужой ящик
export const forgotPasswordLimiter = [
  rateLimit({ name: "forgot-ip", windowMs: HOUR, max: 10 }),
  rateLimit({ name: "forgot-email", windowMs: HOUR, max: 3, key: emailOf }),
];
export const resetPasswordLimiter = rateLimit({ name: "reset", windowMs: HOUR, max: 10 });

// Любые запросы, которые тратят квоту модели: на пользователя, не на IP. Подключать после authMiddleware.
export const aiLimiter = rateLimit({
  name: "ai",
  windowMs: 10 * MINUTE,
  max: 60,
  key: (req) => (req.userId ? String(req.userId) : null),
  message: "Слишком много запросов к AI за короткое время. Подождите несколько минут.",
});
