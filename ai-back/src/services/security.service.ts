// Одноразовая (идемпотентная) доводка уже сохранённых данных до текущих правил безопасности.
// Запускается при старте сервера: после включения шифрования и хэширования старые строки
// переписываются, новые и так пишутся в защищённом виде.

import { pool } from "../plugins/pg";
import { encryptSecret, isEncrypted } from "../utils/secrets";

export interface ISecurityMigrationResult {
  tokensEncrypted: number;
  refreshHashed: number;
  resetCleared: number;
}

// scope.userIds ограничивает миграцию заданными пользователями (нужно тестам, чтобы не трогать чужие данные в общей БД)
export const runSecurityMigrations = async (scope?: { userIds: number[] }): Promise<ISecurityMigrationResult> => {
  const ids = scope?.userIds ?? null;
  const result: ISecurityMigrationResult = { tokensEncrypted: 0, refreshHashed: 0, resetCleared: 0 };

  // OAuth-токены Google, записанные до шифрования. Без ключа encryptSecret вернёт их как есть — ничего не меняем.
  const legacy = await pool.query<{ id: number; access_token: string; refresh_token: string | null }>(
    `SELECT id, access_token, refresh_token FROM integrations
     WHERE ($1::int[] IS NULL OR user_id = ANY($1))
       AND (access_token NOT LIKE 'enc:v1:%' OR (refresh_token IS NOT NULL AND refresh_token NOT LIKE 'enc:v1:%'))`,
    [ids],
  );

  for (const row of legacy.rows) {
    const access = isEncrypted(row.access_token) ? row.access_token : encryptSecret(row.access_token);
    const refresh =
      row.refresh_token === null || isEncrypted(row.refresh_token) ? row.refresh_token : encryptSecret(row.refresh_token);

    if (access !== row.access_token || refresh !== row.refresh_token) {
      await pool.query(`UPDATE integrations SET access_token = $1, refresh_token = $2 WHERE id = $3`, [
        access,
        refresh,
        row.id,
      ]);
      result.tokensEncrypted++;
    }
  }

  // Refresh-токены сессий хранились как есть (JWT: три части через точку). Хэш SHA-256 — 64 hex-символа без точек,
  // поэтому условие LIKE '%.%' отличает старые значения от уже захэшированных, а сессии пользователей сохраняются.
  const hashed = await pool.query(
    `UPDATE users SET refresh_token = encode(sha256(convert_to(refresh_token, 'UTF8')), 'hex')
     WHERE refresh_token LIKE '%.%' AND ($1::int[] IS NULL OR id = ANY($1))`,
    [ids],
  );
  result.refreshHashed = hashed.rowCount ?? 0;

  // Токены сброса пароля теперь хранятся хэшем. Просроченные чистим; живые старые (≤ 1 часа) при проверке не совпадут
  // с хэшем и перестанут работать — пользователь запросит новую ссылку, а в БД они доживут до очистки при следующем старте.
  const cleared = await pool.query(
    `UPDATE users SET reset_token = NULL, reset_token_expires = NULL
     WHERE reset_token IS NOT NULL AND (reset_token_expires IS NULL OR reset_token_expires < now())
       AND ($1::int[] IS NULL OR id = ANY($1))`,
    [ids],
  );
  result.resetCleared = cleared.rowCount ?? 0;

  return result;
};
