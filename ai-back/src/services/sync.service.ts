// Синхронизация Gmail / Calendar / Drive в наши таблицы.
// Фронт и дальнейшие AI-функции читают уже локальные данные (см. data.service.ts),
// а сюда мы ходим в Google только по кнопке «Синхронизировать» и после подключения.

import { calendar_v3, drive_v3, gmail_v1, google } from "googleapis";
import { GoogleResource, hasScope } from "../config/googleScopes";
import { pool } from "../plugins/pg";
import { apiErrors } from "../utils/apiErrors";
import { retentionCutoff } from "./retention.service";
import {
  getAuthorizedClient,
  IIntegration,
} from "./googleIntegration.service";

const GMAIL_LIMIT = 50; // последние письма во входящих
const GMAIL_SENT_LIMIT = 30; // и последние отправленные: из них берём обещания и «жду ответа»
const GMAIL_CHUNK = 10; // сколько писем запрашиваем у Gmail параллельно
const CALENDAR_DAYS_BACK = 30;
const CALENDAR_DAYS_FORWARD = 90;
const DRIVE_PAGE_SIZE = 100;
const DRIVE_MAX_PAGES = 3;
const FOLDER_MIME = "application/vnd.google-apps.folder";

// ---------------------------------------------------------------------------
// Мапперы: ответ Google API -> строка нашей таблицы (чистые функции)
// ---------------------------------------------------------------------------

export interface IEmailRow {
  gmailId: string;
  threadId: string | null;
  subject: string;
  fromName: string;
  fromEmail: string;
  toText: string; // заголовок To как есть (у отправленных — кому писали)
  snippet: string;
  receivedAt: Date | null;
  isRead: boolean;
  isStarred: boolean;
  labels: string[];
}

// "Иван Иванов <ivan@x.com>", "\"Ivan\" <ivan@x.com>" или просто "ivan@x.com"
export const parseFromHeader = (raw: string) => {
  const match = raw.match(/^\s*"?([^"<]*?)"?\s*<([^>]+)>\s*$/);

  if (match) {
    const email = (match[2] ?? "").trim();
    const name = (match[1] ?? "").trim();
    return { name: name || email, email };
  }

  const value = raw.trim();
  return { name: value, email: value };
};

export const mapGmailMessage = (
  message: gmail_v1.Schema$Message,
): IEmailRow | null => {
  if (!message.id) {
    return null;
  }

  const headers = message.payload?.headers ?? [];
  const header = (name: string) =>
    headers.find((h) => h.name?.toLowerCase() === name.toLowerCase())?.value ??
    "";

  const from = parseFromHeader(header("From"));
  const labels = message.labelIds ?? [];
  const internalDate = Number(message.internalDate);

  return {
    gmailId: message.id,
    threadId: message.threadId ?? null,
    subject: header("Subject"),
    fromName: from.name,
    fromEmail: from.email,
    toText: header("To").slice(0, 300),
    snippet: message.snippet ?? "",
    receivedAt: Number.isFinite(internalDate) ? new Date(internalDate) : null,
    isRead: !labels.includes("UNREAD"),
    isStarred: labels.includes("STARRED"),
    labels,
  };
};

export interface IAttendee {
  email: string;
  name: string;
  self: boolean; // это сам пользователь
  resource: boolean; // переговорка или другой ресурс, а не человек
  response: string; // accepted | declined | tentative | needsAction
}

export interface IEventRow {
  googleEventId: string;
  title: string;
  description: string;
  location: string;
  startAt: Date;
  endAt: Date;
  allDay: boolean;
  attendeesCount: number;
  attendees: IAttendee[];
  organizerEmail: string;
  htmlLink: string | null;
}

