import { Star } from "lucide-react";
import type { Email } from "@/lib/types";
import { cn } from "@/lib/utils";

export function EmailRow({ email }: { email: Email }) {
  return (
    <div className="flex cursor-pointer items-start gap-3 border-b border-ink-100 px-6 py-4 hover:bg-ink-100">
      <input type="checkbox" className="mt-1 h-4 w-4 rounded border-ink-300" />
      <button type="button" aria-label="Star email" className="mt-1 text-ink-300 hover:text-accent">
        <Star className={cn("h-4 w-4", email.starred && "fill-accent text-accent")} />
      </button>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-ink-900">{email.sender}</p>
        <p className="truncate text-sm font-medium text-ink-900">{email.subject}</p>
        <p className="truncate text-sm text-ink-500">{email.preview}</p>
      </div>
    </div>
  );
}
