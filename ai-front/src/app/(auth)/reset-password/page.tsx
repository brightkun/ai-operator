import { Suspense } from "react";
import Link from "next/link";
import { AuthCard } from "@/components/auth/auth-card";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export default function ResetPasswordPage() {
  return (
    <AuthCard
      title="Новый пароль"
      description="Придумайте новый пароль для входа"
      footer={
        <>
          Вспомнили пароль?{" "}
          <Link
            href="/login"
            className="font-medium text-ink-900 hover:underline"
          >
            Войти
          </Link>
        </>
      }
    >
      {/* useSearchParams требует Suspense-границу, иначе Next ругается при билде */}
      <Suspense fallback={null}>
        <ResetPasswordForm />
      </Suspense>
    </AuthCard>
  );
}
