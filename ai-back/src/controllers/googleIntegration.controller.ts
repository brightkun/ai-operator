import { Request, Response } from "express";
import { config } from "../config/env";
import {
  disconnectGoogleService,
  getGoogleAuthUrlService,
  getIntegrationStatusService,
  handleGoogleCallbackService,
  listRecentEmailsService,
} from "../services/googleIntegration.service";

const CLIENT_URL = config.clientUrl;

// GET /api/integrations/google/connect — отдаёт ссылку на Google consent screen.
// Фронт делает fetch с Authorization-заголовком и сам редиректит браузер на url.
export const connectGoogleController = async (req: Request, res: Response) => {
  const url = getGoogleAuthUrlService(req.userId);
  return res.status(200).json({ url });
};

// GET /api/integrations/google/callback — сюда браузер попадает по редиректу от Google
// (без Authorization-заголовка, поэтому userId достаём из state). Не защищён authMiddleware.
export const googleCallbackController = async (req: Request, res: Response) => {
  const { code, state } = req.query;

  if (typeof code !== "string" || typeof state !== "string") {
    return res.redirect(`${CLIENT_URL}/gmail?error=invalid_request`);
  }

  try {
    await handleGoogleCallbackService(code, state);
    return res.redirect(`${CLIENT_URL}/gmail?connected=google`);
  } catch {
    return res.redirect(`${CLIENT_URL}/gmail?error=google_auth_failed`);
  }
};

// GET /api/integrations/google/status — подключён ли Gmail и к какому ящику
export const statusController = async (req: Request, res: Response) => {
  const status = await getIntegrationStatusService(req.userId);
  return res.status(200).json(status);
};

// DELETE /api/integrations/google — отключить Gmail
export const disconnectController = async (req: Request, res: Response) => {
  await disconnectGoogleService(req.userId);
  return res.status(200).json({ message: "Gmail отключён" });
};

// GET /api/integrations/google/emails — последние письма (проверка, что интеграция работает)
export const listEmailsController = async (req: Request, res: Response) => {
  const emails = await listRecentEmailsService(req.userId);
  return res.status(200).json({ emails });
};
