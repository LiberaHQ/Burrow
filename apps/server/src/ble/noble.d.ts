/**
 * Minimal hand-written types for @abandonware/noble.
 * The package ships no official types and the community @types/noble
 * package targets the old API surface, so we declare only what we use.
 */
declare module "@abandonware/noble" {
  import { EventEmitter } from "node:events";

  export interface Advertisement {
    localName?: string;
    txPowerLevel?: number;
    serviceUuids?: string[];
    manufacturerData?: Buffer;
    serviceData?: { uuid: string; data: Buffer }[];
  }

  export class Characteristic extends EventEmitter {
    uuid: string;
    name: string | null;
    type: string | null;
    properties: string[];
    writeAsync(data: Buffer, withoutResponse: boolean): Promise<void>;
    readAsync(): Promise<Buffer>;
    subscribeAsync(): Promise<void>;
    unsubscribeAsync(): Promise<void>;
    on(event: "data", listener: (data: Buffer, isNotification: boolean) => void): this;
    on(event: string, listener: (...args: unknown[]) => void): this;
  }

  export class Service {
    uuid: string;
    name: string | null;
    discoverCharacteristicsAsync(characteristicUUIDs?: string[]): Promise<Characteristic[]>;
  }

  export class Peripheral extends EventEmitter {
    id: string;
    address: string;
    addressType: string;
    connectable: boolean;
    advertisement: Advertisement;
    rssi: number;
    state: "error" | "connecting" | "connected" | "disconnecting" | "disconnected";
    connectAsync(): Promise<void>;
    disconnectAsync(): Promise<void>;
    updateRssiAsync(): Promise<number>;
    discoverServicesAsync(serviceUUIDs?: string[]): Promise<Service[]>;
    on(event: "disconnect", listener: () => void): this;
    on(event: "rssiUpdate", listener: (rssi: number) => void): this;
    on(event: string, listener: (...args: unknown[]) => void): this;
  }

  export interface Noble extends EventEmitter {
    state: "unknown" | "resetting" | "unsupported" | "unauthorized" | "poweredOff" | "poweredOn";
    startScanningAsync(serviceUUIDs?: string[], allowDuplicates?: boolean): Promise<void>;
    stopScanningAsync(): Promise<void>;
    on(event: "stateChange", listener: (state: Noble["state"]) => void): this;
    on(event: "discover", listener: (peripheral: Peripheral) => void): this;
    on(event: "scanStart", listener: () => void): this;
    on(event: "scanStop", listener: () => void): this;
    on(event: string, listener: (...args: unknown[]) => void): this;
  }

  const noble: Noble;
  export default noble;
}
