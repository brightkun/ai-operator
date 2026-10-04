-- Схема БД AI Operator. Скрипт идемпотентный: можно запускать повторно.
-- Применить:  psql -U <DB_USER> -d <DB_NAME> -f sql/schema.sql

CREATE TABLE IF NOT EXISTS users (
  id                   SERIAL PRIMARY KEY,
  name                 TEXT        NOT NULL,
  email                TEXT        NOT NULL UNIQUE,
  password             TEXT,                 -- NULL у тех, кто вошёл только через Google
  google_id            TEXT        UNIQUE,
  refresh_token        TEXT,                 -- текущий активный refresh-токен
  reset_token          TEXT,                 -- токен восстановления пароля
  reset_token_expires  TIMESTAMPTZ,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS users_reset_token_idx ON users (reset_token);

-- Подключённые внешние сервисы (сейчас только Google / Gmail)
CREATE TABLE IF NOT EXISTS integrations (
  id             SERIAL PRIMARY KEY,
  user_id        INTEGER     NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  provider       TEXT        NOT NULL,
  access_token   TEXT        NOT NULL,
  refresh_token  TEXT,
  scope          TEXT,
  token_expiry   TIMESTAMPTZ,
  google_email   TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, provider)
);
