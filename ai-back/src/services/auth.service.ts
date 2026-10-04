// Вся бизнес-логика авторизации и прямые запросы к БД через pool.query.
// Контроллеры только вызывают эти функции и формируют ответ — никакого SQL в контроллерах.

import bcrypt from "bcryptjs";
import crypto from "crypto";
import { google } from "googleapis";
import { config } from "../config/env";
import { pool } from "../plugins/pg";
import { apiErrors } from "../utils/apiErrors";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../utils/jwt";
import { sendResetPasswordEmail } from "../utils/mailer";
import { hashToken } from "../utils/secrets";

// Форма строки таблицы users (см. sql/users.sql)
interface IUser {
  id: number;
  name: string;
  email: string;
  password: string | null; // null у пользователей, которые вошли только через Google
  google_id: string | null;
  refresh_token: string | null; // текущий активный refresh-токен пользователя
  reset_token: string | null; // временный токен для восстановления пароля
  reset_token_expires: Date | null;
  created_at: Date;
}

const GOOGLE_CLIENT_ID = config.googleClientId;

const googleClient = new google.auth.OAuth2(GOOGLE_CLIENT_ID);

// Убираем служебные поля (пароль, токены) перед тем как отдать пользователя наружу
const toProfile = (user: IUser) => ({
  id: user.id,
  name: user.name,
  email: user.email,
});

// Общая логика выдачи пары токенов: генерируем access+refresh
// и сразу сохраняем refresh в БД, чтобы потом можно было проверить/инвалидировать его
const issueTokens = async (userId: number) => {
  const accessToken = generateAccessToken({ userId });
  const refreshToken = generateRefreshToken({ userId });

  // в БД лежит только хэш: утечка таблицы не даёт готовых токенов сессий
  await pool.query(`UPDATE users SET refresh_token = $1 WHERE id = $2`, [
    hashToken(refreshToken),
    userId,
  ]);

  return { accessToken, refreshToken };
};

// Регистрация: проверяем что email свободен, хэшируем пароль, создаём пользователя, выдаём токены
export const registerService = async (
  name: string,
  email: string,
  password: string,
) => {
  const existing = await pool.query<IUser>(
    `SELECT id FROM users WHERE email = $1`,
    [email],
  );

  if (existing.rows.length) {
    throw apiErrors.conflict("Пользователь с таким email уже существует");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const result = await pool.query<IUser>(
    `INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING *`,
    [name, email, hashedPassword],
  );

  const user = result.rows[0];

  if (!user) {
    throw apiErrors.badRequest("Не удалось создать пользователя");
  }

  const { accessToken, refreshToken } = await issueTokens(user.id);

  return { user: toProfile(user), accessToken, refreshToken };
};

// Логин по email/паролю: сверяем хэш через bcrypt.compare, выдаём токены
export const loginService = async (email: string, password: string) => {
  const result = await pool.query<IUser>(
    `SELECT * FROM users WHERE email = $1`,
    [email],
  );
  const user = result.rows[0];

  // намеренно одна и та же ошибка и когда юзера нет, и когда пароль не совпал —
  // чтобы не палить существование email
  if (!user || !user.password) {
    throw apiErrors.unauthorized("Неверный email или пароль");
  }

  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    throw apiErrors.unauthorized("Неверный email или пароль");
  }

  const { accessToken, refreshToken } = await issueTokens(user.id);

  return { user: toProfile(user), accessToken, refreshToken };
};

// Обновление токенов: клиент присылает refresh-токен из куки,
// мы проверяем его подпись И сверяем с тем, что сохранено в БД (это позволяет
// "отозвать" все токены пользователя одним UPDATE, например при подозрительной активности)
export const refreshService = async (token: string | undefined) => {
  if (!token) {
    throw apiErrors.unauthorized("Refresh токен отсутствует");
  }

  let payload;

  try {
    payload = verifyRefreshToken(token);
  } catch {
    throw apiErrors.unauthorized("Невалидный refresh токен");
  }

  const result = await pool.query<IUser>(
    `SELECT * FROM users WHERE id = $1 AND refresh_token = $2`,
    [payload.userId, hashToken(token)],
  );
  const user = result.rows[0];

  // токен подписан верно, но в БД уже не совпадает — значит был разлогинен/токен заменён
  if (!user) {
    throw apiErrors.unauthorized("Refresh токен недействителен");
  }

  const { accessToken, refreshToken } = await issueTokens(user.id);

  return { user: toProfile(user), accessToken, refreshToken };
};

// Логаут: затираем refresh_token в БД, чтобы старый refresh-токен больше не работал.
// Если токена нет/он невалиден — просто молча выходим (тут нечего инвалидировать)
export const logoutService = async (token: string | undefined) => {
  if (!token) {
    return;
  }

  try {
    const payload = verifyRefreshToken(token);
    await pool.query(`UPDATE users SET refresh_token = NULL WHERE id = $1`, [
      payload.userId,
    ]);
  } catch {
    return;
  }
};

