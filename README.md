# 素衡OS（suheng-os）

Electron + Vue3 + TypeScript + Vite6 + Element Plus 桌面应用与三端门户。

## 仓库结构

- **根目录（当前版本，V3）**：三端门户体系（开发端 / 运营端 / 管理端）、8 语言 i18n、统一登录、跨端口数据联动
- **`suhengos/`（历史版本，V2）**：早期单体应用源码（Vue3 + Vite + Electron 双导航体系），仅作存档保留

## 当前版本功能

- **三端门户**：开发端 `dev-portal.html` / 运营端 `ops-portal.html` / 管理端 `admin-portal.html`
- **三端统一登录**：共享 auth store，任一端登录即全端登录
- **多语言 i18n**：中文 / 英文 / 日文 / 韩文 / 西班牙文 / 俄文 / 德文 / 法文
- **运营端**：接单智能体、语音播报、AI 询价机器人、1000 条订单库、电商展示、供应链
- **开发端**：API 统计、调试沙箱、SDK 下载、配额套餐、Webhooks、调用审计、告警管理
- **管理端**：系统监控、通知公告、数据备份、存储管理、平台集成、智能体配置、审计日志
- **品牌视觉**：深绿 `#1a6b5c` + 金 `#d4a853` + 米白 `#faf8f3`

## 开发

```bash
pnpm install
pnpm dev            # 主站开发
node scripts/portal.cjs dev <portal>   # 单门户开发（dev/ops/admin）
node scripts/portal.cjs build <portal> # 单门户构建
```

## 远程仓库

- Gitee：https://gitee.com/suwensz/sw
