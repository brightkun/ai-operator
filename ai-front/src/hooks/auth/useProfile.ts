import { IUser, useAuthStore } from "@/store/auth-store";
import { useQuery } from "@tanstack/react-query";
import { api } from "../api/api";

export const useProfile = () => {
  const status = useAuthStore((state) => state.status);

  return useQuery({
    queryKey: ["profile"],
    enabled: status === "authenticated",
    queryFn: async () => {
      const response = await api.get<{ user: IUser }>("/auth/profile");

      return response.data.user;
    },
  });
};