// Профиль текущего пользователя (userId кладёт authMiddleware после проверки access-токена)
export const getProfileService = async (userId: number) => {
  const result = await pool.query<IUser>(`SELECT * FROM users WHERE id = $1`, [
    userId,
  ]);
  const user = result.rows[0];

  if (!user) {
    throw apiErrors.notFound("Пользователь не найден");
  }

  return toProfile(user);
};

// Вход через Google: фронтенд присылает idToken, полученный от Google Identity Services.
// Мы проверяем его подлинность через googleapis, затем ищем/создаём пользователя по google_id/email
export const googleLoginService = async (idToken: string) => {
  if (!idToken) {
    throw apiErrors.badRequest("Google токен обязателен");
  }

  // verifyIdToken сам проверит подпись, срок жизни и audience (наш GOOGLE_CLIENT_ID)
  const ticket = await googleClient.verifyIdToken({
    idToken,
    audience: GOOGLE_CLIENT_ID,
  });

  const payload = ticket.getPayload();

  if (!payload || !payload.email) {
    throw apiErrors.badRequest("Невалидный Google токен");
  }

  // без подтверждённого email нельзя привязывать Google к существующему аккаунту по адресу —
  // иначе можно захватить чужой аккаунт, указав чужой email
  if (!payload.email_verified) {
    throw apiErrors.badRequest("Email в Google-аккаунте не подтверждён");
  }

  const googleId = payload.sub;
  const email = payload.email;
  const name = payload.name || email;

  // ищем либо по google_id (уже логинился через Google), либо по email
  // (обычная регистрация, теперь привязываем Google к этому же аккаунту)
  const existing = await pool.query<IUser>(
    `SELECT * FROM users WHERE google_id = $1 OR email = $2`,
    [googleId, email],
  );

  let user = existing.rows[0];

  if (!user) {
    // такого пользователя ещё не было — создаём нового, пароль ему не нужен
    const inserted = await pool.query<IUser>(
      `INSERT INTO users (name, email, google_id) VALUES ($1, $2, $3) RETURNING *`,
      [name, email, googleId],
    );
    user = inserted.rows[0];
  } else if (!user.google_id) {
    // пользователь уже был зарегистрирован по email/паролю — привязываем к нему google_id
    const updated = await pool.query<IUser>(
      `UPDATE users SET google_id = $1 WHERE id = $2 RETURNING *`,
      [googleId, user.id],
    );
    user = updated.rows[0];
  }

  if (!user) {
    throw apiErrors.badRequest("Не удалось авторизоваться через Google");
  }

  const { accessToken, refreshToken } = await issueTokens(user.id);

  return { user: toProfile(user), accessToken, refreshToken };
};

// Шаг 1 восстановления пароля: генерируем случайный токен, сохраняем его с TTL 1 час,
// отправляем на почту ссылку вида CLIENT_URL/reset-password?token=...
export const forgotPasswordService = async (email: string) => {
  const result = await pool.query<IUser>(
    `SELECT * FROM users WHERE email = $1`,
    [email],
  );
  const user = result.rows[0];

  // если пользователя нет — молча выходим: ответ одинаковый в обоих случаях,
  // чтобы нельзя было перебором выяснить, какие email зарегистрированы
  if (!user) {
    return;
  }

  const resetToken = crypto.randomBytes(32).toString("hex");
  const resetTokenExpires = new Date(Date.now() + 60 * 60 * 1000);

  await pool.query(
    `UPDATE users SET reset_token = $1, reset_token_expires = $2 WHERE id = $3`,
    [hashToken(resetToken), resetTokenExpires, user.id],
  );

  // на почту уходит сам токен, в БД остаётся только его хэш
  await sendResetPasswordEmail(user.email, resetToken);
};

// Шаг 2 восстановления пароля: пользователь переходит по ссылке из письма и вводит новый пароль.
// Проверяем что токен существует и ещё не истёк (reset_token_expires > now()),
// ставим новый пароль и сбрасываем токен, чтобы им нельзя было воспользоваться повторно
export const resetPasswordService = async (
  token: string,
  newPassword: string,
) => {
  const result = await pool.query<IUser>(
    `SELECT * FROM users WHERE reset_token = $1 AND reset_token_expires > now()`,
    [hashToken(token)],
  );
  const user = result.rows[0];

  if (!user) {
    throw apiErrors.badRequest(
      "Ссылка для восстановления пароля недействительна или истекла",
    );
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  await pool.query(
    // новый пароль — старые сессии больше не действуют
    `UPDATE users SET password = $1, reset_token = NULL, reset_token_expires = NULL, refresh_token = NULL WHERE id = $2`,
    [hashedPassword, user.id],
  );
};
