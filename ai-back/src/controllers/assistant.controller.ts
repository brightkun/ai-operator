import { Request, Response } from "express";
import { assistantChatService } from "../services/assistant.service";

// POST /api/assistant/chat — ответ ассистента на последнюю реплику диалога.
// История хранится на клиенте и приходит целиком (тело уже проверено zod-схемой).
export const assistantChatController = async (req: Request, res: Response) => {
  const { messages, timeZone } = req.body;

  const result = await assistantChatService(req.userId, messages, timeZone);
  return res.status(200).json(result);
};
