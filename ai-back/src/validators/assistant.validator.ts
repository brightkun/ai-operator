// Zod-схема тела запроса к AI-ассистенту. Подключается через middleware validate().

import { z } from "zod";

export const assistantChatSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().trim().min(1, "Пустое сообщение").max(8000, "Сообщение слишком длинное"),
      }),
    )
    .min(1, "Нужно хотя бы одно сообщение")
    .max(60, "Слишком длинная история диалога")
    .refine((messages) => messages[messages.length - 1]?.role === "user", {
      message: "Последнее сообщение должно быть от пользователя",
    }),
  // IANA-зона браузера, например "Asia/Bishkek"; некорректная заменяется на UTC в сервисе
  timeZone: z.string().max(64).optional(),
});
