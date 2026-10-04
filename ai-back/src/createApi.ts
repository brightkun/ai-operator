import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import { config } from "./config/env";
import { errorHandler } from "./middlewares/errorHandler";
import assistantRoute from "./routes/assistant.route";
import authRoute from "./routes/auth.route";
import dataRoute from "./routes/data.route";
import integrationRoute from "./routes/integration.route";

const createApi = () => {
  const app = express();

  app.use(
    cors({
      origin: config.clientUrl,
      credentials: true,
    }),
  );
  app.use(express.json());
  app.use(cookieParser());

  app.use("/api/auth", authRoute);
  app.use("/api/integrations", integrationRoute);
  app.use("/api/assistant", assistantRoute);
  // последним: роутер данных висит на общем префиксе /api и требует авторизацию для всего внутри
  app.use("/api", dataRoute);

  app.use(errorHandler);

  return app;
};

export default createApi;
