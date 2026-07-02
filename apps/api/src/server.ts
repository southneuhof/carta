import { serve } from "@hono/node-server";
import { app } from "./app";

const port = Number(process.env.API_PORT);

if (!port) {
  console.error("API_PORT is not set");
  process.exit(1);
}

serve({
  fetch: app.fetch,
  port,
});

console.log(`Listening on port ${port}`);
