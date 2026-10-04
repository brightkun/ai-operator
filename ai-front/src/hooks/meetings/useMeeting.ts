import { useAuthStore } from "@/store/auth-store";
import type { BriefSummary, MeetingDetail } from "@/lib/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/api";

export const useMeeting = (eventId: number | null) => {
  const auth = useAuthStore((state) => state.status);

  return useQuery({
    queryKey: ["meeting", eventId],
    enabled: auth === "authenticated" && eventId !== null,
    retry: false,
    queryFn: async () => {
      const response = await api.get<MeetingDetail>(`/meetings/${eventId}`);

      return response.data;
    },
  });
};

// Подготовка к встрече от AI: один запрос к модели, результат кешируется на сервере
export const useGenerateMeetingPrep = (eventId: number | null) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["meeting-prep", eventId],
    mutationFn: async () => {
      const response = await api.post<{ prep: BriefSummary }>(`/meetings/${eventId}/prep`, {
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      });

      return response.data.prep;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["meeting", eventId] }),
  });
};
