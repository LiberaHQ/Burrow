#!/bin/bash
# Compiles the peripheral-role helper directly into its .app bundle and
# ad-hoc signs it (needed for macOS to attribute Bluetooth TCC permission to
# the bundle at all — see main.swift's top comment and peripheral.ts for why).
# No-ops on non-macOS since this feature isn't implemented anywhere else yet.
set -euo pipefail

if [ "$(uname)" != "Darwin" ]; then
  echo "Skipping peripheral helper build (not macOS)."
  exit 0
fi

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP="$DIR/../mac-wrapper/BurrowPeripheral.app"
mkdir -p "$APP/Contents/MacOS"

swiftc -O "$DIR/main.swift" -o "$APP/Contents/MacOS/BurrowPeripheral"
codesign --force --deep --sign - "$APP"
echo "Built and signed $APP"
