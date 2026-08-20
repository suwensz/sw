/**
 * 素衡OS (Suheng OS) - Electron 主进程
 * 素衡OS (Suheng OS) 桌面端：融合中医健康监测与跨境电商的智能体平台
 *
 * 功能：
 * - 系统托盘常驻
 * - 健康预警桌面通知
 * - 多窗口管理（主窗口/手表实时监测悬浮窗）
 * - 开机自启动
 * - 单实例锁
 */

const {
  app,
  BrowserWindow,
  Tray,
  Menu,
  nativeImage,
  ipcMain,
  shell,
  Notification,
  powerMonitor,
} = require('electron')
const path = require('path')
const os = require('os')
const { pathToFileURL } = require('url')
const fs = require('fs')

// ====== 日志 ======
const LOG_FILE = path.join(os.tmpdir(), 'suheng-debug.log')
function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}\n`
  fs.appendFileSync(LOG_FILE, line)
}
log('=== 素衡OS 启动 ===')
log(`process.argv: ${JSON.stringify(process.argv)}`)
log(`__dirname: ${__dirname}`)
log(`app.isPackaged: ${true}`)

// ====== 配置 ======
const isDev = !app.isPackaged
const PORT = process.env.DEPLOY_RUN_PORT || '5000'
const APP_URL = isDev
  ? `http://localhost:${PORT}`
  : pathToFileURL(path.join(__dirname, '../dist/index.html')).href
log(`isDev: ${isDev}, APP_URL: ${APP_URL}`)

// ====== 多端窗口定义（客户端 / 管理端 / 运营端 / 开发端）======
// 开发态指向各端口 dev server；打包后加载 asar 内各端构建产物。
// 每端使用独立 session partition，登录态互不污染。
const PORTALS = {
  admin: {
    label: '管理端',
    title: '素衡OS · 管理端',
    port: 5100,
    distDir: '../dist-admin',
    partition: 'persist:portal-admin',
    roles: ['admin'],
    width: 1440,
    height: 900,
  },
  ops: {
    label: '运营端',
    title: '素衡OS · 运营端',
    port: 5200,
    distDir: '../dist-ops',
    partition: 'persist:portal-ops',
    roles: ['ops', 'admin'],
    width: 1440,
    height: 900,
  },
  dev: {
    label: '开发端',
    title: '素衡OS · 开发端',
    port: 5300,
    distDir: '../dist-dev',
    partition: 'persist:portal-dev',
    roles: ['dev', 'admin'],
    width: 1280,
    height: 840,
  },
}

let mainWindow = null
let tray = null
let watcherWindow = null
let isQuitting = false

// ====== 角色感知（渲染进程登录后上报，用于菜单可用性）======
let currentRole = null
const portalWindows = new Map()

// ====== 应用图标（内联 SVG → NativeImage）======
const ICON_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="14" fill="#1a6b5c"/>
  <path d="M32 14 L32 50 M20 22 L44 22 M22 30 L42 30 M24 38 L40 38 M26 46 L38 46"
        stroke="#d4a853" stroke-width="2.5" stroke-linecap="round" fill="none"/>
  <circle cx="32" cy="32" r="26" stroke="#faf8f3" stroke-width="1.5" fill="none" opacity="0.4"/>
