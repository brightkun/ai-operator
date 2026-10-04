// Управление аккаунтом и данными: срок хранения, полное удаление. Журнал безопасности — в audit.service.ts.

import bcrypt from "bcryptjs";
import { pool } from "../plugins/pg";
import { apiErrors } from "../utils/apiErrors";
import { decryptSecret } from "../utils/secrets";
import { createOAuthClient } from "./googleIntegration.service";
import { applyRetentionService, IRetentionResult, RETENTION_OPTIONS } from "./retention.service";

interface IAccountRow {
  id: number;
  email: string;
  password: string | null;
  retention_days: number | null;
}

const loadAccount = async (userId: number) => {
  const result = await pool.query<IAccountRow>(`SELECT id, email, password, retention_days FROM users WHERE id = $1`, [
    userId,
  ]);
  const account = result.rows[0];

  if (!account) {
    throw apiErrors.notFound("Пользователь не найден");
  }

  return account;
};

export const getAccountService = async (userId: number) => {
  const account = await loadAccount(userId);

  return {
    email: account.email,
    hasPassword: account.password !== null,
    retentionDays: account.retention_days,
    retentionOptions: RETENTION_OPTIONS,
  };
};

// null — хранить без ограничения. Новый срок применяется сразу: лишнее удаляется, число удалённого возвращаем в ответе
export const setRetentionService = async (
  userId: number,
  retentionDays: number | null,
): Promise<{ retentionDays: number | null; purged: IRetentionResult }> => {
  await loadAccount(userId);

  await pool.query(`UPDATE users SET retention_days = $1 WHERE id = $2`, [retentionDays, userId]);
  const purged = await applyRetentionService({ userIds: [userId] });

  return { retentionDays, purged };
};

// Полное удаление аккаунта и всех данных. Подтверждение: email аккаунта, а для аккаунтов с паролем ещё и пароль.
// Доступ Google отзываем у самого Google (если не получится — не мешаем удалению), остальное удаляет каскад БД.
export const deleteAccountService = async (userId: number, confirmEmail: string, password: string | undefined) => {
  const account = await loadAccount(userId);

  if (confirmEmail.trim().toLowerCase() !== account.email.toLowerCase()) {
    throw apiErrors.badRequest("Email для подтверждения не совпадает с адресом аккаунта");
  }

  if (account.password !== null) {
    if (!password || !(await bcrypt.compare(password, account.password))) {
      throw apiErrors.unauthorized("Неверный пароль");
    }
  }

  const integration = await pool.query<{ access_token: string }>(
    `SELECT access_token FROM integrations WHERE user_id = $1 AND provider = 'google'`,
    [userId],
  );

  if (integration.rows[0]) {
    try {
      await createOAuthClient().revokeToken(decryptSecret(integration.rows[0].access_token));
    } catch {
      // токен мог истечь или быть отозван вручную
    }
  }

  await pool.query(`DELETE FROM users WHERE id = $1`, [userId]);
};
