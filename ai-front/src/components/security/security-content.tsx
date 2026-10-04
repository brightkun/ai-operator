"use client";

import { FormEvent, useState } from "react";
import { AxiosError } from "axios";
import { Button } from "@/components/ui/button";
import { useAccount, useAuditLog, useDeleteAccount, useSetRetention } from "@/hooks/account/useAccount";
import type { AuditAction, AuditEntry } from "@/lib/types";
import { cn } from "@/lib/utils";

const ACTION_LABELS: Record<AuditAction, string> = {
  register: "Регистрация",
  login: "Вход в аккаунт",
  login_failed: "Неудачная попытка входа",
  google_login: "Вход через Google",
  logout: "Выход из аккаунта",
  password_reset_requested: "Запрошен сброс пароля",
  password_reset: "Пароль изменён",
  google_connected: "Подключён Google",
  google_disconnected: "Отключён Google (синхронизированные данные удалены)",
  retention_changed: "Изменён срок хранения данных",
  data_purged: "Удалены данные по сроку хранения",
  account_deleted: "Аккаунт удалён",
};

const dateTime = new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

// Из User-Agent оставляем только понятное: браузер и система
const deviceOf = (userAgent: string) => {
  if (!userAgent) return "";
  const browser = /Edg\//.test(userAgent)
    ? "Edge"
    : /OPR\//.test(userAgent)
      ? "Opera"
      : /Firefox\//.test(userAgent)
        ? "Firefox"
        : /Chrome\//.test(userAgent)
          ? "Chrome"
          : /Safari\//.test(userAgent)
            ? "Safari"
            : "";
  const system = /Windows/.test(userAgent)
    ? "Windows"
    : /Android/.test(userAgent)
      ? "Android"
      : /iPhone|iPad/.test(userAgent)
        ? "iOS"
        : /Mac OS/.test(userAgent)
          ? "macOS"
          : /Linux/.test(userAgent)
            ? "Linux"
            : "";
  return [browser, system].filter(Boolean).join(" · ") || userAgent.slice(0, 30);
};

const cleanIp = (ip: string) => ip.replace(/^::ffff:/, "");

const details = (entry: AuditEntry) => {
  if (entry.action === "data_purged") {
    const { emails = 0, events = 0 } = entry.meta as { emails?: number; events?: number };
    return `писем: ${emails}, событий: ${events}`;
  }
  if (entry.action === "retention_changed") {
    const days = entry.meta.retentionDays as number | null;
    return days ? `${days} дней` : "без ограничения";
  }
  return "";
};

const errorMessage = (error: unknown, fallback: string) =>
  (error as AxiosError<{ message: string }>)?.response?.data?.message ?? fallback;

export function SecurityContent() {
  return (
    <div className="mx-auto max-w-3xl space-y-10 px-6 pb-12 pt-6">
      <header>
        <p className="text-xs font-medium uppercase tracking-wide text-ink-500">Безопасность</p>
        <h1 className="mt-1 text-2xl font-semibold text-ink-900">Ваши данные и доступ</h1>
        <p className="mt-1 text-sm text-ink-500">
          Токены доступа к Google хранятся в БД в зашифрованном виде. Операции ниже работают только с вашим аккаунтом.
        </p>
      </header>

      <RetentionSection />
      <AuditSection />
      <DeleteSection />
    </div>
  );
}

function RetentionSection() {
  const account = useAccount();
  const setRetention = useSetRetention();
  const [notice, setNotice] = useState<string | null>(null);

  if (!account.data) return null;

  const current = account.data.retentionDays;
  const options: (number | null)[] = [null, ...account.data.retentionOptions];

  const choose = (days: number | null) => {
    if (days === current || setRetention.isPending) return;

    const message =
      days === null
        ? "Хранить данные из Google без ограничения срока?"
        : `Письма и прошедшие события календаря старше ${days} дней будут удалены у нас сразу и не вернутся при синхронизации. В самом Google ничего не изменится. Продолжить?`;
    if (!window.confirm(message)) return;

    setNotice(null);
    setRetention.mutate(days, {
      onSuccess: ({ purged }) =>
        setNotice(
          purged.emails + purged.events > 0
            ? `Удалено писем: ${purged.emails}, событий календаря: ${purged.events}.`
            : "Сохранено. Удалять пока нечего.",
        ),
    });
  };

  return (
    <section>
      <h2 className="text-sm font-semibold text-ink-900">Срок хранения данных из Google</h2>
      <p className="mt-1 text-sm text-ink-500">
        Сколько хранить копии писем и прошедших событий. Задачи, заметки и показатели не затрагиваются.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {options.map((days) => (
          <button
            key={days ?? "none"}
            type="button"
            disabled={setRetention.isPending}
            onClick={() => choose(days)}
            aria-pressed={days === current}
            className={cn(
              "rounded-lg border px-3 py-1.5 text-sm transition-colors disabled:opacity-50",
              days === current ? "border-ink-900 bg-ink-900 text-white" : "border-ink-300 text-ink-700 hover:bg-ink-100",
            )}
          >
            {days === null ? "Без ограничения" : `${days} дней`}
          </button>
        ))}
      </div>
      {notice && <p className="mt-2 text-sm text-ink-700">{notice}</p>}
      {setRetention.isError && <p className="mt-2 text-sm text-red-600">{errorMessage(setRetention.error, "Не удалось сохранить.")}</p>}
    </section>
  );
}

