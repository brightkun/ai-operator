import { Request, Response } from "express";
import {
  listCalendarEventsService,
  listDriveFilesService,
  listEmailsService,
} from "../services/data.service";
import { syncAllService } from "../services/sync.service";
import { apiErrors } from "../utils/apiErrors";

const asString = (value: unknown) =>
  typeof value === "string" ? value : undefined;

// POST /api/sync — подтянуть из Google письма, события и файлы
export const syncController = async (req: Request, res: Response) => {
  const results = await syncAllService(req.userId);
  return res.status(200).json({ results });
};

// GET /api/emails?search=&limit=
export const emailsController = async (req: Request, res: Response) => {
  const limit = Number(asString(req.query.limit));
  const emails = await listEmailsService(req.userId, {
    ...(Number.isFinite(limit) && limit > 0 ? { limit } : {}),
    ...(asString(req.query.search) ? { search: asString(req.query.search)! } : {}),
  });

  return res.status(200).json({ emails });
};

// GET /api/calendar/events?from=ISO&to=ISO
export const calendarEventsController = async (req: Request, res: Response) => {
  const from = new Date(asString(req.query.from) ?? "");
  const to = new Date(asString(req.query.to) ?? "");

  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime()) || from >= to) {
    throw apiErrors.badRequest("Нужны корректные параметры from и to (ISO-даты, from < to)");
  }

  const events = await listCalendarEventsService(req.userId, from, to);
  return res.status(200).json({ events });
};

// GET /api/drive/files?search=
export const driveFilesController = async (req: Request, res: Response) => {
  const files = await listDriveFilesService(req.userId, {
    ...(asString(req.query.search) ? { search: asString(req.query.search)! } : {}),
  });

  return res.status(200).json({ files });
};
