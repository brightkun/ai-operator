// Zod-схемы тел запросов для задач и сводки. Подключаются через middleware validate().

import { z } from "zod";
import { isRealDateKey } from "../utils/time";

const title = z.string().trim().min(1, "Введите название задачи").max(200, "Название слишком длинное (до 200 символов)");
const dueDate = z.string().refine(isRealDateKey, "Некорректная дата, нужен формат ГГГГ-ММ-ДД");
const timeZone = z.string().max(64).optional();

export const createTaskSchema = z.object({
  title,
  kind: z.enum(["todo", "commitment", "waiting"]).default("todo"),
  dueDate: dueDate.nullish(),
});

export const updateTaskSchema = z
  .object({
    status: z.enum(["open", "done", "dismissed"]).optional(),
    title: title.optional(),
    dueDate: dueDate.nullable().optional(),
  })
  .refine((value) => Object.values(value).some((v) => v !== undefined), {
    message: "Нечего изменять",
  });

export const timeZoneSchema = z.object({ timeZone });
