import { useAuthStore } from "@/store/auth-store";
import { useChatStore } from "@/store/chat-store";
import type { Account, AuditEntry } from "@/lib/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { api } from "../api/api";

export const useAccount = () => {
  const auth = useAuthStore((state) => state.status);

  return useQuery({
    queryKey: ["account"],
    enabled: auth === "authenticated",
    queryFn: async () => (await api.get<Account>("/account")).data,
  });
};

export const useAuditLog = () => {
  const auth = useAuthStore((state) => state.status);

  return useQuery({
    queryKey: ["audit"],
    enabled: auth === "authenticated",
    queryFn: async () => (await api.get<{ entries: AuditEntry[] }>("/account/audit")).data.entries,
  });
};

export const useSetRetention = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (retentionDays: number | null) =>
      (
        await api.patch<{ retentionDays: number | null; purged: { emails: number; events: number } }>(
          "/account/retention",
          { retentionDays },
        )
      ).data,
    onSuccess: () => {
      // письма и события могли удалиться — обновляем всё, что на них опирается
      queryClient.invalidateQueries();
    },
  });
};

export const useDeleteAccount = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const clearAuth = useAuthStore((state) => state.clearAuth);

  return useMutation({
    mutationFn: async (input: { confirmEmail: string; password?: string }) => {
      await api.delete("/account", { data: input });
    },
    onSuccess: () => {
      clearAuth();
      queryClient.clear();
      useChatStore.getState().reset(null);
      router.replace("/login");
    },
  });
};
