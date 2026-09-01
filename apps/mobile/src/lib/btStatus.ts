export type BtTone = "ok" | "warn" | "off";

export interface BtStatus {
  label: string;
  tone: BtTone;
}

/**
 * Normalizes the two independent BLE role state strings — react-native-ble-plx's
 * PascalCase central state ("Unknown", "PoweredOn", …) and BurrowPeripheral's
 * camelCase peripheral state ("unknown", "poweredOn", …) — into one
 * human-readable status, instead of surfacing raw enum values side by side
 * (e.g. "Unsupported / unknown", which means nothing to someone who isn't
 * reading the CoreBluetooth docs).
 */
export function describeBtStatus(centralState: string, peripheralState: string): BtStatus {
  const c = centralState.toLowerCase();
  const p = peripheralState.toLowerCase();

  // "Unsupported" is what the iOS Simulator always reports for both roles —
  // there's no real radio to simulate. Call that out explicitly rather than
  // leaving someone to guess why nothing works.
  if (c === "unsupported" || p === "unsupported") {
    return { label: "Bluetooth unavailable — needs a real iPhone, not the Simulator", tone: "off" };
  }
  if (c === "unauthorized" || p === "unauthorized") {
    return { label: "Bluetooth permission denied — enable it in Settings > Burrow", tone: "warn" };
  }
  if (c === "poweredoff" || p === "poweredoff") {
    return { label: "Bluetooth is turned off", tone: "warn" };
  }
  if (c === "resetting" || p === "resetting") {
    return { label: "Bluetooth resetting…", tone: "warn" };
  }
  if (c === "poweredon" && p === "poweredon") {
    return { label: "Bluetooth ready", tone: "ok" };
  }
  if (c === "poweredon" || p === "poweredon") {
    return { label: "Bluetooth partially ready", tone: "warn" };
  }
  // Neither role has resolved a real state yet (still "unknown" on both) —
  // this is normal for the first moment after launch, not an error.
  return { label: "Waiting for Bluetooth…", tone: "warn" };
}
