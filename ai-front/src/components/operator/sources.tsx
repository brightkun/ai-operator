import { Calendar, FileText, ListChecks, Mail } from "lucide-react";
import type { ChatSource } from "@/store/chat-store";

const sourceIcon: Record<ChatSource["type"], typeof Mail> = {
  email: Mail,
  event: Calendar,
  file: FileText,
  task: ListChecks,
};

// Пронумерованный список источников под ответом ассистента; номера совпадают со сносками в тексте
export function Sources({ sources }: { sources: ChatSource[] }) {
  return (
    <ol className="mt-3 space-y-1 border-t border-ink-100 pt-3">
      {sources.map((source, i) => {
        const Icon = sourceIcon[source.type];
        const body = (
          <>
            <span className="w-4 shrink-0 text-right text-xs font-semibold text-ink-500">{i + 1}</span>
            <Icon className="h-3.5 w-3.5 shrink-0 text-ink-500" />
            <span className="truncate text-xs text-ink-900">{source.title}</span>
            <span className="shrink-0 truncate text-xs text-ink-500">· {source.subtitle}</span>
          </>
        );

        return (
          <li key={source.ref}>
            {source.url ? (
              <a
                href={source.url}
                target="_blank"
                rel="noreferrer"
                className="-mx-1 flex items-center gap-2 rounded px-1 py-0.5 hover:bg-ink-100"
              >
                {body}
              </a>
            ) : (
              <div className="flex items-center gap-2 px-0 py-0.5">{body}</div>
            )}
          </li>
        );
      })}
    </ol>
  );
}
