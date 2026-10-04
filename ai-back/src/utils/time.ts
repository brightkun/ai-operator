// Даты в часовом поясе пользователя. Бэкенд хранит всё в UTC, а «сегодня», «завтра» и «до пятницы»
// имеют смысл только в зоне пользователя (её присылает браузер).

export const DAY_MS = 24 * 60 * 60 * 1000;

export const safeTimeZone = (tz: string | undefined) => {
  if (!tz) return "UTC";
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return tz;
  } catch {
    return "UTC";
  }
};

// "2026-10-04 15:19"
export const formatLocal = (date: Date, tz: string) => {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: tz,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(date)
      .map((p) => [p.type, p.value]),
  );
  return `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute}`;
};

// "2026-10-04": какая сейчас дата у пользователя
export const localDateKey = (date: Date, tz: string) => formatLocal(date, tz).slice(0, 10);

// Сдвиг календарной даты вида "2026-10-04" на N дней (чистая арифметика по календарю, без часовых поясов)
export const addDaysToKey = (key: string, days: number) => {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(Date.UTC(y!, m! - 1, d! + days)).toISOString().slice(0, 10);
};

// Разница в днях между двумя датами вида "YYYY-MM-DD" (b - a)
export const diffDays = (a: string, b: string) => {
  const [ay, am, ad] = a.split("-").map(Number);
  const [by, bm, bd] = b.split("-").map(Number);
  return Math.round((Date.UTC(by!, bm! - 1, bd!) - Date.UTC(ay!, am! - 1, ad!)) / DAY_MS);
};

// Настоящая ли это календарная дата (отсекает 2026-02-31 и мусор от модели)
export const isRealDateKey = (value: unknown): value is string => {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
};

// у события «на весь день» время не имеет смысла: дата хранится как полночь UTC
export const formatAllDay = (date: Date) => date.toISOString().slice(0, 10);

export const weekdayName = (date: Date, tz: string) =>
  new Intl.DateTimeFormat("ru-RU", { timeZone: tz, weekday: "long" }).format(date);

// "2026-10-05" или "2026-10-05T09:00" трактуем как время пользователя; со смещением/Z — как есть
export const parseUserDate = (value: unknown, tz: string): Date | null => {
  if (typeof value !== "string" || !value.trim()) return null;
  const text = value.trim();

  if (/[zZ]$|[+-]\d{2}:?\d{2}$/.test(text)) {
    const d = new Date(text);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  const m = text.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2}))?/);
  if (!m) return null;

  const [, y, mo, d, h = "00", mi = "00"] = m;
  // ищем момент UTC, который в зоне tz выглядит как y-mo-d h:mi (две итерации покрывают переход часов)
  const target = Date.UTC(+y!, +mo! - 1, +d!, +h, +mi);
  let guess = target;
  for (let i = 0; i < 2; i++) {
    const shown = formatLocal(new Date(guess), tz);
    const [sd, st] = shown.split(" ");
    const [sy, smo, sdd] = sd!.split("-").map(Number);
    const [sh, smi] = st!.split(":").map(Number);
    const shownUtc = Date.UTC(sy!, smo! - 1, sdd!, sh!, smi!);
    guess += target - shownUtc;
  }
  return new Date(guess);
};
