import { app, BrowserWindow, ipcMain, dialog } from 'electron'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import fs from 'node:fs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

process.env.APP_ROOT = path.join(__dirname, '..')

export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, 'public') : RENDERER_DIST

let win: BrowserWindow | null
let subWin: BrowserWindow | null = null
let captureWin: BrowserWindow | null = null
let pendingCaptureState: string[] = []

function createWindow() {
  win = new BrowserWindow({
    icon: path.join(process.env.VITE_PUBLIC, 'electron-vite.svg'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
      webviewTag: true,
    },
  })

  // Maximize the window for more screen space
  win.maximize()

  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', (new Date).toLocaleString())
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
  } else {
    win.loadFile(path.join(RENDERER_DIST, 'index.html'))
  }
}

// ── IPC: Open Secondary Window ──
ipcMain.on('open-sub-window', () => {
  if (subWin) {
    if (subWin.isMinimized()) subWin.restore()
    subWin.focus()
    return
  }

  subWin = new BrowserWindow({
    icon: path.join(process.env.VITE_PUBLIC, 'electron-vite.svg'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
      webviewTag: true,
    },
  })

  // Start maxmimized layout to utilize secondary monitor logic naturally 
  subWin.maximize()

  if (VITE_DEV_SERVER_URL) {
    subWin.loadURL(VITE_DEV_SERVER_URL + '#sub')
  } else {
    subWin.loadFile(path.join(RENDERER_DIST, 'index.html'), { hash: 'sub' })
  }

  subWin.on('closed', () => {
    subWin = null
  })
})

// ── IPC: Sync App State to Sub Window ──
ipcMain.on('sync-state', (_event, state) => {
  if (subWin) {
    subWin.webContents.send('sync-state', state)
  }
})

// ── IPC: Open Capture Window ──
ipcMain.on('open-capture-window', (_event, codes: string[]) => {
  pendingCaptureState = codes || []

  if (captureWin) {
    if (captureWin.isMinimized()) captureWin.restore()
    captureWin.focus()
    // Re-send state in case codes changed
    captureWin.webContents.send('sync-capture-state', pendingCaptureState)
    return
  }

  captureWin = new BrowserWindow({
    icon: path.join(process.env.VITE_PUBLIC, 'electron-vite.svg'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
      webviewTag: true,
    },
  })

  captureWin.maximize()

  if (VITE_DEV_SERVER_URL) {
    captureWin.loadURL(VITE_DEV_SERVER_URL + '#capture')
  } else {
    captureWin.loadFile(path.join(RENDERER_DIST, 'index.html'), { hash: 'capture' })
  }

  captureWin.on('closed', () => {
    captureWin = null
  })
})

// ── IPC: Get Capture State (invoked by capture window on load) ──
ipcMain.handle('get-capture-state', () => {
  return pendingCaptureState
})

// ── IPC: Sync Capture State (from main window to capture window) ──
ipcMain.on('sync-capture-state', (_event, state: string[]) => {
  pendingCaptureState = state
  if (captureWin) {
    captureWin.webContents.send('sync-capture-state', state)
  }
})

// ── IPC: Select folder to save screenshots ──
ipcMain.handle('select-save-folder', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory'],
    title: 'Chọn thư mục lưu ảnh chụp màn hình',
  })
  if (result.canceled || result.filePaths.length === 0) return null
  return result.filePaths[0]
})

// ── IPC: Save screenshot PNG to disk ──
ipcMain.handle('save-screenshot', async (_event, filePath: string, base64Data: string) => {
  try {
    const dir = path.dirname(filePath)
    fs.mkdirSync(dir, { recursive: true })
    const buffer = Buffer.from(base64Data, 'base64')
    fs.writeFileSync(filePath, buffer)
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
})

// ── IPC: Capture the BrowserWindow content area ──
// Tự động detect window nào gửi request để capture đúng window
ipcMain.handle('capture-page', async (event, rect?: { x: number, y: number, width: number, height: number }) => {
  const senderWindow = BrowserWindow.fromWebContents(event.sender)
  if (!senderWindow) return null
  const image = rect
    ? await senderWindow.webContents.capturePage(rect)
    : await senderWindow.webContents.capturePage()
  return image.toPNG().toString('base64')
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
    win = null
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

app.whenReady().then(createWindow)
