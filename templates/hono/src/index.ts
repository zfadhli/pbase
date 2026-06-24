import { serve } from "@hono/node-server";
import { createApp } from "./app";

const port = process.env.PORT ? Number(process.env.PORT) : 3000;

const app = await createApp();
serve({ fetch: app.fetch, port });
console.log(`Server running on http://localhost:${port}`);
