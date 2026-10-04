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

// --- Пока без бэкенда (заглушки) ---

export interface Note {
  id: string;
  title: string;
  updatedAt: string;
  content: string;
}

export interface Suggestion {
  id: string;
  icon: "inbox" | "calendar" | "folder" | "note";
  title: string;
  description: string;
}
