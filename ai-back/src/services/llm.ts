// Клиент к OpenAI-совместимому chat completions API (Gemini, Groq, Ollama, ...).
// Без SDK: один fetch. Провайдер меняется через LLM_BASE_URL / LLM_MODEL / LLM_API_KEY.
//
// Бесплатные тарифы часто «перегружены» (Gemini отвечает 503 UNAVAILABLE на пару секунд) или упираются
// в квоту отдельной модели (429). Поэтому один запрос пользователя проходит такой путь:
//   основная модель -> повтор при временном сбое -> запасные модели (LLM_FALLBACK_MODELS).

import { config } from "../config/env";
import { apiErrors } from "../utils/apiErrors";

export interface IToolCall {
  id: string;
  type: "function";
  function: { name: string; arguments: string };
}

// Сообщение модели храним целиком, как пришло: у Gemini 3 в вызовах инструментов бывают
// служебные поля (подписи рассуждений), которые нужно вернуть в следующем запросе без изменений.
export interface IChatMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string | null;
  tool_calls?: IToolCall[];
  tool_call_id?: string;
  [extra: string]: unknown;
}

export interface IToolDefinition {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
}

export interface ILlmResult {
  message: IChatMessage;
  model: string; // какая модель реально ответила — следующий круг диалога продолжаем на ней же
}

const ATTEMPT_TIMEOUT_MS = 45_000;
const TOTAL_BUDGET_MS = 80_000; // дольше пользователя не держим, как бы ни складывались сбои
const ATTEMPTS_PER_MODEL = 2; // первая попытка + один повтор при временном сбое

type FailureKind = "overloaded" | "rate_limit" | "network" | "timeout" | "empty" | "rejected";

interface IFailure {
  model: string;
  kind: FailureKind;
  status?: number;
  detail: string;
}

type Attempt =
  | { ok: true; message: IChatMessage }
  | { ok: false; failure: IFailure; retrySameModel: boolean };

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Gemini отдаёт ошибки то объектом {error:{...}}, то массивом [{error:{...}}]
const providerMessage = (raw: string) => {
  try {
    const data = JSON.parse(raw);
    const error = Array.isArray(data) ? data[0]?.error : data?.error;
    return String(error?.message ?? error ?? raw).slice(0, 300);
  } catch {
    return raw.slice(0, 300);
  }
};

