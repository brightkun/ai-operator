import Link from "next/link";
import { MapPin, Sparkles, Users } from "lucide-react";
import { eventDotClass } from "@/components/calendar/event-colors";
import { formatTime } from "@/lib/format";
import type { CalendarEvent } from "@/lib/types";
import { cn } from "@/lib/utils";

interface DayAgendaProps {
  date: Date;
  events: CalendarEvent[];
}

const weekday = new Intl.DateTimeFormat("ru-RU", { weekday: "long" });
const dateLabel = new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long" });

const timeLabel = (event: CalendarEvent) =>
  event.allDay ? "Весь день" : `${formatTime(event.startAt)} – ${formatTime(event.endAt)}`;

export function DayAgenda({ date, events }: DayAgendaProps) {
  return (
    <aside className="w-72 shrink-0 overflow-y-auto border-l border-ink-300 p-5">
      <p className="text-xs font-medium uppercase tracking-wide text-ink-500">
        {weekday.format(date)}
      </p>
      <h2 className="mt-1 text-xl font-semibold text-ink-900">{dateLabel.format(date)}</h2>

      {events.length === 0 && <p className="mt-5 text-sm text-ink-500">Событий нет.</p>}

      <div className="mt-5 space-y-4">
        {events.map((event) => {
          const body = (
            <>
              <span className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", eventDotClass(event))} />
              <div className="min-w-0">
                <p className="text-sm font-medium text-ink-900">{event.title}</p>
                <p className="text-xs text-ink-500">{timeLabel(event)}</p>
                {event.location && (
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-ink-500">
                    <MapPin className="h-3 w-3 shrink-0" />
                    <span className="truncate">{event.location}</span>
                  </p>
                )}
                {event.attendeesCount > 0 && (
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-ink-500">
                    <Users className="h-3 w-3 shrink-0" />
                    {event.attendeesCount}
                  </p>
                )}
              </div>
            </>
          );

          return (
            <div key={event.id}>
              {event.htmlLink ? (
                <a
                  href={event.htmlLink}
                  target="_blank"
                  rel="noreferrer"
                  className="-mx-2 flex items-start gap-2 rounded px-2 py-1 hover:bg-ink-100"
                >
                  {body}
                </a>
              ) : (
                <div className="flex items-start gap-2">{body}</div>
              )}
              <Link
                href={`/meetings/${event.id}`}
                className="ml-4 mt-0.5 inline-flex items-center gap-1 text-xs font-medium text-ink-700 hover:text-ink-900 hover:underline"
              >
                <Sparkles className="h-3 w-3 text-accent" />
                Подготовиться
              </Link>
            </div>
          );
        })}
      </div>
    </aside>
  );
}
