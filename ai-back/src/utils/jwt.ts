// Генерация и проверка JWT-токенов.
// Access-токен — короткоживущий (15 минут), им авторизуют каждый запрос через authMiddleware.
// Refresh-токен — долгоживущий (30 дней), хранится в httpOnly-куке и в БД (users.refresh_token),
// нужен только чтобы выдать новый access-токен, когда старый истёк.

import jwt from "jsonwebtoken";
import { requireEnv } from "../config/env";

const ACCESS_SECRET = requireEnv("ACCESS_SECRET");
const REFRESH_SECRET = requireEnv("REFRESH_SECRET");
const OAUTH_STATE_SECRET = requireEnv("OAUTH_STATE_SECRET");

// state-параметр для Google OAuth (integrations, не login): в нём прокидываем userId
// через редирект на Google и обратно, потому что на /callback уже нет Authorization-заголовка
export const generateOAuthState = (payload: ITokenPayload) => {
  return jwt.sign(payload, OAUTH_STATE_SECRET, { expiresIn: "10m" });
};

export const verifyOAuthState = (state: string): ITokenPayload => {
  return jwt.verify(state, OAUTH_STATE_SECRET) as ITokenPayload;
};

export interface ITokenPayload {
  userId: number;
}

// Создать access-токен (кладём только userId, без лишних данных)
export const generateAccessToken = (payload: ITokenPayload) => {
  return jwt.sign(payload, ACCESS_SECRET, { expiresIn: "15m" });
};

// Создать refresh-токен
export const generateRefreshToken = (payload: ITokenPayload) => {
  return jwt.sign(payload, REFRESH_SECRET, { expiresIn: "30d" });
};

// Проверить access-токен из заголовка Authorization; бросит ошибку, если токен невалиден/истёк
export const verifyAccessToken = (token: string): ITokenPayload => {
  return jwt.verify(token, ACCESS_SECRET) as ITokenPayload;
};

// Проверить refresh-токен из куки
export const verifyRefreshToken = (token: string): ITokenPayload => {
  return jwt.verify(token, REFRESH_SECRET) as ITokenPayload;
};
