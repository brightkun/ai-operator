import type { CalendarEvent } from "@/lib/types";
import { cn } from "@/lib/utils";

const dotColor: Record<CalendarEvent["color"], string> = {
  blue: "bg-blue-500",
  purple: "bg-purple-500",
  orange: "bg-orange-500",
  green: "bg-green-500",
  red: "bg-red-500",
};

interface DayAgendaProps {
  weekdayLabel: string;
  dateLabel: string;
  events: CalendarEvent[];
}

export function DayAgenda({ weekdayLabel, dateLabel, events }: DayAgendaProps) {
  return (
    <aside className="w-72 shrink-0 border-l border-ink-300 p-5">
      <p className="text-xs font-medium uppercase tracking-wide text-ink-500">{weekdayLabel}</p>
      <h2 className="mt-1 text-xl font-semibold text-ink-900">{dateLabel}</h2>

      <div className="mt-5 space-y-4">
        {events.map((event) => (
          <div key={event.id} className="flex items-start gap-2">
            <span className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", dotColor[event.color])} />
            <div>
              <p className="text-sm font-medium text-ink-900">{event.title}</p>
              <p className="text-xs text-ink-500">{event.time}</p>
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}
