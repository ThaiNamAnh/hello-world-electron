import { ipcMain, BrowserWindow, dialog, app } from "electron";
import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs";
const __dirname$1 = path.dirname(fileURLToPath(import.meta.url));
process.env.APP_ROOT = path.join(__dirname$1, "..");
const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
const MAIN_DIST = path.join(process.env.APP_ROOT, "dist-electron");
const RENDERER_DIST = path.join(process.env.APP_ROOT, "dist");
process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, "public") : RENDERER_DIST;
let win;
let subWin = null;
let captureWin = null;
let pendingCaptureState = [];
function createWindow() {
  win = new BrowserWindow({
    icon: path.join(process.env.VITE_PUBLIC, "electron-vite.svg"),
    webPreferences: {
      preload: path.join(__dirname$1, "preload.mjs"),
      webviewTag: true
    }
  });
  win.maximize();
  win.webContents.on("did-finish-load", () => {
    win == null ? void 0 : win.webContents.send("main-process-message", (/* @__PURE__ */ new Date()).toLocaleString());
  });
  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
  } else {
    win.loadFile(path.join(RENDERER_DIST, "index.html"));
  }
}
ipcMain.on("open-sub-window", () => {
  if (subWin) {
    if (subWin.isMinimized()) subWin.restore();
    subWin.focus();
    return;
  }
  subWin = new BrowserWindow({
    icon: path.join(process.env.VITE_PUBLIC, "electron-vite.svg"),
    webPreferences: {
      preload: path.join(__dirname$1, "preload.mjs"),
      webviewTag: true
    }
  });
  subWin.maximize();
  if (VITE_DEV_SERVER_URL) {
    subWin.loadURL(VITE_DEV_SERVER_URL + "#sub");
  } else {
    subWin.loadFile(path.join(RENDERER_DIST, "index.html"), { hash: "sub" });
  }
  subWin.on("closed", () => {
    subWin = null;
  });
});
ipcMain.on("sync-state", (_event, state) => {
  if (subWin) {
    subWin.webContents.send("sync-state", state);
  }
});
ipcMain.on("open-capture-window", (_event, codes) => {
  pendingCaptureState = codes || [];
  if (captureWin) {
    if (captureWin.isMinimized()) captureWin.restore();
    captureWin.focus();
    captureWin.webContents.send("sync-capture-state", pendingCaptureState);
    return;
  }
  captureWin = new BrowserWindow({
    icon: path.join(process.env.VITE_PUBLIC, "electron-vite.svg"),
    webPreferences: {
      preload: path.join(__dirname$1, "preload.mjs"),
      webviewTag: true
    }
  });
  captureWin.maximize();
  if (VITE_DEV_SERVER_URL) {
    captureWin.loadURL(VITE_DEV_SERVER_URL + "#capture");
  } else {
    captureWin.loadFile(path.join(RENDERER_DIST, "index.html"), { hash: "capture" });
  }
  captureWin.on("closed", () => {
    captureWin = null;
  });
});
ipcMain.handle("get-capture-state", () => {
  return pendingCaptureState;
});
ipcMain.on("sync-capture-state", (_event, state) => {
  pendingCaptureState = state;
  if (captureWin) {
    captureWin.webContents.send("sync-capture-state", state);
  }
});
ipcMain.handle("select-save-folder", async () => {
  const result = await dialog.showOpenDialog({
    properties: ["openDirectory"],
    title: "Chọn thư mục lưu ảnh chụp màn hình"
  });
  if (result.canceled || result.filePaths.length === 0) return null;
  return result.filePaths[0];
});
ipcMain.handle("save-screenshot", async (_event, filePath, base64Data) => {
  try {
    const dir = path.dirname(filePath);
    fs.mkdirSync(dir, { recursive: true });
    const buffer = Buffer.from(base64Data, "base64");
    fs.writeFileSync(filePath, buffer);
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});
ipcMain.handle("capture-page", async (event, rect) => {
  const senderWindow = BrowserWindow.fromWebContents(event.sender);
  if (!senderWindow) return null;
  const image = rect ? await senderWindow.webContents.capturePage(rect) : await senderWindow.webContents.capturePage();
  return image.toPNG().toString("base64");
});
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
    win = null;
  }
});
app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
app.whenReady().then(createWindow);
export {
  MAIN_DIST,
  RENDERER_DIST,
  VITE_DEV_SERVER_URL
};
