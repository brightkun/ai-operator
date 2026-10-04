"use client";

import { useDeferredValue, useEffect, useRef, useState } from "react";
import { Plus, Search } from "lucide-react";
import { NoteEditor } from "@/components/notes/note-editor";
import { NotesList } from "@/components/notes/notes-list";
import { useNotes } from "@/hooks/notes/useNotes";

// key — идентичность открытого редактора: пока она не меняется, он не пересоздаётся (и не теряет курсор),
// даже когда новая заметка получила id на сервере (createdId)
interface Selection {
  key: string;
  initialId: number | null;
  createdId: number | null;
}

export default function NotesPage() {
  const [query, setQuery] = useState("");
  const search = useDeferredValue(query.trim());
  const notes = useNotes(search);
  const items = notes.data ?? [];

  const [selection, setSelection] = useState<Selection | null>(null);
  const counter = useRef(0);
  const initialized = useRef(false);

  const open = (id: number): Selection => ({ key: `n${id}`, initialId: id, createdId: null });
  const draft = (): Selection => ({ key: `new${++counter.current}`, initialId: null, createdId: null });

  // при первом заходе открываем самую свежую заметку, а если их нет — пустой черновик
  useEffect(() => {
    if (initialized.current || !notes.data) return;
    initialized.current = true;
    setSelection(notes.data[0] ? open(notes.data[0].id) : draft());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notes.data]);

  const selectedId = selection ? (selection.createdId ?? selection.initialId) : null;

  const markCreated = (key: string, id: number) =>
    setSelection((current) => (current && current.key === key ? { ...current, createdId: id } : current));

  const afterDelete = (deletedId: number | null) => {
    const next = items.find((note) => note.id !== deletedId);
    setSelection(next ? open(next.id) : draft());
  };

  return (
    <div className="flex h-full">
      <div className="flex w-80 shrink-0 flex-col border-r border-ink-300">
        <div className="flex items-center justify-between px-4 py-4">
          <h1 className="text-lg font-semibold text-ink-900">Заметки</h1>
          <button
            type="button"
            aria-label="Новая заметка"
            title="Новая заметка"
            onClick={() => setSelection(draft())}
            className="flex h-7 w-7 items-center justify-center rounded-md bg-ink-900 text-white hover:bg-ink-700"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        <div className="px-4 pb-3">
          <div className="flex items-center gap-2 rounded-lg border border-ink-300 px-3 py-1.5">
            <Search className="h-3.5 w-3.5 text-ink-500" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Поиск по заметкам..."
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-ink-500"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {notes.isLoading && <p className="px-4 py-3 text-sm text-ink-500">Загрузка...</p>}
          {notes.isError && <p className="px-4 py-3 text-sm text-red-600">Не удалось загрузить заметки.</p>}
          {notes.data && items.length === 0 && (
            <p className="px-4 py-3 text-sm text-ink-500">
              {search ? "Ничего не найдено." : "Заметок пока нет."}
            </p>
          )}
          <NotesList
            notes={items}
            selectedId={selectedId}
            onSelect={(id) => {
              if (id !== selectedId) setSelection(open(id));
            }}
          />
        </div>
      </div>

      <div className="min-w-0 flex-1">
        {selection && (
          <NoteEditor
            key={selection.key}
            initialId={selection.initialId}
            onCreated={(id) => markCreated(selection.key, id)}
            onDeleted={afterDelete}
          />
        )}
      </div>
    </div>
  );
}
