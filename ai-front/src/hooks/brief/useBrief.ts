import { useAuthStore } from "@/store/auth-store";
import type { Brief, BriefSummary } from "@/lib/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/api";

const timeZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone;

// Метрика «открытие сводки дня» (ТЗ): один раз за заход на страницу. Сбой метрики не показываем.
export const reportBriefOpened = () => {
  api.post("/events", { type: "brief_opened" }).catch(() => {});
};

export const useBrief = () => {
  const auth = useAuthStore((state) => state.status);

  return useQuery({
    queryKey: ["brief"],
    enabled: auth === "authenticated",
    queryFn: async () => {
      const response = await api.get<Brief>("/brief", { params: { timeZone: timeZone() } });

      return response.data;
    },
  });
};

// Выжимка «что главное» от AI: один запрос к модели; остальное в сводке считается без неё
export const useGenerateBriefSummary = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["brief-summary"],
    mutationFn: async () => {
      const response = await api.post<{ summary: BriefSummary }>("/brief/summary", {
        timeZone: timeZone(),
      });

      return response.data.summary;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["brief"] }),
  });
};
