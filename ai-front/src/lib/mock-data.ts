import type { Note, Suggestion } from "@/lib/types";

// Подсказки для чата (description — текст, который уходит ассистенту) и заглушка заметок.
// Gmail, Calendar и Drive берут данные с сервера (см. hooks/data/useData.ts).

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

export const notes: Note[] = [
  {
    id: "n1",
    title: "Футбол",
    updatedAt: "12 сент., 10:28",
    content: "Играть в pubg в 22:00",
  },
  {
    id: "n2",
    title: "Receipt",
    updatedAt: "12 сент., 10:26",
    content: "Shawarma carrot",
  },
  {
    id: "n3",
    title: "dashbdas",
    updatedAt: "8 сент., 16:10",
    content: "hdasbdn",
  },
];
