// Отправка письма для восстановления пароля через nodemailer (SMTP).

import nodemailer from "nodemailer";
import { config, requireEnv } from "../config/env";

// Транспорт создаём при первой отправке: SMTP_USER/SMTP_PASS нужны только здесь.
// Для Gmail нужен пароль приложения, а не обычный пароль.
const createTransporter = () =>
  nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
      user: requireEnv("SMTP_USER"),
      pass: requireEnv("SMTP_PASS"),
    },
  });

// Формирует ссылку вида CLIENT_URL/reset-password?token=... и отправляет письмо
export const sendResetPasswordEmail = async (
  to: string,
  resetToken: string,
) => {
  const resetUrl = `${config.clientUrl}/reset-password?token=${resetToken}`;

  await createTransporter().sendMail({
    from: requireEnv("SMTP_USER"),
    to,
    subject: "Восстановление пароля",
    html: `<p>Для восстановления пароля перейдите по ссылке:</p><p><a href="${resetUrl}">${resetUrl}</a></p><p>Ссылка действительна 1 час.</p>`,
  });
};
