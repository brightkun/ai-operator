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

-- ---------------------------------------------------------------------------
-- Задачи из писем и сводка дня (см. services/tasks.service.ts, services/brief.service.ts)
-- ---------------------------------------------------------------------------

-- кому адресовано письмо (нужно для «жду ответа» по отправленным) и когда из него искали задачи
ALTER TABLE emails ADD COLUMN IF NOT EXISTS to_text TEXT NOT NULL DEFAULT '';
ALTER TABLE emails ADD COLUMN IF NOT EXISTS tasks_extracted_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS tasks (
  id             SERIAL PRIMARY KEY,
  user_id        INTEGER     NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  email_id       INTEGER     REFERENCES emails (id) ON DELETE SET NULL,
  title          TEXT        NOT NULL,
  -- todo: надо сделать мне; commitment: я пообещал; waiting: жду ответа/действия от другого
  kind           TEXT        NOT NULL CHECK (kind IN ('todo', 'commitment', 'waiting')),
  due_date       DATE,
  status         TEXT        NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'done', 'dismissed')),
  source         TEXT        NOT NULL DEFAULT 'email' CHECK (source IN ('email', 'manual')),
  -- данные письма копируем: задача должна быть понятна, даже если письма уже нет в кеше
  source_title   TEXT        NOT NULL DEFAULT '',
  source_person  TEXT        NOT NULL DEFAULT '',
  source_url     TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, email_id, title)
);

CREATE INDEX IF NOT EXISTS tasks_user_status_due_idx ON tasks (user_id, status, due_date);

-- Текст сводки дня: по одной на пользователя и локальную дату (остальное в сводке считается на лету)
CREATE TABLE IF NOT EXISTS briefs (
  user_id       INTEGER     NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  brief_date    DATE        NOT NULL,
  summary       TEXT        NOT NULL,
  sources       JSONB       NOT NULL DEFAULT '[]',
  model         TEXT        NOT NULL DEFAULT '',
  generated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, brief_date)
);

-- ---------------------------------------------------------------------------
-- Заметки пользователя (хранятся только у нас; модели не отправляются)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS notes (
  id          SERIAL PRIMARY KEY,
  user_id     INTEGER     NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  title       TEXT        NOT NULL DEFAULT '',
  content     TEXT        NOT NULL DEFAULT '',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS notes_user_updated_idx ON notes (user_id, updated_at DESC);

-- ---------------------------------------------------------------------------
-- Помощь AI по письмам и события использования (метрики из ТЗ)
-- ---------------------------------------------------------------------------

-- Краткое содержание письма: делаем один раз и кешируем (экономим квоту модели)
CREATE TABLE IF NOT EXISTS email_summaries (
  user_id       INTEGER     NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  email_id      INTEGER     NOT NULL REFERENCES emails (id) ON DELETE CASCADE,
  summary       TEXT        NOT NULL,
  model         TEXT        NOT NULL DEFAULT '',
  generated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, email_id)
);

-- Ключевые действия пользователя и AI для метрик: принятые черновики, завершённые AI-задачи, открытия сводки.
-- Содержимого писем и заметок здесь нет: в meta только id и числа.
CREATE TABLE IF NOT EXISTS usage_events (
  id          BIGSERIAL PRIMARY KEY,
  user_id     INTEGER     NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  type        TEXT        NOT NULL,
  meta        JSONB       NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS usage_events_user_type_idx ON usage_events (user_id, type, created_at DESC);

-- ---------------------------------------------------------------------------
-- Подготовка к встрече (Meeting Intelligence)
-- ---------------------------------------------------------------------------

-- участники из Google Calendar: [{ email, name, self, resource, response }]
ALTER TABLE calendar_events ADD COLUMN IF NOT EXISTS attendees JSONB NOT NULL DEFAULT '[]';
ALTER TABLE calendar_events ADD COLUMN IF NOT EXISTS organizer_email TEXT NOT NULL DEFAULT '';

-- Текст подготовки: по одной на встречу (пересоздаётся по кнопке)
CREATE TABLE IF NOT EXISTS meeting_preps (
  user_id       INTEGER     NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  event_id      INTEGER     NOT NULL REFERENCES calendar_events (id) ON DELETE CASCADE,
  summary       TEXT        NOT NULL,
  sources       JSONB       NOT NULL DEFAULT '[]',
  model         TEXT        NOT NULL DEFAULT '',
  generated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, event_id)
);