const attemptOnce = async (
  model: string,
  apiKey: string,
  messages: IChatMessage[],
  tools: IToolDefinition[],
  timeoutMs: number,
): Promise<Attempt> => {
  let response: Response;

  try {
    response = await fetch(`${config.llm.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        ...(tools.length ? { tools, tool_choice: "auto" } : {}),
      }),
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (error) {
    const timedOut = error instanceof Error && error.name === "TimeoutError";
    return {
      ok: false,
      retrySameModel: true,
      failure: {
        model,
        kind: timedOut ? "timeout" : "network",
        detail: error instanceof Error ? error.message : String(error),
      },
    };
  }

  if (response.ok) {
    const data = (await response.json().catch(() => ({}))) as {
      choices?: { message?: IChatMessage }[];
    };
    const message = data.choices?.[0]?.message;

    // Ответ без текста и без вызова инструмента — тоже сбой: Gemini иногда отдаёт 200 с пустым
    // сообщением (особенно после результата инструмента). Принять его значило бы показать пользователю пустоту.
    const hasText = typeof message?.content === "string" && message.content.trim() !== "";
    const hasCalls = Array.isArray(message?.tool_calls) && message.tool_calls.length > 0;

    return message && (hasText || hasCalls)
      ? { ok: true, message }
      : {
          ok: false,
          retrySameModel: true,
          failure: {
            model,
            kind: "empty",
            status: 200,
            detail: `пустой ответ: ${JSON.stringify(message ?? data).slice(0, 300)}`,
          },
        };
  }

  const detail = providerMessage(await response.text().catch(() => ""));
  const status = response.status;

  // ключ не подошёл — другие модели с тем же ключом не помогут
  if (status === 401 || status === 403) {
    console.error(`LLM ${model}: ${status} — ${detail}`);
    throw apiErrors.badGateway(
      "AI-сервис отклонил ключ. Проверьте LLM_API_KEY в ai-back/.env (и что сервис доступен в вашем регионе).",
    );
  }

  // квоты у моделей отдельные: повторять ту же бессмысленно, а запасная может ответить
  if (status === 429) {
    return { ok: false, retrySameModel: false, failure: { model, kind: "rate_limit", status, detail } };
  }

  // временный сбой на стороне провайдера («high demand», 500/502/503/504) — стоит повторить
  if (status >= 500) {
    return { ok: false, retrySameModel: true, failure: { model, kind: "overloaded", status, detail } };
  }

  // 400/404/...: модель не принимает запрос или её нет у этого ключа — пробуем следующую
  return { ok: false, retrySameModel: false, failure: { model, kind: "rejected", status, detail } };
};

// Что показать пользователю, когда не ответила ни одна модель
const explain = (failures: IFailure[]) => {
  const has = (...kinds: FailureKind[]) => failures.some((f) => kinds.includes(f.kind));

  if (has("overloaded", "timeout", "empty")) {
    return apiErrors.badGateway(
      "AI-модели сейчас перегружены (на бесплатном тарифе это бывает). Подождите минуту и повторите.",
    );
  }

  if (has("rate_limit")) {
    return apiErrors.tooManyRequests(
      "Исчерпан лимит запросов бесплатного тарифа AI. Подождите минуту и попробуйте снова.",
    );
  }

  if (has("network")) {
    return apiErrors.badGateway("AI-сервис недоступен. Проверьте подключение к интернету.");
  }

  const status = failures.find((f) => f.status)?.status ?? "?";
  return apiErrors.badGateway(`AI-сервис не принял запрос (код ${status}). Подробности в логе сервера.`);
};

export const chatCompletion = async (
  messages: IChatMessage[],
  tools: IToolDefinition[],
  preferredModel?: string,
): Promise<ILlmResult> => {
  const apiKey = process.env.LLM_API_KEY;

  if (!apiKey || apiKey === "change_me") {
    throw apiErrors.unavailable(
      "AI-ассистент не настроен: добавьте LLM_API_KEY в ai-back/.env и перезапустите сервер",
    );
  }

  // Порядок: модель, на которой уже идёт диалог -> основная -> запасные (без повторов)
  const candidates = [
    ...new Set([preferredModel ?? config.llm.model, config.llm.model, ...config.llm.fallbackModels]),
  ];
  const deadline = Date.now() + TOTAL_BUDGET_MS;
  const failures: IFailure[] = [];

  for (const model of candidates) {
    for (let attempt = 1; attempt <= ATTEMPTS_PER_MODEL; attempt++) {
      const remaining = deadline - Date.now();
      if (remaining <= 0) {
        throw explain(failures.length ? failures : [{ model, kind: "timeout", detail: "бюджет времени" }]);
      }

      const result = await attemptOnce(
        model,
        apiKey,
        messages,
        tools,
        Math.min(ATTEMPT_TIMEOUT_MS, remaining),
      );

      if (result.ok) {
        if (failures.length) {
          console.warn(`LLM: ответила ${model} после ${failures.length} неудачных попыток`);
        }
        return { message: result.message, model };
      }

      failures.push(result.failure);
      console.warn(
        `LLM ${model} (попытка ${attempt}): ${result.failure.status ?? result.failure.kind} — ${result.failure.detail}`,
      );

      if (!result.retrySameModel || attempt === ATTEMPTS_PER_MODEL) break;
      await sleep(config.llm.retryDelayMs * attempt);
    }
  }

  throw explain(failures);
};
