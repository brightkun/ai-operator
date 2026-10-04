import { useAuthStore } from "@/store/auth-store";
import type { Note, NoteSummary } from "@/lib/types";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { api } from "../api/api";
import { waitForSave } from "./note-saves";

export const NOTES_KEY = ["notes"] as const;

// search — строка поиска; при наборе показываем прежний список, пока грузится новый (без мигания)
export const useNotes = (search: string) => {
  const auth = useAuthStore((state) => state.status);

  return useQuery({
    queryKey: [...NOTES_KEY, "list", search],
    enabled: auth === "authenticated",
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const response = await api.get<{ notes: NoteSummary[] }>("/notes", {
        params: search ? { search } : {},
      });

      return response.data.notes;
    },
  });
};

// Одна заметка целиком. Кеш не держим (gcTime: 0): редактор берёт значение один раз при открытии,
// и устаревшая копия из кеша вернула бы человеку старый текст.
export const useNote = (noteId: number | null) => {
  const auth = useAuthStore((state) => state.status);

  return useQuery({
    queryKey: [...NOTES_KEY, "one", noteId],
    enabled: auth === "authenticated" && noteId !== null,
    gcTime: 0,
    staleTime: 0,
    retry: false,
    queryFn: async () => {
      await waitForSave(noteId!);
      const response = await api.get<{ note: Note }>(`/notes/${noteId}`);

      return response.data.note;
    },
  });
};
