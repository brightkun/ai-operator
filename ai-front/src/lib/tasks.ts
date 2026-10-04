// Чистая логика задач для интерфейса: подписи сроков и группировка. Без React, чтобы проверять отдельно.

import type { Task } from "@/lib/types";

export type DueTone = "overdue" | "today" | "soon" | "later";

const pad = (n: number) => String(n).padStart(2, "0");

// "2026-10-04" -> число дней между двумя календарными датами (b - a), без часовых поясов
export const diffDays = (a: string, b: string) => {
  const [ay, am, ad] = a.split("-").map(Number);
  const [by, bm, bd] = b.split("-").map(Number);
  return Math.round((Date.UTC(by!, bm! - 1, bd!) - Date.UTC(ay!, am! - 1, ad!)) / 86_400_000);
};

export const todayKey = (now: Date = new Date()) =>
  `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;

// 1 день, 2 дня, 5 дней
export const plural = (n: number, forms: [string, string, string]) => {
  const mod100 = Math.abs(n) % 100;
  const mod10 = mod100 % 10;
  if (mod100 > 10 && mod100 < 20) return forms[2];
  if (mod10 === 1) return forms[0];
  if (mod10 >= 2 && mod10 <= 4) return forms[1];
  return forms[2];
};

const dayMonth = new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "short" });

// Подпись срока и «тон» для цвета; null — срока нет
export const dueInfo = (dueDate: string | null, today: string): { label: string; tone: DueTone } | null => {
  if (!dueDate) return null;

  const days = diffDays(today, dueDate);
  if (days < 0) {
    return { label: `Просрочено на ${-days} ${plural(-days, ["день", "дня", "дней"])}`, tone: "overdue" };
  }
  if (days === 0) return { label: "Сегодня", tone: "today" };
  if (days === 1) return { label: "Завтра", tone: "soon" };

  const [y, m, d] = dueDate.split("-").map(Number);
  return { label: `до ${dayMonth.format(new Date(y!, m! - 1, d!))}`, tone: days <= 7 ? "soon" : "later" };
};

// Открытые задачи по разделам: просроченное, «жду ответа» и всё остальное, что надо сделать мне
export const groupOpenTasks = (tasks: Task[], today: string) => {
  const isOverdue = (t: Task) => t.dueDate !== null && t.dueDate < today;
  return {
    overdue: tasks.filter(isOverdue),
    waiting: tasks.filter((t) => t.kind === "waiting" && !isOverdue(t)),
    mine: tasks.filter((t) => t.kind !== "waiting" && !isOverdue(t)),
  };
};
