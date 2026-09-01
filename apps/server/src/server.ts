import Fastify, { type FastifyInstance } from "fastify";
import cors from "@fastify/cors";
import websocket from "@fastify/websocket";
import { registerPeerRoutes } from "./routes/peers.js";
import { registerMessageRoutes } from "./routes/messages.js";
import { registerWebSocket } from "./ws.js";

export interface BuildServerOptions {
  logger?: boolean;
  /** Absolute path to a static site (e.g. a Next.js export) to serve at "/". */
  staticDir?: string;
}

export async function buildServer(options: BuildServerOptions = {}): Promise<FastifyInstance> {
  const app = Fastify({ logger: options.logger ?? true });

  await app.register(cors, { origin: true });
  await app.register(websocket);

  app.get("/health", async () => ({ ok: true }));

  registerPeerRoutes(app);
  registerMessageRoutes(app);
  registerWebSocket(app);

  if (options.staticDir) {
    const { default: fastifyStatic } = await import("@fastify/static");
    await app.register(fastifyStatic, { root: options.staticDir });
    app.setNotFoundHandler((req, reply) => {
      if (req.method === "GET" && !req.url.startsWith("/peers") && !req.url.startsWith("/scan")) {
        return reply.sendFile("index.html");
      }
      return reply.code(404).send({ error: "Not found" });
    });
  }

  return app;
}
