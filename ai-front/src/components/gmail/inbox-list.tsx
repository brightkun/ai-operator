import type { Email } from "@/lib/types";
import { EmailRow } from "@/components/gmail/email-row";

export function InboxList({ emails }: { emails: Email[] }) {
  return (
    <div>
      <div className="px-6 pb-2 pt-4">
        <h1 className="text-lg font-semibold text-ink-900">Inbox</h1>
        <p className="text-sm text-ink-500">{emails.length} messages</p>
      </div>
      <div>
        {emails.map((email) => (
          <EmailRow key={email.id} email={email} />
        ))}
      </div>
    </div>
  );
}
