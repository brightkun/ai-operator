import { useMutation } from "@tanstack/react-query";
import { api } from "../api/api";

export const useForgotPassword = () =>
  useMutation({
    mutationKey: ["forgot-password"],
    mutationFn: async (body: { email: string }) => {
      const response = await api.post<{ message: string }>(
        "/auth/forgot-password",
        body,
      );

      return response.data;
    },
  });
