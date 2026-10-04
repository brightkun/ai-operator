"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AxiosError } from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useGoogleLoginMutation } from "@/hooks/auth/useGoogleLoginMutation";
import { GoogleButton } from "./google-button";
import { useLogin } from "@/hooks/auth/useLogin";

export function LoginForm() {
  const router = useRouter();
  const login = useLogin();
  const googleLogin = useGoogleLoginMutation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    login.mutate({ email, password }, { onSuccess: () => router.push("/") });
  };

  const error =
    (login.error as AxiosError<{ message: string }> | null)?.response?.data
      ?.message ||
    (googleLogin.error as AxiosError<{ message: string }> | null)?.response
      ?.data?.message;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-sm font-medium text-ink-900">
          Email
        </label>
        <Input
          id="email"
          type="email"
          placeholder="you@company.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <label
            htmlFor="password"
            className="text-sm font-medium text-ink-900"
          >
            Пароль
          </label>
          <Link
            href="/forgot-password"
            className="text-xs text-ink-500 hover:text-ink-900"
          >
            Забыли пароль?
          </Link>
        </div>
        <Input
          id="password"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <Button
        type="submit"
        className="w-full bg-ink-900 hover:bg-ink-900/90"
        disabled={login.isPending}
      >
        {login.isPending ? "Входим..." : "Войти"}
      </Button>

      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-ink-300" />
        <span className="text-xs text-ink-500">или</span>
        <div className="h-px flex-1 bg-ink-300" />
      </div>

      <GoogleButton
        onCredential={(idToken) =>
          googleLogin.mutate({ idToken }, { onSuccess: () => router.push("/") })
        }
      />
    </form>
  );
}
