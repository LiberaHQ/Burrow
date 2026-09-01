import { loadOrCreateIdentity, type Identity } from "./identity";
import { MeshRouter } from "./router";

/**
 * Owns the single MeshRouter instance shared by both BLE roles (central and
 * peripheral) so a message/identity is handled consistently regardless of
 * which transport it arrived over. Peer ids passed into the router are
 * prefixed ("central:<deviceId>" / "peripheral:<centralId>") since the two
 * roles have separate, unrelated id namespaces; each transport module
 * registers its own prefix's send function via registerTransport, so this
 * module never has to import central.ts/peripheral.ts directly (avoiding a
 * circular import, since both of those import `mesh`).
 */
class Mesh {
  private routerPromise: Promise<MeshRouter> | null = null;
  private transports = new Map<string, (peerId: string, text: string) => Promise<void>>();

  registerTransport(prefix: string, sendRaw: (peerId: string, text: string) => Promise<void>): void {
    this.transports.set(prefix, sendRaw);
  }

  async getRouter(): Promise<MeshRouter> {
    if (!this.routerPromise) this.routerPromise = this.init();
    return this.routerPromise;
  }

  async getIdentity(): Promise<Identity> {
    return loadOrCreateIdentity();
  }

  private async init(): Promise<MeshRouter> {
    const identity = await loadOrCreateIdentity();
    const router = new MeshRouter(identity, (peerId, text) => this.dispatch(peerId, text));
    await router.ready;
    return router;
  }

  private async dispatch(peerId: string, text: string): Promise<void> {
    for (const [prefix, sendRaw] of this.transports) {
      if (peerId.startsWith(prefix)) return sendRaw(peerId, text);
    }
    throw new Error(`No transport registered for peer id: ${peerId}`);
  }
}

export const mesh = new Mesh();
