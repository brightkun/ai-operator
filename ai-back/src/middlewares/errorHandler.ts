import { NextFunction, Request, Response } from "express";

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  // ожидаемые ошибки (apiErrors.*) — отдаём как есть
  if (err.status && err.message) {
    return res.status(err.status).json({
      message: err.message,
    });
  }

  // неожиданные ошибки пишем в лог, а клиенту не раскрываем детали (SQL, стек и т.п.)
  console.error(err);
  res.status(500).json({
    message: "Внутренняя ошибка сервера",
  });
};
