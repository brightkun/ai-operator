import type { Note, Suggestion } from "@/lib/types";

// Заглушки для разделов, у которых пока нет бэкенда: подсказки чата и заметки.
// Gmail, Calendar и Drive берут данные с сервера (см. hooks/data/useData.ts).

export const suggestions: Suggestion[] = [
  {
    id: "inbox-summary",
    icon: "inbox",
    title: "Inbox summary",
    description: "Summarize the most important emails in my inbox today",
  },
  {
    id: "todays-schedule",
    icon: "calendar",
    title: "Today's schedule",
    description: "What's on my calendar for today?",
  },
  {
    id: "find-file",
    icon: "folder",
    title: "Find a file",
    description: "Find the latest budget file in my Drive",
  },
  {
    id: "create-note",
    icon: "note",
    title: "Create a note",
    description: "Create a note with today's meeting takeaways",
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
