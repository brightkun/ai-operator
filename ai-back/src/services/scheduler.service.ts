// Фоновая синхронизация: данные обновляются сами, а не только по кнопке (принцип ТЗ: Operator наблюдает,
// пользователь не обязан постоянно заходить и проверять). Модель здесь не вызывается — только Google API.

import { config } from "../config/env";
import { pool } from "../plugins/pg";
import { applyRetentionService } from "./retention.service";
import { ISyncResult, syncAllService } from "./sync.service";

const FIRST_RUN_DELAY_MS = 90_000; // не синхронизируем в первую минуту: dev-сервер часто перезапускается
const PAUSE_BETWEEN_USERS_MS = 1_500; // не бьём по Google пачкой запросов подряд
const AUTH_BACKOFF_MS = 6 * 60 * 60 * 1000; // доступ отозван/истёк — следующая попытка не раньше чем через 6 часов

// Ошибки «токен больше не годится»: пока пользователь не переподключит Google, повторять бессмысленно
const AUTH_ERROR_PATTERNS = [
  "%invalid_grant%",
  "%invalid authentication credentials%",
  "%expired or revoked%",
  "%invalid_client%",
  "%unauthorized_client%",
];

export interface ISchedulerDeps {
  sync: (userId: number) => Promise<Record<string, ISyncResult>>;
  pause: (ms: number) => Promise<void>;
  now: () => number;
}

const defaultDeps: ISchedulerDeps = {
  sync: syncAllService,
  pause: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
  now: () => Date.now(),
};

export interface ISchedulerSummary {
  considered: number;
  synced: number;
  skipped: number;
  failed: number;
  busy?: boolean;
}

let running = false;

// Один проход: синхронизирует тех, кому пора. Возвращает сводку (для логов и тестов).
export const runScheduledSync = async (
  intervalMs: number,
  deps: ISchedulerDeps = defaultDeps,
): Promise<ISchedulerSummary> => {
  // два прохода одновременно не нужны (например, прошлый затянулся из-за медленного Google)
  if (running) {
    return { considered: 0, synced: 0, skipped: 0, failed: 0, busy: true };
  }

  running = true;
  const summary: ISchedulerSummary = { considered: 0, synced: 0, skipped: 0, failed: 0 };

  try {
    const result = await pool.query<{
      user_id: number;
      last_sync: Date | null;
      last_auth_error: Date | null;
    }>(
      `SELECT i.user_id,
              max(s.synced_at) AS last_sync,
              max(s.synced_at) FILTER (WHERE s.error ILIKE ANY ($1::text[])) AS last_auth_error
       FROM integrations i
       LEFT JOIN sync_state s ON s.user_id = i.user_id
       WHERE i.provider = 'google'
       GROUP BY i.user_id
       ORDER BY i.user_id`,
      [AUTH_ERROR_PATTERNS],
    );

    summary.considered = result.rows.length;
    let first = true;

    for (const row of result.rows) {
      const now = deps.now();
      const recentlySynced = row.last_sync !== null && now - row.last_sync.getTime() < intervalMs / 2;
      const authBroken = row.last_auth_error !== null && now - row.last_auth_error.getTime() < AUTH_BACKOFF_MS;

      if (recentlySynced || authBroken) {
        summary.skipped++;
        continue;
      }

      if (!first) await deps.pause(PAUSE_BETWEEN_USERS_MS);
      first = false;

      try {
        await deps.sync(row.user_id);
        summary.synced++;
      } catch (error) {
        // сбой одного пользователя не должен останавливать остальных
        summary.failed++;
        console.warn(
          `Фоновая синхронизация, пользователь ${row.user_id}:`,
          error instanceof Error ? error.message : error,
        );
      }
    }
  } finally {
    running = false;
  }

  return summary;
};

let timers: { first?: NodeJS.Timeout; every?: NodeJS.Timeout } = {};

export const startScheduler = () => {
  const minutes = config.syncIntervalMinutes;

  if (!(minutes > 0)) {
    console.log("Фоновая синхронизация выключена (SYNC_INTERVAL_MINUTES=0)");
    return;
  }

  const intervalMs = minutes * 60_000;
  const tick = () =>
    applyRetentionService()
      .then((purged) => {
        if (purged.emails + purged.events > 0) {
          console.log(`Срок хранения: удалено писем ${purged.emails}, событий ${purged.events}`);
        }
      })
      .catch((error) => console.error("Очистка по сроку хранения упала:", error))
      .then(() => runScheduledSync(intervalMs))
      .then((s) => {
        if (s.synced || s.failed) {
          console.log(`Фоновая синхронизация: обновлено ${s.synced}, пропущено ${s.skipped}, ошибок ${s.failed}`);
        }
      })
      .catch((error) => console.error("Фоновая синхронизация упала:", error));

  // unref: таймеры не должны мешать процессу завершиться
  timers.first = setTimeout(tick, FIRST_RUN_DELAY_MS);
  timers.first.unref();
  timers.every = setInterval(tick, intervalMs);
  timers.every.unref();

  console.log(`Фоновая синхронизация: каждые ${minutes} мин.`);
};

export const stopScheduler = () => {
  clearTimeout(timers.first);
  clearInterval(timers.every);
  timers = {};
};
