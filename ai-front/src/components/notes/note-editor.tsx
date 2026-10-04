import { Trash2 } from "lucide-react";
import type { Note } from "@/lib/types";

export function NoteEditor({ note }: { note: Note }) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex justify-end px-6 py-3">
        <button type="button" aria-label="Delete note" className="rounded p-1 text-ink-500 hover:bg-ink-100">
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
      <div className="px-8">
        <h1 className="text-2xl font-semibold text-ink-900">{note.title}</h1>
        <p className="mt-4 whitespace-pre-wrap text-sm text-ink-700">{note.content}</p>
      </div>
    </div>
  );
}
