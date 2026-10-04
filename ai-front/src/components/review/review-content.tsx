"use client";

import { ReactNode, useEffect, useRef } from "react";
import Link from "next/link";
import { AxiosError } from "axios";
import { RefreshCw, Sparkles } from "lucide-react";
import { MessageText } from "@/components/operator/message-text";
import { Sources } from "@/components/operator/sources";
import { useGenerateReviewSummary, useReview } from "@/hooks/review/useReview";
import { formatShortDate, formatTime } from "@/lib/format";
import { diffDays, dueInfo, plural } from "@/lib/tasks";
import type { Task } from "@/lib/types";
import { cn } from "@/lib/utils";

const dayMonth = new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "short" });
const keyToDate = (key: string) => {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y!, m! - 1, d!);
};

export function ReviewContent() {
  const reviewQuery = useReview();
  const generate = useGenerateReviewSummary();
  const autoRequested = useRef(false);

  const review = reviewQuery.data;

  // Выжимку недели составляем сама при первом открытии за день (один запрос к модели), дальше — кнопкой
  useEffect(() => {
    if (review && !review.summary && !autoRequested.current && !generate.isPending) {
      autoRequested.current = true;
      generate.mutate();
    }
  }, [review, generate]);

  if (reviewQuery.isLoading) {
    return <p className="px-6 py-8 text-sm text-ink-500">Загрузка...</p>;
  }

  if (reviewQuery.isError || !review) {
    return (
      <div className="px-6 py-8 text-sm">
        <p className="text-red-600">Не удалось загрузить обзор.</p>
        <button type="button" onClick={() => reviewQuery.refetch()} className="mt-1 underline">
          Повторить
        </button>
      </div>
    );
  }

  const { tasks, meetings, emails, ai } = review;
  const generateError = generate.isError
    ? ((generate.error as AxiosError<{ message: string }>).response?.data?.message ??
      "Не удалось составить выжимку.")
    : null;

  const stats: { label: string; value: string; hint?: string; accent?: boolean }[] = [
    { label: "Задач выполнено", value: String(tasks.doneCount) },
    { label: "Задач создано", value: String(tasks.created), hint: tasks.createdFromEmail ? `из них AI нашёл ${tasks.createdFromEmail}` : undefined },
    { label: "Просрочено сейчас", value: String(tasks.overdue.length) },
    { label: "Встреч", value: String(meetings.count), hint: meetings.hours ? `${meetings.hours} ч` : undefined },
    { label: "Писем", value: `${emails.received} / ${emails.sent}`, hint: "получено / отправлено" },
    {
      label: "Действий с помощью AI",
      value: String(ai.aiActions),
      hint: `закрыто задач из писем: ${ai.aiTasksDone}, принято черновиков: ${ai.draftsAccepted}`,
      accent: true,
    },
  ];

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-6 pb-12 pt-6">
      <header>
        <p className="text-xs font-medium uppercase tracking-wide text-ink-500">Недельный обзор</p>
        <h1 className="mt-1 text-2xl font-semibold text-ink-900">
          {dayMonth.format(keyToDate(review.weekStart))} — {dayMonth.format(keyToDate(review.weekEnd))}
        </h1>
      </header>

      <section className="rounded-card border border-ink-300 p-5">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-accent" />
          <h2 className="text-sm font-semibold text-ink-900">Итоги от AI</h2>
          {review.summary && (
            <span className="text-xs text-ink-500">· составлено {formatShortDate(review.summary.generatedAt)}</span>
          )}
          <button
            type="button"
            onClick={() => generate.mutate()}
            disabled={generate.isPending}
            className="ml-auto inline-flex items-center gap-1.5 rounded px-2 py-1 text-xs text-ink-700 hover:bg-ink-100 disabled:opacity-50"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", generate.isPending && "animate-spin")} />
            {review.summary ? "Обновить" : "Составить"}
          </button>
        </div>
        <div className="mt-3">
          {generate.isPending && !review.summary && (
            <p className="animate-pulse text-sm text-ink-500">AI подводит итоги недели...</p>
          )}
          {review.summary && (
            <>
              <MessageText content={review.summary.text} sources={review.summary.sources} />
              {review.summary.sources.length > 0 && <Sources sources={review.summary.sources} />}
            </>
          )}
          {generateError && <p className="mt-2 text-sm text-red-600">{generateError}</p>}
        </div>
      </section>

      <section>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {stats.map((stat) => (
            <div
              key={stat.label}
              title={stat.hint}
              className={cn("rounded-lg border px-4 py-3", stat.accent ? "border-ink-900 bg-ink-900 text-white" : "border-ink-300")}
            >
              <p className={cn("text-2xl font-semibold", !stat.accent && "text-ink-900")}>{stat.value}</p>
              <p className={cn("text-xs", stat.accent ? "text-ink-300" : "text-ink-500")}>{stat.label}</p>
              {stat.hint && <p className={cn("mt-0.5 text-[11px]", stat.accent ? "text-ink-300" : "text-ink-500")}>{stat.hint}</p>}
            </div>
          ))}
        </div>
        <p className="mt-2 text-xs text-ink-500">
          Письма считаются по синхронизированным (последние входящие и отправленные), поэтому цифры могут быть заниженными.
        </p>
      </section>

      <ListBlock title="Выполнено" empty="За неделю закрытых задач нет." tasks={tasks.done} render={(t) => <TaskLine task={t} />} />

      <ListBlock
        title="Зависло"
        empty="Ничего не зависло."
        tasks={[...tasks.overdue, ...tasks.staleWaiting.filter((t) => !tasks.overdue.some((o) => o.id === t.id))]}
        render={(t) => {
          const due = dueInfo(t.dueDate, review.weekEnd);
          const waiting = t.kind === "waiting";
          const days = Math.max(1, diffDays(t.createdAt.slice(0, 10), review.weekEnd));
          return (
            <TaskLine
              task={t}
              note={
                due && due.tone === "overdue"
                  ? due.label
                  : waiting
                    ? `ждёте ${days} ${plural(days, ["день", "дня", "дней"])}`
                    : undefined
              }
              danger={Boolean(due && due.tone === "overdue")}
            />
          );
        }}
      />

      <section>
        <h2 className="text-xs font-medium uppercase tracking-wide text-ink-500">Впереди (7 дней)</h2>
        {review.upcoming.length === 0 && tasks.dueNextWeek.length === 0 ? (
          <p className="mt-2 text-sm text-ink-500">На ближайшую неделю встреч и сроков нет.</p>
        ) : (
          <ul className="mt-2 divide-y divide-ink-100 rounded-lg border border-ink-300">
            {review.upcoming.map((event) => (
              <li key={`e${event.id}`}>
                <Link href={`/meetings/${event.id}`} className="flex items-center gap-3 px-4 py-2.5 hover:bg-ink-50">
                  <span className="w-32 shrink-0 text-xs font-medium text-ink-500">
                    {event.allDay
                      ? `${dayMonth.format(new Date(event.startAt.slice(0, 10) + "T12:00:00"))}, весь день`
                      : `${dayMonth.format(new Date(event.startAt))}, ${formatTime(event.startAt)}`}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm font-medium text-ink-900">{event.title}</span>
                  <span className="shrink-0 text-xs text-ink-500">Подготовка →</span>
                </Link>
              </li>
            ))}
            {tasks.dueNextWeek.map((task) => {
              const due = dueInfo(task.dueDate, review.weekEnd);
              return (
                <li key={`t${task.id}`} className="flex items-center gap-3 px-4 py-2.5">
                  <span className="w-32 shrink-0 text-xs font-medium text-ink-500">Срок</span>
                  <span className="min-w-0 flex-1 truncate text-sm text-ink-900">{task.title}</span>
                  {due && <span className="shrink-0 text-xs text-ink-500">{due.label}</span>}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

function ListBlock({
  title,
  empty,
  tasks,
  render,
}: {
  title: string;
  empty: string;
  tasks: Task[];
  render: (task: Task) => ReactNode;
}) {
  return (
    <section>
      <div className="flex items-baseline justify-between">
        <h2 className="text-xs font-medium uppercase tracking-wide text-ink-500">
          {title}
          {tasks.length > 0 && ` · ${tasks.length}`}
        </h2>
        <Link href="/tasks" className="text-xs text-ink-500 hover:text-ink-900 hover:underline">
          Все задачи →
        </Link>
      </div>
      {tasks.length === 0 ? (
        <p className="mt-2 text-sm text-ink-500">{empty}</p>
      ) : (
        <ul className="mt-2 divide-y divide-ink-100 rounded-lg border border-ink-300">
          {tasks.map((task) => (
            <li key={task.id}>{render(task)}</li>
          ))}
        </ul>
      )}
    </section>
  );
}

function TaskLine({ task, note, danger = false }: { task: Task; note?: string; danger?: boolean }) {
  return (
    <div className="flex items-center gap-3 px-4 py-2.5">
      <span className="min-w-0 flex-1 truncate text-sm text-ink-900">{task.title}</span>
      {note && <span className={cn("shrink-0 text-xs font-medium", danger ? "text-red-700" : "text-ink-500")}>{note}</span>}
    </div>
  );
}
