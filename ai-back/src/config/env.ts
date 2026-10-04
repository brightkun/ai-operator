try {
  process.loadEnvFile();
} catch {
  // Файла .env нет — переменные берутся из окружения
}

export const requireEnv = (name: string): string => {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Переменная окружения ${name} не задана (см. .env.example)`);
  }

  return value;
};

const serverUrl = process.env.SERVER_URL || "http://localhost:5000";

const DEFAULT_LLM_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/openai";
const llmBaseUrl = (process.env.LLM_BASE_URL || DEFAULT_LLM_BASE_URL).replace(/\/+$/, "");

// Единая точка доступа к настройкам. SMTP-данные читаются лениво (см. utils/mailer.ts),
// чтобы сервер стартовал и без почты — она нужна только для сброса пароля.
export const config = {
  port: Number(process.env.PORT) || 5000,
  clientUrl: process.env.CLIENT_URL || "http://localhost:3000",
  serverUrl,
  googleClientId: requireEnv("GOOGLE_CLIENT_ID"),
  googleClientSecret: requireEnv("GOOGLE_CLIENT_SECRET"),
  googleRedirectUri: `${serverUrl}/api/integrations/google/callback`,
  // secure-кука работает только по https, поэтому включаем её в проде
  cookieSecure: process.env.NODE_ENV === "production",
  // Любой OpenAI-совместимый chat completions API. По умолчанию — бесплатный тариф Gemini.
  // Ключ (LLM_API_KEY) читается лениво в services/llm.ts: без него сервер стартует, не работает только чат.
  llm: {
    baseUrl: llmBaseUrl,
    model: process.env.LLM_MODEL || "gemini-3.8-flash",
    // Запасные модели на случай «high demand» (503) или исчерпанной квоты основной.
    // Список проверен на реальном ключе: все они принимают вызовы инструментов и историю основной модели.
    // gemini-2.5-* сюда не входят: для новых ключей они уже недоступны (404).
    // LLM_FALLBACK_MODELS="" отключает запасные; у других провайдеров по умолчанию их нет.
    fallbackModels:
      process.env.LLM_FALLBACK_MODELS !== undefined
        ? process.env.LLM_FALLBACK_MODELS.split(",").map((m) => m.trim()).filter(Boolean)
        : llmBaseUrl === DEFAULT_LLM_BASE_URL
          ? ["gemini-3.5-flash", "gemini-3.6-flash", "gemini-3.1-flash-lite"]
          : [],
    retryDelayMs: Number(process.env.LLM_RETRY_DELAY_MS) || 800,
  },
};
