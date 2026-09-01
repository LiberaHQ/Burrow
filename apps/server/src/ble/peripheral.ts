import { EventEmitter } from "node:events";
import { execFile } from "node:child_process";
import fs from "node:fs";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

export type PeripheralEvent =
  | { type: "state"; state: string }
  | { type: "advertising"; advertising: boolean; error?: string }
  | { type: "subscribed"; centralId: string }
  | { type: "unsubscribed"; centralId: string }
  | { type: "message"; centralId: string; text: string };

const SOCKET_PATH = path.join(os.homedir(), ".burrow", "peripheral.sock");

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// dist/ble/peripheral.js -> apps/server/mac-wrapper/BurrowPeripheral.app
const APP_PATH = path.join(__dirname, "..", "..", "mac-wrapper", "BurrowPeripheral.app");

/**
 * Desktop's BLE *peripheral* role (advertise a GATT server other devices can
 * connect to) — the counterpart to scanner.ts's central role. Only macOS is
 * implemented so far; see the peripheral role's own doc comment in
 * ../../mac-peripheral/main.swift for the full "why a helper .app" story,
 * and README for the Linux equivalent (BlueZ GATT-over-D-Bus) not existing
 * yet.
 *
 * Talks to the helper app over a Unix socket rather than the helper's stdio
 * because the helper must be launched via `open` (LaunchServices) for
 * macOS's Bluetooth permission prompt to work at all instead of hard-
 * crashing — and `open` doesn't hand back a usable stdio pipe.
 */
export class MacPeripheral extends EventEmitter {
  private server: net.Server | null = null;
  private conn: net.Socket | null = null;
  private launching: Promise<void> | null = null;
  private wantsAdvertising = false;
  private pendingName = "Burrow";
  advertising = false;

  get isSupported(): boolean {
    return process.platform === "darwin" && fs.existsSync(APP_PATH);
  }

  async startAdvertising(name: string): Promise<void> {
    if (!this.isSupported) {
      throw new Error(
        process.platform === "darwin"
          ? "Peripheral helper app not built — see apps/server/mac-peripheral/README (if present) or run swiftc manually."
          : "Desktop peripheral/advertising is only implemented on macOS right now.",
      );
    }
    this.pendingName = name;
    this.wantsAdvertising = true;
    if (!this.conn) await this.launch();
    this.send({ cmd: "start", name });
  }

  async stopAdvertising(): Promise<void> {
    this.wantsAdvertising = false;
    this.send({ cmd: "stop" });
  }

  sendMessage(centralId: string, text: string): void {
    this.send({ cmd: "send", centralId, text });
  }

  private send(obj: Record<string, unknown>): void {
    this.conn?.write(JSON.stringify(obj) + "\n");
  }

  /** Starts (once) the Unix socket server and launches the helper .app via `open`. */
  private async launch(): Promise<void> {
    if (this.launching) return this.launching;
    this.launching = this.doLaunch();
    return this.launching;
  }

  private async doLaunch(): Promise<void> {
    fs.mkdirSync(path.dirname(SOCKET_PATH), { recursive: true });
    fs.rmSync(SOCKET_PATH, { force: true });

    await new Promise<void>((resolve, reject) => {
      const server = net.createServer((conn) => {
        this.conn = conn;
        let buffer = "";
        conn.on("data", (chunk: Buffer) => {
          buffer += chunk.toString("utf8");
          let newlineIndex: number;
          while ((newlineIndex = buffer.indexOf("\n")) >= 0) {
            const line = buffer.slice(0, newlineIndex);
            buffer = buffer.slice(newlineIndex + 1);
            if (line) this.handleLine(line);
          }
        });
        conn.on("close", () => {
          this.conn = null;
          this.launching = null;
          this.advertising = false;
          this.emit("event", { type: "advertising", advertising: false } satisfies PeripheralEvent);
        });
        conn.on("error", () => undefined); // "close" fires regardless; avoid an unhandled error crashing the process
        if (this.wantsAdvertising) this.send({ cmd: "start", name: this.pendingName });
      });
      server.once("error", reject);
      server.listen(SOCKET_PATH, () => {
        this.server = server;
        resolve();
      });
    });

    execFile("open", [APP_PATH], (err) => {
      if (err) {
        this.emit("event", {
          type: "advertising",
          advertising: false,
          error: `Failed to launch peripheral helper: ${err.message}`,
        } satisfies PeripheralEvent);
      }
    });
  }

  private handleLine(line: string): void {
    let event: PeripheralEvent;
    try {
      event = JSON.parse(line) as PeripheralEvent;
    } catch {
      return;
    }
    if (event.type === "advertising") this.advertising = event.advertising;
    this.emit("event", event);
  }

  async shutdown(): Promise<void> {
    this.conn?.destroy();
    this.server?.close();
    fs.rmSync(SOCKET_PATH, { force: true });
  }
}
