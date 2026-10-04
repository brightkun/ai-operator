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

// --- Метрики ---

export interface MetricsPeriod {
  from: string;
  to: string;
  aiActions: number;
  aiTasksDone: number;
  draftsAccepted: number;
  draftsGenerated: number;
  draftAcceptanceRate: number | null;
  tasksSuggested: number;
  tasksKept: number;
  suggestionAcceptanceRate: number | null;
  commitmentsDetected: number;
  commitmentsCompleted: number;
  briefOpenDays: number;
  briefOpenRate: number;
  assistantAnswers: number;
  assistantAnswersWithSources: number;
  emailSummaries: number;
  meetingPreps: number;
  hoursSaved: number;
}

export interface Metrics {
  timeZone: string;
  current: MetricsPeriod;
  previous: MetricsPeriod;
  minutesSaved: {
    emailSummary: number;
    draftAccepted: number;
    meetingPrep: number;
    assistantAnswer: number;
    taskFound: number;
  };
}

// --- Недельный обзор ---

export interface ReviewData {
  weekStart: string;
  weekEnd: string;
  timeZone: string;
  tasks: {
    created: number;
    createdFromEmail: number;
    doneCount: number;
    done: Task[];
    openCount: number;
    overdue: Task[];
    staleWaiting: Task[];
    dueNextWeek: Task[];
  };
  meetings: { count: number; hours: number; busiestDay: { date: string; count: number } | null };
  emails: { received: number; sent: number; unread: number };
  upcoming: { id: number; title: string; startAt: string; endAt: string; allDay: boolean; location: string }[];
  ai: {
    aiTasksDone: number;
    draftsAccepted: number;
    draftsGenerated: number;
    emailSummaries: number;
    meetingPreps: number;
    aiActions: number;
  };
  summary: BriefSummary | null;
}

// --- Подготовка к встрече ---

export interface MeetingAttendee {
  name: string;
  email: string;
  self: boolean;
  response: string; // accepted | declined | tentative | needsAction | ""
}

export interface MeetingDetail {
  event: {
    id: number;
    title: string;
    description: string;
    location: string;
    startAt: string;
    endAt: string;
    allDay: boolean;
    htmlLink: string | null;
    organizerEmail: string;
    attendees: MeetingAttendee[];
  };
  context: {
    emails: { id: number; subject: string; person: string; receivedAt: string | null; url: string }[];
    tasks: {
      id: number;
      title: string;
      kind: TaskKind;
      dueDate: string | null;
      person: string;
      url: string | null;
    }[];
    files: { id: number; name: string; url: string | null }[];
  };
  prep: BriefSummary | null;
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

// --- Безопасность и данные аккаунта ---

export interface Account {
  email: string;
  hasPassword: boolean;
  retentionDays: number | null;
  retentionOptions: number[];
}

export type AuditAction =
  | "register"
  | "login"
  | "login_failed"
  | "google_login"
  | "logout"
  | "password_reset_requested"
  | "password_reset"
  | "google_connected"
  | "google_disconnected"
  | "retention_changed"
  | "data_purged"
  | "account_deleted";

export interface AuditEntry {
  id: number;
  action: AuditAction;
  ip: string;
  userAgent: string;
  meta: Record<string, unknown>;
  createdAt: string;
}
