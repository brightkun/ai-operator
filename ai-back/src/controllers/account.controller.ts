import { CookieOptions, Request, Response } from "express";
import { config } from "../config/env";
import { deleteAccountService, getAccountService, setRetentionService } from "../services/account.service";
import { listAuditService, recordAudit } from "../services/audit.service";

// GET /api/account — email, есть ли пароль, срок хранения данных
export const getAccountController = async (req: Request, res: Response) => {
  return res.status(200).json(await getAccountService(req.userId));
};

// PATCH /api/account/retention — {retentionDays: 30|90|180|365|null}; применяется сразу
export const setRetentionController = async (req: Request, res: Response) => {
  const result = await setRetentionService(req.userId, req.body.retentionDays);

  void recordAudit(req.userId, "retention_changed", req, { retentionDays: result.retentionDays });
  if (result.purged.emails + result.purged.events > 0) {
    void recordAudit(req.userId, "data_purged", req, { ...result.purged, reason: "retention" });
  }

  return res.status(200).json(result);
};

// GET /api/account/audit — последние события безопасности этого аккаунта
export const listAuditController = async (req: Request, res: Response) => {
  return res.status(200).json({ entries: await listAuditService(req.userId) });
};

const REFRESH_COOKIE_OPTIONS: CookieOptions = { httpOnly: true, secure: config.cookieSecure, sameSite: "lax" };

// DELETE /api/account — {confirmEmail, password?}: удалить аккаунт и все данные безвозвратно
export const deleteAccountController = async (req: Request, res: Response) => {
  const userId = req.userId;
  await deleteAccountService(userId, req.body.confirmEmail, req.body.password);

  // аккаунта уже нет: запись остаётся без user_id, с id удалённого аккаунта в meta
  void recordAudit(null, "account_deleted", req, { userId });

  res.clearCookie("refreshToken", REFRESH_COOKIE_OPTIONS);
  return res.status(200).json({ message: "Аккаунт и все данные удалены" });
};