export const mapCalendarEvent = (
  event: calendar_v3.Schema$Event,
): IEventRow | null => {
  if (!event.id || event.status === "cancelled") {
    return null;
  }

  // событие на весь день приходит как { date: "2026-10-04" } без времени, конец — не включительно.
  // Храним полночь UTC и all_day = true: время суток у такого события не имеет смысла.
  const allDay = Boolean(event.start?.date);
  const start = event.start?.dateTime ?? event.start?.date;
  const end = event.end?.dateTime ?? event.end?.date ?? start;

  if (!start || !end) {
    return null;
  }

  return {
    googleEventId: event.id,
    title: event.summary || "(без названия)",
    description: event.description ?? "",
    location: event.location ?? "",
    startAt: new Date(start),
    endAt: new Date(end),
    allDay,
    attendeesCount: event.attendees?.length ?? 0,
    // у большой встречи участников сотни — храним первых 50: для подготовки этого достаточно
    attendees: (event.attendees ?? [])
      .filter((a) => a.email)
      .slice(0, 50)
      .map((a) => ({
        email: String(a.email).toLowerCase(),
        name: a.displayName ?? "",
        self: Boolean(a.self),
        resource: Boolean(a.resource) || /resource\.calendar\.google\.com$/i.test(a.email ?? ""),
        response: a.responseStatus ?? "",
      })),
    organizerEmail: (event.organizer?.email ?? "").toLowerCase(),
    htmlLink: event.htmlLink ?? null,
  };
};

export interface IFileRow {
  googleFileId: string;
  name: string;
  mimeType: string;
  isFolder: boolean;
  ownerName: string;
  modifiedAt: Date | null;
  sizeBytes: number | null;
  isStarred: boolean;
  webViewLink: string | null;
}

export const mapDriveFile = (file: drive_v3.Schema$File): IFileRow | null => {
  if (!file.id) {
    return null;
  }

  const owner = file.owners?.[0];

  return {
    googleFileId: file.id,
    name: file.name ?? "",
    mimeType: file.mimeType ?? "",
    isFolder: file.mimeType === FOLDER_MIME,
    ownerName: owner?.displayName || owner?.emailAddress || "",
    modifiedAt: file.modifiedTime ? new Date(file.modifiedTime) : null,
    // у Google Docs/Sheets размера нет — поле не приходит
    sizeBytes: file.size ? Number(file.size) : null,
    isStarred: Boolean(file.starred),
    webViewLink: file.webViewLink ?? null,
  };
};

// ---------------------------------------------------------------------------
// Сохранение в БД (отдельно от запросов к Google, чтобы это можно было проверять без сети)
// ---------------------------------------------------------------------------

export const saveEmails = async (userId: number, allRows: IEmailRow[]) => {
  // срок хранения, выбранный пользователем: письма старше него обратно не загружаем
  const cutoff = await retentionCutoff(userId);
  const rows = cutoff ? allRows.filter((r) => !r.receivedAt || r.receivedAt >= cutoff) : allRows;

  for (const r of rows) {
    await pool.query(
      `INSERT INTO emails (user_id, gmail_id, thread_id, subject, from_name, from_email, to_text, snippet, received_at, is_read, is_starred, labels, synced_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, now())
       ON CONFLICT (user_id, gmail_id) DO UPDATE SET
         thread_id = EXCLUDED.thread_id, subject = EXCLUDED.subject,
         from_name = EXCLUDED.from_name, from_email = EXCLUDED.from_email,
         to_text = EXCLUDED.to_text, snippet = EXCLUDED.snippet, received_at = EXCLUDED.received_at,
         is_read = EXCLUDED.is_read, is_starred = EXCLUDED.is_starred,
         labels = EXCLUDED.labels, synced_at = now()`,
      [
        userId,
        r.gmailId,
        r.threadId,
        r.subject,
        r.fromName,
        r.fromEmail,
        r.toText,
        r.snippet,
        r.receivedAt,
        r.isRead,
        r.isStarred,
        r.labels,
      ],
    );
  }
};

