"use client";

import { ReactNode, useEffect, useRef } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { AxiosError } from "axios";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  CircleHelp,
  ExternalLink,
  FileText,
  ListChecks,
  Mail,
  MapPin,
  RefreshCw,
  Sparkles,
  XCircle,
} from "lucide-react";
import { MessageText } from "@/components/operator/message-text";
import { Sources } from "@/components/operator/sources";
import { useGenerateMeetingPrep, useMeeting } from "@/hooks/meetings/useMeeting";
import { formatShortDate, formatTime } from "@/lib/format";
import { dueInfo, todayKey } from "@/lib/tasks";
import type { MeetingAttendee } from "@/lib/types";
import { cn } from "@/lib/utils";

const dateTitle = new Intl.DateTimeFormat("ru-RU", { weekday: "long", day: "numeric", month: "long" });
const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

const KIND_LABEL = { todo: "Сделать", commitment: "Обещано", waiting: "Жду ответа" } as const;

const RESPONSE: Record<string, { label: string; Icon: typeof CheckCircle2; className: string }> = {
  accepted: { label: "придёт", Icon: CheckCircle2, className: "text-green-600" },
  declined: { label: "отказался", Icon: XCircle, className: "text-red-600" },
  tentative: { label: "возможно", Icon: CircleHelp, className: "text-orange-500" },
};

