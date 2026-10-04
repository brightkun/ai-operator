"use client";

import { FormEvent, useState } from "react";
import { AxiosError } from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useForgotPassword } from "@/hooks/auth/useForgotPassword";

export function ForgotPasswordForm() {
  const forgotPassword = useForgotPassword();
  const [email, setEmail] = useState("");

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    forgotPassword.mutate({ email });
  };

  const error = (forgotPassword.error as AxiosError<{ message: string }> | null)
    ?.response?.data?.message;

  if (forgotPassword.isSuccess) {
    return (
      <p className="text-sm text-ink-700">{forgotPassword.data.message}</p>
    );
  }

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

      {error && <p className="text-sm text-red-600">{error}</p>}

      <Button
        type="submit"
        className="w-full bg-ink-900 hover:bg-ink-900/90"
        disabled={forgotPassword.isPending}
      >
        {forgotPassword.isPending ? "Отправляем..." : "Отправить ссылку"}
      </Button>
    </form>
  );
}
