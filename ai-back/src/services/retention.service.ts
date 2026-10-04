// Срок хранения данных из Google (настраивается пользователем): письма и прошедшие события календаря
// старше выбранного числа дней удаляются у нас (в самом Google ничего не трогаем) и больше не возвращаются при синхронизации.
// Задачи, заметки и метрики срок хранения не затрагивает — это данные самого пользователя, а не копия из Google.

import { pool } from "../plugins/pg";
import { purgeOldAudit } from "./audit.service";

export const RETENTION_OPTIONS = [30, 90, 180, 365] as const;

export interface IRetentionResult {
  emails: number;
  events: number;
}

// Граница, раньше которой данные не хранятся: null, если срок не ограничен
export const retentionCutoff = async (userId: number): Promise<Date | null> => {
  const result = await pool.query<{ cutoff: Date | null }>(
    `SELECT CASE WHEN retention_days IS NULL THEN NULL ELSE now() - make_interval(days => retention_days) END AS cutoff
     FROM users WHERE id = $1`,
    [userId],
  );
  return result.rows[0]?.cutoff ?? null;
};

// scope.userIds ограничивает очистку заданными пользователями (нужно тестам: общая БД содержит настоящие данные)
export const applyRetentionService = async (scope?: { userIds: number[] }): Promise<IRetentionResult> => {
  const ids = scope?.userIds ?? null;

  const emails = await pool.query(
    `DELETE FROM emails e USING users u
     WHERE e.user_id = u.id AND u.retention_days IS NOT NULL
       AND e.received_at < now() - make_interval(days => u.retention_days)
       AND ($1::int[] IS NULL OR u.id = ANY($1))`,
    [ids],
  );

  const events = await pool.query(
    `DELETE FROM calendar_events c USING users u
     WHERE c.user_id = u.id AND u.retention_days IS NOT NULL
       AND c.end_at < now() - make_interval(days => u.retention_days)
       AND ($1::int[] IS NULL OR u.id = ANY($1))`,
    [ids],
  );

  // общий срок хранения журнала безопасности — не зависит от настройки пользователя; в тестах его не гоняем
  if (!ids) await purgeOldAudit();

  return { emails: emails.rowCount ?? 0, events: events.rowCount ?? 0 };
};
