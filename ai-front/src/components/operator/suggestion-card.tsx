import { Inbox, Calendar, FolderOpen, NotebookPen, type LucideIcon } from "lucide-react";
import type { Suggestion } from "@/lib/types";

const icons: Record<Suggestion["icon"], LucideIcon> = {
  inbox: Inbox,
  calendar: Calendar,
  folder: FolderOpen,
  note: NotebookPen,
};

export function SuggestionCard({ suggestion }: { suggestion: Suggestion }) {
  const Icon = icons[suggestion.icon];

  return (
    <button
      type="button"
      className="flex items-start gap-3 rounded-card border border-ink-300 bg-white p-4 text-left transition-colors hover:bg-ink-100"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-ink-100 text-ink-700">
        <Icon className="h-4 w-4" />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-ink-900">{suggestion.title}</span>
        <span className="mt-0.5 block truncate text-sm text-ink-500">{suggestion.description}</span>
      </span>
    </button>
  );
}
