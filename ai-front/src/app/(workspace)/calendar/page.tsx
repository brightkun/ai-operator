"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayAgenda } from "@/components/calendar/day-agenda";
import { MonthGrid } from "@/components/calendar/month-grid";
import { GoogleGate } from "@/components/integrations/google-gate";
import { Button } from "@/components/ui/button";
import { useCalendarEvents } from "@/hooks/data/useData";
import { buildMonthGrid, dayKey, gridRange, startOfDay } from "@/lib/calendar";

const monthLabel = new Intl.DateTimeFormat("ru-RU", { month: "long", year: "numeric" });

// только первая буква: CSS capitalize сделал бы заглавной и «г.» в «2026 г.»
const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

export default function CalendarPage() {
  return (
    <GoogleGate resource="calendar">
      <CalendarContent />
    </GoogleGate>
  );
}

function CalendarContent() {
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selected, setSelected] = useState(() => startOfDay(new Date()));

  // запрашиваем ровно то окно, которое показывает сетка (6 недель)
  const { start, end } = useMemo(() => gridRange(month), [month]);
  const events = useCalendarEvents(start.toISOString(), end.toISOString());

  const weeks = useMemo(
    () => buildMonthGrid(month, events.data ?? []),
    [month, events.data],
  );
  const selectedDay = weeks.flat().find((day) => day.key === dayKey(selected));

  // выбранный день всегда должен лежать в показанном месяце: иначе панель дня
  // будет пустой, хотя события есть. В текущем месяце выбираем сегодня, в остальных — 1-е число.
  const goToMonth = (delta: number) => {
    const next = new Date(month.getFullYear(), month.getMonth() + delta, 1);
    const now = new Date();
    const isCurrent =
      next.getFullYear() === now.getFullYear() && next.getMonth() === now.getMonth();

    setMonth(next);
    setSelected(isCurrent ? startOfDay(now) : next);
  };

  const goToToday = () => {
    const now = new Date();
    setMonth(new Date(now.getFullYear(), now.getMonth(), 1));
    setSelected(startOfDay(now));
  };

  const selectDay = (date: Date) => {
    setSelected(startOfDay(date));
    // клик по дню соседнего месяца переключает сетку на него
    if (date.getMonth() !== month.getMonth()) {
      setMonth(new Date(date.getFullYear(), date.getMonth(), 1));
    }
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 border-b border-ink-300 px-6 py-3">
        <Button variant="secondary" className="px-3 py-1.5 text-sm" onClick={goToToday}>
          Сегодня
        </Button>
        <div className="flex items-center gap-1 text-ink-500">
          <button
            type="button"
            aria-label="Предыдущий месяц"
            onClick={() => goToMonth(-1)}
            className="rounded p-1 hover:bg-ink-100"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label="Следующий месяц"
            onClick={() => goToMonth(1)}
            className="rounded p-1 hover:bg-ink-100"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        <h1 className="text-sm font-semibold text-ink-900">
          {capitalize(monthLabel.format(month))}
        </h1>
        {events.isLoading && <span className="text-xs text-ink-500">Загрузка...</span>}
        {events.isError && (
          <span className="text-xs text-red-600">Не удалось загрузить события</span>
        )}
      </div>

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <MonthGrid weeks={weeks} selectedKey={dayKey(selected)} onSelect={selectDay} />
        <DayAgenda date={selected} events={selectedDay?.events ?? []} />
      </div>
    </div>
  );
}
