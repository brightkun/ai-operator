// Роуты заметок, смонтированы в createApi.ts под префиксом /api/notes

import { Router } from "express";
import {
  createNoteController,
  deleteNoteController,
  getNoteController,
  listNotesController,
  updateNoteController,
} from "../controllers/notes.controller";
import { authMiddleware } from "../middlewares/authMiddleware";
import { validate } from "../middlewares/validate";
import { createNoteSchema, updateNoteSchema } from "../validators/notes.validator";

const router = Router();

router.use(authMiddleware);

router.get("/", listNotesController);
router.post("/", validate(createNoteSchema), createNoteController);
router.get("/:id", getNoteController);
router.patch("/:id", validate(updateNoteSchema), updateNoteController);
router.delete("/:id", deleteNoteController);

export default router;
