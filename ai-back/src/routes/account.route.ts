// Роуты аккаунта (срок хранения данных, журнал безопасности, удаление), смонтированы в createApi.ts под /api/account

import { Router } from "express";
import {
  deleteAccountController,
  getAccountController,
  listAuditController,
  setRetentionController,
} from "../controllers/account.controller";
import { authMiddleware } from "../middlewares/authMiddleware";
import { rateLimit } from "../middlewares/rateLimit";
import { validate } from "../middlewares/validate";
import { deleteAccountSchema, retentionSchema } from "../validators/account.validator";

const router = Router();

router.use(authMiddleware);

router.get("/", getAccountController);
router.get("/audit", listAuditController);
router.patch("/retention", validate(retentionSchema), setRetentionController);
// пароль сверяется через bcrypt: не даём перебирать его через этот роут
router.delete(
  "/",
  rateLimit({ name: "account-delete", windowMs: 60 * 60 * 1000, max: 5, key: (req) => String(req.userId) }),
  validate(deleteAccountSchema),
  deleteAccountController,
);

export default router;
