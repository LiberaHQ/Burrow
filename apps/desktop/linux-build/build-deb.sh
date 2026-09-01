#!/bin/bash
# Run this on an actual Ubuntu (or other Debian-based) x64 machine — not
# macOS. It needs to run here because @abandonware/noble (Bluetooth) has
# platform-specific native code that must be compiled on the target OS.
#
# Usage: from the repo root, ./apps/desktop/linux-build/build-deb.sh
set -euo pipefail
cd "$(dirname "$0")/../../.."

echo "==> Installing workspace dependencies (this compiles noble's native BLE binding for Linux)"
pnpm install

echo "==> Building web (static export)"
pnpm --filter @burrow/web build

echo "==> Building server"
pnpm --filter @burrow/server build

echo "==> Building desktop"
pnpm --filter @burrow/desktop build

echo "==> Packaging .deb"
pnpm --filter @burrow/desktop dist:linux

echo ""
echo "Done. Find it at: apps/desktop/release/Burrow-<version>-x64.deb"
