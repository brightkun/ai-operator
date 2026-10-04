import { config } from "./config/env";
import createApi from "./createApi";
import { startScheduler } from "./services/scheduler.service";

const app = createApi();

app.listen(config.port, () => {
  console.log(`Server is on ${config.port}`);
  startScheduler();
});
