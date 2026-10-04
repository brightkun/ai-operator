import { ChevronLeft, ChevronRight } from "lucide-react";
import { calendarMonthLabel, calendarWeeks, selectedDay } from "@/lib/mock-data";
import { MonthGrid } from "@/components/calendar/month-grid";
import { DayAgenda } from "@/components/calendar/day-agenda";
import { Button } from "@/components/ui/button";

export default function CalendarPage() {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 border-b border-ink-300 px-6 py-3">
        <Button variant="secondary" className="px-3 py-1.5 text-sm">
          Today
        </Button>
        <div className="flex items-center gap-1 text-ink-500">
          <button type="button" aria-label="Previous month" className="rounded p-1 hover:bg-ink-100">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button type="button" aria-label="Next month" className="rounded p-1 hover:bg-ink-100">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        <h1 className="text-sm font-semibold text-ink-900">{calendarMonthLabel}</h1>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <MonthGrid weeks={calendarWeeks} />
        <DayAgenda {...selectedDay} />
      </div>
    </div>
  );
}
