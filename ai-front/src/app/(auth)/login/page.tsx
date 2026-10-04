import Link from "next/link";
import { AuthCard } from "@/components/auth/auth-card";
import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <AuthCard
      title="AI Operator"
      description="Войдите, чтобы продолжить работу"
      footer={
        <>
          Нет аккаунта?{" "}
          <Link
            href="/register"
            className="font-medium text-ink-900 hover:underline"
          >
            Зарегистрироваться
          </Link>
        </>
      }
    >
      <LoginForm />
    </AuthCard>
  );
}
