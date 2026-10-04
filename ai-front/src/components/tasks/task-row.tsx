import { Check, Clock, ExternalLink, Handshake, RotateCcw, X } from "lucide-react";
import { dueInfo, type DueTone } from "@/lib/tasks";
import type { Task } from "@/lib/types";
import { cn } from "@/lib/utils";

const toneClass: Record<DueTone, string> = {
  overdue: "bg-red-50 text-red-700",
  today: "bg-orange-50 text-orange-700",
  soon: "bg-blue-50 text-blue-700",
  later: "bg-ink-100 text-ink-700",
};

interface TaskRowProps {
  task: Task;
  today: string;
  done?: boolean;
  disabled?: boolean;
  onToggle: (task: Task) => void;
  onDismiss?: (task: Task) => void;
}

export function TaskRow({ task, today, done = false, disabled = false, onToggle, onDismiss }: TaskRowProps) {
  const due = done ? null : dueInfo(task.dueDate, today);

  return (
    <li className="group flex items-start gap-3 border-b border-ink-100 px-6 py-3 hover:bg-ink-50">
      <button
        type="button"
        onClick={() => onToggle(task)}
        disabled={disabled}
        aria-label={done ? "Вернуть в активные" : "Отметить выполненной"}
        title={done ? "Вернуть в активные" : "Выполнено"}
        className={cn(
          "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors disabled:opacity-50",
          done
            ? "border-ink-900 bg-ink-900 text-white hover:bg-ink-700"
            : "border-ink-300 text-transparent hover:border-ink-900 hover:text-ink-900",
        )}
      >
        {done ? <RotateCcw className="h-3 w-3" /> : <Check className="h-3 w-3" />}
      </button>

      <div className="min-w-0 flex-1">
        <p className={cn("text-sm font-medium", done ? "text-ink-500 line-through" : "text-ink-900")}>
          {task.title}
        </p>

        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-500">
          {task.kind === "waiting" && (
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Жду ответа
            </span>
          )}
          {task.kind === "commitment" && (
            <span className="inline-flex items-center gap-1">
              <Handshake className="h-3 w-3" />
              Обещал
            </span>
          )}
          {due && (
            <span className={cn("rounded px-1.5 py-0.5 font-medium", toneClass[due.tone])}>{due.label}</span>
          )}
          {task.source === "email" && task.sourceUrl && (
            <a
              href={task.sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-w-0 items-center gap-1 hover:text-ink-900 hover:underline"
              title={task.sourceTitle}
            >
              <ExternalLink className="h-3 w-3 shrink-0" />
              <span className="truncate">
                {task.sourcePerson ? `${task.sourcePerson}: ` : ""}
                {task.sourceTitle}
              </span>
            </a>
          )}
        </div>
      </div>

      {onDismiss && (
        <button
          type="button"
          onClick={() => onDismiss(task)}
          disabled={disabled}
          aria-label="Убрать задачу"
          title="Убрать (это не задача)"
          className="shrink-0 rounded p-1 text-ink-300 opacity-0 transition-opacity hover:bg-ink-100 hover:text-ink-900 focus:opacity-100 group-hover:opacity-100 disabled:opacity-50"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </li>
  );
}
