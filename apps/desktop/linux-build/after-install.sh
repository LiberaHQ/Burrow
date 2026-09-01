#!/bin/bash
# Granting a Linux binary a file capability (below) puts the dynamic linker
# into "secure execution mode" for it, which disables $ORIGIN-relative
# RPATH/RUNPATH resolution (a security measure — an attacker-controlled
# $ORIGIN could otherwise inject libraries into a privileged process). The
# bundled Electron binary relies on exactly that $ORIGIN mechanism to find
# its sibling libs (libffmpeg.so etc. next to the executable in /opt/Burrow),
# so without this, the app fails to launch at all once capped:
#   error while loading shared libraries: libffmpeg.so: cannot open shared
#   object file: No such file or directory
# Secure mode still honors the system-wide linker cache (ldconfig), which
# isn't attacker-controllable per-process the way $ORIGIN/LD_LIBRARY_PATH
# are — so register /opt/Burrow there instead of depending on $ORIGIN.
echo "/opt/Burrow" > /etc/ld.so.conf.d/burrow.conf
ldconfig

# Grants the packaged Electron binary raw HCI socket access so Bluetooth
# scanning works without running Burrow as root. Non-fatal if it fails
# (e.g. setcap unavailable) — the app will just need to be run with sudo.
setcap cap_net_raw+eip /opt/Burrow/burrow 2>/dev/null || true
