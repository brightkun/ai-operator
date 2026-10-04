"use client";

import { useDeferredValue, useState } from "react";
import { Search } from "lucide-react";
import { GoogleGate } from "@/components/integrations/google-gate";
import { EmailAssistPanel } from "@/components/gmail/email-assist-panel";
import { InboxList } from "@/components/gmail/inbox-list";
import { useEmails } from "@/hooks/data/useData";
import type { Email } from "@/lib/types";

export default function GmailPage() {
  return (
    <GoogleGate resource="gmail">
      <GmailContent />
    </GoogleGate>
  );
}

function GmailContent() {
  const [query, setQuery] = useState("");
  // запрос уходит на сервер с небольшим отставанием от набора, а не на каждую букву
  const search = useDeferredValue(query.trim());
  const emails = useEmails(search);
  const [assistEmail, setAssistEmail] = useState<Email | null>(null);

  return (
    <div>
      <div className="border-b border-ink-300 px-6 py-3">
        <div className="flex items-center gap-2 rounded-lg border border-ink-300 px-3 py-2">
          <Search className="h-4 w-4 text-ink-500" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Поиск по письмам..."
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-ink-500"
          />
        </div>
      </div>

      <InboxList
        emails={emails.data}
        isLoading={emails.isLoading}
        isError={emails.isError}
        searching={search.length > 0}
        onAssist={setAssistEmail}
      />

      {assistEmail && (
        <EmailAssistPanel key={assistEmail.id} email={assistEmail} onClose={() => setAssistEmail(null)} />
      )}
    </div>
  );
}
