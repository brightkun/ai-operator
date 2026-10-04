import { useAuthStore } from "@/store/auth-store";
import type { ExtractResult, Task, TaskKind, TaskStatus } from "@/lib/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/api";

export const TASKS_KEY = ["tasks"] as const;

// После любого изменения задач сводка (счётчики по срокам) тоже устаревает
const invalidateTasks = (queryClient: ReturnType<typeof useQueryClient>) => {
  queryClient.invalidateQueries({ queryKey: TASKS_KEY });
  queryClient.invalidateQueries({ queryKey: ["brief"] });
};

export const useTasks = (status: "open" | "done") => {
  const auth = useAuthStore((state) => state.status);

  return useQuery({
    queryKey: [...TASKS_KEY, status],
    enabled: auth === "authenticated",
    queryFn: async () => {
      const response = await api.get<{ tasks: Task[] }>("/tasks", { params: { status } });

      return response.data.tasks;
    },
  });
};

export const useCreateTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["task-create"],
    mutationFn: async (body: { title: string; kind?: TaskKind; dueDate?: string | null }) => {
      const response = await api.post<{ task: Task }>("/tasks", body);

      return response.data.task;
    },
    onSuccess: () => invalidateTasks(queryClient),
  });
};

export const useUpdateTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["task-update"],
    mutationFn: async ({ id, ...patch }: { id: number; status?: TaskStatus; title?: string; dueDate?: string | null }) => {
      const response = await api.patch<{ task: Task }>(`/tasks/${id}`, patch);

      return response.data.task;
    },
    onSuccess: () => invalidateTasks(queryClient),
  });
};

// Поиск задач в письмах: один запрос к AI на пачку писем. timeZone — чтобы «завтра» понималось как у пользователя
export const useExtractTasks = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["tasks-extract"],
    mutationFn: async () => {
      const response = await api.post<ExtractResult>("/tasks/extract", {
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      });

      return response.data;
    },
    onSuccess: () => invalidateTasks(queryClient),
  });
};
