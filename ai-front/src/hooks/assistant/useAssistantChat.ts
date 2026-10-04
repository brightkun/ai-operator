import type { ChatSource } from "@/store/chat-store";
import { useMutation } from "@tanstack/react-query";
import { api } from "../api/api";

interface IAssistantResponse {
  answer: string;
  sources: ChatSource[];
}

type HistoryMessage = { role: "user" | "assistant"; content: string };

// История диалога хранится на клиенте и уходит целиком; часовой пояс — чтобы «сегодня» и «завтра»
// ассистент понимал так же, как пользователь
export const useAssistantChat = () =>
  useMutation({
    mutationKey: ["assistant-chat"],
    mutationFn: async (messages: HistoryMessage[]) => {
      const response = await api.post<IAssistantResponse>("/assistant/chat", {
        messages,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      });

      return response.data;
    },
  });
