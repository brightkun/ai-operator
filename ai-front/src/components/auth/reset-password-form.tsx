"use client";

import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AxiosError } from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useResetPassword } from "@/hooks/auth/useResetPassword";

export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const resetPassword = useResetPassword();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [mismatchError, setMismatchError] = useState("");

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();

    if (password !== confirmPassword) {
      setMismatchError("Пароли не совпадают");
      return;
    }

    setMismatchError("");
    resetPassword.mutate(
      { token, password },
      { onSuccess: () => router.push("/login") },
    );
  };

  const apiError = (
    resetPassword.error as AxiosError<{ message: string }> | null
  )?.response?.data?.message;

  if (!token) {
    return (
      <p className="text-sm text-red-600">
        Ссылка недействительна — токен отсутствует. Запросите восстановление
        пароля заново.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className="text-sm font-medium text-ink-900">
          Новый пароль
        </label>
        <Input
          id="password"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="confirmPassword"
          className="text-sm font-medium text-ink-900"
        >
          Повторите пароль
        </label>
        <Input
          id="confirmPassword"
          type="password"
          placeholder="••••••••"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />
      </div>

      {(mismatchError || apiError) && (
        <p className="text-sm text-red-600">{mismatchError || apiError}</p>
      )}

      <Button
        type="submit"
        className="w-full bg-ink-900 hover:bg-ink-900/90"
        disabled={resetPassword.isPending}
      >
        {resetPassword.isPending ? "Сохраняем..." : "Сохранить пароль"}
      </Button>
    </form>
  );
}
