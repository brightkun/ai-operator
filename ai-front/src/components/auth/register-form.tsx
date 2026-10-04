"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { AxiosError } from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useGoogleLoginMutation } from "@/hooks/auth/useGoogleLoginMutation";
import { GoogleButton } from "./google-button";
import { useRegister } from "@/hooks/auth/useRegister";

export function RegisterForm() {
  const router = useRouter();
  const register = useRegister();
  const googleLogin = useGoogleLoginMutation();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    register.mutate(
      { name, email, password },
      { onSuccess: () => router.push("/") },
    );
  };

  const error =
    (register.error as AxiosError<{ message: string }> | null)?.response?.data
      ?.message ||
    (googleLogin.error as AxiosError<{ message: string }> | null)?.response
      ?.data?.message;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="name" className="text-sm font-medium text-ink-900">
          Имя
        </label>
        <Input
          id="name"
          type="text"
          placeholder="Иван Иванов"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>

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
        <label htmlFor="password" className="text-sm font-medium text-ink-900">
          Пароль
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

      {error && <p className="text-sm text-red-600">{error}</p>}

      <Button
        type="submit"
        className="w-full bg-ink-900 hover:bg-ink-900/90"
        disabled={register.isPending}
      >
        {register.isPending ? "Создаём..." : "Создать аккаунт"}
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
