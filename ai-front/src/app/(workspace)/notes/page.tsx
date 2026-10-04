"use client";

import { useState } from "react";
import { Plus, Search } from "lucide-react";
import { notes } from "@/lib/mock-data";
import { NotesList } from "@/components/notes/notes-list";
import { NoteEditor } from "@/components/notes/note-editor";

export default function NotesPage() {
  const [selectedId, setSelectedId] = useState(notes[0].id);
  const selectedNote = notes.find((n) => n.id === selectedId) ?? notes[0];

  return (
    <div className="flex h-full">
      <div className="flex w-80 shrink-0 flex-col border-r border-ink-300">
        <div className="flex items-center justify-between px-4 py-4">
          <h1 className="text-lg font-semibold text-ink-900">Notes</h1>
          <button
            type="button"
            aria-label="New note"
            className="flex h-7 w-7 items-center justify-center rounded-md bg-ink-900 text-white"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        <div className="px-4 pb-3">
          <div className="flex items-center gap-2 rounded-lg border border-ink-300 px-3 py-1.5">
            <Search className="h-3.5 w-3.5 text-ink-500" />
            <input
              placeholder="Search notes..."
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-ink-500"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <NotesList notes={notes} selectedId={selectedId} onSelect={setSelectedId} />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <NoteEditor note={selectedNote} />
      </div>
    </div>
  );
}
