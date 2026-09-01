#!/bin/bash
# Cleans up the linker cache entry added by after-install.sh.
rm -f /etc/ld.so.conf.d/burrow.conf
ldconfig
