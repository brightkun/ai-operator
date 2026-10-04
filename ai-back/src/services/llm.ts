// Клиент к OpenAI-совместимому chat completions API (Gemini, Groq, Ollama, ...).
// Без SDK: один fetch. Провайдер меняется через LLM_BASE_URL / LLM_MODEL / LLM_API_KEY.

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

const TIMEOUT_MS = 60_000;

export const chatCompletion = async (
  messages: IChatMessage[],
  tools: IToolDefinition[],
): Promise<IChatMessage> => {
  const apiKey = process.env.LLM_API_KEY;

  if (!apiKey || apiKey === "change_me") {
    throw apiErrors.unavailable(
      "AI-ассистент не настроен: добавьте LLM_API_KEY в ai-back/.env и перезапустите сервер",
    );
  }

  let response: Response;

  try {
    response = await fetch(`${config.llm.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: config.llm.model,
        messages,
        ...(tools.length ? { tools, tool_choice: "auto" } : {}),
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (error) {
    const timedOut = error instanceof Error && error.name === "TimeoutError";
    throw apiErrors.badGateway(
      timedOut
        ? "AI-сервис не ответил вовремя. Попробуйте ещё раз."
        : "AI-сервис недоступен. Проверьте подключение к интернету.",
    );
  }

  if (response.status === 429) {
    throw apiErrors.tooManyRequests(
      "Исчерпан лимит запросов бесплатного тарифа AI. Подождите минуту и попробуйте снова.",
    );
  }

  if (response.status === 401 || response.status === 403) {
    throw apiErrors.badGateway(
      "AI-сервис отклонил ключ. Проверьте LLM_API_KEY в ai-back/.env.",
    );
  }

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    // тело ошибки провайдера — в лог для диагностики, пользователю — короткое сообщение
    console.error(`LLM error ${response.status}:`, body.slice(0, 1000));
    throw apiErrors.badGateway(`AI-сервис вернул ошибку ${response.status}`);
  }

  const data = (await response.json()) as {
    choices?: { message?: IChatMessage }[];
  };
  const message = data.choices?.[0]?.message;

  if (!message) {
    throw apiErrors.badGateway("AI-сервис вернул пустой ответ");
  }

  return message;
};
