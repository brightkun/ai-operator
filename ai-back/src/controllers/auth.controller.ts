// HTTP-слой: разбирает req.body/req.cookies, вызывает нужный *Service
// и формирует ответ. Вся логика и SQL — в auth.service.ts.

import { CookieOptions, Request, Response } from "express";
import { config } from "../config/env";
import {
  forgotPasswordService,
  getProfileService,
  googleLoginService,
  loginService,
  logoutService,
  refreshService,
  registerService,
  resetPasswordService,
} from "../services/auth.service";

// ts-node не подхватывает types/express/index.d.ts сам, поэтому расширение Request дублируем здесь
declare global {
  namespace Express {
    interface Request {
      userId: number;
    }
  }
}

const REFRESH_COOKIE = "refreshToken";

// httpOnly — кука недоступна из JS на фронте (защита от XSS)
// secure включается в проде (NODE_ENV=production), когда сайт работает по https
const REFRESH_COOKIE_OPTIONS: CookieOptions = {
  httpOnly: true,
  secure: config.cookieSecure,
  sameSite: "lax",
  maxAge: 30 * 24 * 60 * 60 * 1000,
};

// POST /api/auth/register — регистрация нового пользователя
export const registerController = async (req: Request, res: Response) => {
  const { name, email, password } = req.body;

  const { user, accessToken, refreshToken } = await registerService(
    name,
    email,
    password,
  );

  // refresh-токен уходит в httpOnly-куку, access-токен — в теле ответа (фронт хранит его в памяти)
  res.cookie(REFRESH_COOKIE, refreshToken, REFRESH_COOKIE_OPTIONS);
  return res.status(201).json({ user, accessToken });
};

// POST /api/auth/login — вход по email/паролю
export const loginController = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const { user, accessToken, refreshToken } = await loginService(
    email,
    password,
  );

  res.cookie(REFRESH_COOKIE, refreshToken, REFRESH_COOKIE_OPTIONS);
  return res.status(200).json({ user, accessToken });
};

// POST /api/auth/refresh — выдать новый access-токен по refresh-токену из куки
export const refreshController = async (req: Request, res: Response) => {
  const token = req.cookies[REFRESH_COOKIE];

  const { user, accessToken, refreshToken } = await refreshService(token);

  // заодно перевыпускаем и refresh-токен (ротация)
  res.cookie(REFRESH_COOKIE, refreshToken, REFRESH_COOKIE_OPTIONS);
  return res.status(200).json({ user, accessToken });
};

// POST /api/auth/logout — выход: чистим refresh-токен и в БД, и в куке
export const logoutController = async (req: Request, res: Response) => {
  const token = req.cookies[REFRESH_COOKIE];

  await logoutService(token);
  res.clearCookie(REFRESH_COOKIE, REFRESH_COOKIE_OPTIONS);
  return res.status(200).json({ message: "Вы вышли из аккаунта" });
};

// GET /api/auth/profile — данные текущего пользователя (защищён authMiddleware)

export const profileController = async (req: Request, res: Response) => {
  const user = await getProfileService(req.userId);
  return res.status(200).json({ user });
};

// POST /api/auth/google — вход/регистрация через Google (idToken с фронта)
export const googleLoginController = async (req: Request, res: Response) => {
  const { idToken } = req.body;

  const { user, accessToken, refreshToken } = await googleLoginService(idToken);

  res.cookie(REFRESH_COOKIE, refreshToken, REFRESH_COOKIE_OPTIONS);
  return res.status(200).json({ user, accessToken });
};

// POST /api/auth/forgot-password — отправить письмо со ссылкой на сброс пароля
export const forgotPasswordController = async (req: Request, res: Response) => {
  const { email } = req.body;

  await forgotPasswordService(email);

  return res
    .status(200)
    .json({
      message:
        "Если аккаунт с таким email существует, мы отправили письмо для восстановления пароля",
    });
};

// POST /api/auth/reset-password — установить новый пароль по токену из письма
export const resetPasswordController = async (req: Request, res: Response) => {
  const { token, password } = req.body;

  await resetPasswordService(token, password);

  return res.status(200).json({ message: "Пароль успешно изменён" });
};
