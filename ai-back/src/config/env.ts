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
};
