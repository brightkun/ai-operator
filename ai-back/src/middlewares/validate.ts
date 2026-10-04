// Универсальный middleware для валидации req.body по zod-схеме.
// При ошибке валидации кидает apiErrors.badRequest с текстом первой проблемы,
// при успехе подменяет req.body уже провалидированными (и приведёнными к типам) данными.

import { NextFunction, Request, Response } from "express";
import { ZodType } from "zod";
import { apiErrors } from "../utils/apiErrors";

export const validate = (schema: ZodType) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const message = result.error.issues
        .map((issue) => issue.message)
        .join(", ");

      throw apiErrors.badRequest(message);
    }

    req.body = result.data;
    next();
  };
};
