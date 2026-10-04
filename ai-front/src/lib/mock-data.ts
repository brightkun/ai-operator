import type { Suggestion } from "@/lib/types";

// Подсказки для чата: description — текст, который уходит ассистенту.

export const suggestions: Suggestion[] = [
  {
    id: "inbox-summary",
    icon: "inbox",
    title: "Что во входящих",
    description: "Что важного во входящих? Выдели письма, которые требуют ответа",
  },
  {
    id: "todays-schedule",
    icon: "calendar",
    title: "План на сегодня",
    description: "Что у меня сегодня и завтра в календаре?",
  },
  {
    id: "find-file",
    icon: "folder",
    title: "Найти файл",
    description: "Найди в Drive последние файлы с бюджетом",
  },
  {
    id: "unread",
    icon: "note",
    title: "Непрочитанное",
    description: "Кратко перескажи непрочитанные письма",
  },
];
