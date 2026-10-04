import { Search } from "lucide-react";
import { emails } from "@/lib/mock-data";
import { InboxList } from "@/components/gmail/inbox-list";

export default function GmailPage() {
  return (
    <div>
      <div className="border-b border-ink-300 px-6 py-3">
        <div className="flex items-center gap-2 rounded-lg border border-ink-300 px-3 py-2">
          <Search className="h-4 w-4 text-ink-500" />
          <input
            placeholder="Search emails or ask AI..."
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-ink-500"
          />
          <kbd className="rounded border border-ink-300 px-1.5 py-0.5 text-xs text-ink-500">⌘K</kbd>
        </div>
      </div>

      <InboxList emails={emails} />
    </div>
  );
}
