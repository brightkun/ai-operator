import { Sparkles } from "lucide-react";
import { suggestions } from "@/lib/mock-data";
import { SuggestionCard } from "@/components/operator/suggestion-card";

export function ChatEmptyState() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-ink-900">
        <Sparkles className="h-6 w-6 text-accent" />
      </div>

      <h1 className="mt-4 text-2xl font-semibold text-ink-900">How can I help?</h1>
      <p className="mt-1 text-sm text-ink-500">
        Ask me about your Gmail, Calendar, Drive or Notes — or try one of these.
      </p>

      <div className="mt-8 grid w-full max-w-2xl grid-cols-1 gap-3 sm:grid-cols-2">
        {suggestions.map((s) => (
          <SuggestionCard key={s.id} suggestion={s} />
        ))}
      </div>
    </div>
  );
}
