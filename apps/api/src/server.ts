import { serve } from "@hono/node-server";
import { isSourceBound } from "@southneuhof/sprindle/model";
import type { DefinedModel } from "@southneuhof/sprindle/model";
import { app } from "./app";
import { getDb } from "./db";
import { modules } from "./routes";

const port = Number(process.env.API_PORT);


if (!port) {
  console.error("API_PORT is not set");
  process.exit(1);
}

// Fail at boot when a mounted model never received a database binding
// (a module bundle missing its domain part), instead of failing per request.
getDb();
for (const bundle of modules) {
  for (const installable of bundle.models) {
    if (!("route" in installable) || !("context" in installable)) continue;
    const model = installable as DefinedModel;
    if (!isSourceBound(model.context.entity.source)) {
      console.error(`Unbound model source: ${model.name} (${model.path}). Add its domain to the module bundle.`);
      process.exit(1);
    }
  }
}

serve({
  fetch: app.fetch,
  port,
});

console.log(`Listening on port ${port}`);
