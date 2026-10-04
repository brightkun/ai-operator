import { useAuthStore } from "@/store/auth-store";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { api } from "../api/api";

export const useLogout = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const clearAuth = useAuthStore((state) => state.clearAuth);

  return useMutation({
    mutationKey: ["logout"],
    mutationFn: async () => {
      await api.post("/auth/logout");
    },
    // выходим локально, даже если запрос на сервер не прошёл
    onSettled: () => {
      clearAuth();
      queryClient.clear();
      router.replace("/login");
    },
  });
};
