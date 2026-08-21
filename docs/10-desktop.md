# 10. 桌面端（素衡OS Electron）

## 架构

```
electron/
├── main.cjs       # 主进程：窗口管理、托盘、通知、IPC、电源事件
└── preload.cjs    # 预加载：contextBridge 安全桥接 → window.suhengOS
```

- 主进程使用 CommonJS（`.cjs`），因为 package.json 设了 `"type": "module"`
- 渲染进程就是 Vue Web 应用，通过 `window.suhengOS` 调用桌面能力
- `contextIsolation: true` + `nodeIntegration: false`，安全隔离

## 开发模式

```bash
pnpm run electron:dev
```

1. Vite 在 5173 端口启动
2. wait-on 等待服务就绪
3. Electron 加载 `http://localhost:5173`
4. 自动打开 DevTools

## 打包

### 前置准备
1. 将应用图标放入 `build/` 目录：
   - `icon.ico`（Windows，256×256，多分辨率）
   - `icon.icns`（macOS）
   - `icon.png`（Linux，512×512）
2. 确保 `pnpm run build` 能正常生成 `dist/`

### 打包命令

```bash
# Windows exe（必须在 Windows 上执行）
pnpm run electron:build:win
# 产物：
#   release/素衡OS-1.0.0-setup.exe      (NSIS 安装包)
#   release/素衡OS-1.0.0-portable.exe   (免安装便携版)

# macOS dmg（必须在 macOS 上执行）
pnpm run electron:build:mac
# 产物：release/素衡OS-1.0.0.dmg

# Linux
pnpm run electron:build:linux
# 产物：release/素衡OS-1.0.0.AppImage, .deb
```

### 跨平台打包说明
electron-builder **不能在 Linux 上打包 Windows exe**（需要 Wine 且不支持代码签名），也不能在非 macOS 上打包 dmg。推荐方案：

**方案 A：本地打包**（最简单）
- Windows 上跑 `electron:build:win`
- Mac 上跑 `electron:build:mac`

**方案 B：GitHub Actions CI 矩阵**
```yaml
# .github/workflows/build.yml
jobs:
  build:
    strategy:
      matrix:
        os: [windows-latest, macos-latest, ubuntu-latest]
    runs-on: ${{ matrix.os }}
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with: { version: 9 }
      - uses: actions/setup-node@v4
        with: { node-version: 24, cache: pnpm }
      - run: pnpm install
      - run: pnpm run electron:build
      - uses: actions/upload-artifact@v4
        with:
          name: release-${{ matrix.os }}
          path: release/
```

### NSIS 安装包配置
`package.json` 的 `build.nsis` 已配置：
- 非一键安装（`oneClick: false`），允许用户选择安装目录
- 创建桌面快捷方式 + 开始菜单快捷方式
- 卸载时不删除用户数据

## 桌面功能

### 系统托盘
- 左键点击：显示/隐藏主窗口
- 右键菜单：打开、手表悬浮窗、开机自启动、退出
- 关闭窗口时最小化到托盘而非退出

### 健康预警通知
危险级预警通过系统通知推送，点击通知跳转预警中心：
```ts
// Vue 组件中
import { useDesktop } from '@/composables/useDesktop'
const { sendAlert } = useDesktop()
sendAlert({
  title: '血压偏高预警',
  body: '父亲（68岁）收缩压 158mmHg，建议复测并关注',
  level: 'danger',
})
```

### 手表监测悬浮窗
- 托盘菜单"手表监测悬浮窗"打开
- 360×520 无边框置顶窗口
- 加载 `/health/watch?mode=floating`
- 实时查看六项指标和心电图

### 开机自启动
托盘菜单勾选，或代码控制：
```ts
const { setAutoLaunch, autoLaunch } = useDesktop()
await setAutoLaunch(true)
```

### 应用菜单
- 文件（隐藏/退出）
- 编辑（撤销/复制/粘贴）
- 视图（刷新/缩放/全屏/DevTools）
- 健康（快捷跳转预警/家人/手表）
- 帮助（关于，显示版本和运行时信息）

### 电源事件
- 系统挂起（suspend）→ 通知渲染进程暂停数据轮询
- 系统恢复（resume）→ 通知渲染进程立即同步手表数据

## 渲染进程 API（window.suhengOS）

```ts
interface SuhengOSAPI {
  getInfo(): Promise<{ version, electron, chrome, node, platform, arch, os, isPackaged }>
  setAutoLaunch(enable): Promise<boolean>
  getAutoLaunch(): Promise<boolean>
  minimize()
  maximize()
  close()
  openWatcher()
  hideWatcher()
  alert(payload: { title?, body?, level? })
  openExternal(url)
  on(channel, cb): () => void   // 监听 nav:go / system:suspend / system:resume
  isDesktop: boolean
  platform: NodeJS.Platform
}
```

## 在 Vue 中使用

```ts
import { useDesktop } from '@/composables/useDesktop'

const {
  isDesktop,      // 是否运行在桌面端
  appInfo,        // 应用版本等信息
  sendAlert,      // 系统通知
  openWatcher,    // 打开悬浮窗
  setAutoLaunch,  // 开机自启
  openExternal,   // 系统浏览器打开链接
} = useDesktop()
```

在浏览器中非桌面环境，所有方法自动降级（如通知改用 Web Notification API）。

## Vite 配置说明
- Web 部署：`base: '/'`（绝对路径）
- Electron 打包：设置 `ELECTRON_BUILD=1` 环境变量，Vite 自动切换 `base: './'`（相对路径，确保 file:// 协议下资源加载正常）

`package.json` 的 `electron:build` 脚本已自动设置该变量。
