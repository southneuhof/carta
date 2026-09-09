import { serve } from "@hono/node-server";
import { assertRouteEntitiesBound, bindRouteEntities } from "@southneuhof/sprindle/hono";
import { app, routeManifest } from "./app";
import { getDb, getDomainSchema } from "./db";

const port = Number(process.env.API_PORT);


if (!port) {
  console.error("API_PORT is not set");
  process.exit(1);
}

getDb();
bindRouteEntities(routeManifest, getDomainSchema().entities);
assertRouteEntitiesBound(routeManifest);

serve({
  fetch: app.fetch,
  port,
});

console.log(`Listening on port ${port}`);
