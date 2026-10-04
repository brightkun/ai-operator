// Zod-схемы для помощи AI по письмам и событий использования.

import { z } from "zod";
import { CLIENT_EVENT_TYPES } from "../services/events.service";

export const emailAssistSchema = z.object({
  action: z.enum(["summary", "reply"]),
  instruction: z.string().trim().max(300, "Пожелание слишком длинное (до 300 символов)").optional(),
  timeZone: z.string().max(64).optional(),
  refresh: z.boolean().optional(),
});

export const clientEventSchema = z.object({
  type: z.enum(CLIENT_EVENT_TYPES),
  meta: z
    .object({
      emailId: z.number().int().positive().optional(),
      how: z.enum(["copy", "gmail"]).optional(),
    })
    .optional(),
});
