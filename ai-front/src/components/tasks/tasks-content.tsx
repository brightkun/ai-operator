"use client";

import { FormEvent, ReactNode, useState } from "react";
import Link from "next/link";
import { AxiosError } from "axios";
import { Plus, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TaskRow } from "@/components/tasks/task-row";
import { useGoogleStatus } from "@/hooks/integrations/useGoogle";
import {
  useCreateTask,
  useExtractTasks,
  useTasks,
  useUpdateTask,
} from "@/hooks/tasks/useTasks";
import { groupOpenTasks, plural, todayKey } from "@/lib/tasks";
import type { Task } from "@/lib/types";
import { cn } from "@/lib/utils";

const apiMessage = (error: unknown) =>
  (error as AxiosError<{ message: string }> | null)?.response?.data?.message;

export function TasksContent() {
  const [tab, setTab] = useState<"open" | "done">("open");
  const tasksQuery = useTasks(tab);
  const create = useCreateTask();
  const update = useUpdateTask();
  const extract = useExtractTasks();
  const googleStatus = useGoogleStatus();

  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");

  const today = todayKey();
  const tasks = tasksQuery.data ?? [];
  const groups = groupOpenTasks(tasks, today);
  const hasGmail = googleStatus.data?.connected === true && googleStatus.data.access.gmail;

  const add = (event: FormEvent) => {
    event.preventDefault();
    if (!title.trim()) return;

    create.mutate(
      { title: title.trim(), dueDate: dueDate || null },
      {
        onSuccess: () => {
          setTitle("");
          setDueDate("");
        },
      },
    );
  };

  const toggle = (task: Task) =>
    update.mutate({ id: task.id, status: task.status === "done" ? "open" : "done" });
  const dismiss = (task: Task) => update.mutate({ id: task.id, status: "dismissed" });

  const result = extract.data;
  const extractError = extract.isError ? (apiMessage(extract.error) ?? "Не удалось найти задачи. Попробуйте ещё раз.") : null;

  return (
    <div className="mx-auto max-w-3xl pb-10">
      <div className="px-6 pb-3 pt-6">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-lg font-semibold text-ink-900">Задачи</h1>
          <div className="ml-auto flex items-center gap-2">
            {hasGmail ? (
              <Button
                variant="secondary"
                onClick={() => extract.mutate()}
                disabled={extract.isPending}
                title="AI прочитает последние письма и найдёт в них задачи, обещания и то, чего вы ждёте"
              >
                <Sparkles className={cn("h-4 w-4", extract.isPending && "animate-pulse")} />
                {extract.isPending ? "Читаю письма..." : "Найти в письмах"}
              </Button>
            ) : (
              <Link href="/integrations" className="text-xs text-ink-500 underline hover:text-ink-900">
                Подключите Gmail, чтобы искать задачи в письмах
              </Link>
            )}
          </div>
        </div>

        {(result || extractError) && (
          <div
            role="status"
            className={cn(
              "mt-3 rounded-lg border px-4 py-2.5 text-sm",
              extractError
                ? "border-red-200 bg-red-50 text-red-800"
                : "border-ink-300 bg-ink-50 text-ink-700",
            )}
          >
            {extractError ??
              (result && (
                <>
                  Разобрано {result.processed} {plural(result.processed, ["письмо", "письма", "писем"])},{" "}
                  {result.created > 0
                    ? `найдено новых задач: ${result.created}.`
                    : "новых задач нет."}
                  {result.remaining > 0 && ` Ещё не разобрано писем: ${result.remaining} — нажмите кнопку снова.`}
                </>
              ))}
          </div>
        )}

        <form onSubmit={add} className="mt-4 flex flex-wrap items-center gap-2">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={200}
            placeholder="Новая задача..."
            className="min-w-0 flex-1 rounded-lg border border-ink-300 px-3 py-2 text-sm text-ink-900 outline-none placeholder:text-ink-500 focus:border-ink-900"
          />
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            aria-label="Срок"
            className="rounded-lg border border-ink-300 px-3 py-2 text-sm text-ink-700 outline-none focus:border-ink-900"
          />
          <Button type="submit" disabled={create.isPending || !title.trim()}>
            <Plus className="h-4 w-4" />
            Добавить
          </Button>
        </form>
        {create.isError && (
          <p className="mt-2 text-sm text-red-600">{apiMessage(create.error) ?? "Не удалось добавить задачу."}</p>
        )}
      </div>

      <div className="flex gap-1 border-b border-ink-300 px-6">
        {(
          [
            ["open", "Активные"],
            ["done", "Выполненные"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={cn(
              "-mb-px border-b-2 px-3 py-2 text-sm font-medium transition-colors",
              tab === key
                ? "border-ink-900 text-ink-900"
                : "border-transparent text-ink-500 hover:text-ink-900",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {tasksQuery.isLoading && <p className="px-6 py-6 text-sm text-ink-500">Загрузка...</p>}
      {tasksQuery.isError && <p className="px-6 py-6 text-sm text-red-600">Не удалось загрузить задачи.</p>}
      {update.isError && (
        <p className="px-6 pt-3 text-sm text-red-600">{apiMessage(update.error) ?? "Не удалось изменить задачу."}</p>
      )}

      {tasksQuery.data && tasks.length === 0 && (
        <p className="px-6 py-8 text-sm text-ink-500">
          {tab === "open"
            ? "Активных задач нет. Добавьте свою или нажмите «Найти в письмах»."
            : "Выполненных задач пока нет."}
        </p>
      )}

      {tab === "open" ? (
        <>
          <Section title="Просрочено" tone="red" tasks={groups.overdue} today={today} onToggle={toggle} onDismiss={dismiss} busy={update.isPending} />
          <Section title="Нужно сделать" tasks={groups.mine} today={today} onToggle={toggle} onDismiss={dismiss} busy={update.isPending} />
          <Section title="Жду ответа" tasks={groups.waiting} today={today} onToggle={toggle} onDismiss={dismiss} busy={update.isPending} />
        </>
      ) : (
        <ul>
          {tasks.map((task) => (
            <TaskRow key={task.id} task={task} today={today} done disabled={update.isPending} onToggle={toggle} />
          ))}
        </ul>
      )}
    </div>
  );
}

function Section({
  title,
  tone,
  tasks,
  today,
  onToggle,
  onDismiss,
  busy,
}: {
  title: string;
  tone?: "red";
  tasks: Task[];
  today: string;
  onToggle: (task: Task) => void;
  onDismiss: (task: Task) => void;
  busy: boolean;
}): ReactNode {
  if (tasks.length === 0) return null;

  return (
    <section>
      <h2
        className={cn(
          "px-6 pb-1 pt-5 text-xs font-medium uppercase tracking-wide",
          tone === "red" ? "text-red-700" : "text-ink-500",
        )}
      >
        {title} · {tasks.length}
      </h2>
      <ul>
        {tasks.map((task) => (
          <TaskRow key={task.id} task={task} today={today} disabled={busy} onToggle={onToggle} onDismiss={onDismiss} />
        ))}
      </ul>
    </section>
  );
}
