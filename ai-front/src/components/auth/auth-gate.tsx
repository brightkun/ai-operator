"use client";

import { ReactNode, useEffect } from "react";
import { useRouter } from "next/navigation";
import { refreshSession } from "@/hooks/api/api";
import { useAuthStore } from "@/store/auth-store";

// Защищает страницы приложения. Access-токен хранится только в памяти, поэтому
// после перезагрузки страницы пробуем восстановить сессию по refresh-куке;
// если не вышло — отправляем на /login.
export function AuthGate({ children }: { children: ReactNode }) {
  const router = useRouter();
  const status = useAuthStore((state) => state.status);

  useEffect(() => {
    if (status !== "loading") return;

    refreshSession().catch(() => {
      useAuthStore.getState().clearAuth();
    });
  }, [status]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
    }
  }, [status, router]);

  if (status !== "authenticated") {
    return (
      <div className="flex h-screen items-center justify-center text-sm text-ink-500">
        Загрузка...
      </div>
    );
  }

  return <>{children}</>;
}