</svg>`

function getAppIcon() {
  return nativeImage.createFromBuffer(Buffer.from(ICON_SVG))
}

// ====== 单实例锁 ======
// 虚拟/无GPU环境下禁用硬件加速，避免GPU进程崩溃
app.disableHardwareAcceleration()
app.commandLine.appendSwitch('in-process-gpu')
app.commandLine.appendSwitch('no-sandbox')

log('disableHardwareAcceleration done')

const gotLock = app.requestSingleInstanceLock()
log(`gotLock: ${gotLock}`)
if (!gotLock) {
  log('No lock, quitting')
  app.quit()
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
    }
  })

  app.whenReady().then(() => {
    log('app.whenReady resolved')
    initApp()
  }).catch((err) => {
    log(`whenReady error: ${err && err.stack ? err.stack : err}`)
  })
}

// ====== 初始化 ======
function initApp() {
  log('initApp start')
  try {
    createMainWindow()
    createTray()
    buildMenu()
    registerIpcHandlers()
    log('initApp done')
  } catch (err) {
    log(`initApp error: ${err && err.stack ? err.stack : err}`)
  }

  // 电源事件：系统挂起时通知渲染进程
  powerMonitor.on('suspend', () => {
    mainWindow?.webContents.send('system:suspend')
  })
  powerMonitor.on('resume', () => {
    mainWindow?.webContents.send('system:resume')
  })

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow()
  })
}

// ====== 主窗口 ======
function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1200,
    minHeight: 760,
    title: '素衡OS · Suheng OS',
    icon: getAppIcon(),
    backgroundColor: '#faf8f3',
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  })

  mainWindow.loadURL(APP_URL)
  log(`loadURL: ${APP_URL}`)

  mainWindow.once('ready-to-show', () => {
    log('ready-to-show fired')
    mainWindow.show()
    if (isDev) mainWindow.webContents.openDevTools({ mode: 'detach' })
  })

  mainWindow.webContents.on('did-fail-load', (_e, code, desc, url) => {
    log(`did-fail-load: code=${code} desc=${desc} url=${url}`)
  })

  mainWindow.webContents.on('render-process-gone', (_e, details) => {
    log(`render-process-gone: ${JSON.stringify(details)}`)
  })

  mainWindow.webContents.on('console-message', (_e, level, msg, line, sourceId) => {
    log(`console[${level}]: ${msg} (${sourceId}:${line})`)
  })

  // 外部链接用系统浏览器打开
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http')) {
      shell.openExternal(url)
      return { action: 'deny' }
    }
    return { action: 'allow' }
  })

  mainWindow.on('close', (e) => {
    if (!isQuitting) {
      e.preventDefault()
      mainWindow.hide()
      return false
    }
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

// ====== 手表实时监测悬浮窗 ======
function createWatcherWindow() {
  if (watcherWindow && !watcherWindow.isDestroyed()) {
    watcherWindow.focus()
    return
  }
  watcherWindow = new BrowserWindow({
    width: 360,
    height: 520,
    resizable: false,
    frame: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    transparent: true,
    icon: getAppIcon(),
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  const watchUrl = isDev
    ? `${APP_URL}/health/watch?mode=floating`
    : `${APP_URL}#/health/watch?mode=floating`
  watcherWindow.loadURL(watchUrl)
  watcherWindow.on('closed', () => {
    watcherWindow = null
  })
}

// ====== 多端窗口派发 ======
// 按登录角色打开对应工作台窗口；同端窗口已存在时聚焦复用。
function portalAllowed(key) {
  const portal = PORTALS[key]
  return !!portal && !!currentRole && portal.roles.includes(currentRole)
}

function createPortalWindow(key) {
  const portal = PORTALS[key]
  if (!portal) return

  const existing = portalWindows.get(key)
  if (existing && !existing.isDestroyed()) {
    existing.show()
    existing.focus()
    return
  }

  const targetUrl = isDev
    ? `http://localhost:${portal.port}`
    : pathToFileURL(path.join(__dirname, portal.distDir, 'index.html')).href

  log(`createPortalWindow[${key}]: ${targetUrl} (role=${currentRole})`)

  const win = new BrowserWindow({
    width: portal.width,
    height: portal.height,
    minWidth: 1024,
    minHeight: 700,
    title: portal.title,
    icon: getAppIcon(),
    backgroundColor: '#faf8f3',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      // 独立会话分区，登录态 / localStorage 与客户端隔离
      partition: portal.partition,
    },
  })

  win.loadURL(targetUrl)

  win.webContents.on('did-fail-load', (_e, code, desc, url) => {
    log(`portal[${key}] did-fail-load: code=${code} desc=${desc} url=${url}`)
  })

  // 外部链接用系统浏览器打开
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http')) {
      shell.openExternal(url)
      return { action: 'deny' }
    }
    return { action: 'allow' }
  })

  win.on('closed', () => {
    portalWindows.delete(key)
  })

  portalWindows.set(key, win)
}

