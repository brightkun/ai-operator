// Журнал безопасности: кто и когда входил, менял пароль, подключал Google, удалял данные.
// В журнал не попадают пароли, токены и тексты писем или заметок — только действие, время, IP и тип устройства.

import { Request } from "express";
import { pool } from "../plugins/pg";

export type AuditAction =
  | "register"
  | "login"
  | "login_failed"
  | "google_login"
  | "logout"
  | "password_reset_requested"
  | "password_reset"
  | "google_connected"
  | "google_disconnected"
  | "retention_changed"
  | "data_purged"
  | "account_deleted";

export interface IAuditEntry {
  id: number;
  action: AuditAction;
  ip: string;
  userAgent: string;
  meta: Record<string, unknown>;
  createdAt: Date;
}

const AUDIT_RETENTION_DAYS = 365;
const LIST_LIMIT = 50;

// Запись журнала не должна ломать основное действие: ошибки глотаем, пишем только в лог
export const recordAudit = (
  userId: number | null,
  action: AuditAction,
  req?: Pick<Request, "ip" | "headers">,
  meta: Record<string, unknown> = {},
) =>
  pool
    .query(`INSERT INTO audit_log (user_id, action, ip, user_agent, meta) VALUES ($1, $2, $3, $4, $5::jsonb)`, [
      userId,
      action,
      req?.ip ?? "",
      String(req?.headers?.["user-agent"] ?? "").slice(0, 200),
      JSON.stringify(meta),
    ])
    .then(() => undefined)
    .catch((error) => console.warn("Не удалось записать в журнал безопасности:", error.message));

// Для неудачного входа: привязываем запись к аккаунту, если такой email существует (иначе user_id пуст, email не сохраняем)
export const findUserIdByEmail = async (email: unknown) => {
  if (typeof email !== "string") return null;

  const result = await pool.query<{ id: number }>(`SELECT id FROM users WHERE email = $1`, [email]);
  return result.rows[0]?.id ?? null;
};

export const listAuditService = async (userId: number): Promise<IAuditEntry[]> => {
  const result = await pool.query<{
    id: string;
    action: AuditAction;
    ip: string;
    user_agent: string;
    meta: Record<string, unknown>;
    created_at: Date;
  }>(
    `SELECT id, action, ip, user_agent, meta, created_at FROM audit_log
     WHERE user_id = $1 ORDER BY created_at DESC, id DESC LIMIT $2`,
    [userId, LIST_LIMIT],
  );

  return result.rows.map((row) => ({
    id: Number(row.id),
    action: row.action,
    ip: row.ip,
    userAgent: row.user_agent,
    meta: row.meta,
    createdAt: row.created_at,
  }));
};

// Журнал хранится ограниченное время (чистится вместе с остальным срезом хранения)
export const purgeOldAudit = async () => {
  const result = await pool.query(`DELETE FROM audit_log WHERE created_at < now() - make_interval(days => $1)`, [
    AUDIT_RETENTION_DAYS,
  ]);
  return result.rowCount ?? 0;
};