export function MeetingContent() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const parsed = Number(params.id);
  const eventId = Number.isInteger(parsed) && parsed > 0 ? parsed : null;

  const meetingQuery = useMeeting(eventId);
  const generate = useGenerateMeetingPrep(eventId);
  const autoRequested = useRef(false);

  const meeting = meetingQuery.data;

  // Подготовку составляем сама при первом открытии встречи (один запрос к модели, дальше она кешируется);
  // обновить можно кнопкой
  useEffect(() => {
    if (meeting && !meeting.prep && !autoRequested.current && !generate.isPending) {
      autoRequested.current = true;
      generate.mutate();
    }
  }, [meeting, generate]);

  const back = (
    <button
      type="button"
      onClick={() => router.back()}
      className="mb-4 inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-900"
    >
      <ArrowLeft className="h-4 w-4" />
      Назад
    </button>
  );

  if (eventId === null) {
    return <div className="mx-auto max-w-3xl px-6 py-8">{back}<p className="text-sm text-red-600">Некорректный адрес встречи.</p></div>;
  }

  if (meetingQuery.isLoading) {
    return <p className="px-6 py-8 text-sm text-ink-500">Загрузка...</p>;
  }

  if (meetingQuery.isError || !meeting) {
    const notFound = (meetingQuery.error as AxiosError | null)?.response?.status === 404;
    return (
      <div className="mx-auto max-w-3xl px-6 py-8">
        {back}
        <p className="text-sm text-red-600">
          {notFound
            ? "Встреча не найдена: возможно, её удалили в Google Calendar."
            : "Не удалось загрузить встречу."}
        </p>
      </div>
    );
  }

  const { event, context, prep } = meeting;
  const start = new Date(event.startAt);
  const today = todayKey();
  const generateError = generate.isError
    ? ((generate.error as AxiosError<{ message: string }>).response?.data?.message ??
      "Не удалось составить подготовку.")
    : null;

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-6 pb-12 pt-6">
      <header>
        {back}
        <h1 className="text-2xl font-semibold text-ink-900">{event.title}</h1>
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink-500">
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays className="h-4 w-4" />
            {event.allDay
              ? `${capitalize(dateTitle.format(new Date(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate())))}, весь день`
              : `${capitalize(dateTitle.format(start))}, ${formatTime(event.startAt)}–${formatTime(event.endAt)}`}
          </span>
          {event.location && (
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="h-4 w-4" />
              {event.location}
            </span>
          )}
          {event.htmlLink && (
            <a
              href={event.htmlLink}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 hover:text-ink-900 hover:underline"
            >
              <ExternalLink className="h-4 w-4" />
              Открыть в Google Calendar
            </a>
          )}
        </div>

        {event.attendees.length > 0 && (
          <ul className="mt-4 flex flex-wrap gap-2">
            {event.attendees.map((person) => (
              <Attendee key={person.email} person={person} />
            ))}
          </ul>
        )}

        {event.description.trim() && (
          <p className="mt-4 max-h-40 overflow-y-auto whitespace-pre-wrap rounded-lg bg-ink-50 px-4 py-3 text-sm text-ink-700">
            {event.description}
          </p>
        )}
      </header>

      <section className="rounded-card border border-ink-300 p-5">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-accent" />
          <h2 className="text-sm font-semibold text-ink-900">Подготовка к встрече</h2>
          {prep && (
            <span className="text-xs text-ink-500">· составлена {formatShortDate(prep.generatedAt)}</span>
          )}
          <button
            type="button"
            onClick={() => generate.mutate()}
            disabled={generate.isPending}
            className="ml-auto inline-flex items-center gap-1.5 rounded px-2 py-1 text-xs text-ink-700 hover:bg-ink-100 disabled:opacity-50"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", generate.isPending && "animate-spin")} />
            {prep ? "Обновить" : "Составить"}
          </button>
        </div>

        <div className="mt-3">
          {generate.isPending && !prep && (
            <p className="animate-pulse text-sm text-ink-500">AI готовит вас к встрече...</p>
          )}
          {prep && (
            <>
              <MessageText content={prep.text} sources={prep.sources} />
              {prep.sources.length > 0 && <Sources sources={prep.sources} />}
            </>
          )}
          {generateError && <p className="mt-2 text-sm text-red-600">{generateError}</p>}
        </div>
      </section>

      <Block icon={Mail} title="Связанные письма" empty="Связанных писем не найдено." count={context.emails.length}>
        {context.emails.map((mail) => (
          <li key={mail.id}>
            <a href={mail.url} target="_blank" rel="noreferrer" className="block px-4 py-2.5 hover:bg-ink-50">
              <div className="flex items-baseline justify-between gap-3">
                <span className="truncate text-sm font-medium text-ink-900">{mail.subject || "(без темы)"}</span>
                <span className="shrink-0 text-xs text-ink-500">{formatShortDate(mail.receivedAt)}</span>
              </div>
              <p className="truncate text-xs text-ink-500">{mail.person}</p>
            </a>
          </li>
        ))}
      </Block>

      <Block icon={ListChecks} title="Связанные задачи" empty="Открытых задач по этой встрече нет." count={context.tasks.length}>
        {context.tasks.map((task) => {
          const due = dueInfo(task.dueDate, today);
          return (
            <li key={task.id} className="flex items-center gap-3 px-4 py-2.5">
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-ink-900">{task.title}</span>
                <span className="block truncate text-xs text-ink-500">
                  {KIND_LABEL[task.kind]}
                  {task.person && ` · ${task.person}`}
                </span>
              </span>
              {due && (
                <span className={cn("shrink-0 text-xs font-medium", due.tone === "overdue" ? "text-red-700" : "text-ink-500")}>
                  {due.label}
                </span>
              )}
            </li>
          );
        })}
        {context.tasks.length > 0 && (
          <li className="px-4 py-2 text-right">
            <Link href="/tasks" className="text-xs text-ink-500 hover:text-ink-900 hover:underline">
              Все задачи →
            </Link>
          </li>
        )}
      </Block>

      <Block icon={FileText} title="Связанные файлы" empty="Файлов с похожими названиями нет." count={context.files.length}>
        {context.files.map((file) => (
          <li key={file.id}>
            {file.url ? (
              <a href={file.url} target="_blank" rel="noreferrer" className="block truncate px-4 py-2.5 text-sm text-ink-900 hover:bg-ink-50">
                {file.name}
              </a>
            ) : (
              <span className="block truncate px-4 py-2.5 text-sm text-ink-900">{file.name}</span>
            )}
          </li>
        ))}
      </Block>
    </div>
  );
}

function Attendee({ person }: { person: MeetingAttendee }) {
  const response = RESPONSE[person.response];

  return (
    <li
      title={`${person.email}${response ? ` · ${response.label}` : ""}`}
      className="inline-flex items-center gap-1.5 rounded-full border border-ink-300 px-3 py-1 text-xs text-ink-700"
    >
      {response && <response.Icon className={cn("h-3.5 w-3.5", response.className)} />}
      {person.name || person.email}
      {person.self && <span className="text-ink-500">(вы)</span>}
    </li>
  );
}

function Block({
  icon: Icon,
  title,
  empty,
  count,
  children,
}: {
  icon: typeof Mail;
  title: string;
  empty: string;
  count: number;
  children: ReactNode;
}) {
  return (
    <section>
      <h2 className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-ink-500">
        <Icon className="h-3.5 w-3.5" />
        {title}
        {count > 0 && ` · ${count}`}
      </h2>
      {count === 0 ? (
        <p className="mt-2 text-sm text-ink-500">{empty}</p>
      ) : (
        <ul className="mt-2 divide-y divide-ink-100 rounded-lg border border-ink-300">{children}</ul>
      )}
    </section>
  );
}
