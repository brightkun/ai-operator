import type { Email } from "@/lib/types";
import { EmailRow } from "@/components/gmail/email-row";

interface InboxListProps {
  emails: Email[] | undefined;
  isLoading: boolean;
  isError: boolean;
  searching: boolean;
  onAssist: (email: Email) => void;
}

export function InboxList({ emails, isLoading, isError, searching, onAssist }: InboxListProps) {
  return (
    <div>
      <div className="px-6 pb-2 pt-4">
        <h1 className="text-lg font-semibold text-ink-900">Входящие</h1>
        {emails && (
          <p className="text-sm text-ink-500">
            {searching ? `Найдено: ${emails.length}` : `Последние ${emails.length}`}
          </p>
        )}
      </div>

      {isLoading && <p className="px-6 py-6 text-sm text-ink-500">Загрузка...</p>}
      {isError && <p className="px-6 py-6 text-sm text-red-600">Не удалось загрузить письма.</p>}
      {emails && emails.length === 0 && (
        <p className="px-6 py-6 text-sm text-ink-500">
          {searching ? "Ничего не найдено." : "Писем пока нет. Нажмите «Синхронизировать»."}
        </p>
      )}

      <div>
        {emails?.map((email) => (
          <EmailRow key={email.id} email={email} onAssist={onAssist} />
        ))}
      </div>
    </div>
  );
}
