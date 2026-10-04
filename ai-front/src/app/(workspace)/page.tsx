import { Sparkles } from "lucide-react";
import { ChatEmptyState } from "@/components/operator/chat-empty-state";
import { ChatInput } from "@/components/operator/chat-input";

export default function OperatorHomePage() {
  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center gap-2 px-6 py-4">
        <Sparkles className="h-4 w-4 text-accent" />
        <h2 className="text-sm font-semibold text-ink-900">AI Operator</h2>
      </header>

      <ChatEmptyState />

      <div className="mx-auto w-full max-w-2xl px-4 pb-6">
        <ChatInput />
      </div>
    </div>
  );
}
