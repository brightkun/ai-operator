import { useMutation } from "@tanstack/react-query";
import { api } from "../api/api";

export const useResetPassword = () =>
  useMutation({
    mutationKey: ["reset-password"],
    mutationFn: async (body: { token: string; password: string }) => {
      const response = await api.post<{ message: string }>(
        "/auth/reset-password",
        body,
      );

      return response.data;
    },
  });
