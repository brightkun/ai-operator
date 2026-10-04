// Чистая логика календаря: сетка месяца и раскладка событий по дням.
// Без зависимостей от React, чтобы можно было проверять отдельно.

export interface EventLike {
  startAt: string;
  endAt: string;
  allDay: boolean;
}

export interface MonthDay<E extends EventLike> {
  date: Date; // локальная полночь этого дня
  key: string; // YYYY-MM-DD в локальной зоне
  inCurrentMonth: boolean;
  isToday: boolean;
  events: E[];
}

const pad = (n: number) => String(n).padStart(2, "0");

export const dayKey = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export const startOfDay = (d: Date) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate());

export const addDays = (d: Date, days: number) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate() + days);

// Неделя начинается с понедельника
export const startOfWeek = (d: Date) => {
  const offset = (d.getDay() + 6) % 7;
  return addDays(startOfDay(d), -offset);
};

// Границы показанной сетки: 6 недель, начиная с понедельника недели, где лежит 1-е число
export const gridRange = (month: Date) => {
  const start = startOfWeek(new Date(month.getFullYear(), month.getMonth(), 1));
  return { start, end: addDays(start, 42) };
};

// Календарные дни события в локальной зоне. Событие «на весь день» хранится как полночь UTC
// с концом не включительно, поэтому его даты читаем из UTC — иначе в зонах западнее UTC
// оно съедет на предыдущий день.
export const eventDayKeys = (event: EventLike): string[] => {
  const start = new Date(event.startAt);
  const end = new Date(event.endAt);

  let first: Date;
  let last: Date;

  if (event.allDay) {
    first = new Date(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate());
    const endDay = new Date(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate());
    last = addDays(endDay, -1); // конец не включительно
  } else {
    first = startOfDay(start);
    // событие, закончившееся ровно в полночь, не заходит на следующий день
    last = startOfDay(new Date(Math.max(end.getTime() - 1, start.getTime())));
  }

  if (last < first) last = first;

  const keys: string[] = [];
  for (let d = first; d <= last && keys.length < 62; d = addDays(d, 1)) {
    keys.push(dayKey(d));
  }
  return keys;
};

export const buildMonthGrid = <E extends EventLike>(
  month: Date,
  events: E[],
  today: Date = new Date(),
): MonthDay<E>[][] => {
  const { start } = gridRange(month);

  const byDay = new Map<string, E[]>();
  for (const event of events) {
    for (const key of eventDayKeys(event)) {
      const list = byDay.get(key);
      if (list) list.push(event);
      else byDay.set(key, [event]);
    }
  }

  const todayKey = dayKey(today);
  const weeks: MonthDay<E>[][] = [];

  for (let w = 0; w < 6; w++) {
    const week: MonthDay<E>[] = [];
    for (let i = 0; i < 7; i++) {
      const date = addDays(start, w * 7 + i);
      const key = dayKey(date);
      week.push({
        date,
        key,
        inCurrentMonth: date.getMonth() === month.getMonth(),
        isToday: key === todayKey,
        events: (byDay.get(key) ?? []).slice().sort(compareEvents),
      });
    }
    weeks.push(week);
  }

  return weeks;
};

// Сначала события на весь день, затем по времени начала
export const compareEvents = (a: EventLike, b: EventLike) => {
  if (a.allDay !== b.allDay) return a.allDay ? -1 : 1;
  return new Date(a.startAt).getTime() - new Date(b.startAt).getTime();
};
