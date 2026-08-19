# 13. 常见问题（FAQ）

## 开发环境

### Q: pnpm install 后 electron 二进制下载失败？
配置国内镜像：
```bash
# 在 .npmrc 中添加
ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/
```
或：
```bash
ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/ pnpm install
```

### Q: 端口 5000 被占用？
开发端口由 `DEPLOY_RUN_PORT` 环境变量控制。修改 `.coze` 或启动时指定：
```bash
DEPLOY_RUN_PORT=3000 pnpm run dev
```

### Q: HMR 不生效？
检查 6000 端口是否被占用（HMR WebSocket 端口）。云沙箱中该端口由基础设施管理。

## 类型与构建

### Q: TS2589 类型实例化过深？
通常出现在 store 中直接调用 `i18n.global.t()`。改用 `tText()` 或在组件中翻译后传入 store。

### Q: vue-tsc 报错但 vite build 能过？
`pnpm run build` 包含 `vue-tsc -b` 类型检查。请修复所有类型错误，不要跳过类型检查。

### Q: Element Plus 组件找不到？
组件通过 `unplugin-vue-components` 按需自动引入，无需手动 import。图标已全局注册，直接 `<el-icon><IconName /></el-icon>` 使用。

## 桌面端

### Q: 打包后白屏？
通常是资源路径问题。确保打包时设置了 `ELECTRON_BUILD=1`（`electron:build` 脚本已自动设置），Vite 会使用 `base: './'`。

### Q: Windows 上打包 exe 失败？
- 确保在 Windows 10/11 或 Windows Server 上执行
- 图标文件 `build/icon.ico` 必须存在且包含 256×256 分辨率
- 以管理员身份运行终端（避免文件权限问题）

### Q: macOS 打包提示签名错误？
未配置 Apple Developer 证书时，在 `package.json` 的 `build.mac` 中添加：
```json
"mac": {
  "identity": null,
  "target": ["dmg"]
}
```
`identity: null` 跳过代码签名（仅限本地测试分发）。

### Q: 桌面端通知不显示？
- Windows：检查系统"专注助手"是否关闭了通知
- macOS：系统设置 → 通知 → 允许素衡OS 通知
- Linux：需安装 `libnotify`

### Q: 关闭窗口后应用还在运行？
这是设计行为——关闭窗口最小化到托盘。通过托盘菜单"退出"或右键托盘 → 退出完全关闭。

## 功能

### Q: 如何修改测试账号密码？
测试账号在 `src/stores/auth.ts` 中硬编码。生产环境应替换为真实后端认证。

### Q: 语音播报不发声？
- 浏览器需用户先与页面交互（点击等）才允许播放音频
- 桌面端基于系统 TTS，确保系统安装了对应语言语音包
- 检查设备是否静音

### Q: 如何添加新语言？
1. 在 `i18n/locales/` 创建新语言文件
2. 在 `i18n/index.ts` 的 `messages` 注册
3. 在 `i18n/extensions.ts` 补充扩展文案
4. 在 `LanguageSwitcher.vue` 添加选项
5. 在 `useSpeech.ts` 添加语音映射
