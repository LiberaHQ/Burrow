FROM node:20-bookworm

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential python3 pkg-config git \
    bluetooth bluez libbluetooth-dev libudev-dev \
    libgtk-3-0 libnss3 libxss1 libasound2 libnotify4 libnspr4 \
    fakeroot dpkg-dev \
    && rm -rf /var/lib/apt/lists/*

RUN corepack enable && corepack prepare pnpm@10.33.1 --activate

WORKDIR /work
