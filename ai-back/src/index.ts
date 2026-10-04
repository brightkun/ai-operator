import { config } from "./config/env";
import createApi from "./createApi";
import { startScheduler } from "./services/scheduler.service";
import { runSecurityMigrations } from "./services/security.service";

const app = createApi();

const start = async () => {
  // существующие токены дошифровываются/хэшируются до приёма запросов
  const migrated = await runSecurityMigrations();
  if (migrated.tokensEncrypted + migrated.refreshHashed + migrated.resetCleared > 0) {
    console.log("Безопасность: обновлены ранее сохранённые данные", migrated);
  }

  app.listen(config.port, () => {
    console.log(`Server is on ${config.port}`);
    startScheduler();
  });
};

start().catch((error) => {
  console.error("Не удалось запустить сервер:", error);
  process.exit(1);
});
