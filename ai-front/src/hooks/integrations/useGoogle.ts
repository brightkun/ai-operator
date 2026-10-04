import { useAuthStore } from "@/store/auth-store";
import type { GoogleStatus, SyncResult } from "@/lib/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/api";

export const STATUS_KEY = ["integration", "google"] as const;

// Данные, которые нужно перечитать после синхронизации или отключения
const invalidateData = (queryClient: ReturnType<typeof useQueryClient>) => {
  for (const key of ["emails", "calendar", "drive"]) {
    queryClient.invalidateQueries({ queryKey: [key] });
  }
};

export const useGoogleStatus = () => {
  const status = useAuthStore((state) => state.status);

  return useQuery({
    queryKey: STATUS_KEY,
    enabled: status === "authenticated",
    queryFn: async () => {
      const response = await api.get<GoogleStatus>("/integrations/google/status");

      return response.data;
    },
  });
};

// Бэкенд отдаёт ссылку на экран согласия Google — отправляем туда браузер
export const useConnectGoogle = () =>
  useMutation({
    mutationKey: ["google-connect"],
    mutationFn: async () => {
      const response = await api.get<{ url: string }>("/integrations/google/connect");

      return response.data.url;
    },
    onSuccess: (url) => {
      window.location.href = url;
    },
  });

export const useSyncGoogle = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["google-sync"],
    mutationFn: async () => {
      const response = await api.post<{ results: Record<string, SyncResult> }>("/sync");

      return response.data.results;
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: STATUS_KEY });
      invalidateData(queryClient);
    },
  });
};

export const useDisconnectGoogle = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["google-disconnect"],
    mutationFn: async () => {
      await api.delete("/integrations/google");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: STATUS_KEY });
      invalidateData(queryClient);
    },
  });
};
