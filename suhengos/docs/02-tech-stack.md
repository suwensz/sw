# 2. 技术栈与环境要求

## 前端技术栈

| 分类 | 技术 | 版本 | 用途 |
|------|------|------|------|
| 框架 | Vue | 3.5+ | Composition API + `<script setup>` |
| 语言 | TypeScript | 5.6+ | 类型安全 |
| 构建 | Vite | 6.x | 开发服务器 + 生产构建 |
| 状态 | Pinia | 2.x | Composition API 风格 store |
| 路由 | Vue Router | 4.x | History 模式 |
| UI | Element Plus | 2.9+ | 按需自动引入 |
| 图标 | @element-plus/icons-vue | 2.x | 全局注册 |
| 国际化 | Vue I18n | 10.x | Composition API，6 语言 |
| 图表 | ECharts + vue-echarts | 5.5 / 7.x | 体质雷达图等 |
| HTTP | axios | 1.x | 预留接口调用 |
| 包管理 | pnpm | 9+ | 唯一允许的包管理器 |

## 桌面端技术

| 技术 | 版本 | 用途 |
|------|------|------|
| Electron | 33.x | 跨平台桌面外壳 |
| electron-builder | 25.x | 打包 NSIS/dmg/AppImage |

## 环境要求

### Web 开发
- **Node.js** ≥ 20（推荐 24）
- **pnpm** ≥ 9
- 现代浏览器（Chrome/Edge/Firefox/Safari 最新版）

### 桌面打包
- **Windows 打包 exe**：Windows 10/11（或 Windows Server）
- **macOS 打包 dmg**：macOS 12+（需 Apple Developer 签名）
- **Linux 打包 AppImage/deb**：Ubuntu 20.04+

> ⚠️ Electron 跨平台打包限制：electron-builder 无法在 Linux 上生成 Windows 代码签名，也无法在非 macOS 上打包 dmg。建议在目标平台本地打包，或使用 CI 矩阵（GitHub Actions 提供三平台 runner）。

## 开发工具推荐

- VS Code + 插件：Volar、ESLint、Prettier
- Vue DevTools
- Electron DevTools（桌面开发时自动打开）
