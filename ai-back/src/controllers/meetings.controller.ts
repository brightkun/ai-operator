import { Request, Response } from "express";
import { generateMeetingPrepService, getMeetingService } from "../services/meetings.service";
import { apiErrors } from "../utils/apiErrors";

const parseId = (raw: unknown) => {
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) {
    throw apiErrors.badRequest("Некорректный id встречи");
  }
  return id;
};

// GET /api/meetings/:id — встреча, участники, связанные письма/задачи/файлы и сохранённая подготовка
export const getMeetingController = async (req: Request, res: Response) => {
  const meeting = await getMeetingService(req.userId, parseId(req.params.id));
  return res.status(200).json(meeting);
};

// POST /api/meetings/:id/prep — составить (или обновить) подготовку к встрече через AI
export const generateMeetingPrepController = async (req: Request, res: Response) => {
  const prep = await generateMeetingPrepService(req.userId, parseId(req.params.id), req.body.timeZone);
  return res.status(200).json({ prep });
};
