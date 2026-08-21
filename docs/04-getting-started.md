# 4. 快速开始

## 1. 安装依赖

```bash
pnpm install
```

> 项目强制使用 pnpm，请勿使用 npm/yarn。

## 2. 启动 Web 开发服务器

```bash
pnpm run dev
```

- 开发端口读取环境变量 `DEPLOY_RUN_PORT`（主仓默认 5000）
- HMR WebSocket 走 6000 端口 `/hot/vite-hmr`
- 浏览器访问 `http://localhost:5000`

## 3. 登录系统

使用开发测试账号：

- **邮箱**：`dev_user@coze.dev`
- **密码**：`dev123456`

或：
- 任意邮箱注册（账号信息存 localStorage）
- 验证码登录：任意 6 位数字

## 4. 生产构建

```bash
pnpm run build     # vue-tsc 类型检查 + vite 构建
pnpm run preview   # 本地预览生产包
```

产物输出到 `dist/`，为纯静态文件，可部署到任意静态服务器。

## 5. 桌面端开发（素衡OS）

```bash
pnpm run electron:dev
```

该命令会：
1. 启动 Vite 开发服务器（5173 端口）
2. 等待服务就绪
3. 启动 Electron 窗口加载开发服务器
4. 自动打开 DevTools

### 桌面端打包

```bash
# Windows（在 Windows 机器上执行）
pnpm run electron:build:win

# macOS（在 macOS 机器上执行）
pnpm run electron:build:mac

# Linux
pnpm run electron:build:linux

# 当前平台自动判断
pnpm run electron:build
```

产物输出到 `release/` 目录。Windows 会生成：
- `素衡OS-1.0.0-setup.exe`（NSIS 安装包）
- `素衡OS-1.0.0-portable.exe`（便携版，免安装）

详见 [桌面端文档](./10-desktop.md)。

## 常见起步问题

### pnpm 命令找不到
```bash
npm install -g pnpm
```

### 端口被占用
开发端口由 `DEPLOY_RUN_PORT` 决定。如需修改，在 `.coze` 或启动脚本中设置环境变量。

### Electron 下载慢
配置国内镜像：
```bash
# .npmrc 或环境变量
ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/ pnpm install
```
