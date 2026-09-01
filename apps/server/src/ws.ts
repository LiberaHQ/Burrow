import type { FastifyInstance } from "fastify";
import type { WebSocket } from "ws";
import { bleManager } from "./ble/scanner.js";
import type { BleEvent } from "./ble/types.js";

export function registerWebSocket(app: FastifyInstance): void {
  const clients = new Set<WebSocket>();

  const broadcast = (event: BleEvent) => {
    const payload = JSON.stringify(event);
    for (const client of clients) {
      if (client.readyState === client.OPEN) client.send(payload);
    }
  };

  bleManager.on("event", broadcast);

  app.get("/ws", { websocket: true }, (socket) => {
    clients.add(socket);
    socket.send(
      JSON.stringify({
        type: "snapshot",
        peers: bleManager.listPeers(),
        scanning: bleManager.isScanning,
        adapterState: bleManager.adapterState,
        advertising: bleManager.advertising,
        peripheralSupported: bleManager.isPeripheralSupported,
      }),
    );
    socket.on("close", () => clients.delete(socket));
  });
}
