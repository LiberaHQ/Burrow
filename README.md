# Burrow (desktop)

Bluetooth-first chat, desktop edition. A pnpm monorepo with three apps wired together:

- **`apps/server`** — Fastify backend. Owns the real Bluetooth radio via
  [`@abandonware/noble`](https://github.com/abandonware/noble) (BLE central/client role) and
  exposes it over REST + WebSocket.
- **`apps/web`** — Next.js UI (chat/peer list). Talks to the Fastify server over HTTP and `/ws`.
- **`apps/desktop`** — Electron shell. Opens a window pointed at the Next.js dev server so the
  whole thing runs as an installable desktop app rather than "open a browser tab."
- **`apps/mobile`** — React Native iOS app (not a pnpm workspace member — see its own README) that
  speaks the same BLE protocol, and unlike the desktop app supports the peripheral/advertising
  role too, so phones can be discovered and chatted with directly. See
  [`apps/mobile/README.md`](apps/mobile/README.md).

## Requirements

- Node 20+, pnpm 10+
- macOS/Linux/Windows with a Bluetooth LE radio. On macOS you'll get a system permission prompt
  for Bluetooth the first time the server scans — allow it, or scanning will fail silently.

## Getting started

```bash
pnpm install
pnpm dev
```

`pnpm dev` runs all three apps concurrently: Fastify on `:4000`, Next.js on `:3000`, then waits
for both to be up before launching the Electron window. You can also run pieces individually with
`pnpm dev:server`, `pnpm dev:web`, `pnpm dev:desktop`.

Copy `apps/web/.env.local.example` to `apps/web/.env.local` if you need to point the UI at a
non-default server URL.

## How the Bluetooth chat protocol works

Peer discovery/chat rides on the **Nordic UART Service (NUS)** — a de facto standard GATT service
(`6e400001-b5a3-f393-e0a9-e50e24dcca9e`, RX/TX characteristics `...002`/`...003`) rather than a
bespoke one. That's deliberate: plenty of real BLE peripherals already implement it out of the box
(ESP32 UART examples, the "UART" simulator built into nRF Connect for Mobile, various BLE-UART
bridges), so you can test discovery/connect/send/receive against real hardware without writing any
firmware first.

- `POST /scan/start` / `POST /scan/stop` — toggle scanning
- `GET /peers` — current peer list + adapter state
- `POST /peers/:id/connect` / `.../disconnect`
- `POST /peers/:id/messages` `{ "text": "..." }` — send a chat message
- `GET /ws` — WebSocket stream of peer/message/scan events (the UI's only source of truth)

## Mesh protocol layer (identity, encryption, offline delivery, relay)

Sitting above the raw BLE transport (`apps/server/src/mesh/`), inspired by real
[Ratspeak](https://github.com/ratspeak/Ratspeak)/Reticulum's design but scoped down to fold into this
app rather than a full reimplementation:

- **Identity & end-to-end encryption**: each device generates a persistent NaCl keypair on first run
  (`~/.burrow/identity.json`), identified by a short hash of its public key. Right after a BLE
  connection is established, both sides exchange a `hello` envelope with their public key; every chat
  message afterward is `nacl.box`-encrypted (X25519 + XSalsa20-Poly1305) to the recipient's key, not
  sent as plaintext. Peers are addressed by this identity hash, not by BLE address — which is what
  makes offline delivery and relay below possible, since BLE addresses aren't stable across
  reconnects/relays.
- **Store-and-forward**: sending to a peer who isn't directly connected right now queues the message
  (persisted to `~/.burrow/outbox.json`, survives restarts) and auto-delivers once you reconnect —
  either directly, or because a relay hop happens to connect you both.
- **Multi-hop relay**: a simple flood relay — if an encrypted envelope arrives addressed to someone
  else, and its hop count (`ttl`, default 8) hasn't run out, it gets forwarded to your other connected
  peers as-is (still encrypted; a relay can't read it). This only works between identities that have
  *directly* handshaken with each other at some point — there's no announce/gossip propagation like
  real Reticulum, so you can't message a total stranger through the mesh, only reach someone you've
  met before but aren't currently adjacent to.

The desktop UI shows this as a "secured (`<hash>`)" tag once a peer's handshake completes, and
"queued…" on messages not yet delivered.

## Important caveat: central-only, not peer-to-peer between two desktops (yet)

`@abandonware/noble` only implements the BLE **central** (client) role. This app can scan for and
connect to any nearby peripheral advertising the UART service — but it cannot *itself* advertise
as a peripheral, so two instances of this desktop app cannot discover each other directly over
BLE today. Making that work needs a peripheral/GATT-server role (e.g. `@abandonware/bleno`), which
is effectively unmaintained and has inconsistent-to-nonexistent support across macOS/Windows/Linux
for desktop peripheral advertising.

Practical ways to test right now:

- Use a phone with **nRF Connect for Mobile** → "GATT Server" / UART simulator as the peripheral,
  and this app as the central.
- Use an ESP32 (or similar) running a standard NUS example sketch.
- Use `apps/mobile` (this repo's own iOS app), which does implement the peripheral role.
- Treat "desktop ↔ desktop" as a follow-up: either resurrect a peripheral-role library, or drop to
  a mobile companion app for the peripheral side.

## macOS: "app crashed" / NSBluetoothAlwaysUsageDescription

If you run `apps/server` from something other than a real Terminal window (an IDE's
non-interactive task runner, a CI wrapper, an automation tool, etc.), macOS may hard-crash the
Node process a moment after it starts, with a crash report saying:

> This app has crashed because it attempted to access privacy-sensitive data without a usage
> description. The app's Info.plist must contain an `NSBluetoothAlwaysUsageDescription` key...

This happens because `noble` touches CoreBluetooth on load, and macOS's privacy (TCC) system
requires the *responsible process* to declare a Bluetooth usage description in an Info.plist.
Launched from a normal Terminal.app window this isn't an issue — Terminal already carries that
declaration, so you'll just get the standard "Allow Bluetooth access?" prompt instead.

If you hit the crash anyway, `apps/server/mac-wrapper/BurrowServer.app` is a minimal app bundle
that declares the required usage strings. Run `pnpm --filter @burrow/server start:mac-app`
(builds the server, then opens the wrapper via `open` so it gets real app identity for TCC) and
point `apps/web`'s `NEXT_PUBLIC_SERVER_URL` / `apps/desktop` at it as usual — logs go to
`/tmp/burrow-server-wrapped.log`. Note the wrapper's launcher script has an absolute path to
`node` baked in for this machine; update it if you're on a different setup.

## Linux (Ubuntu) setup

No code changes are needed — `@abandonware/noble` builds a Linux/BlueZ native binding the same way
it built the macOS one here, and Electron/Next.js are already cross-platform. Native modules are
platform-specific though, so `node_modules` can't be copied over from macOS: run a fresh install on
the Ubuntu machine.

```bash
sudo apt update
sudo apt install -y build-essential python3 bluetooth bluez libbluetooth-dev libudev-dev
pnpm install
```

Linux has no macOS-style permission *prompt* for Bluetooth — instead, scanning needs raw HCI socket
access, which normally means running as root. The standard workaround is to grant the Node binary
that one capability instead of running everything as root:

```bash
sudo setcap cap_net_raw+eip "$(readlink -f "$(which node)")"
```

Re-run that after any Node version change (`setcap` is tied to that specific binary file). Then
`pnpm dev` as usual.

One known rough edge: on some newer BlueZ 5.x versions, noble's Linux scanning can be flaky or need
`bluetoothd` started with `--experimental` — if `adapterState` shows `poweredOn` but scanning never
turns up peers, that's the first thing to check (`sudo systemctl status bluetooth`, and whether
`hcitool lescan` from a plain terminal finds anything).

## Production packaging (Linux `.deb`)

`apps/desktop` runs as a split-process dev setup (separate Fastify + `next dev` + Electron) for hot
reload, but a packaged build needs everything bundled into one launchable binary. In production
mode (`app.isPackaged`), `apps/desktop/src/main.ts` instead imports `@burrow/server`'s
`buildServer()` directly into Electron's main process, serves the Next.js **static export**
(`apps/web` builds with `output: "export"`) from the same Fastify instance via `@fastify/static`,
and points the window at `http://127.0.0.1:4000/` — one process, one port, no dev servers involved.

Building the `.deb` needs a real Linux x86_64 environment — `noble`'s Bluetooth support is a native
C++ addon, and native addons can't be cross-compiled for Linux from macOS with standard tooling.
`apps/desktop/linux-build/build-deb.sh` handles this via a Docker container (works with
colima/OrbStack/Docker Desktop — whichever provides `docker`):

```bash
colima start --arch x86_64   # or have Docker Desktop/OrbStack running
./apps/desktop/linux-build/build-deb.sh
```

This produces `apps/desktop/release/Burrow-<version>-amd64.deb`. It rebuilds the native BLE
binding against Electron's own ABI (via `@electron/rebuild`, which `electron-builder` runs
automatically), so it's specifically compiled for the bundled Electron runtime, not system Node.

On the Ubuntu machine:

```bash
sudo apt install ./Burrow-<version>-amd64.deb
```

The package's `postinst` hook (`apps/desktop/linux-build/after-install.sh`) automatically grants
the installed binary (`/opt/Burrow/burrow`) raw HCI socket access via `setcap`, so Bluetooth
scanning works out of the box without running as root — no manual `setcap` step needed (that's only
for the dev-mode `pnpm dev` path in the Linux setup section above). Launch it from the applications
menu or `/opt/Burrow/burrow`.

Known rough edges:
- **pnpm workspace + electron-builder**: `asar` packaging is disabled (`"asar": false` in
  `apps/desktop/package.json`) because electron-builder's asar packager can't handle
  `@burrow/server` being a pnpm workspace symlink pointing outside `apps/desktop/`. This just
  means the app ships as plain unpacked files instead of one archive — no functional difference.
- The `usb` package (a transitive dep pulled in via `bluetooth-hci-socket`) bundles prebuilt
  binaries for every platform it supports, not just linux-x64, adding some dead weight to the
  package size. Harmless, just not minimal.
- Untested on a real Ubuntu machine end-to-end — verified by inspecting the `.deb`'s contents
  (control metadata, `postinst`, bundled native `.node` files, static web assets) from this
  session, not by actually installing and running it on Linux hardware. If something's off once
  you install it, send me the error.

## Why "Burrow"

Formerly named after (and inspired by) the real [Ratspeak](https://github.com/ratspeak/Ratspeak)
project — renamed to avoid confusion with that unrelated, much larger Rust/Reticulum-based mesh
client. "Burrow" keeps the small-local-network spirit: a private, local mesh you and nearby peers
share, discovered over Bluetooth range rather than the open internet.
