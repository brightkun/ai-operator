import { Request, Response } from "express";
import {
  createNoteService,
  deleteNoteService,
  getNoteService,
  listNotesService,
  updateNoteService,
} from "../services/notes.service";
import { apiErrors } from "../utils/apiErrors";

const parseId = (raw: unknown) => {
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) {
    throw apiErrors.badRequest("Некорректный id заметки");
  }
  return id;
};

// GET /api/notes?search= — список (без полного текста)
export const listNotesController = async (req: Request, res: Response) => {
  const search = typeof req.query.search === "string" ? req.query.search : undefined;

  const notes = await listNotesService(req.userId, search);
  return res.status(200).json({ notes });
};

// GET /api/notes/:id — заметка целиком
export const getNoteController = async (req: Request, res: Response) => {
  const note = await getNoteService(req.userId, parseId(req.params.id));
  return res.status(200).json({ note });
};

// POST /api/notes
export const createNoteController = async (req: Request, res: Response) => {
  const note = await createNoteService(req.userId, req.body);
  return res.status(201).json({ note });
};

// PATCH /api/notes/:id — название и/или текст
export const updateNoteController = async (req: Request, res: Response) => {
  const note = await updateNoteService(req.userId, parseId(req.params.id), req.body);
  return res.status(200).json({ note });
};

// DELETE /api/notes/:id
export const deleteNoteController = async (req: Request, res: Response) => {
  await deleteNoteService(req.userId, parseId(req.params.id));
  return res.status(204).send();
};
