import type { MonthDay } from "@/lib/calendar";
import { eventColor } from "@/components/calendar/event-colors";
import type { CalendarEvent } from "@/lib/types";
import { cn } from "@/lib/utils";

const WEEKDAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
const MAX_VISIBLE = 3;

interface MonthGridProps {
  weeks: MonthDay<CalendarEvent>[][];
  selectedKey: string;
  onSelect: (date: Date) => void;
}

export function MonthGrid({ weeks, selectedKey, onSelect }: MonthGridProps) {
  return (
    <div className="flex min-w-0 flex-1 flex-col">
      <div className="grid grid-cols-7 border-b border-ink-300">
        {WEEKDAYS.map((day) => (
          <div key={day} className="px-3 py-2 text-xs font-medium text-ink-500">
            {day}
          </div>
        ))}
      </div>

      <div className="grid flex-1 grid-cols-7 grid-rows-6">
        {weeks.flat().map((day) => {
          const hidden = day.events.length - MAX_VISIBLE;

          return (
            <button
              type="button"
              key={day.key}
              onClick={() => onSelect(day.date)}
              className={cn(
                "min-h-[96px] border-b border-r border-ink-100 p-2 text-left align-top hover:bg-ink-50",
                !day.inCurrentMonth && "bg-ink-50",
                day.key === selectedKey && "bg-ink-100 hover:bg-ink-100",
              )}
            >
              <span
                className={cn(
                  "flex h-6 w-6 items-center justify-center rounded-full text-sm",
                  day.isToday
                    ? "bg-ink-900 text-white"
                    : day.inCurrentMonth
                      ? "text-ink-900"
                      : "text-ink-300",
                )}
              >
                {day.date.getDate()}
              </span>
              <div className="mt-1 space-y-1">
                {day.events.slice(0, MAX_VISIBLE).map((event) => (
                  <div
                    key={event.id}
                    className={cn(
                      "truncate rounded px-1.5 py-0.5 text-xs font-medium",
                      eventColor(event),
                    )}
                  >
                    {event.title}
                  </div>
                ))}
                {hidden > 0 && (
                  <div className="px-1.5 text-xs text-ink-500">ещё {hidden}</div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
