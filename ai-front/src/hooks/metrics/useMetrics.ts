import { useAuthStore } from "@/store/auth-store";
import type { Metrics } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";
import { api } from "../api/api";

export const useMetrics = () => {
  const auth = useAuthStore((state) => state.status);

  return useQuery({
    queryKey: ["metrics"],
    enabled: auth === "authenticated",
    queryFn: async () => {
      const response = await api.get<Metrics>("/metrics", {
        params: { timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone },
      });

      return response.data;
    },
  });
};
