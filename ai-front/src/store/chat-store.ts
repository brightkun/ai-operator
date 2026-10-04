import { create } from "zustand";

export interface ChatSource {
  ref: string;
  type: "email" | "event" | "file";
  title: string;
  subtitle: string;
  url: string | null;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: ChatSource[];
}

// Диалог живёт только в памяти вкладки. ownerId — чей это диалог: если в том же браузере
// войдёт другой пользователь, он не увидит чужую переписку с ассистентом.
interface ChatState {
  ownerId: number | null;
  messages: ChatMessage[];
  add: (message: ChatMessage) => void;
  reset: (ownerId: number | null) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  ownerId: null,
  messages: [],
  add: (message) => set((state) => ({ messages: [...state.messages, message] })),
  reset: (ownerId) => set({ ownerId, messages: [] }),
}));
