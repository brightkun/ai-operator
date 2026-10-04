import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import { config } from "./config/env";
import { errorHandler } from "./middlewares/errorHandler";
import { securityHeaders } from "./middlewares/securityHeaders";
import accountRoute from "./routes/account.route";
import assistantRoute from "./routes/assistant.route";
import authRoute from "./routes/auth.route";
import briefRoute from "./routes/brief.route";
import dataRoute from "./routes/data.route";
import integrationRoute from "./routes/integration.route";
import meetingsRoute from "./routes/meetings.route";
import notesRoute from "./routes/notes.route";
import metricsRoute from "./routes/metrics.route";
import reviewRoute from "./routes/review.route";
import tasksRoute from "./routes/tasks.route";

const createApi = () => {
  const app = express();

  app.disable("x-powered-by");
  // за обратным прокси (nginx, Render, Railway) IP клиента берётся из X-Forwarded-For: TRUST_PROXY=1 (число прокси)
  if (process.env.TRUST_PROXY) app.set("trust proxy", Number(process.env.TRUST_PROXY) || process.env.TRUST_PROXY);
  app.use(securityHeaders);

  app.use(
    cors({
      origin: config.clientUrl,
      credentials: true,
    }),
  );
  // 50 000 символов заметки по-русски (2–4 байта на символ) не влезают в стандартные 100 КБ
  app.use(express.json({ limit: "300kb" }));
  app.use(cookieParser());

  app.use("/api/auth", authRoute);
  app.use("/api/integrations", integrationRoute);
  app.use("/api/assistant", assistantRoute);
  app.use("/api/tasks", tasksRoute);
  app.use("/api/brief", briefRoute);
  app.use("/api/notes", notesRoute);
  app.use("/api/meetings", meetingsRoute);
  app.use("/api/review", reviewRoute);
  app.use("/api/metrics", metricsRoute);
  app.use("/api/account", accountRoute);
  // последним: роутер данных висит на общем префиксе /api и требует авторизацию для всего внутри
  app.use("/api", dataRoute);

  app.use(errorHandler);

  return app;
};

export default createApi;