// ====== 系统托盘 ======
function buildTrayMenu() {
  return Menu.buildFromTemplate([
    { label: '打开素衡OS', click: () => mainWindow?.show() },
    { label: '手表监测悬浮窗', click: createWatcherWindow },
    { type: 'separator' },
    {
      label: `管理端（admin）`,
      enabled: portalAllowed('admin'),
      click: () => createPortalWindow('admin'),
    },
    {
      label: `运营端（ops）`,
      enabled: portalAllowed('ops'),
      click: () => createPortalWindow('ops'),
    },
    {
      label: `开发端（dev）`,
      enabled: portalAllowed('dev'),
      click: () => createPortalWindow('dev'),
    },
    { type: 'separator' },
    {
      label: '开机自启动',
      type: 'checkbox',
      checked: app.getLoginItemSettings().openAtLogin,
      click: (item) => {
        app.setLoginItemSettings({ openAtLogin: item.checked })
      },
    },
    { type: 'separator' },
    {
      label: '退出',
      click: () => {
        isQuitting = true
        app.quit()
      },
    },
  ])
}

function createTray() {
  tray = new Tray(getAppIcon())
  tray.setToolTip('素衡OS · Suheng OS')
  tray.setContextMenu(buildTrayMenu())
  tray.on('click', () => {
    if (mainWindow?.isVisible()) {
      mainWindow.hide()
    } else {
      mainWindow?.show()
    }
  })
}

// ====== 应用菜单 ======
function buildMenu() {
  const template = [
    {
      label: '文件',
      submenu: [
        { label: '隐藏窗口', accelerator: 'CmdOrCtrl+H', click: () => mainWindow?.hide() },
        { type: 'separator' },
        { role: 'quit', label: '退出素衡OS' },
      ],
    },
    {
      label: '工作台',
      submenu: [
        {
          label: '管理端 · :5100',
          accelerator: 'CmdOrCtrl+Shift+A',
          enabled: portalAllowed('admin'),
          click: () => createPortalWindow('admin'),
        },
        {
          label: '运营端 · :5200',
          accelerator: 'CmdOrCtrl+Shift+O',
          enabled: portalAllowed('ops'),
          click: () => createPortalWindow('ops'),
        },
        {
          label: '开发端 · :5300',
          accelerator: 'CmdOrCtrl+Shift+D',
          enabled: portalAllowed('dev'),
          click: () => createPortalWindow('dev'),
        },
      ],
    },
    {
      label: '编辑',
      submenu: [
        { role: 'undo', label: '撤销' },
        { role: 'redo', label: '重做' },
        { type: 'separator' },
        { role: 'cut', label: '剪切' },
        { role: 'copy', label: '复制' },
        { role: 'paste', label: '粘贴' },
      ],
    },
    {
      label: '视图',
      submenu: [
        { role: 'reload', label: '刷新' },
        { role: 'toggleDevTools', label: '开发者工具' },
        { type: 'separator' },
        { role: 'resetZoom', label: '重置缩放' },
        { role: 'zoomIn', label: '放大' },
        { role: 'zoomOut', label: '缩小' },
        { type: 'separator' },
        { role: 'togglefullscreen', label: '全屏' },
      ],
    },
    {
      label: '健康',
      submenu: [
        { label: '健康预警', click: () => mainWindow?.webContents.send('nav:go', '/health/alerts') },
        { label: '家人管理', click: () => mainWindow?.webContents.send('nav:go', '/health/family') },
        { label: '智能手表', click: () => mainWindow?.webContents.send('nav:go', '/health/watch') },
      ],
    },
    {
      label: '帮助',
      submenu: [
        {
          label: '关于素衡OS',
          click: () => {
            const version = app.getVersion()
            Notification.isSupported() &&
              new Notification({
                title: '素衡OS · Suheng OS',
                body: `版本 v${version}\nElectron ${process.versions.electron}\n${os.type()} ${os.arch()}`,
                icon: getAppIcon(),
              }).show()
          },
        },
      ],
    },
  ]
  Menu.setApplicationMenu(Menu.buildFromTemplate(template))
}

