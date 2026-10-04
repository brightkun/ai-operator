import { Request, Response } from "express";
import { recordEvent } from "../services/events.service";
import { assistEmailService } from "../services/emailAssist.service";
import { apiErrors } from "../utils/apiErrors";

// POST /api/emails/:id/assist — {action: "summary" | "reply", instruction?} -> {text, cached}
export const emailAssistController = async (req: Request, res: Response) => {
  const emailId = Number(req.params.id);
  if (!Number.isInteger(emailId) || emailId <= 0) {
    throw apiErrors.badRequest("Некорректный id письма");
  }

  const { action, instruction, timeZone, refresh } = req.body;
  const result = await assistEmailService(req.userId, emailId, action, { instruction, timeZone, refresh });

  return res.status(200).json(result);
};

// POST /api/events — событие, о котором знает только браузер (человек принял черновик). Для метрик из ТЗ.
export const clientEventController = async (req: Request, res: Response) => {
  await recordEvent(req.userId, req.body.type, req.body.meta ?? {});
  return res.status(204).send();
};
