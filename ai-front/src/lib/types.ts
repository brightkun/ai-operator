export type NavKey = "operator" | "gmail" | "calendar" | "drive" | "notes" | "jira";

export interface NavItem {
  key: NavKey;
  label: string;
  href: string;
}

export interface Email {
  id: string;
  sender: string;
  subject: string;
  preview: string;
  read: boolean;
  starred: boolean;
}

export interface CalendarEvent {
  id: string;
  title: string;
  time: string;
  color: "blue" | "purple" | "orange" | "green" | "red";
}

export interface CalendarDay {
  date: number;
  inCurrentMonth: boolean;
  isToday?: boolean;
  events: CalendarEvent[];
}

export interface DriveFolder {
  id: string;
  name: string;
}

export interface DriveFile {
  id: string;
  name: string;
  owner: string;
  modified: string;
  size: string;
  starred?: boolean;
  kind: "pdf" | "doc" | "sheet";
}

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
