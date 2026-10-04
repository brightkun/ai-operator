import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { IAuthResponse, useAuthStore } from "@/store/auth-store";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // обязательно — иначе httpOnly refreshToken-кука не будет отправляться
});

// подставляем access-токен из zustand-стора в каждый запрос
api.interceptors.request.use((config) => {
  const accessToken = useAuthStore.getState().accessToken;

  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  return config;
});

// Обновление access-токена по refresh-куке. Запрос идёт мимо `api`, чтобы не попасть
// в собственный interceptor. Одновременные вызовы делят один запрос: бэкенд ротирует
// refresh-токен, и второй параллельный запрос со старой кукой был бы отклонён.
let refreshPromise: Promise<IAuthResponse> | null = null;

export const refreshSession = (): Promise<IAuthResponse> => {
  if (!refreshPromise) {
    refreshPromise = axios
      .post<IAuthResponse>(`${API_URL}/auth/refresh`, null, {
        withCredentials: true,
      })
      .then((response) => {
        useAuthStore
          .getState()
          .setAuth(response.data.user, response.data.accessToken);
        return response.data;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
};

// Роуты, на которых 401 означает «неверные данные», а не «истёк access-токен»
const NO_REFRESH_ROUTES = [
  "/auth/login",
  "/auth/register",
  "/auth/refresh",
  "/auth/google",
  "/auth/forgot-password",
  "/auth/reset-password",
];

type RetriableConfig = InternalAxiosRequestConfig & { _retry?: boolean };

// Если access-токен истёк (401) — один раз обновляем его и повторяем запрос
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as RetriableConfig | undefined;

    if (
      error.response?.status === 401 &&
      original &&
      !original._retry &&
      !NO_REFRESH_ROUTES.includes(original.url ?? "")
    ) {
      original._retry = true;

      try {
        const { accessToken } = await refreshSession();
        original.headers.Authorization = `Bearer ${accessToken}`;
        return api(original);
      } catch {
        // refresh не удался — сессии больше нет, AuthGate отправит на /login
        useAuthStore.getState().clearAuth();
      }
    }

    return Promise.reject(error);
  },
);
