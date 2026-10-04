import { IAuthResponse, useAuthStore } from "@/store/auth-store";
import { useMutation } from "@tanstack/react-query";
import { api } from "../api/api";

export const useGoogleLoginMutation = () => {
  const setAuth = useAuthStore((state) => state.setAuth);

  return useMutation({
    mutationKey: ["google-login"],
    mutationFn: async (body: { idToken: string }) => {
      const response = await api.post<IAuthResponse>("/auth/google", body);

      return response.data;
    },
    onSuccess: (data) => {
      setAuth(data.user, data.accessToken);
    },
  });
};
