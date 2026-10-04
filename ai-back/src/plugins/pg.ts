import { Pool } from "pg";

export const pool = new Pool({
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 5432,
  password: process.env.DB_PASSWORD,
});

// Проверяем подключение при старте и сразу возвращаем клиента в пул,
// иначе он остаётся занятым навсегда. Ошибку логируем, а не роняем процесс.
pool
  .query("SELECT 1")
  .then(() => console.log("Connected to DB"))
  .catch((error) => console.error("DB connection failed:", error.message));