export const saveEvents = async (
  userId: number,
  allRows: IEventRow[],
  timeMin: Date,
  timeMax: Date,
) => {
  const cutoff = await retentionCutoff(userId);
  const rows = cutoff ? allRows.filter((r) => r.endAt >= cutoff) : allRows;

  for (const r of rows) {
    await pool.query(
      `INSERT INTO calendar_events (user_id, google_event_id, title, description, location, start_at, end_at, all_day, attendees_count, attendees, organizer_email, html_link, synced_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb, $11, $12, now())
       ON CONFLICT (user_id, google_event_id) DO UPDATE SET
         title = EXCLUDED.title, description = EXCLUDED.description,
         location = EXCLUDED.location, start_at = EXCLUDED.start_at,
         end_at = EXCLUDED.end_at, all_day = EXCLUDED.all_day,
         attendees_count = EXCLUDED.attendees_count, attendees = EXCLUDED.attendees,
         organizer_email = EXCLUDED.organizer_email, html_link = EXCLUDED.html_link,
         synced_at = now()`,
      [
        userId,
        r.googleEventId,
        r.title,
        r.description,
        r.location,
        r.startAt,
        r.endAt,
        r.allDay,
        r.attendeesCount,
        JSON.stringify(r.attendees),
        r.organizerEmail,
        r.htmlLink,
      ],
    );
  }

  // удалённые/отменённые в Google события внутри окна синхронизации убираем и у нас
  await pool.query(
    `DELETE FROM calendar_events
     WHERE user_id = $1 AND start_at >= $2 AND start_at < $3
       AND NOT (google_event_id = ANY($4::text[]))`,
    [userId, timeMin, timeMax, rows.map((r) => r.googleEventId)],
  );
};

export const saveFiles = async (userId: number, rows: IFileRow[]) => {
  for (const r of rows) {
    await pool.query(
      `INSERT INTO drive_files (user_id, google_file_id, name, mime_type, is_folder, owner_name, modified_at, size_bytes, is_starred, web_view_link, synced_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, now())
       ON CONFLICT (user_id, google_file_id) DO UPDATE SET
         name = EXCLUDED.name, mime_type = EXCLUDED.mime_type,
         is_folder = EXCLUDED.is_folder, owner_name = EXCLUDED.owner_name,
         modified_at = EXCLUDED.modified_at, size_bytes = EXCLUDED.size_bytes,
         is_starred = EXCLUDED.is_starred, web_view_link = EXCLUDED.web_view_link,
         synced_at = now()`,
      [
        userId,
        r.googleFileId,
        r.name,
        r.mimeType,
        r.isFolder,
        r.ownerName,
        r.modifiedAt,
        r.sizeBytes,
        r.isStarred,
        r.webViewLink,
      ],
    );
  }

  // храним снимок «последние файлы»: всё, чего нет в свежей выборке (удалено/ушло глубже), убираем
  await pool.query(
    `DELETE FROM drive_files WHERE user_id = $1 AND NOT (google_file_id = ANY($2::text[]))`,
    [userId, rows.map((r) => r.googleFileId)],
  );
};

// ---------------------------------------------------------------------------
// Синхронизация отдельных ресурсов
// ---------------------------------------------------------------------------

type Auth = Awaited<ReturnType<typeof getAuthorizedClient>>;

const syncGmail = async (userId: number, auth: Auth) => {
  const gmail = google.gmail({ version: "v1", auth });

  const listIds = async (labelId: string, maxResults: number) => {
    const list = await gmail.users.messages.list({
      userId: "me",
      labelIds: [labelId],
      maxResults,
    });
    return (list.data.messages ?? []).flatMap((m) => (m.id ? [m.id] : []));
  };

  const ids = [
    ...new Set([
      ...(await listIds("INBOX", GMAIL_LIMIT)),
      ...(await listIds("SENT", GMAIL_SENT_LIMIT)),
    ]),
  ];

  const rows: IEmailRow[] = [];

  for (let i = 0; i < ids.length; i += GMAIL_CHUNK) {
    const chunk = ids.slice(i, i + GMAIL_CHUNK);
    const details = await Promise.all(
      chunk.map((id) =>
        gmail.users.messages.get({
          userId: "me",
          id,
          format: "metadata",
          metadataHeaders: ["Subject", "From", "To", "Date"],
        }),
      ),
    );

    for (const detail of details) {
      const row = mapGmailMessage(detail.data);
      if (row) rows.push(row);
    }
  }

  await saveEmails(userId, rows);

  return rows.length;
};

