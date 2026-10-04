"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  HardDrive,
  Mail,
  RefreshCw,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  useConnectGoogle,
  useDisconnectGoogle,
  useGoogleStatus,
  useSyncGoogle,
} from "@/hooks/integrations/useGoogle";
import { formatFullDate, formatShortDate } from "@/lib/format";
import type { GoogleResource } from "@/lib/types";

const RESOURCES: {
  key: GoogleResource;
  label: string;
  href: string;
  Icon: typeof Mail;
}[] = [
  { key: "gmail", label: "Gmail", href: "/gmail", Icon: Mail },
  { key: "calendar", label: "Google Calendar", href: "/calendar", Icon: Calendar },
  { key: "drive", label: "Google Drive", href: "/drive", Icon: HardDrive },
];

// Коды, с которыми бэкенд возвращает пользователя после OAuth (см. googleIntegration.controller.ts)
const ERROR_MESSAGES: Record<string, string> = {
  invalid_request:
    "Подключение отменено или Google вернул неполный ответ. Попробуйте подключить ещё раз.",
  google_auth_failed:
    "Не удалось завершить подключение к Google. Проверьте настройки OAuth-клиента в Google Cloud (адрес возврата, включённые API) и попробуйте ещё раз.",
};

type Notice = { type: "success" | "error"; text: string };

