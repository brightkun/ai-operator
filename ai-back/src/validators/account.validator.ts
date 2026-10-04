// Zod-схемы для настроек аккаунта.

import { z } from "zod";
import { RETENTION_OPTIONS } from "../services/retention.service";

export const retentionSchema = z.object({
  // null — хранить без ограничения
  retentionDays: z.union([
    z.null(),
    z.number().refine((value) => (RETENTION_OPTIONS as readonly number[]).includes(value), "Недопустимый срок хранения"),
  ]),
});

export const deleteAccountSchema = z.object({
  confirmEmail: z.string().min(1, "Введите email аккаунта").max(254),
  password: z.string().max(200).optional(),
});
