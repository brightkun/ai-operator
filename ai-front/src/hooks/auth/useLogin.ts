import { IAuthResponse, useAuthStore } from "@/store/auth-store";
import { useMutation } from "@tanstack/react-query";
import { api } from "../api/api";

export const useLogin = () => {
  const setAuth = useAuthStore((state) => state.setAuth);

  return useMutation({
    mutationKey: ["login"],
    mutationFn: async (body: { email: string; password: string }) => {
      const response = await api.post<IAuthResponse>("/auth/login", body);

      return response.data;
    },
    onSuccess: (data) => {
      setAuth(data.user, data.accessToken);
    },
  });
};
