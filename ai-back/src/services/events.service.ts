// События использования для метрик из ТЗ (North Star: действия, выполненные с помощью AI, на пользователя в неделю;
// принятие черновиков, открытия сводки и т. д.). В meta кладём только id и числа — без текста писем и заметок.

import { pool } from "../plugins/pg";

export type UsageEventType =
  | "email_summary" // AI кратко пересказал письмо
  | "email_draft" // AI составил черновик ответа
  | "draft_accepted" // человек скопировал черновик или открыл его в Gmail
  | "brief_summary" // составлена выжимка сводки дня
  | "brief_opened" // открыта сводка дня
  | "tasks_extracted" // AI нашёл задачи в письмах
  | "meeting_prep" // подготовка к встрече
  | "weekly_review" // недельный обзор
  | "assistant_query"; // ответ ассистента в чате (meta.sources — сколько источников приложено)

// События, о которых сообщает браузер (остальные пишет сервер сам)
export const CLIENT_EVENT_TYPES = ["draft_accepted", "brief_opened"] as const;

// Запись метрики никогда не должна ломать основную функцию: ошибки глотаем, только пишем в лог
export const recordEvent = (userId: number, type: UsageEventType, meta: Record<string, unknown> = {}) =>
  pool
    .query(`INSERT INTO usage_events (user_id, type, meta) VALUES ($1, $2, $3::jsonb)`, [
      userId,
      type,
      JSON.stringify(meta),
    ])
    .then(() => undefined)
    .catch((error) => console.warn("Не удалось записать событие использования:", error.message));
