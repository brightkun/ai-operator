// Чтение синхронизированных данных из наших таблиц. В Google отсюда не ходим.

import { pool } from "../plugins/pg";

// % и _ в пользовательском поиске должны искаться как обычные символы, а не как маски LIKE
const escapeLike = (value: string) => value.replace(/[\\%_]/g, "\\$&");

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

export const listEmailsService = async (
  userId: number,
  options: { limit?: number; search?: string },
) => {
  const limit = clamp(options.limit ?? 50, 1, 200);
  const search = options.search?.trim();

  const result = await pool.query(
    `SELECT id, gmail_id AS "gmailId", subject, from_name AS "fromName", from_email AS "fromEmail",
            snippet, received_at AS "receivedAt", is_read AS "isRead", is_starred AS "isStarred"
     FROM emails
     WHERE user_id = $1
       AND ($2::text IS NULL OR subject ILIKE '%' || $2 || '%'
            OR from_name ILIKE '%' || $2 || '%' OR from_email ILIKE '%' || $2 || '%'
            OR snippet ILIKE '%' || $2 || '%')
     ORDER BY received_at DESC NULLS LAST
     LIMIT $3`,
    [userId, search ? escapeLike(search) : null, limit],
  );

  return result.rows;
};

export const listCalendarEventsService = async (
  userId: number,
  from: Date,
  to: Date,
) => {
  // событие попадает в окно, если пересекается с ним (а не только начинается внутри)
  const result = await pool.query(
    `SELECT id, google_event_id AS "googleEventId", title, description, location,
            start_at AS "startAt", end_at AS "endAt", all_day AS "allDay",
            attendees_count AS "attendeesCount", html_link AS "htmlLink"
     FROM calendar_events
     WHERE user_id = $1 AND end_at > $2 AND start_at < $3
     ORDER BY start_at ASC
     LIMIT 1000`,
    [userId, from, to],
  );

  return result.rows;
};

export const listDriveFilesService = async (
  userId: number,
  options: { search?: string },
) => {
  const search = options.search?.trim();

  const result = await pool.query(
    `SELECT id, google_file_id AS "googleFileId", name, mime_type AS "mimeType",
            is_folder AS "isFolder", owner_name AS "ownerName",
            modified_at AS "modifiedAt", size_bytes::float8 AS "sizeBytes",
            is_starred AS "isStarred", web_view_link AS "webViewLink"
     FROM drive_files
     WHERE user_id = $1 AND ($2::text IS NULL OR name ILIKE '%' || $2 || '%')
     ORDER BY is_folder DESC, modified_at DESC NULLS LAST
     LIMIT 300`,
    [userId, search ? escapeLike(search) : null],
  );

  return result.rows;
};
