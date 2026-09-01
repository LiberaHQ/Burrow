// react-native-ble-plx exchanges characteristic values as base64 strings
// (the RN bridge has no binary type). React Native's JS engine has no
// built-in atob/btoa/Buffer, hence this tiny standalone codec.
const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

export function bytesToBase64(bytes: Uint8Array): string {
  let result = "";
  for (let i = 0; i < bytes.length; i += 3) {
    const b0 = bytes[i];
    const b1 = i + 1 < bytes.length ? bytes[i + 1] : undefined;
    const b2 = i + 2 < bytes.length ? bytes[i + 2] : undefined;

    result += CHARS[b0 >> 2];
    result += CHARS[((b0 & 0x03) << 4) | (b1 === undefined ? 0 : b1 >> 4)];
    result += b1 === undefined ? "=" : CHARS[((b1 & 0x0f) << 2) | (b2 === undefined ? 0 : b2 >> 6)];
    result += b2 === undefined ? "=" : CHARS[b2 & 0x3f];
  }
  return result;
}

export function base64ToBytes(base64: string): Uint8Array {
  const clean = base64.replace(/=+$/, "");
  const bytes: number[] = [];
  let buffer = 0;
  let bits = 0;
  for (const char of clean) {
    const value = CHARS.indexOf(char);
    if (value === -1) continue;
    buffer = (buffer << 6) | value;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      bytes.push((buffer >> bits) & 0xff);
    }
  }
  return new Uint8Array(bytes);
}

// Hermes' TextEncoder/TextDecoder availability varies by RN version, so this
// encodes/decodes UTF-8 manually rather than depending on it.
export function utf8Encode(text: string): Uint8Array {
  const bytes: number[] = [];
  for (let i = 0; i < text.length; i++) {
    let codePoint = text.codePointAt(i)!;
    if (codePoint > 0xffff) i++; // consumed a surrogate pair

    if (codePoint < 0x80) {
      bytes.push(codePoint);
    } else if (codePoint < 0x800) {
      bytes.push(0xc0 | (codePoint >> 6), 0x80 | (codePoint & 0x3f));
    } else if (codePoint < 0x10000) {
      bytes.push(0xe0 | (codePoint >> 12), 0x80 | ((codePoint >> 6) & 0x3f), 0x80 | (codePoint & 0x3f));
    } else {
      bytes.push(
        0xf0 | (codePoint >> 18),
        0x80 | ((codePoint >> 12) & 0x3f),
        0x80 | ((codePoint >> 6) & 0x3f),
        0x80 | (codePoint & 0x3f),
      );
    }
  }
  return new Uint8Array(bytes);
}

export function utf8Decode(bytes: ArrayLike<number>): string {
  let result = "";
  let i = 0;
  while (i < bytes.length) {
    const b0 = bytes[i++];
    let codePoint: number;
    if (b0 < 0x80) {
      codePoint = b0;
    } else if (b0 < 0xe0) {
      codePoint = ((b0 & 0x1f) << 6) | (bytes[i++] & 0x3f);
    } else if (b0 < 0xf0) {
      codePoint = ((b0 & 0x0f) << 12) | ((bytes[i++] & 0x3f) << 6) | (bytes[i++] & 0x3f);
    } else {
      codePoint =
        ((b0 & 0x07) << 18) | ((bytes[i++] & 0x3f) << 12) | ((bytes[i++] & 0x3f) << 6) | (bytes[i++] & 0x3f);
    }
    result += String.fromCodePoint(codePoint);
  }
  return result;
}

export function utf8ToBase64(text: string): string {
  return bytesToBase64(utf8Encode(text));
}

export function base64ToUtf8(base64: string): string {
  return utf8Decode(base64ToBytes(base64));
}
