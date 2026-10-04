import { Sparkles, Star } from "lucide-react";
import type { Email } from "@/lib/types";
import { formatShortDate } from "@/lib/format";
import { cn } from "@/lib/utils";

interface EmailRowProps {
  email: Email;
  onAssist: (email: Email) => void;
}

// Клик по строке открывает письмо в самом Gmail; кнопка «AI» справа — краткое содержание и черновик ответа
export function EmailRow({ email, onAssist }: EmailRowProps) {
  return (
    <div className="group relative border-b border-ink-100 hover:bg-ink-100">
      <a
        href={`https://mail.google.com/mail/u/0/#inbox/${email.gmailId}`}
        target="_blank"
        rel="noreferrer"
        className="flex items-start gap-3 py-4 pl-6 pr-16"
      >
        <Star
          aria-label={email.isStarred ? "Помечено" : undefined}
          className={cn(
            "mt-0.5 h-4 w-4 shrink-0",
            email.isStarred ? "fill-accent text-accent" : "text-ink-300",
          )}
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-3">
            <p
              className={cn(
                "truncate text-sm text-ink-900",
                email.isRead ? "font-medium" : "font-semibold",
              )}
            >
              {email.fromName || email.fromEmail}
            </p>
            <span className="shrink-0 text-xs text-ink-500">
              {formatShortDate(email.receivedAt)}
            </span>
          </div>
          <p
            className={cn(
              "truncate text-sm text-ink-900",
              email.isRead ? "font-normal" : "font-medium",
            )}
          >
            {email.subject || "(без темы)"}
          </p>
          <p className="truncate text-sm text-ink-500">{email.snippet}</p>
        </div>
        {!email.isRead && (
          <span aria-label="Не прочитано" className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-ink-900" />
        )}
      </a>

      <button
        type="button"
        onClick={() => onAssist(email)}
        aria-label="AI: кратко и черновик ответа"
        title="AI: кратко и черновик ответа"
        className="absolute right-4 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg border border-ink-300 bg-white text-ink-700 opacity-60 transition-opacity hover:bg-ink-50 hover:text-ink-900 focus:opacity-100 group-hover:opacity-100"
      >
        <Sparkles className="h-4 w-4 text-accent" />
      </button>
    </div>
  );
}
