import path from "node:path";
import { app, BrowserWindow, dialog } from "electron";

const PORT = 4000;
const DEV_WEB_URL = process.env.BURROW_WEB_URL ?? "http://localhost:3000";

function createWindow(url: string): void {
  const win = new BrowserWindow({
    width: 1100,
    height: 760,
    title: "Burrow",
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  win.loadURL(url);
}

async function startBundledServer(): Promise<string> {
  const { buildServer } = await import("@burrow/server");
  const staticDir = path.join(process.resourcesPath, "web");
  const server = await buildServer({ staticDir });
  await server.listen({ port: PORT, host: "127.0.0.1" });
  return `http://127.0.0.1:${PORT}`;
}

app.whenReady().then(async () => {
  let url: string;
  try {
    url = app.isPackaged ? await startBundledServer() : DEV_WEB_URL;
  } catch (err) {
    const message = err instanceof Error ? (err.stack ?? err.message) : String(err);
    console.error("[burrow] failed to start bundled server:", message);
    dialog.showErrorBox("Burrow failed to start", message);
    app.quit();
    return;
  }

  createWindow(url);

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow(url);
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
