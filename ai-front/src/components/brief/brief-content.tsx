"use client";

import { ReactNode, useEffect, useRef } from "react";
import Link from "next/link";
import { AxiosError } from "axios";
import { MapPin, RefreshCw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MessageText } from "@/components/operator/message-text";
import { Sources } from "@/components/operator/sources";
import { reportBriefOpened, useBrief, useGenerateBriefSummary } from "@/hooks/brief/useBrief";
import { useGoogleStatus } from "@/hooks/integrations/useGoogle";
import { useUpdateTask } from "@/hooks/tasks/useTasks";
import { formatShortDate, formatTime } from "@/lib/format";
import { dueInfo } from "@/lib/tasks";
import type { BriefEvent, Task } from "@/lib/types";
import { cn } from "@/lib/utils";

const dateTitle = new Intl.DateTimeFormat("ru-RU", { weekday: "long", day: "numeric", month: "long" });

const eventTime = (event: BriefEvent) =>
  event.allDay ? "Весь день" : `${formatTime(event.startAt)}–${formatTime(event.endAt)}`;

const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

// "2026-10-04" -> локальная дата без сдвига часовых поясов
const keyToDate = (key: string) => {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y!, m! - 1, d!);
};

export function BriefContent() {
  const briefQuery = useBrief();
  const generate = useGenerateBriefSummary();
  const googleStatus = useGoogleStatus();
  const update = useUpdateTask();
  const autoRequested = useRef(false);
  const openReported = useRef(false);

  useEffect(() => {
    if (openReported.current) return;
    openReported.current = true;
    reportBriefOpened();
  }, []);

  const brief = briefQuery.data;
  const hasData =
    brief !== undefined &&
    brief.events.today.length + brief.events.tomorrow.length + brief.unread.count + brief.tasks.openCount > 0;

  // Выжимку на сегодня составляем сама при первом открытии (один запрос к модели в день);
  // дальше — только по кнопке, чтобы не расходовать бесплатную квоту
  useEffect(() => {
    if (brief && !brief.summary && hasData && !autoRequested.current && !generate.isPending) {
      autoRequested.current = true;
      generate.mutate();
    }
  }, [brief, hasData, generate]);

  const googleConnected = googleStatus.data?.connected === true;
  const done = (task: Task) => update.mutate({ id: task.id, status: "done" });

  if (briefQuery.isLoading) {
    return <p className="px-6 py-8 text-sm text-ink-500">Загрузка...</p>;
  }

  if (briefQuery.isError || !brief) {
    return (
      <div className="px-6 py-8 text-sm">
        <p className="text-red-600">Не удалось загрузить сводку.</p>
        <button type="button" onClick={() => briefQuery.refetch()} className="mt-1 underline">
          Повторить
        </button>
      </div>
    );
  }

  const generateError = generate.isError
    ? ((generate.error as AxiosError<{ message: string }>).response?.data?.message ??
      "Не удалось составить выжимку.")
    : null;

  const urgent = [...brief.tasks.overdue, ...brief.tasks.dueToday];
  const counters: [string, number, string][] = [
    ["Просрочено", brief.tasks.overdue.length, "text-red-700"],
    ["Сегодня", brief.tasks.dueToday.length, "text-orange-700"],
    ["На неделе", brief.tasks.dueSoon.length, "text-blue-700"],
    ["Жду ответа", brief.tasks.waiting.length, "text-ink-700"],
  ];

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-6 pb-12 pt-6">
      <header>
        <p className="text-xs font-medium uppercase tracking-wide text-ink-500">Сводка дня</p>
        <h1 className="mt-1 text-2xl font-semibold text-ink-900">
          {capitalize(dateTitle.format(keyToDate(brief.date)))}
        </h1>
      </header>

      {!googleConnected && googleStatus.isSuccess && (
        <div className="rounded-lg border border-ink-300 bg-ink-50 px-4 py-3 text-sm text-ink-700">
          Google не подключён, поэтому событий и писем здесь нет.{" "}
          <Link href="/integrations" className="font-medium underline">
            Подключить
          </Link>
        </div>
      )}

      <section className="rounded-card border border-ink-300 p-5">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-accent" />
          <h2 className="text-sm font-semibold text-ink-900">Главное</h2>
          {brief.summary && (
            <span className="text-xs text-ink-500">
              · составлено {formatShortDate(brief.summary.generatedAt)}
            </span>
          )}
          <button
            type="button"
            onClick={() => generate.mutate()}
            disabled={generate.isPending || !hasData}
            className="ml-auto inline-flex items-center gap-1.5 rounded px-2 py-1 text-xs text-ink-700 hover:bg-ink-100 disabled:opacity-50"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", generate.isPending && "animate-spin")} />
            {brief.summary ? "Обновить" : "Составить"}
          </button>
        </div>

        <div className="mt-3">
          {generate.isPending && !brief.summary && (
            <p className="animate-pulse text-sm text-ink-500">AI читает ваш день...</p>
          )}
          {brief.summary && (
            <>
              <MessageText content={brief.summary.text} sources={brief.summary.sources} />
              {brief.summary.sources.length > 0 && <Sources sources={brief.summary.sources} />}
            </>
          )}
          {!brief.summary && !generate.isPending && !hasData && (
            <p className="text-sm text-ink-500">
              Пока нечего подытоживать: нет событий, непрочитанных писем и задач.
            </p>
          )}
          {generateError && <p className="mt-2 text-sm text-red-600">{generateError}</p>}
        </div>
      </section>

      <section>
        <SectionTitle>События сегодня</SectionTitle>
        <EventList events={brief.events.today} empty="На сегодня событий нет." />
        {brief.events.tomorrow.length > 0 && (
          <>
            <SectionTitle className="mt-6">Завтра</SectionTitle>
            <EventList events={brief.events.tomorrow} empty="" />
          </>
        )}
      </section>

      <section>
        <div className="flex items-baseline justify-between">
          <SectionTitle>Задачи</SectionTitle>
          <Link href="/tasks" className="text-xs text-ink-500 hover:text-ink-900 hover:underline">
            Все задачи →
          </Link>
        </div>
        <div className="mt-2 grid grid-cols-4 gap-2">
          {counters.map(([label, count, color]) => (
            <div key={label} className="rounded-lg border border-ink-300 px-3 py-2">
              <p className={cn("text-xl font-semibold", count > 0 ? color : "text-ink-300")}>{count}</p>
              <p className="text-xs text-ink-500">{label}</p>
            </div>
          ))}
        </div>
        {urgent.length > 0 ? (
          <ul className="mt-3 divide-y divide-ink-100 rounded-lg border border-ink-300">
            {urgent.map((task) => {
              const due = dueInfo(task.dueDate, brief.date);
              return (
                <li key={task.id} className="flex items-center gap-3 px-4 py-2.5">
                  <button
                    type="button"
                    onClick={() => done(task)}
                    disabled={update.isPending}
                    aria-label="Отметить выполненной"
                    className="h-4 w-4 shrink-0 rounded-full border border-ink-300 hover:border-ink-900 disabled:opacity-50"
                  />
                  <span className="min-w-0 flex-1 truncate text-sm text-ink-900">{task.title}</span>
                  {due && (
                    <span
                      className={cn(
                        "shrink-0 text-xs font-medium",
                        due.tone === "overdue" ? "text-red-700" : "text-orange-700",
                      )}
                    >
                      {due.label}
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-ink-500">
            {brief.tasks.openCount === 0
              ? "Открытых задач нет."
              : "Срочных задач на сегодня нет."}
          </p>
        )}
      </section>

      <section>
        <SectionTitle>
          Непрочитанные письма{brief.unread.count > 0 ? ` · ${brief.unread.count}` : ""}
        </SectionTitle>
        {brief.unread.items.length === 0 ? (
          <p className="mt-2 text-sm text-ink-500">Непрочитанных писем нет.</p>
        ) : (
          <ul className="mt-2 divide-y divide-ink-100 rounded-lg border border-ink-300">
            {brief.unread.items.map((mail) => (
              <li key={mail.id}>
                <a
                  href={mail.url}
                  target="_blank"
                  rel="noreferrer"
                  className="block px-4 py-2.5 hover:bg-ink-50"
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="truncate text-sm font-semibold text-ink-900">
                      {mail.fromName || mail.fromEmail}
                    </span>
                    <span className="shrink-0 text-xs text-ink-500">{formatShortDate(mail.receivedAt)}</span>
                  </div>
                  <p className="truncate text-sm text-ink-900">{mail.subject || "(без темы)"}</p>
                  <p className="truncate text-xs text-ink-500">{mail.snippet}</p>
                </a>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function SectionTitle({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <h2 className={cn("text-xs font-medium uppercase tracking-wide text-ink-500", className)}>{children}</h2>
  );
}

function EventList({ events, empty }: { events: BriefEvent[]; empty: string }) {
  if (events.length === 0) {
    return empty ? <p className="mt-2 text-sm text-ink-500">{empty}</p> : null;
  }

  return (
    <ul className="mt-2 divide-y divide-ink-100 rounded-lg border border-ink-300">
      {events.map((event) => {
        const body = (
          <>
            <span className="w-28 shrink-0 text-xs font-medium text-ink-500">{eventTime(event)}</span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium text-ink-900">{event.title}</span>
              {event.location && (
                <span className="flex items-center gap-1 text-xs text-ink-500">
                  <MapPin className="h-3 w-3 shrink-0" />
                  <span className="truncate">{event.location}</span>
                </span>
              )}
            </span>
          </>
        );

        return (
          <li key={event.id} className="flex items-center hover:bg-ink-50">
            {event.htmlLink ? (
              <a
                href={event.htmlLink}
                target="_blank"
                rel="noreferrer"
                className="flex min-w-0 flex-1 items-center gap-3 px-4 py-2.5"
              >
                {body}
              </a>
            ) : (
              <div className="flex min-w-0 flex-1 items-center gap-3 px-4 py-2.5">{body}</div>
            )}
            <Link
              href={`/meetings/${event.id}`}
              className="mr-3 inline-flex shrink-0 items-center gap-1 rounded-lg border border-ink-300 px-2.5 py-1 text-xs font-medium text-ink-700 hover:bg-white hover:text-ink-900"
            >
              <Sparkles className="h-3 w-3 text-accent" />
              Подготовка
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
