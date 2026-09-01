import { NativeEventEmitter, NativeModules } from "react-native";
import { mesh } from "../mesh/mesh";

/** Peripheral-role peer ids are prefixed before being handed to the shared
 *  mesh router, since central-role deviceIds live in a separate id namespace. */
export const PERIPHERAL_PREFIX = "peripheral:";

interface BurrowPeripheralNative {
  startAdvertising(localName: string): void;
  stopAdvertising(): void;
  sendMessage(centralId: string, text: string): void;
}

const native = NativeModules.BurrowPeripheral as BurrowPeripheralNative | undefined;

// Don't let a missing/misregistered native module take down the whole app —
// this has happened in practice on Android (see BurrowPeripheralModule.kt),
// and losing chat entirely because one optional feature's native side isn't
// wired up right is a much worse failure mode than just not being able to
// advertise. Central-role scanning (react-native-ble-plx) doesn't depend on
// this module at all, so it should keep working regardless.
export const isSupported = native != null;
if (!native) {
  console.warn(
    "[burrow] BurrowPeripheral native module not found — advertising/peripheral role is disabled, but scanning/connecting out to other peers still works. " +
      "(iOS: did you run `pod install` and rebuild after adding BurrowPeripheral.m/.h? Android: check BurrowPeripheralModule/Package registration in MainApplication.kt.)",
  );
}

const emitter = native ? new NativeEventEmitter(NativeModules.BurrowPeripheral) : null;

export type PeripheralEvent =
  | { type: "stateChange"; state: string }
  | { type: "advertisingStateChange"; advertising: boolean; error?: string }
  | { type: "centralSubscribed"; centralId: string }
  | { type: "centralUnsubscribed"; centralId: string }
  | { type: "messageReceived"; centralId: string; text: string };

export function subscribeToPeripheralEvents(handler: (event: PeripheralEvent) => void): () => void {
  if (!emitter) return () => undefined;
  // `any` here is intentional: NativeEventEmitter's payload type is opaque at this boundary.
  const subs = [
    emitter.addListener("onStateChange", (e: any) => handler({ type: "stateChange", state: e.state })),
    emitter.addListener("onAdvertisingStateChange", (e: any) =>
      handler({ type: "advertisingStateChange", advertising: e.advertising, error: e.error }),
    ),
    emitter.addListener("onCentralSubscribed", (e: any) =>
      handler({ type: "centralSubscribed", centralId: e.centralId }),
    ),
    emitter.addListener("onCentralUnsubscribed", (e: any) =>
      handler({ type: "centralUnsubscribed", centralId: e.centralId }),
    ),
    emitter.addListener("onMessageReceived", (e: any) =>
      handler({ type: "messageReceived", centralId: e.centralId, text: e.text }),
    ),
  ];
  return () => subs.forEach((s) => s.remove());
}

export const peripheral = {
  startAdvertising: (localName: string) => native?.startAdvertising(localName),
  stopAdvertising: () => native?.stopAdvertising(),
  sendMessage: (centralId: string, text: string) => native?.sendMessage(centralId, text),
};

mesh.registerTransport(PERIPHERAL_PREFIX, async (prefixedPeerId, text) => {
  peripheral.sendMessage(prefixedPeerId.slice(PERIPHERAL_PREFIX.length), text);
});

// Drive the shared router from raw native events, independently of whatever
// the UI subscribes to via subscribeToPeripheralEvents above.
emitter?.addListener("onMessageReceived", (e: any) => {
  mesh
    .getRouter()
    .then((router) => router.handleIncoming(PERIPHERAL_PREFIX + e.centralId, e.text))
    .catch(() => undefined);
});
emitter?.addListener("onCentralUnsubscribed", (e: any) => {
  mesh
    .getRouter()
    .then((router) => router.handleDisconnect(PERIPHERAL_PREFIX + e.centralId))
    .catch(() => undefined);
});
