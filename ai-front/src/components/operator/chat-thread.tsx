"use client";

import { useEffect, useRef } from "react";
import { Calendar, FileText, Mail, Sparkles } from "lucide-react";
import { MessageText, renderPlain } from "@/components/operator/message-text";
import type { ChatMessage, ChatSource } from "@/store/chat-store";

const sourceIcon: Record<ChatSource["type"], typeof Mail> = {
  email: Mail,
  event: Calendar,
  file: FileText,
};

interface ChatThreadProps {
  messages: ChatMessage[];
  pending: boolean;
  error: string | null;
  onRetry: () => void;
}

export function ChatThread({ messages, pending, error, onRetry }: ChatThreadProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length, pending, error]);

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6 px-4 py-6">
      {messages.map((message) =>
        message.role === "user" ? (
          <div key={message.id} className="flex justify-end">
            <div className="max-w-[85%] rounded-2xl rounded-br-md bg-ink-100 px-4 py-2.5 text-ink-900">
              {renderPlain(message.content)}
            </div>
          </div>
        ) : (
          <div key={message.id} className="flex gap-3">
            <AssistantAvatar />
            <div className="min-w-0 flex-1">
              <MessageText content={message.content} sources={message.sources} />
              {message.sources && message.sources.length > 0 && (
                <Sources sources={message.sources} />
              )}
            </div>
          </div>
        ),
      )}

      {pending && (
        <div className="flex gap-3">
          <AssistantAvatar />
          <p className="animate-pulse pt-1 text-sm text-ink-500">Ищу в письмах, календаре и файлах...</p>
        </div>
      )}

      {error && !pending && (
        <div className="flex gap-3">
          <AssistantAvatar />
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            <p>{error}</p>
            <button type="button" onClick={onRetry} className="mt-1 font-medium underline">
              Повторить
            </button>
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}

function AssistantAvatar() {
  return (
    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-ink-900">
      <Sparkles className="h-3.5 w-3.5 text-accent" />
    </span>
  );
}

function Sources({ sources }: { sources: ChatSource[] }) {
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
