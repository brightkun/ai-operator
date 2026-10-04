import type { CalendarEvent, DriveFile, Email } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";
import { api } from "../api/api";

export const useEmails = (search: string) =>
  useQuery({
    queryKey: ["emails", search],
    queryFn: async () => {
      const response = await api.get<{ emails: Email[] }>("/emails", {
        params: search ? { search } : {},
      });

      return response.data.emails;
    },
  });

// from/to — ISO-строки; в ключе они же, поэтому при смене месяца данные запрашиваются заново
export const useCalendarEvents = (from: string, to: string) =>
  useQuery({
    queryKey: ["calendar", from, to],
    queryFn: async () => {
      const response = await api.get<{ events: CalendarEvent[] }>("/calendar/events", {
        params: { from, to },
      });

      return response.data.events;
    },
  });

export const useDriveFiles = (search: string) =>
  useQuery({
    queryKey: ["drive", search],
    queryFn: async () => {
      const response = await api.get<{ files: DriveFile[] }>("/drive/files", {
        params: search ? { search } : {},
      });

      return response.data.files;
    },
  });
