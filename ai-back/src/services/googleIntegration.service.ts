// Подключение Gmail к аккаунту пользователя (OAuth authorization code flow) + чтение писем.
// Это НЕ "Войти через Google" (см. auth.service.ts) — там просто проверяется id_token.
// Здесь нужен полноценный access_token/refresh_token с правами на чтение почты.

import { google } from "googleapis";
import { config } from "../config/env";
import { pool } from "../plugins/pg";
import { apiErrors } from "../utils/apiErrors";
import { generateOAuthState, verifyOAuthState } from "../utils/jwt";

// Данные OAuth-клиента берутся из .env. Authorized redirect URI в Google Cloud Console
// должен совпадать с googleRedirectUri (SERVER_URL + /api/integrations/google/callback) 1-в-1.
const GOOGLE_CLIENT_ID = config.googleClientId;
const GOOGLE_CLIENT_SECRET = config.googleClientSecret;
const GOOGLE_REDIRECT_URI = config.googleRedirectUri;

// gmail.readonly достаточно, чтобы читать письма; userinfo.email — чтобы узнать, какой именно ящик подключили
const GMAIL_SCOPES = [
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/userinfo.email",
];

interface IIntegration {
  id: number;
  user_id: number;
  provider: string;
  access_token: string;
  refresh_token: string | null;
  scope: string | null;
  token_expiry: Date | null;
  google_email: string | null;
  created_at: Date;
}

const createOAuthClient = () => {
  return new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URI,
  );
};

// Шаг 1: строим ссылку на Google consent screen.
// access_type: "offline" — чтобы получить refresh_token.
// prompt: "consent" — чтобы Google отдавал refresh_token каждый раз (иначе только при первом согласии).
// userId прокидываем через state, потому что коллбэк дёргает сам Google, без нашего Authorization-заголовка.
export const getGoogleAuthUrlService = (userId: number) => {
  const state = generateOAuthState({ userId });
  const oauth2Client = createOAuthClient();

  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: GMAIL_SCOPES,
    state,
  });
};

// Шаг 2: Google редиректит сюда с ?code=...&state=....
// Меняем code на токены и сохраняем их в БД (upsert — переподключение просто обновляет запись).
export const handleGoogleCallbackService = async (
  code: string,
  state: string,
) => {
  let userId: number;

  try {
    ({ userId } = verifyOAuthState(state));
  } catch {
    throw apiErrors.badRequest("Невалидный или истёкший state");
  }

  const oauth2Client = createOAuthClient();
  const { tokens } = await oauth2Client.getToken(code);
  oauth2Client.setCredentials(tokens);

  const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client });
  const { data } = await oauth2.userinfo.get();

  await pool.query<IIntegration>(
    `INSERT INTO integrations (user_id, provider, access_token, refresh_token, scope, token_expiry, google_email)
     VALUES ($1, 'google', $2, $3, $4, $5, $6)
     ON CONFLICT (user_id, provider) DO UPDATE SET
       access_token = EXCLUDED.access_token,
       refresh_token = COALESCE(EXCLUDED.refresh_token, integrations.refresh_token),
       scope = EXCLUDED.scope,
       token_expiry = EXCLUDED.token_expiry,
       google_email = EXCLUDED.google_email
     RETURNING *`,
    [
      userId,
      tokens.access_token,
      tokens.refresh_token || null,
      tokens.scope || null,
      tokens.expiry_date ? new Date(tokens.expiry_date) : null,
      data.email || null,
    ],
  );
};

// Подключён ли Gmail у пользователя и к какому ящику
export const getIntegrationStatusService = async (userId: number) => {
  const result = await pool.query<IIntegration>(
    `SELECT * FROM integrations WHERE user_id = $1 AND provider = 'google'`,
    [userId],
  );
  const integration = result.rows[0];

  if (!integration) {
    return { connected: false as const };
  }

  return {
    connected: true as const,
    email: integration.google_email,
    scope: integration.scope,
    connectedAt: integration.created_at,
  };
};

// Отключить Gmail: отзываем токен у Google (best-effort) и удаляем запись
export const disconnectGoogleService = async (userId: number) => {
  const result = await pool.query<IIntegration>(
    `SELECT * FROM integrations WHERE user_id = $1 AND provider = 'google'`,
    [userId],
  );
  const integration = result.rows[0];

  if (!integration) {
    return;
  }

  try {
    await createOAuthClient().revokeToken(integration.access_token);
  } catch {
    // токен мог уже истечь/быть отозванным вручную в Google — это не мешает удалить запись
  }

  await pool.query(
    `DELETE FROM integrations WHERE user_id = $1 AND provider = 'google'`,
    [userId],
  );
};

// Собираем авторизованный OAuth-клиент по сохранённым токенам пользователя.
// Если Google по ходу дела сам обновит access_token — сразу сохраняем новый в БД.
const getAuthorizedClient = async (userId: number) => {
  const result = await pool.query<IIntegration>(
    `SELECT * FROM integrations WHERE user_id = $1 AND provider = 'google'`,
    [userId],
  );
  const integration = result.rows[0];

  if (!integration) {
    throw apiErrors.notFound("Gmail не подключён");
  }

  const oauth2Client = createOAuthClient();
  oauth2Client.setCredentials({
    access_token: integration.access_token,
    refresh_token: integration.refresh_token,
  });

  oauth2Client.on("tokens", (tokens) => {
    if (tokens.access_token) {
      pool
        .query(
          `UPDATE integrations SET access_token = $1 WHERE user_id = $2 AND provider = 'google'`,
          [tokens.access_token, userId],
        )
        .catch(() => {});
    }
  });

  return oauth2Client;
};

// Демонстрация того, что интеграция реально работает: последние N писем (тема/отправитель/дата/сниппет)
export const listRecentEmailsService = async (userId: number, limit = 10) => {
  const auth = await getAuthorizedClient(userId);
  const gmail = google.gmail({ version: "v1", auth });

  const list = await gmail.users.messages.list({
    userId: "me",
    maxResults: limit,
  });
  const messages = list.data.messages || [];

  const emails = await Promise.all(
    messages.map(async (message) => {
      const detail = await gmail.users.messages.get({
        userId: "me",
        id: message.id as string,
        format: "metadata",
        metadataHeaders: ["Subject", "From", "Date"],
      });

      const headers = detail.data.payload?.headers || [];
      const getHeader = (name: string) =>
        headers.find((header) => header.name === name)?.value || "";

      return {
        id: message.id,
        subject: getHeader("Subject"),
        from: getHeader("From"),
        date: getHeader("Date"),
        snippet: detail.data.snippet,
      };
    }),
  );

  return emails;
};
