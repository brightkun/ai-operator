import { ReactNode } from "react";

interface AuthCardProps {
  title: string;
  description: string;
  children: ReactNode;
  footer: ReactNode;
}

export function AuthCard({ title, description, children, footer }: AuthCardProps) {
  return (
    <div className="w-full max-w-sm">
      <div className="mb-8 flex flex-col items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-ink-900 text-sm font-semibold text-white">
          AI
        </div>
        <h1 className="text-lg font-semibold text-ink-900">{title}</h1>
        <p className="text-center text-sm text-ink-500">{description}</p>
      </div>

      <div className="rounded-xl border border-ink-300 bg-white p-6 shadow-sm">
        {children}
      </div>

      <p className="mt-6 text-center text-sm text-ink-500">{footer}</p>
    </div>
  );
}
