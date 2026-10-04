import { config } from "./config/env";
import createApi from "./createApi";

const app = createApi();

app.listen(config.port, () => {
  console.log(`Server is on ${config.port}`);
});