const syncCalendar = async (userId: number, auth: Auth) => {
  const calendar = google.calendar({ version: "v3", auth });

  const day = 24 * 60 * 60 * 1000;
  const timeMin = new Date(Date.now() - CALENDAR_DAYS_BACK * day);
  const timeMax = new Date(Date.now() + CALENDAR_DAYS_FORWARD * day);

  const rows: IEventRow[] = [];
  let pageToken: string | undefined;

  for (let page = 0; page < 3; page++) {
    const response = await calendar.events.list({
      calendarId: "primary",
      timeMin: timeMin.toISOString(),
      timeMax: timeMax.toISOString(),
      singleEvents: true, // повторяющиеся события раскладываются на отдельные
      orderBy: "startTime",
      maxResults: 250,
      ...(pageToken ? { pageToken } : {}),
    });

    for (const event of response.data.items ?? []) {
      const row = mapCalendarEvent(event);
      if (row) rows.push(row);
    }

    pageToken = response.data.nextPageToken ?? undefined;
    if (!pageToken) break;
  }

  await saveEvents(userId, rows, timeMin, timeMax);

  return rows.length;
};

const syncDrive = async (userId: number, auth: Auth) => {
  const drive = google.drive({ version: "v3", auth });

  const rows: IFileRow[] = [];
  let pageToken: string | undefined;

  for (let page = 0; page < DRIVE_MAX_PAGES; page++) {
    const response = await drive.files.list({
      q: "trashed = false",
      orderBy: "modifiedTime desc",
      pageSize: DRIVE_PAGE_SIZE,
      fields:
        "nextPageToken, files(id, name, mimeType, modifiedTime, size, starred, webViewLink, owners(displayName, emailAddress))",
      ...(pageToken ? { pageToken } : {}),
    });

    for (const file of response.data.files ?? []) {
      const row = mapDriveFile(file);
      if (row) rows.push(row);
    }

    pageToken = response.data.nextPageToken ?? undefined;
    if (!pageToken) break;
  }

  await saveFiles(userId, rows);

  return rows.length;
};

const SYNCERS: Record<
  GoogleResource,
  (userId: number, auth: Auth) => Promise<number>
> = {
  gmail: syncGmail,
  calendar: syncCalendar,
  drive: syncDrive,
};

export interface ISyncResult {
  ok: boolean;
  count: number;
  error?: string;
}

const saveState = (
  userId: number,
  resource: GoogleResource,
  count: number,
  error: string | null,
) =>
  pool.query(
    `INSERT INTO sync_state (user_id, resource, synced_at, item_count, error)
     VALUES ($1, $2, now(), $3, $4)
     ON CONFLICT (user_id, resource) DO UPDATE SET
       synced_at = now(), item_count = EXCLUDED.item_count, error = EXCLUDED.error`,
    [userId, resource, count, error],
  );

const runOne = async (
  userId: number,
  resource: GoogleResource,
  auth: Auth,
): Promise<ISyncResult> => {
  try {
    const count = await SYNCERS[resource](userId, auth);
    await saveState(userId, resource, count, null);
    return { ok: true, count };
  } catch (error) {
    // сообщение Google (например, «API не включён в проекте») полезно для диагностики
    const message =
      error instanceof Error ? error.message : "Неизвестная ошибка синхронизации";
    await saveState(userId, resource, 0, message).catch(() => {});
    return { ok: false, count: 0, error: message };
  }
};

// Два одновременных запроса sync от одного пользователя делят один запуск
const inFlight = new Map<number, Promise<Record<string, ISyncResult>>>();

export const syncAllService = (userId: number) => {
  const running = inFlight.get(userId);
  if (running) return running;

  const promise = (async () => {
    const found = await pool.query<IIntegration>(
      `SELECT * FROM integrations WHERE user_id = $1 AND provider = 'google'`,
      [userId],
    );
    const integration = found.rows[0];

    if (!integration) {
      throw apiErrors.notFound("Google не подключён");
    }

    const auth = await getAuthorizedClient(userId);
    const resources: GoogleResource[] = ["gmail", "calendar", "drive"];

    const entries = await Promise.all(
      resources.map(async (resource): Promise<[string, ISyncResult]> => {
        if (!hasScope(integration.scope, resource)) {
          return [
            resource,
            { ok: false, count: 0, error: "missing_scope" },
          ];
        }

        return [resource, await runOne(userId, resource, auth)];
      }),
    );

    return Object.fromEntries(entries);
  })().finally(() => {
    inFlight.delete(userId);
  });

  inFlight.set(userId, promise);
  return promise;
};
