"use client";

import { useEffect, useRef } from "react";
import { Sparkles } from "lucide-react";
import { MessageText, renderPlain } from "@/components/operator/message-text";
import { Sources } from "@/components/operator/sources";
import type { ChatMessage } from "@/store/chat-store";

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
