import type { CalendarDay } from "@/lib/types";
import { calendarWeekdays } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

const eventDot: Record<CalendarDay["events"][number]["color"], string> = {
  blue: "bg-blue-50 text-blue-700",
  purple: "bg-purple-50 text-purple-700",
  orange: "bg-orange-50 text-orange-700",
  green: "bg-green-50 text-green-700",
  red: "bg-red-50 text-red-700",
};

export function MonthGrid({ weeks }: { weeks: CalendarDay[][] }) {
  return (
    <div className="flex-1">
      <div className="grid grid-cols-7 border-b border-ink-300">
        {calendarWeekdays.map((day) => (
          <div key={day} className="px-3 py-2 text-xs font-medium text-ink-500">
            {day}
          </div>
        ))}
      </div>

      <div className="grid flex-1 grid-cols-7 grid-rows-4">
        {weeks.map((week, i) =>
          week.map((day, j) => (
            <div
              key={`${i}-${j}`}
              className={cn(
                "min-h-[110px] border-b border-r border-ink-100 p-2",
                !day.inCurrentMonth && "bg-ink-50 text-ink-300"
              )}
            >
              <span
                className={cn(
                  "flex h-6 w-6 items-center justify-center rounded-full text-sm",
                  day.isToday ? "bg-ink-900 text-white" : "text-ink-900",
                  !day.inCurrentMonth && "text-ink-300"
                )}
              >
                {day.date}
              </span>
              <div className="mt-1 space-y-1">
                {day.events.map((event) => (
                  <div
                    key={event.id}
                    className={cn(
                      "truncate rounded px-1.5 py-0.5 text-xs font-medium",
                      eventDot[event.color]
                    )}
                  >
                    {event.title}
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