function AuditSection() {
  const audit = useAuditLog();

  return (
    <section>
      <h2 className="text-sm font-semibold text-ink-900">Журнал безопасности</h2>
      <p className="mt-1 text-sm text-ink-500">Последние действия в аккаунте. Если видите незнакомый вход — смените пароль.</p>
      {audit.isLoading && <p className="mt-3 text-sm text-ink-500">Загрузка...</p>}
      {audit.isError && <p className="mt-3 text-sm text-red-600">Не удалось загрузить журнал.</p>}
      {audit.data && audit.data.length === 0 && <p className="mt-3 text-sm text-ink-500">Записей пока нет.</p>}
      {audit.data && audit.data.length > 0 && (
        <ul className="mt-3 divide-y divide-ink-100 rounded-lg border border-ink-300">
          {audit.data.map((entry) => (
            <li key={entry.id} className="flex items-baseline gap-3 px-4 py-2.5 text-sm">
              <span className="w-28 shrink-0 text-xs text-ink-500">{dateTime.format(new Date(entry.createdAt))}</span>
              <span className={cn("min-w-0 flex-1", entry.action === "login_failed" ? "font-medium text-red-700" : "text-ink-900")}>
                {ACTION_LABELS[entry.action] ?? entry.action}
                {details(entry) && <span className="text-ink-500"> · {details(entry)}</span>}
              </span>
              <span className="hidden shrink-0 text-xs text-ink-500 sm:block">
                {[cleanIp(entry.ip), deviceOf(entry.userAgent)].filter(Boolean).join(" · ")}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function DeleteSection() {
  const account = useAccount();
  const remove = useDeleteAccount();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  if (!account.data) return null;

  const submit = (event: FormEvent) => {
    event.preventDefault();
    remove.mutate({ confirmEmail: email, ...(account.data!.hasPassword ? { password } : {}) });
  };

  return (
    <section className="rounded-lg border border-red-200 p-5">
      <h2 className="text-sm font-semibold text-red-700">Удалить аккаунт и все данные</h2>
      <p className="mt-1 text-sm text-ink-500">
        Будут безвозвратно удалены письма, события, файлы, задачи, заметки, сводки и показатели, а доступ к Google отозван. Восстановить
        данные потом нельзя.
      </p>
      {!open ? (
        <Button variant="secondary" className="mt-3 border-red-300 text-red-700 hover:bg-red-50" onClick={() => setOpen(true)}>
          Удалить аккаунт...
        </Button>
      ) : (
        <form onSubmit={submit} className="mt-3 space-y-3">
          <label className="block text-sm">
            <span className="text-ink-700">
              Введите email аккаунта ({account.data.email}) для подтверждения
            </span>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="off"
              className="mt-1 w-full rounded-lg border border-ink-300 px-3 py-2 text-sm"
            />
          </label>
          {account.data.hasPassword && (
            <label className="block text-sm">
              <span className="text-ink-700">Пароль</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                className="mt-1 w-full rounded-lg border border-ink-300 px-3 py-2 text-sm"
              />
            </label>
          )}
          {remove.isError && <p className="text-sm text-red-600">{errorMessage(remove.error, "Не удалось удалить аккаунт.")}</p>}
          <div className="flex gap-2">
            <Button
              type="submit"
              disabled={remove.isPending || !email || (account.data.hasPassword && !password)}
              className="bg-red-600 hover:bg-red-700"
            >
              {remove.isPending ? "Удаляем..." : "Удалить навсегда"}
            </Button>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Отмена
            </Button>
          </div>
        </form>
      )}
    </section>
  );
}
