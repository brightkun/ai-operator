// Защита секретов в БД: шифрование OAuth-токенов Google (AES-256-GCM) и хэширование
// одноразовых токенов (refresh, сброс пароля), которые достаточно уметь только сверять.
//
// Ключ шифрования — TOKEN_ENCRYPTION_KEY: 32 байта в hex (64 символа) или base64.
// Сгенерировать: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
// Потеряете ключ — пользователям придётся заново подключить Google (расшифровать токены станет нечем).

import crypto from "crypto";

const PREFIX = "enc:v1:";

let warned = false;

const parseKey = (raw: string | undefined): Buffer | null => {
  if (!raw) return null;

  const value = raw.trim();
  const key = /^[0-9a-fA-F]{64}$/.test(value) ? Buffer.from(value, "hex") : Buffer.from(value, "base64");

  if (key.length !== 32) {
    throw new Error("TOKEN_ENCRYPTION_KEY должен быть 32 байта: 64 hex-символа или base64 (см. .env.example)");
  }

  return key;
};

// Ключ читается при каждом вызове: так тесты и смена окружения не требуют перезагрузки модуля
const getKey = () => {
  const key = parseKey(process.env.TOKEN_ENCRYPTION_KEY);

  if (!key && process.env.NODE_ENV === "production") {
    throw new Error("В production обязательна переменная TOKEN_ENCRYPTION_KEY (см. .env.example)");
  }

  return key;
};

export const isEncrypted = (value: string) => value.startsWith(PREFIX);

// Без ключа (только разработка) токен остаётся как есть и сервер один раз предупреждает об этом
export const encryptSecret = (plain: string): string => {
  const key = getKey();

  if (!key) {
    if (!warned) {
      warned = true;
      console.warn("TOKEN_ENCRYPTION_KEY не задан: OAuth-токены хранятся в БД без шифрования");
    }
    return plain;
  }

  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);

  return PREFIX + [iv, cipher.getAuthTag(), encrypted].map((part) => part.toString("base64")).join(":");
};

// Значения без префикса — токены, записанные до включения шифрования: возвращаем как есть
export const decryptSecret = (stored: string): string => {
  if (!isEncrypted(stored)) return stored;

  const key = getKey();
  if (!key) {
    throw new Error("Токены зашифрованы, но TOKEN_ENCRYPTION_KEY не задан");
  }

  const [iv, tag, data] = stored
    .slice(PREFIX.length)
    .split(":")
    .map((part) => Buffer.from(part, "base64"));

  if (!iv || !tag || !data) {
    throw new Error("Повреждённое зашифрованное значение");
  }

  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);

  return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
};

// SHA-256 в hex: для токенов, которые мы только сверяем (refresh-токен, токен сброса пароля)
export const hashToken = (token: string) => crypto.createHash("sha256").update(token).digest("hex");
