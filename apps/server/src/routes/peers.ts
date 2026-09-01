import type { FastifyInstance } from "fastify";
import { bleManager } from "../ble/scanner.js";

export function registerPeerRoutes(app: FastifyInstance): void {
  app.get("/identity", async () => bleManager.ownIdentity);

  app.get("/peers", async () => ({
    peers: bleManager.listPeers(),
    scanning: bleManager.isScanning,
    adapterState: bleManager.adapterState,
    advertising: bleManager.advertising,
    peripheralSupported: bleManager.isPeripheralSupported,
  }));

  app.post("/scan/start", async (_req, reply) => {
    try {
      await bleManager.startScan();
      return { scanning: true };
    } catch (err) {
      return reply.code(409).send({ error: (err as Error).message });
    }
  });

  app.post("/scan/stop", async () => {
    await bleManager.stopScan();
    return { scanning: false };
  });

  app.post<{ Body: { name?: string } }>("/advertise/start", async (req, reply) => {
    try {
      await bleManager.startAdvertising(req.body?.name ?? "Burrow");
      return { advertising: true };
    } catch (err) {
      return reply.code(409).send({ error: (err as Error).message });
    }
  });

  app.post("/advertise/stop", async () => {
    await bleManager.stopAdvertising();
    return { advertising: false };
  });

  app.post<{ Params: { id: string } }>("/peers/:id/connect", async (req, reply) => {
    try {
      await bleManager.connect(req.params.id);
      return { connected: true };
    } catch (err) {
      return reply.code(400).send({ error: (err as Error).message });
    }
  });

  app.post<{ Params: { id: string } }>("/peers/:id/disconnect", async (req) => {
    await bleManager.disconnect(req.params.id);
    return { connected: false };
  });
}