// ====== IPC 通信 ======
// 角色变更：渲染进程登录 / 退出后上报，主进程刷新菜单可用性
function updateRole(role) {
  currentRole = role || null
  log(`auth:setRole → ${currentRole}`)
  buildMenu()
  if (tray) tray.setContextMenu(buildTrayMenu())
}

function registerIpcHandlers() {
  ipcMain.on('auth:setRole', (_e, role) => {
    updateRole(['user', 'admin', 'ops', 'dev'].includes(role) ? role : null)
  })

  // 渲染进程主动请求打开某端窗口（仍受角色校验约束）
  ipcMain.on('portal:open', (_e, key) => {
    if (!portalAllowed(key)) {
      log(`portal:open denied for key=${key} role=${currentRole}`)
      return
    }
    createPortalWindow(key)
  })

  ipcMain.handle('app:getInfo', () => ({
    version: app.getVersion(),
    electron: process.versions.electron,
    chrome: process.versions.chrome,
    node: process.versions.node,
    platform: process.platform,
    arch: os.arch(),
    os: os.release(),
    isPackaged: app.isPackaged,
  }))

  ipcMain.handle('app:setAutoLaunch', (_e, enable) => {
    app.setLoginItemSettings({ openAtLogin: !!enable })
    return app.getLoginItemSettings().openAtLogin
  })

  ipcMain.handle('app:getAutoLaunch', () => app.getLoginItemSettings().openAtLogin)

  ipcMain.on('app:minimize', () => mainWindow?.minimize())
  ipcMain.on('app:maximize', () => {
    if (!mainWindow) return
    mainWindow.isMaximized() ? mainWindow.unmaximize() : mainWindow.maximize()
  })
  ipcMain.on('app:close', () => mainWindow?.close())
  ipcMain.on('app:hideWatcher', () => watcherWindow?.close())

  // 健康预警桌面通知
  ipcMain.on('health:alert', (_e, payload) => {
    if (!Notification.isSupported()) return
    const { title, body, level } = payload
    const notif = new Notification({
      title: `[素衡健康] ${title || '健康预警'}`,
      body: body || '',
      icon: getAppIcon(),
      urgency: level === 'danger' ? 'critical' : 'normal',
      silent: false,
    })
    notif.on('click', () => {
      mainWindow?.show()
      mainWindow?.webContents.send('nav:go', '/health/alerts')
    })
    notif.show()
  })

  // 打开手表悬浮窗
  ipcMain.on('watch:openWatcher', createWatcherWindow)

  // 外部链接
  ipcMain.on('shell:openExternal', (_e, url) => {
    if (typeof url === 'string' && url.startsWith('http')) shell.openExternal(url)
  })
}

// ====== 生命周期 ======
app.on('window-all-closed', (e) => {
  e.preventDefault()
  // 最小化到托盘，不退出
})

app.on('before-quit', () => {
  isQuitting = true
  log('before-quit')
})

process.on('uncaughtException', (err) => {
  log(`uncaughtException: ${err && err.stack ? err.stack : err}`)
})

app.on('gpu-process-crashed', (event) => {
  log(`gpu-process-crashed: ${JSON.stringify(event)}`)
})

app.on('child-process-gone', (event, details) => {
  log(`child-process-gone: ${JSON.stringify(details)}`)
})
