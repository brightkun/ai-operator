import { IAuthResponse, useAuthStore } from "@/store/auth-store";
import { useMutation } from "@tanstack/react-query";
import { api } from "../api/api";

// Бэкенд сразу логинит нового пользователя, поэтому сохраняем токен так же, как при входе
export const useRegister = () => {
  const setAuth = useAuthStore((state) => state.setAuth);

  return useMutation({
    mutationKey: ["register"],
    mutationFn: async (body: {
      name: string;
      email: string;
      password: string;
    }) => {
      const response = await api.post<IAuthResponse>("/auth/register", body);

      return response.data;
    },
    onSuccess: (data) => {
      setAuth(data.user, data.accessToken);
    },
  });
};
