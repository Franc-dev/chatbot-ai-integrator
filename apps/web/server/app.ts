import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { ZodError } from "zod";
import { dashboard } from "./routes/dashboard";
import { mgmt } from "./routes/mgmt";
import { pub } from "./routes/public";
import { internal } from "./routes/internal";
import { openapi } from "./routes/openapi";

export const app = new Hono()
  .basePath("/api")
  .use("*", logger())
  .use(
    "/public/*",
    cors({
      origin: (origin) => origin || "*",
      allowHeaders: ["content-type", "x-publishable-key"],
      allowMethods: ["GET", "POST", "OPTIONS"],
    }),
  )
  .route("/v1", dashboard)
  .route("/mgmt/v1", mgmt)
  .route("/public/v1", pub)
  .route("/internal", internal)
  .route("/openapi", openapi)
  .onError((err, c) => {
    if (err instanceof ZodError) {
      return c.json(
        {
          error: {
            code: "invalid_body",
            message: err.issues[0]?.message ?? "Invalid request",
            details: err.issues,
          },
        },
        400,
      );
    }
    return c.json({ error: { code: "internal", message: err.message } }, 500);
  })
  .notFound((c) => c.json({ error: { code: "not_found", message: "Not found" } }, 404));

export type AppType = typeof app;
