import Link from "next/link";
import { AuthCard } from "@/components/auth/auth-card";
import { RegisterForm } from "@/components/auth/register-form";

export default function RegisterPage() {
  return (
    <AuthCard
      title="AI Operator"
      description="Создайте аккаунт, чтобы начать"
      footer={
        <>
          Уже есть аккаунт?{" "}
          <Link
            href="/login"
            className="font-medium text-ink-900 hover:underline"
          >
            Войти
          </Link>
        </>
      }
    >
      <RegisterForm />
    </AuthCard>
  );
}