export function IntegrationsContent() {
  const router = useRouter();
  const params = useSearchParams();

  const statusQuery = useGoogleStatus();
  const connect = useConnectGoogle();
  const sync = useSyncGoogle();
  const disconnect = useDisconnectGoogle();

  const [notice, setNotice] = useState<Notice | null>(null);
  const autoSynced = useRef(false);

  // Результат OAuth приходит в адресе (?connected=google / ?error=...): показываем и убираем из адреса,
  // чтобы после обновления страницы сообщение не появлялось снова
  useEffect(() => {
    const connected = params.get("connected");
    const error = params.get("error");

    if (connected === "google") {
      setNotice({ type: "success", text: "Google подключён." });
    } else if (error) {
      setNotice({
        type: "error",
        text: ERROR_MESSAGES[error] ?? "Не удалось подключить Google.",
      });
    }

    if (connected || error) {
      router.replace("/integrations");
    }
  }, [params, router]);

  const status = statusQuery.data;
  const connected = status?.connected === true ? status : null;

  // сразу после подключения подтягиваем данные тех разделов, к которым есть доступ
  const needsFirstSync =
    connected !== null &&
    RESOURCES.some((r) => connected.access[r.key] && !connected.sync[r.key]);

  useEffect(() => {
    if (needsFirstSync && !autoSynced.current && !sync.isPending) {
      autoSynced.current = true;
      sync.mutate();
    }
  }, [needsFirstSync, sync]);

  const missingAccess =
    connected !== null && RESOURCES.some((r) => !connected.access[r.key]);

  const onDisconnect = () => {
    const ok = window.confirm(
      "Отключить Google? Мы также удалим синхронизированные письма, события и файлы.",
    );
    if (ok) disconnect.mutate();
  };

  return (
    <div className="mx-auto max-w-2xl px-6 py-8">
      <h1 className="text-lg font-semibold text-ink-900">Интеграции</h1>
      <p className="mt-1 text-sm text-ink-500">
        Подключённые сервисы. Доступ только на чтение: мы ничего не изменяем и не отправляем.
      </p>

      {notice && (
        <div
          role="status"
          className={
            notice.type === "success"
              ? "mt-5 flex items-start gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800"
              : "mt-5 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
          }
        >
          {notice.type === "success" ? (
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          ) : (
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          )}
          <span>{notice.text}</span>
        </div>
      )}

      <section className="mt-6 rounded-card border border-ink-300">
        <div className="flex items-center justify-between gap-3 border-b border-ink-100 px-5 py-4">
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-ink-900">Google</h2>
            <p className="truncate text-xs text-ink-500">
              {statusQuery.isLoading
                ? "Загрузка..."
                : connected
                  ? `${connected.email ?? "аккаунт подключён"} · с ${formatFullDate(connected.connectedAt)}`
                  : "Не подключён"}
            </p>
          </div>

          {!statusQuery.isLoading && !connected && (
            <Button disabled={connect.isPending} onClick={() => connect.mutate()}>
              {connect.isPending ? "Переходим в Google..." : "Подключить Google"}
            </Button>
          )}
        </div>

        {statusQuery.isError && (
          <p className="px-5 py-4 text-sm text-red-600">
            Не удалось загрузить статус подключения.{" "}
            <button type="button" className="underline" onClick={() => statusQuery.refetch()}>
              Повторить
            </button>
          </p>
        )}

        {connected && (
          <>
            <ul className="divide-y divide-ink-100">
              {RESOURCES.map(({ key, label, href, Icon }) => {
                const hasAccess = connected.access[key];
                const info = connected.sync[key];
                const syncError =
                  sync.data?.[key]?.ok === false ? sync.data[key]?.error : info?.error;
                const shownError = syncError && syncError !== "missing_scope" ? syncError : null;

                return (
                  <li key={key} className="flex items-start gap-3 px-5 py-3">
                    <Icon className="mt-0.5 h-4 w-4 shrink-0 text-ink-500" />
                    <div className="min-w-0 flex-1">
                      {hasAccess ? (
                        <Link href={href} className="text-sm font-medium text-ink-900 hover:underline">
                          {label}
                        </Link>
                      ) : (
                        <p className="text-sm font-medium text-ink-900">{label}</p>
                      )}

                      {hasAccess ? (
                        <p className="text-xs text-ink-500">
                          {info?.syncedAt
                            ? info.error
                              ? `Последняя попытка ${formatShortDate(info.syncedAt)}`
                              : `Обновлено ${formatShortDate(info.syncedAt)} · записей: ${info.itemCount}`
                            : sync.isPending
                              ? "Синхронизация..."
                              : "Ещё не синхронизировано"}
                        </p>
                      ) : (
                        <p className="text-xs text-ink-500">Нет доступа. Подключите Google заново.</p>
                      )}

                      {shownError && (
                        <p className="mt-0.5 break-words text-xs text-red-600">
                          Ошибка: {shownError}
                        </p>
                      )}
                    </div>

                    {hasAccess ? (
                      <CheckCircle2 aria-label="Доступ есть" className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                    ) : (
                      <XCircle aria-label="Нет доступа" className="mt-0.5 h-4 w-4 shrink-0 text-ink-300" />
                    )}
                  </li>
                );
              })}
            </ul>

            {missingAccess && (
              <p className="border-t border-ink-100 bg-ink-50 px-5 py-3 text-xs text-ink-700">
                Часть разделов подключена без доступа. Нажмите «Подключить заново» и разрешите
                все запрошенные права.
              </p>
            )}

            <div className="flex flex-wrap items-center gap-2 border-t border-ink-100 px-5 py-3">
              <Button
                variant="secondary"
                disabled={sync.isPending}
                onClick={() => sync.mutate()}
              >
                <RefreshCw className={sync.isPending ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
                Синхронизировать
              </Button>
              <Button
                variant={missingAccess ? "primary" : "secondary"}
                disabled={connect.isPending}
                onClick={() => connect.mutate()}
              >
                Подключить заново
              </Button>
              <Button
                variant="ghost"
                className="ml-auto text-red-600 hover:bg-red-50"
                disabled={disconnect.isPending}
                onClick={onDisconnect}
              >
                Отключить
              </Button>
            </div>
          </>
        )}

        {(connect.isError || sync.isError || disconnect.isError) && (
          <p className="border-t border-ink-100 px-5 py-3 text-sm text-red-600">
            Операция не удалась. Проверьте, что бэкенд запущен, и попробуйте ещё раз.
          </p>
        )}
      </section>
    </div>
  );
}
