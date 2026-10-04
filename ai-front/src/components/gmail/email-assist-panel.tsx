"use client";

import { useEffect, useState } from "react";
import { AxiosError } from "axios";
import { Check, Copy, ExternalLink, RefreshCw, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MessageText } from "@/components/operator/message-text";
import { reportDraftAccepted, useEmailAssist } from "@/hooks/data/useEmailAssist";
import { formatShortDate } from "@/lib/format";
import type { Email } from "@/lib/types";
import { cn } from "@/lib/utils";

const QUICK_INSTRUCTIONS = ["Согласиться", "Вежливо отказать", "Уточнить детали", "Попросить перенести"];
const MAX_COMPOSE_URL = 7000; // длиннее Gmail-ссылку браузеры не принимают

const apiMessage = (error: unknown) =>
  (error as AxiosError<{ message: string }> | null)?.response?.data?.message ??
  "Не удалось получить ответ. Проверьте, что сервер запущен.";

const composeUrl = (email: Email, draft: string) => {
  const subject = /^(re|отв):/i.test(email.subject.trim()) ? email.subject : `Re: ${email.subject || "(без темы)"}`;
  return (
    `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(email.fromEmail)}` +
    `&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(draft)}`
  );
};

// Панель помощи по письму. Ничего не отправляется: ответ — только черновик, который человек правит и отправляет сам.
export function EmailAssistPanel({ email, onClose }: { email: Email; onClose: () => void }) {
  const assist = useEmailAssist();

  const [summary, setSummary] = useState<string | null>(null);
  const [draft, setDraft] = useState<string | null>(null);
  const [instruction, setInstruction] = useState("");
  const [busy, setBusy] = useState<"summary" | "reply" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const run = async (action: "summary" | "reply", refresh = false) => {
    setBusy(action);
    setError(null);

    try {
      const result = await assist.mutateAsync({
        emailId: email.id,
        action,
        refresh,
        ...(action === "reply" ? { instruction } : {}),
      });
      if (action === "summary") setSummary(result.text);
      else setDraft(result.text);
    } catch (e) {
      setError(apiMessage(e));
    } finally {
      setBusy(null);
    }
  };

  const copy = async () => {
    if (draft === null) return;

    try {
      await navigator.clipboard.writeText(draft);
    } catch {
      // нет доступа к буферу обмена (например, http) — выделяем текст, человек скопирует сам
      document.querySelector<HTMLTextAreaElement>("textarea[data-draft]")?.select();
      setError("Не удалось скопировать автоматически: текст выделен, нажмите Ctrl+C.");
      return;
    }

    reportDraftAccepted(email.id, "copy");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const url = draft ? composeUrl(email, draft) : "";
  const tooLong = url.length > MAX_COMPOSE_URL;

  const openInGmail = () => {
    if (!draft || tooLong) return;
    reportDraftAccepted(email.id, "gmail");
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="fixed inset-0 z-30 flex justify-end bg-black/20" onClick={onClose}>
      <aside
        role="dialog"
        aria-label="Помощь AI по письму"
        onClick={(event) => event.stopPropagation()}
        className="flex h-full w-full max-w-md flex-col overflow-y-auto border-l border-ink-300 bg-white shadow-xl"
      >
        <div className="flex items-start gap-3 border-b border-ink-100 px-5 py-4">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-ink-900">{email.subject || "(без темы)"}</p>
            <p className="truncate text-xs text-ink-500">
              {email.fromName || email.fromEmail}
              {email.receivedAt && ` · ${formatShortDate(email.receivedAt)}`}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Закрыть"
            className="rounded p-1 text-ink-500 hover:bg-ink-100 hover:text-ink-900"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 space-y-6 px-5 py-5">
          <section>
            <div className="flex items-center gap-2">
              <h2 className="text-xs font-medium uppercase tracking-wide text-ink-500">Кратко</h2>
              {summary !== null && (
                <button
                  type="button"
                  onClick={() => run("summary", true)}
                  disabled={busy !== null}
                  aria-label="Пересоздать краткое содержание"
                  title="Пересоздать"
                  className="rounded p-1 text-ink-500 hover:bg-ink-100 disabled:opacity-50"
                >
                  <RefreshCw className={cn("h-3.5 w-3.5", busy === "summary" && "animate-spin")} />
                </button>
              )}
            </div>
            {summary === null ? (
              <Button
                variant="secondary"
                className="mt-2"
                onClick={() => run("summary")}
                disabled={busy !== null}
              >
                <Sparkles className={cn("h-4 w-4", busy === "summary" && "animate-pulse")} />
                {busy === "summary" ? "Читаю письмо..." : "Кратко о письме"}
              </Button>
            ) : (
              <div className="mt-2">
                <MessageText content={summary} />
              </div>
            )}
          </section>

          <section>
            <h2 className="text-xs font-medium uppercase tracking-wide text-ink-500">Черновик ответа</h2>

            <div className="mt-2 flex flex-wrap gap-1.5">
              {QUICK_INSTRUCTIONS.map((label) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => setInstruction((current) => (current === label ? "" : label))}
                  className={cn(
                    "rounded-full border px-2.5 py-1 text-xs transition-colors",
                    instruction === label
                      ? "border-ink-900 bg-ink-900 text-white"
                      : "border-ink-300 text-ink-700 hover:bg-ink-100",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
            <input
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              maxLength={300}
              placeholder="Пожелание к ответу (необязательно)"
              className="mt-2 w-full rounded-lg border border-ink-300 px-3 py-2 text-sm text-ink-900 outline-none placeholder:text-ink-500 focus:border-ink-900"
            />

            <Button className="mt-2" onClick={() => run("reply")} disabled={busy !== null}>
              <Sparkles className={cn("h-4 w-4", busy === "reply" && "animate-pulse")} />
              {busy === "reply" ? "Пишу ответ..." : draft === null ? "Составить черновик" : "Составить заново"}
            </Button>

            {draft !== null && (
              <div className="mt-4">
                <textarea
                  data-draft
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  rows={10}
                  aria-label="Черновик ответа"
                  className="w-full resize-y rounded-lg border border-ink-300 px-3 py-2 text-sm leading-relaxed text-ink-900 outline-none focus:border-ink-900"
                />
                <div className="mt-2 flex flex-wrap gap-2">
                  <Button variant="secondary" onClick={copy}>
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    {copied ? "Скопировано" : "Копировать"}
                  </Button>
                  <Button variant="secondary" onClick={openInGmail} disabled={tooLong}>
                    <ExternalLink className="h-4 w-4" />
                    Открыть в Gmail
                  </Button>
                </div>
                {tooLong && (
                  <p className="mt-2 text-xs text-ink-500">
                    Черновик слишком длинный для ссылки в Gmail — используйте «Копировать».
                  </p>
                )}
                <p className="mt-2 text-xs text-ink-500">
                  Это только черновик: письмо не отправляется. Проверьте текст и отправьте сами.
                </p>
              </div>
            )}
          </section>

          {error && (
            <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
              {error}
            </p>
          )}
        </div>

        <p className="border-t border-ink-100 px-5 py-3 text-xs text-ink-500">
          Текст письма отправляется в AI только когда вы нажимаете кнопки выше.
        </p>
      </aside>
    </div>
  );
}
