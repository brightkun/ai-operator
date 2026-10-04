import { useAuthStore } from "@/store/auth-store";
import type { BriefSummary, ReviewData } from "@/lib/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/api";

const timeZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone;

export const useReview = () => {
  const auth = useAuthStore((state) => state.status);

  return useQuery({
    queryKey: ["review"],
    enabled: auth === "authenticated",
    queryFn: async () => {
      const response = await api.get<ReviewData>("/review", { params: { timeZone: timeZone() } });

      return response.data;
    },
  });
};

// Выжимка недели от AI: один запрос к модели; цифры и списки обзора считаются без неё
export const useGenerateReviewSummary = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["review-summary"],
    mutationFn: async () => {
      const response = await api.post<{ summary: BriefSummary }>("/review/summary", {
        timeZone: timeZone(),
      });

      return response.data.summary;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["review"] }),
  });
};
