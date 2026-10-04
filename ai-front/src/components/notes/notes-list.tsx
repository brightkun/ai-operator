import type { Note } from "@/lib/types";
import { cn } from "@/lib/utils";

interface NotesListProps {
  notes: Note[];
  selectedId: string;
  onSelect: (id: string) => void;
}

export function NotesList({ notes, selectedId, onSelect }: NotesListProps) {
  return (
    <div>
      {notes.map((note) => (
        <button
          key={note.id}
          type="button"
          onClick={() => onSelect(note.id)}
          className={cn(
            "block w-full border-b border-ink-100 px-4 py-3 text-left",
            note.id === selectedId ? "bg-ink-100" : "hover:bg-ink-100/60"
          )}
        >
          <div className="flex items-baseline justify-between gap-2">
            <span className="truncate text-sm font-semibold text-ink-900">{note.title}</span>
            <span className="shrink-0 text-xs text-ink-500">{note.updatedAt}</span>
          </div>
          <p className="mt-0.5 truncate text-sm text-ink-500">{note.content}</p>
        </button>
      ))}
    </div>
  );
}
