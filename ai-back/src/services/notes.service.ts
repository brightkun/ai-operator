// Заметки пользователя: личные записи, живут только в нашей БД (ни в Google, ни в модель не уходят).

import { pool } from "../plugins/pg";
import { apiErrors } from "../utils/apiErrors";
import { escapeLike } from "./data.service";

const EXCERPT_LENGTH = 160;
const LIST_LIMIT = 200;

export interface INoteSummary {
  id: number;
  title: string;
  excerpt: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface INote {
  id: number;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

const NOTE_COLUMNS = `id, title, content, created_at AS "createdAt", updated_at AS "updatedAt"`;

// В списке отдаём только начало текста, без пробельного мусора: сами заметки могут быть большими
export const listNotesService = async (userId: number, search?: string) => {
  const query = search?.trim();

  const result = await pool.query<INoteSummary>(
    `SELECT id, title,
            left(btrim(regexp_replace(content, '\\s+', ' ', 'g')), ${EXCERPT_LENGTH}) AS excerpt,
            created_at AS "createdAt", updated_at AS "updatedAt"
     FROM notes
     WHERE user_id = $1
       AND ($2::text IS NULL OR title ILIKE '%' || $2 || '%' OR content ILIKE '%' || $2 || '%')
     ORDER BY updated_at DESC, id DESC
     LIMIT ${LIST_LIMIT}`,
    [userId, query ? escapeLike(query) : null],
  );

  return result.rows;
};

export const getNoteService = async (userId: number, noteId: number) => {
  // user_id в условии: чужая заметка для всех остальных «не найдена»
  const result = await pool.query<INote>(
    `SELECT ${NOTE_COLUMNS} FROM notes WHERE id = $1 AND user_id = $2`,
    [noteId, userId],
  );

  const note = result.rows[0];
  if (!note) {
    throw apiErrors.notFound("Заметка не найдена");
  }

  return note;
};

export const createNoteService = async (
  userId: number,
  input: { title: string; content: string },
) => {
  const result = await pool.query<INote>(
    `INSERT INTO notes (user_id, title, content) VALUES ($1, $2, $3) RETURNING ${NOTE_COLUMNS}`,
    [userId, input.title, input.content],
  );

  return result.rows[0]!;
};

export const updateNoteService = async (
  userId: number,
  noteId: number,
  patch: { title?: string; content?: string },
) => {
  const sets: string[] = [];
  const params: unknown[] = [noteId, userId];

  if (patch.title !== undefined) {
    params.push(patch.title);
    sets.push(`title = $${params.length}`);
  }
  if (patch.content !== undefined) {
    params.push(patch.content);
    sets.push(`content = $${params.length}`);
  }

  if (sets.length === 0) {
    throw apiErrors.badRequest("Нечего изменять");
  }

  const result = await pool.query<INote>(
    `UPDATE notes SET ${sets.join(", ")}, updated_at = now()
     WHERE id = $1 AND user_id = $2
     RETURNING ${NOTE_COLUMNS}`,
    params,
  );

  const note = result.rows[0];
  if (!note) {
    throw apiErrors.notFound("Заметка не найдена");
  }

  return note;
};

export const deleteNoteService = async (userId: number, noteId: number) => {
  const result = await pool.query(`DELETE FROM notes WHERE id = $1 AND user_id = $2`, [noteId, userId]);

  if (result.rowCount === 0) {
    throw apiErrors.notFound("Заметка не найдена");
  }
};
