import type { ChatSource } from "@/store/chat-store";

export type NavKey = "operator" | "gmail" | "calendar" | "drive" | "notes" | "jira";

export interface NavItem {
  key: NavKey;
  label: string;
  href: string;
}

// --- Данные из бэкенда (даты приходят строками ISO) ---

export interface Email {
  id: number;
  gmailId: string;
  subject: string;
  fromName: string;
  fromEmail: string;
  snippet: string;
  receivedAt: string | null;
  isRead: boolean;
  isStarred: boolean;
}

export interface CalendarEvent {
  id: number;
  googleEventId: string;
  title: string;
  description: string;
  location: string;
  startAt: string;
  endAt: string;
  allDay: boolean;
  attendeesCount: number;
  htmlLink: string | null;
}

export interface DriveFile {
  id: number;
  googleFileId: string;
  name: string;
  mimeType: string;
  isFolder: boolean;
  ownerName: string;
  modifiedAt: string | null;
  sizeBytes: number | null;
  isStarred: boolean;
  webViewLink: string | null;
}

export type GoogleResource = "gmail" | "calendar" | "drive";

export interface SyncInfo {
  syncedAt: string | null;
  itemCount: number;
  error: string | null;
}

export type GoogleStatus =
  | { connected: false }
  | {
      connected: true;
      email: string | null;
      connectedAt: string;
      access: Record<GoogleResource, boolean>;
      sync: Partial<Record<GoogleResource, SyncInfo>>;
    };

export interface SyncResult {
  ok: boolean;
  count: number;
  error?: string;
}

export type TaskKind = "todo" | "commitment" | "waiting";
export type TaskStatus = "open" | "done" | "dismissed";

export interface Task {
  id: number;
  title: string;
  kind: TaskKind;
  dueDate: string | null; // YYYY-MM-DD
  status: TaskStatus;
  source: "email" | "manual";
  sourceTitle: string;
  sourcePerson: string;
  sourceUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ExtractResult {
  processed: number; // писем разобрано
  created: number; // новых задач
  remaining: number; // писем ещё не разобрано
}

export interface BriefEvent {
  id: number;
  title: string;
  location: string;
  startAt: string;
  endAt: string;
  allDay: boolean;
  attendeesCount: number;
  htmlLink: string | null;
}

export interface BriefUnread {
  id: number;
  subject: string;
  fromName: string;
  fromEmail: string;
  snippet: string;
  receivedAt: string | null;
  url: string;
}

export interface BriefSummary {
  text: string;
  sources: ChatSource[];
  model: string;
  generatedAt: string;
}

export interface Brief {
  date: string;
  timeZone: string;
  events: { today: BriefEvent[]; tomorrow: BriefEvent[] };
  unread: { count: number; items: BriefUnread[] };
  tasks: {
    overdue: Task[];
    dueToday: Task[];
    dueSoon: Task[];
    waiting: Task[];
    openCount: number;
  };
  summary: BriefSummary | null;
}

// --- Заметки ---

export interface NoteSummary {
  id: number;
  title: string;
  excerpt: string; // начало текста для списка
  createdAt: string;
  updatedAt: string;
}

export interface Note {
  id: number;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

// --- Подсказки чата ---

export interface Suggestion {
  id: string;
  icon: "inbox" | "calendar" | "folder" | "note";
  title: string;
  description: string;
}
