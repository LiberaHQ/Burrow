function resolveServerUrl(): string {
  if (process.env.NEXT_PUBLIC_SERVER_URL) return process.env.NEXT_PUBLIC_SERVER_URL;
  // Reach the API server at whatever host was used to load this page, so the
  // same build works from localhost, a LAN IP, or Electron without rebuilding.
  if (typeof window !== "undefined") {
    return `${window.location.protocol}//${window.location.hostname}:4000`;
  }
  return "http://localhost:4000";
}

export const SERVER_URL = resolveServerUrl();
export const WS_URL = `${SERVER_URL.replace(/^http/, "ws")}/ws`;

async function postJson(path: string, body?: unknown): Promise<void> {
  const res = await fetch(`${SERVER_URL}${path}`, {
    method: "POST",
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const payload = await res.json().catch(() => null);
    throw new Error(payload?.error ?? `Request to ${path} failed (${res.status})`);
  }
}

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${SERVER_URL}${path}`);
  if (!res.ok) throw new Error(`Request to ${path} failed (${res.status})`);
  return res.json() as Promise<T>;
}

export interface OwnIdentity {
  hash: string;
  publicKey: string;
}

export const api = {
  startScan: () => postJson("/scan/start"),
  stopScan: () => postJson("/scan/stop"),
  startAdvertising: (name: string) => postJson("/advertise/start", { name }),
  stopAdvertising: () => postJson("/advertise/stop"),
  connectPeer: (id: string) => postJson(`/peers/${encodeURIComponent(id)}/connect`),
  disconnectPeer: (id: string) => postJson(`/peers/${encodeURIComponent(id)}/disconnect`),
  sendMessage: (id: string, text: string) =>
    postJson(`/peers/${encodeURIComponent(id)}/messages`, { text }),
  getIdentity: () => getJson<OwnIdentity>("/identity"),
};
