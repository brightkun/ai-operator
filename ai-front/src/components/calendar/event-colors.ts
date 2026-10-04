import type { CalendarEvent } from "@/lib/types";

// Цвет события выбираем по хэшу названия: у одинаковых событий он всегда одинаковый
const PALETTE = [
  { chip: "bg-blue-50 text-blue-700", dot: "bg-blue-500" },
  { chip: "bg-purple-50 text-purple-700", dot: "bg-purple-500" },
  { chip: "bg-orange-50 text-orange-700", dot: "bg-orange-500" },
  { chip: "bg-green-50 text-green-700", dot: "bg-green-500" },
  { chip: "bg-red-50 text-red-700", dot: "bg-red-500" },
] as const;

const pick = (event: CalendarEvent) => {
  let hash = 0;
  for (const char of event.title) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return PALETTE[hash % PALETTE.length]!;
};

export const eventColor = (event: CalendarEvent) => pick(event).chip;
export const eventDotClass = (event: CalendarEvent) => pick(event).dot;
