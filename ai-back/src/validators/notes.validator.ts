// Zod-схемы тел запросов для заметок. Подключаются через middleware validate().

import { z } from "zod";

// Заголовок и текст не обрезаем (trim): они сохраняются на лету, пока человек печатает,
// и «Привет » с пробелом на конце не должно превращаться в «Привет» под курсором
const title = z.string().max(200, "Название слишком длинное (до 200 символов)");
const content = z.string().max(50_000, "Заметка слишком длинная (до 50 000 символов)");

export const createNoteSchema = z.object({
  title: title.default(""),
  content: content.default(""),
});

export const updateNoteSchema = z
  .object({
    title: title.optional(),
    content: content.optional(),
  })
  .refine((value) => value.title !== undefined || value.content !== undefined, {
    message: "Нечего изменять",
  });
