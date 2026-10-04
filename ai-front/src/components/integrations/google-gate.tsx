"use client";

import { ReactNode, useEffect, useRef } from "react";
import { AxiosError } from "axios";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  useConnectGoogle,
  useGoogleStatus,
  useSyncGoogle,
} from "@/hooks/integrations/useGoogle";
import { formatShortDate } from "@/lib/format";
import type { GoogleResource } from "@/lib/types";

const TITLES: Record<GoogleResource, string> = {
  gmail: "Gmail",
  calendar: "Google Calendar",
  drive: "Google Drive",
};

// Показывает страницу ресурса только когда Google подключён и дал нужные права.
// Иначе — экран подключения. Если ресурс ещё ни разу не синхронизировался, запускает синхронизацию сама.
export function GoogleGate({
  resource,
  children,
}: {
  resource: GoogleResource;
  children: ReactNode;
}) {
  const statusQuery = useGoogleStatus();
  const connect = useConnectGoogle();
  const sync = useSyncGoogle();
  const autoSynced = useRef(false);

  const status = statusQuery.data;
  const ready = status?.connected === true && status.access[resource];
  const neverSynced = ready && !status.sync[resource];

  useEffect(() => {
    if (neverSynced && !autoSynced.current && !sync.isPending) {
      autoSynced.current = true;
      sync.mutate();
    }
  }, [neverSynced, sync]);

  if (statusQuery.isLoading) {
    return <Centered>Загрузка...</Centered>;
  }

  if (statusQuery.isError) {
    return (
      <Centered>
        <p className="text-sm text-red-600">Не удалось загрузить статус подключения.</p>
        <Button variant="secondary" className="mt-3" onClick={() => statusQuery.refetch()}>
          Повторить
        </Button>
      </Centered>
    );
  }

  if (!status?.connected || !status.access[resource]) {
    const needsUpgrade = status?.connected === true;

    return (
      <Centered>
        <h1 className="text-lg font-semibold text-ink-900">
          {needsUpgrade ? "Нужны дополнительные права" : `Подключите ${TITLES[resource]}`}
        </h1>
        <p className="mt-1 max-w-sm text-sm text-ink-500">
          {needsUpgrade
            ? "Ваш Google-аккаунт подключён без доступа к этому разделу. Подключите его заново и разрешите доступ."
            : "Войдите через Google и разрешите доступ на чтение. Мы ничего не изменяем и не отправляем."}
        </p>
        <Button
          className="mt-4"
          disabled={connect.isPending}
          onClick={() => connect.mutate()}
        >
          {connect.isPending ? "Переходим в Google..." : needsUpgrade ? "Подключить заново" : "Подключить Google"}
        </Button>
        {connect.isError && (
          <p className="mt-2 text-sm text-red-600">Не удалось начать подключение. Попробуйте ещё раз.</p>
        )}
      </Centered>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <SyncBar resource={resource} />
      <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
    </div>
  );
}

function Centered({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-full flex-col items-center justify-center px-4 text-center">
      {children}
    </div>
  );
}

function SyncBar({ resource }: { resource: GoogleResource }) {
  const statusQuery = useGoogleStatus();
  const sync = useSyncGoogle();

  const status = statusQuery.data;
  const info = status?.connected ? status.sync[resource] : undefined;

  const requestError = sync.error as AxiosError<{ message: string }> | null;
  const message = requestError
    ? (requestError.response?.data?.message ?? "Не удалось синхронизировать")
    : sync.data?.[resource]?.ok === false
      ? sync.data[resource]?.error
      : info?.error;

  return (
    <div className="flex items-center gap-3 border-b border-ink-100 px-6 py-2 text-xs text-ink-500">
      <span>
        {info?.syncedAt
          ? `Обновлено: ${formatShortDate(info.syncedAt)}`
          : sync.isPending
            ? "Первая синхронизация..."
            : "Ещё не синхронизировано"}
      </span>
      {message && message !== "missing_scope" && (
        <span className="truncate text-red-600" title={message}>
          Ошибка: {message}
        </span>
      )}
      <button
        type="button"
        onClick={() => sync.mutate()}
        disabled={sync.isPending}
        className="ml-auto inline-flex items-center gap-1.5 rounded px-2 py-1 text-ink-700 hover:bg-ink-100 disabled:opacity-50"
      >
        <RefreshCw className={sync.isPending ? "h-3.5 w-3.5 animate-spin" : "h-3.5 w-3.5"} />
        Синхронизировать
      </button>
    </div>
  );
}
