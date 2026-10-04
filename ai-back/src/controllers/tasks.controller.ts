import { Request, Response } from "express";
import {
  createTaskService,
  extractTasksService,
  listTasksService,
  updateTaskService,
} from "../services/tasks.service";
import { apiErrors } from "../utils/apiErrors";

const parseId = (raw: unknown) => {
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) {
    throw apiErrors.badRequest("Некорректный id задачи");
  }
  return id;
};

// GET /api/tasks?status=open|done&kind=todo|commitment|waiting
export const listTasksController = async (req: Request, res: Response) => {
  const status = req.query.status === "done" ? "done" : "open";
  const kind = (["todo", "commitment", "waiting"] as const).find((k) => k === req.query.kind);

  const tasks = await listTasksService(req.userId, status, kind);
  return res.status(200).json({ tasks });
};

// POST /api/tasks — задача, добавленная вручную
export const createTaskController = async (req: Request, res: Response) => {
  const { title, kind, dueDate } = req.body;

  const task = await createTaskService(req.userId, { title, kind, dueDate: dueDate ?? null });
  return res.status(201).json({ task });
};

// PATCH /api/tasks/:id — статус (open/done/dismissed), название, срок
export const updateTaskController = async (req: Request, res: Response) => {
  const task = await updateTaskService(req.userId, parseId(req.params.id), req.body);
  return res.status(200).json({ task });
};

// POST /api/tasks/extract — найти задачи в ещё не разобранных письмах (один запрос к AI на пачку)
export const extractTasksController = async (req: Request, res: Response) => {
  const result = await extractTasksService(req.userId, req.body.timeZone);
  return res.status(200).json(result);
};
