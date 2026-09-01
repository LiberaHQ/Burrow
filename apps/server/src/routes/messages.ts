import type { FastifyInstance } from "fastify";
import { bleManager } from "../ble/scanner.js";

interface SendBody {
  text: string;
}

export function registerMessageRoutes(app: FastifyInstance): void {
  app.post<{ Params: { id: string }; Body: SendBody }>("/peers/:id/messages", async (req, reply) => {
    const { text } = req.body ?? {};
    if (!text || typeof text !== "string") {
      return reply.code(400).send({ error: "Body must include a non-empty 'text' string" });
    }
    try {
      const message = await bleManager.sendMessage(req.params.id, text);
      return { message };
    } catch (err) {
      return reply.code(400).send({ error: (err as Error).message });
    }
  });
}
