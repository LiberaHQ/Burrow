import AsyncStorage from "@react-native-async-storage/async-storage";
import nacl from "tweetnacl";
import { base64ToBytes, bytesToBase64 } from "../ble/base64";

export interface Identity {
  publicKey: Uint8Array;
  secretKey: Uint8Array;
  /** Short display/routing id derived from the public key — analogous to a Reticulum destination hash. */
  hash: string;
}

const STORAGE_KEY = "burrow.identity";

/** First 8 bytes of SHA-512(publicKey), hex-encoded — a short, stable id for a peer's identity. */
export function identityHashOf(publicKey: Uint8Array): string {
  const digest = nacl.hash(publicKey);
  return bytesToHex(digest.subarray(0, 8));
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

let cached: Identity | null = null;

/** Loads the persisted device identity, generating and persisting a new one on first run. */
export async function loadOrCreateIdentity(): Promise<Identity> {
  if (cached) return cached;

  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (raw) {
    const parsed = JSON.parse(raw) as { publicKey: string; secretKey: string };
    const publicKey = base64ToBytes(parsed.publicKey);
    const secretKey = base64ToBytes(parsed.secretKey);
    cached = { publicKey, secretKey, hash: identityHashOf(publicKey) };
    return cached;
  }

  const keyPair = nacl.box.keyPair();
  await AsyncStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      publicKey: bytesToBase64(keyPair.publicKey),
      secretKey: bytesToBase64(keyPair.secretKey),
    }),
  );
  cached = { publicKey: keyPair.publicKey, secretKey: keyPair.secretKey, hash: identityHashOf(keyPair.publicKey) };
  return cached;
}
