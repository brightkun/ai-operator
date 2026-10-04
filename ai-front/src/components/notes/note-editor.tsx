"use client";

import { useEffect, useRef, useState } from "react";
import { Trash2 } from "lucide-react";
import { api } from "@/hooks/api/api";
import { trackSave } from "@/hooks/notes/note-saves";
import { NOTES_KEY, useNote } from "@/hooks/notes/useNotes";
import { formatShortDate } from "@/lib/format";
import type { Note } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";

const SAVE_DELAY_MS = 800;

type SaveStatus = "saved" | "dirty" | "saving" | "error";

interface NoteEditorProps {
  initialId: number | null; // null — новая заметка (черновик)
  onCreated: (id: number) => void;
  onDeleted: (id: number | null) => void;
}

// Открывает заметку: существующую подгружает, новую показывает сразу пустой
export function NoteEditor({ initialId, onCreated, onDeleted }: NoteEditorProps) {
  const query = useNote(initialId);

  if (initialId === null) {
    return <EditorForm initial={null} onCreated={onCreated} onDeleted={onDeleted} />;
  }

  if (query.isLoading) {
    return <p className="px-8 py-8 text-sm text-ink-500">Загрузка...</p>;
  }

  if (query.isError || !query.data) {
    return <p className="px-8 py-8 text-sm text-red-600">Не удалось открыть заметку. Возможно, её уже удалили.</p>;
  }

  return <EditorForm initial={query.data} onCreated={onCreated} onDeleted={onDeleted} />;
}

const STATUS_TEXT: Record<SaveStatus, string> = {
  saved: "Сохранено",
  dirty: "Изменения...",
  saving: "Сохранение...",
  error: "Не удалось сохранить",
};

// Редактор с автосохранением. Значения в полях — источник истины, пока заметка открыта:
// серверные обновления списка их не перезаписывают.
function EditorForm({
  initial,
  onCreated,
  onDeleted,
}: {
  initial: Note | null;
  onCreated: (id: number) => void;
  onDeleted: (id: number | null) => void;
}) {
  const queryClient = useQueryClient();

  const [title, setTitle] = useState(initial?.title ?? "");
  const [content, setContent] = useState(initial?.content ?? "");
  const [status, setStatus] = useState<SaveStatus>("saved");
  const [hasId, setHasId] = useState(initial !== null);
  const [updatedAt, setUpdatedAt] = useState<string | null>(initial?.updatedAt ?? null);

  const noteId = useRef<number | null>(initial?.id ?? null);
  const latest = useRef({ title, content }); // что сейчас в полях
  const saved = useRef({ title, content }); // что уже на сервере
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const queue = useRef<Promise<void>>(Promise.resolve()); // сохранения идут строго по очереди
  const mounted = useRef(true);
  const deleting = useRef(false);
  const onCreatedRef = useRef(onCreated);
  onCreatedRef.current = onCreated;

  const doSave = async () => {
    const { title: t, content: c } = latest.current;

    if (deleting.current) return;
    if (t === saved.current.title && c === saved.current.content) return;
    // пустой черновик на сервер не отправляем: иначе каждое нажатие «+» оставляло бы пустую заметку
    if (noteId.current === null && t.trim() === "" && c.trim() === "") return;

    if (mounted.current) setStatus("saving");

    try {
      let note: Note;

      if (noteId.current === null) {
        note = (await api.post<{ note: Note }>("/notes", { title: t, content: c })).data.note;
        noteId.current = note.id;
        if (mounted.current) setHasId(true);
        onCreatedRef.current(note.id);
      } else {
        note = (await api.patch<{ note: Note }>(`/notes/${noteId.current}`, { title: t, content: c })).data.note;
      }

      saved.current = { title: t, content: c };
      queryClient.invalidateQueries({ queryKey: NOTES_KEY });

      if (mounted.current) {
        setUpdatedAt(note.updatedAt);
        // пока шло сохранение, человек мог печатать дальше — тогда следом уйдёт ещё одно
        const same = latest.current.title === t && latest.current.content === c;
        setStatus(same ? "saved" : "dirty");
      }
    } catch {
      if (mounted.current) setStatus("error");
    }
  };

  const enqueueSave = () => {
    const run = queue.current.then(doSave);
    queue.current = run;
    if (noteId.current !== null) trackSave(noteId.current, run);
    return run;
  };

  const change = (next: { title?: string; content?: string }) => {
    latest.current = { ...latest.current, ...next };
    setStatus("dirty");
    clearTimeout(timer.current);
    timer.current = setTimeout(enqueueSave, SAVE_DELAY_MS);
  };

  // При закрытии редактора (другая заметка, другой раздел) несохранённое уходит на сервер.
  // В dev-режиме React монтирует эффект дважды, но сохранять там нечего — лишнего запроса не будет.
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      clearTimeout(timer.current);
      void enqueueSave();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Закрытие вкладки с несохранёнными правками — предупреждаем
  useEffect(() => {
    if (status === "saved") return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [status]);

  const remove = async () => {
    if (noteId.current === null) {
      onDeleted(null);
      return;
    }
    if (!window.confirm("Удалить эту заметку? Это нельзя отменить.")) return;

    deleting.current = true;
    clearTimeout(timer.current);

    try {
      await queue.current;
      const id = noteId.current;
      await api.delete(`/notes/${id}`);
      queryClient.invalidateQueries({ queryKey: NOTES_KEY });
      onDeleted(id);
    } catch {
      deleting.current = false;
      setStatus("error");
    }
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 px-8 py-3">
        <span
          role="status"
          className={cn("text-xs", status === "error" ? "text-red-600" : "text-ink-500")}
        >
          {STATUS_TEXT[status]}
          {status === "saved" && updatedAt && ` · ${formatShortDate(updatedAt)}`}
        </span>
        {status === "error" && (
          <button type="button" onClick={() => void enqueueSave()} className="text-xs text-red-600 underline">
            Повторить
          </button>
        )}
        {hasId && (
          <button
            type="button"
            onClick={remove}
            aria-label="Удалить заметку"
            title="Удалить"
            className="ml-auto rounded p-1.5 text-ink-500 hover:bg-ink-100 hover:text-ink-900"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="flex min-h-0 flex-1 flex-col px-8 pb-6">
        <input
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            change({ title: e.target.value });
          }}
          autoFocus={initial === null}
          maxLength={200}
          placeholder="Название"
          aria-label="Название заметки"
          className="w-full bg-transparent text-2xl font-semibold text-ink-900 outline-none placeholder:text-ink-300"
        />
        <textarea
          value={content}
          onChange={(e) => {
            setContent(e.target.value);
            change({ content: e.target.value });
          }}
          maxLength={50_000}
          placeholder="Начните писать..."
          aria-label="Текст заметки"
          className="mt-4 min-h-0 w-full flex-1 resize-none bg-transparent text-sm leading-relaxed text-ink-900 outline-none placeholder:text-ink-300"
        />
      </div>
    </div>
  );
}
