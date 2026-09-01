# Burrow Mobile (iOS)

React Native iOS app that can chat with the desktop app (and other instances of itself) over
Bluetooth LE, using the same Nordic UART Service protocol as `apps/server`. Unlike the desktop app
(which is BLE **central**-only — see the root README), this app supports **both** BLE roles:

- **Central** (`src/ble/central.ts`, via `react-native-ble-plx`) — scan for and connect out to
  nearby UART peripherals, same as the desktop app does.
- **Peripheral** (`src/ble/peripheral.ts` + `ios/BurrowMobile/BurrowPeripheral.{h,m}`) — a
  custom native module wrapping `CBPeripheralManager`, since no maintained RN library does this
  reliably on iOS. This is what lets the desktop app (or another phone) discover *this* phone and
  connect to it — the missing piece the desktop-only setup couldn't provide on its own.

Both roles speak the same wire protocol as the desktop server: chunked 20-byte writes/notifies,
newline-delimited so multi-chunk messages reassemble correctly (`src/ble/central.ts` and
`BurrowPeripheral.m` both implement this; see `apps/server/src/ble/scanner.ts` for the desktop
side of the same framing).

On top of that, `src/mesh/` ports the same identity/encryption/store-and-forward/relay protocol as
the desktop's `apps/server/src/mesh/` (see the root README's "Mesh protocol layer" section for the
full design) — persistent NaCl identity (via AsyncStorage instead of a file), end-to-end encrypted
messages, offline queuing, and flood relay. Both BLE roles route through one shared `MeshRouter`
instance (`src/mesh/mesh.ts`), so a message is handled the same way regardless of whether it arrived
via the central or peripheral transport. **Each install generates its own independent identity** —
there's nothing device-derived or shared about it, so uninstalling/reinstalling (or clearing app
data) produces a brand new identity hash and keypair, and any peer who'd handshaken with the old one
won't recognize the new one.

The app has a bottom tab bar (Home / Messages / Peers / Identity) — the mobile equivalent of the
desktop app's left sidebar nav.

## Status: builds and runs

Xcode + CocoaPods are now set up on this machine, and the app has actually been built, installed,
and run (iOS Simulator) — not just typechecked. In the process this caught and fixed two real bugs
that no amount of static analysis would have caught:

- **Identity generation was completely broken**: `tweetnacl`'s `nacl.box.keyPair()` needs a secure
  `crypto.getRandomValues`, which Hermes doesn't provide on its own — every call failed with
  `no PRNG`, silently, forever (the promise never resolved or rejected visibly). This meant the
  entire mesh/encryption layer was non-functional on mobile from the start. Fixed by adding
  `react-native-get-random-values` and importing it as the very first line of `index.js` (must run
  before anything touches `nacl`).
- The Xcode project itself was still internally named `RatspeakMobile` (folder, `.xcodeproj`,
  target, scheme, bundle id) — a previously-disclosed gap from the Burrow rename that couldn't be
  verified without Xcode. Now fully renamed to `BurrowMobile` / `dev.burrow.mobile`, verified by an
  actual successful build.

**Still not verified**: real Bluetooth behavior. The iOS Simulator has no Bluetooth radio at all —
`centralState`/`peripheralState` correctly report "unsupported" there, and the app now surfaces that
as a plain-language status message instead of raw enum text. Scanning, advertising, connecting, and
chatting over actual BLE all still need a real iPhone to confirm.

## Requirements

- **Xcode** (not just the command-line tools) — installed. `xcode-select` must point at
  `/Applications/Xcode.app/Contents/Developer` (`sudo xcode-select -s ...` if it doesn't).
- **CocoaPods** — installed via Homebrew (`brew install cocoapods`).
- **Node 22.11+** — this app's `package.json` requires it (`engines.node`); the rest of the
  monorepo runs on Node 20. Use nvm to switch when working in `apps/mobile/`.
- A physical iPhone for real Bluetooth testing (see above).

## Setup

```bash
cd apps/mobile
nvm use 22   # or install Node 22+ another way
npm install
cd ios && pod install && cd ..
```

Open `ios/BurrowMobile.xcworkspace` (not the `.xcodeproj`) in Xcode, select your iPhone as the run
destination, and hit Run — you'll need to sign in with your Apple ID under Xcode's Signing &
Capabilities for the free provisioning profile. First launch will prompt for Bluetooth permission
(`NSBluetoothAlwaysUsageDescription` is already set in `Info.plist`).

To run on the Simulator instead (UI/logic only — no real Bluetooth, see above):

```bash
npx react-native start   # Metro, in one terminal
# in another terminal:
cd ios
xcodebuild -workspace BurrowMobile.xcworkspace -scheme BurrowMobile -configuration Debug \
  -destination 'platform=iOS Simulator,name=<some iPhone>' -derivedDataPath build
xcrun simctl install booted build/Build/Products/Debug-iphonesimulator/BurrowMobile.app
xcrun simctl launch booted dev.burrow.mobile
```

## Trying it against the desktop app

1. On the desktop: run the server (`pnpm --filter @burrow/server start:mac-app` on macOS, or
   `pnpm dev` elsewhere) and start scanning from the Burrow window.
2. On the phone: tap **Find peers** (Home) or go to the **Peers** tab and tap **Start advertising**.
3. A new peer should appear in the desktop's peer list — connect to it there, and messages sent
   from the desktop should show up on the phone (and vice versa once you tap the peer on the phone
   and send from there too).

For phone-to-phone: one phone starts advertising (Peers tab), the other starts scanning and
connects to it once it shows up.

## Known gaps

- Relay/store-and-forward only work between identities that have directly handshaken at some point
  (no announce/gossip propagation like real Reticulum) — see the root README's mesh section.
- The default Jest test (`__tests__/App.test.tsx`) fails — `react-native-ble-plx`'s `BleManager` is
  instantiated at module scope and has no native module to bind to under Jest, so it throws on
  import before the test body even runs. Pre-existing (not introduced by any of the work described
  above); fixing it needs a proper native-module mock for `react-native-ble-plx` (and friends), not
  attempted here since it doesn't block running the real app.
- Background operation is declared in `Info.plist` (`bluetooth-central`/`bluetooth-peripheral`
  background modes) but not really exercised — the app hasn't been tested backgrounded, and iOS's
  background BLE limitations (especially for peripheral/advertising) are real. Treat foreground use
  as the supported case for now.
- No reconnection/retry logic if a BLE link drops — matches the desktop app's current behavior, not
  a regression, but worth knowing.
- Real end-to-end Bluetooth (scan/advertise/connect/chat, encrypted, between two real devices) is
  still unverified — needs at least one physical iPhone, ideally two.
