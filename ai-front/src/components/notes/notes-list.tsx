import { formatShortDate } from "@/lib/format";
import type { NoteSummary } from "@/lib/types";
import { cn } from "@/lib/utils";

interface NotesListProps {
  notes: NoteSummary[];
  selectedId: number | null;
  onSelect: (id: number) => void;
}

export function NotesList({ notes, selectedId, onSelect }: NotesListProps) {
  return (
    <div>
      {notes.map((note) => {
        const title = note.title.trim();

        return (
          <button
            key={note.id}
            type="button"
            onClick={() => onSelect(note.id)}
            className={cn(
              "block w-full border-b border-ink-100 px-4 py-3 text-left",
              note.id === selectedId ? "bg-ink-100" : "hover:bg-ink-100/60",
            )}
          >
            <div className="flex items-baseline justify-between gap-2">
              <span
                className={cn(
                  "truncate text-sm font-semibold",
                  title ? "text-ink-900" : "italic text-ink-500",
                )}
              >
                {title || "Без названия"}
              </span>
              <span className="shrink-0 text-xs text-ink-500">{formatShortDate(note.updatedAt)}</span>
            </div>
            <p className="mt-0.5 truncate text-sm text-ink-500">{note.excerpt || "Нет текста"}</p>
          </button>
        );
      })}
    </div>
  );
}
