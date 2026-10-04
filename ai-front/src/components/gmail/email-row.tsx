import { Star } from "lucide-react";
import type { Email } from "@/lib/types";
import { formatShortDate } from "@/lib/format";
import { cn } from "@/lib/utils";

// Клик открывает письмо в самом Gmail: здесь мы только читаем
export function EmailRow({ email }: { email: Email }) {
  return (
    <a
      href={`https://mail.google.com/mail/u/0/#inbox/${email.gmailId}`}
      target="_blank"
      rel="noreferrer"
      className="flex items-start gap-3 border-b border-ink-100 px-6 py-4 hover:bg-ink-100"
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
  );
}
