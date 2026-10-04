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

-- ---------------------------------------------------------------------------
-- Данные из Google, синхронизируются в наши таблицы (см. services/sync.service.ts)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS emails (
  id            SERIAL PRIMARY KEY,
  user_id       INTEGER     NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  gmail_id      TEXT        NOT NULL,
  thread_id     TEXT,
  subject       TEXT        NOT NULL DEFAULT '',
  from_name     TEXT        NOT NULL DEFAULT '',
  from_email    TEXT        NOT NULL DEFAULT '',
  snippet       TEXT        NOT NULL DEFAULT '',
  received_at   TIMESTAMPTZ,
  is_read       BOOLEAN     NOT NULL DEFAULT TRUE,
  is_starred    BOOLEAN     NOT NULL DEFAULT FALSE,
  labels        TEXT[]      NOT NULL DEFAULT '{}',
  synced_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, gmail_id)
);

CREATE INDEX IF NOT EXISTS emails_user_received_idx ON emails (user_id, received_at DESC);

CREATE TABLE IF NOT EXISTS calendar_events (
  id               SERIAL PRIMARY KEY,
  user_id          INTEGER     NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  google_event_id  TEXT        NOT NULL,
  title            TEXT        NOT NULL DEFAULT '',
  description      TEXT        NOT NULL DEFAULT '',
  location         TEXT        NOT NULL DEFAULT '',
  start_at         TIMESTAMPTZ NOT NULL,
  end_at           TIMESTAMPTZ NOT NULL,
  all_day          BOOLEAN     NOT NULL DEFAULT FALSE,
  attendees_count  INTEGER     NOT NULL DEFAULT 0,
  html_link        TEXT,
  synced_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, google_event_id)
);

CREATE INDEX IF NOT EXISTS calendar_events_user_start_idx ON calendar_events (user_id, start_at);

CREATE TABLE IF NOT EXISTS drive_files (
  id              SERIAL PRIMARY KEY,
  user_id         INTEGER     NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  google_file_id  TEXT        NOT NULL,
  name            TEXT        NOT NULL DEFAULT '',
  mime_type       TEXT        NOT NULL DEFAULT '',
  is_folder       BOOLEAN     NOT NULL DEFAULT FALSE,
  owner_name      TEXT        NOT NULL DEFAULT '',
  modified_at     TIMESTAMPTZ,
  size_bytes      BIGINT,
  is_starred      BOOLEAN     NOT NULL DEFAULT FALSE,
  web_view_link   TEXT,
  synced_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, google_file_id)
);

CREATE INDEX IF NOT EXISTS drive_files_user_modified_idx ON drive_files (user_id, modified_at DESC);

-- Когда и чем закончилась последняя синхронизация каждого ресурса
CREATE TABLE IF NOT EXISTS sync_state (
  user_id    INTEGER     NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  resource   TEXT        NOT NULL,          -- gmail | calendar | drive
  synced_at  TIMESTAMPTZ,
  item_count INTEGER     NOT NULL DEFAULT 0,
  error      TEXT,
  PRIMARY KEY (user_id, resource)
);
