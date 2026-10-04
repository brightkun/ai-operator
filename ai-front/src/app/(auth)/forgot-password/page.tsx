import Link from "next/link";
import { AuthCard } from "@/components/auth/auth-card";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export default function ForgotPasswordPage() {
  return (
    <AuthCard
      title="Восстановление пароля"
      description="Укажите email — пришлём ссылку для сброса пароля"
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
      <ForgotPasswordForm />
    </AuthCard>
  );
}
