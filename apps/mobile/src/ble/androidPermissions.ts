import { Linking, PermissionsAndroid, Platform } from "react-native";

/**
 * Android 12+ (API 31+) requires BLUETOOTH_SCAN/CONNECT/ADVERTISE to be
 * requested at runtime — unlike iOS, where CoreBluetooth shows its own
 * permission prompt automatically the first time it's touched, Android
 * expects the app to drive this explicitly before making any Bluetooth API
 * call, or those calls just throw/fail silently. Older Android versions
 * (<12) instead gate BLE scanning behind ACCESS_FINE_LOCATION.
 */
function requiredPermissions() {
  return Number(Platform.Version) >= 31
    ? [
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_ADVERTISE,
      ]
    : [PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION];
}

export type PermissionOutcome = "granted" | "denied" | "blocked";

/**
 * Requests the Bluetooth permissions this app needs, showing the system
 * dialog. Returns "blocked" if the user has denied it before in a way
 * Android now refuses to show the dialog for again ("Deny" a second time, or
 * "Don't ask again") — the only way out of that state is the Settings app,
 * which openAppSettings() below jumps straight to.
 *
 * No-ops (returns "granted") on iOS.
 */
export async function ensureAndroidBluetoothPermissions(): Promise<PermissionOutcome> {
  if (Platform.OS !== "android") return "granted";

  const permissions = requiredPermissions();
  try {
    const results = await PermissionsAndroid.requestMultiple(permissions);
    const values = permissions.map((p) => results[p]);
    if (values.every((v) => v === PermissionsAndroid.RESULTS.GRANTED)) return "granted";
    if (values.some((v) => v === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN)) return "blocked";
    return "denied";
  } catch (err) {
    console.warn("[burrow] failed to request Android Bluetooth permissions:", err);
    return "denied";
  }
}

/** Jumps to this app's page in the system Settings app — the only way for
 *  the user to grant a permission Android has stopped prompting for. */
export function openAppSettings(): void {
  Linking.openSettings();
}
