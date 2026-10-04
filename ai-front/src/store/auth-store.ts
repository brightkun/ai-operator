import { create } from "zustand";

export interface IUser {
  id: number;
  name: string;
  email: string;
}

// То, что бэкенд возвращает из login / register / google / refresh
export interface IAuthResponse {
  user: IUser;
  accessToken: string;
}

// loading — ещё не знаем, есть ли сессия (access-токен живёт только в памяти,
// после перезагрузки страницы его нужно получить заново через refresh-куку)
type AuthStatus = "loading" | "authenticated" | "unauthenticated";

interface AuthState {
  user: IUser | null;
  accessToken: string | null;
  status: AuthStatus;
  setAuth: (user: IUser, accessToken: string) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  status: "loading",
  setAuth: (user, accessToken) =>
    set({ user, accessToken, status: "authenticated" }),
  clearAuth: () =>
    set({ user: null, accessToken: null, status: "unauthenticated" }),
}));
