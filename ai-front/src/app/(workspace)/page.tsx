"use client";

import { useEffect } from "react";
import { AxiosError } from "axios";
import { Plus, Sparkles } from "lucide-react";
import { ChatEmptyState } from "@/components/operator/chat-empty-state";
import { ChatInput } from "@/components/operator/chat-input";
import { ChatThread } from "@/components/operator/chat-thread";
import { useAssistantChat } from "@/hooks/assistant/useAssistantChat";
import { useAuthStore } from "@/store/auth-store";
import { ChatMessage, useChatStore } from "@/store/chat-store";

const newId = () => crypto.randomUUID();

export default function OperatorHomePage() {
  const userId = useAuthStore((state) => state.user?.id ?? null);
  const { ownerId, messages: stored, add, reset } = useChatStore();
  const chat = useAssistantChat();

  // диалог принадлежит пользователю: при смене аккаунта начинаем с чистого листа.
  // Чужие сообщения не показываем даже до срабатывания эффекта.
  const messages = ownerId === userId ? stored : [];
  useEffect(() => {
    if (ownerId !== userId) reset(userId);
  }, [ownerId, userId, reset]);

  const request = (history: ChatMessage[]) => {
    chat.mutate(
      history.map(({ role, content }) => ({ role, content })),
      {
        onSuccess: (data) =>
          add({ id: newId(), role: "assistant", content: data.answer, sources: data.sources }),
      },
    );
  };

  const send = (text: string) => {
    const content = text.trim();
    if (!content || chat.isPending) return;

    const message: ChatMessage = { id: newId(), role: "user", content };
    add(message);
    request([...messages, message]);
  };

  const retry = () => {
    if (!chat.isPending) request(useChatStore.getState().messages);
  };

  const startOver = () => {
    chat.reset();
    reset(userId);
  };

  const error = chat.error
    ? ((chat.error as AxiosError<{ message: string }>).response?.data?.message ??
      "Не удалось получить ответ. Проверьте, что сервер запущен.")
    : null;

  const empty = messages.length === 0 && !chat.isPending;

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center gap-2 px-6 py-4">
        <Sparkles className="h-4 w-4 text-accent" />
        <h2 className="text-sm font-semibold text-ink-900">AI Operator</h2>
        {!empty && (
          <button
            type="button"
            onClick={startOver}
            className="ml-auto inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-ink-700 hover:bg-ink-100"
          >
            <Plus className="h-3.5 w-3.5" />
            Новый чат
          </button>
        )}
      </header>

      {empty ? (
        <ChatEmptyState onPick={send} />
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto">
          <ChatThread
            messages={messages}
            pending={chat.isPending}
            error={error}
            onRetry={retry}
          />
        </div>
      )}

      <div className="mx-auto w-full max-w-2xl px-4 pb-6 pt-2">
        <ChatInput onSend={send} disabled={chat.isPending} />
        <p className="mt-2 text-center text-[11px] text-ink-500">
          Ассистент только читает данные и может ошибаться — проверяйте по источникам.
        </p>
      </div>
    </div>
  );
}
