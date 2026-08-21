# 素衡OS — 开发文档

> 融合中医健康管理与跨境电商的智能体平台。Web + 桌面（Electron）双端。

---

## 目录

1. [项目概览](./01-overview.md)
2. [技术栈与环境要求](./02-tech-stack.md)
3. [目录结构](./03-directory.md)
4. [快速开始](./04-getting-started.md)
5. [核心模块开发](./05-modules/)
   - [认证与账户](./05-modules/auth.md)
   - [中医智能体对话](./05-modules/chat.md)
   - [体质测评](./05-modules/assessment.md)
   - [健康预警引擎](./05-modules/health-alerts.md)
   - [家人管理](./05-modules/family.md)
   - [智能手表监测](./05-modules/watch.md)
   - [跨境电商商城](./05-modules/shop.md)
   - [电商运营工具](./05-modules/ops.md)
6. [国际化（6 语言）](./06-i18n.md)
7. [状态管理（Pinia）](./07-state.md)
8. [路由体系](./08-routing.md)
9. [Mock 数据规范](./09-mock.md)
10. [桌面端（素衡OS Electron）](./10-desktop.md)
11. [构建与部署](./11-deploy.md)
12. [设计规范](./12-design.md)
13. [常见问题（FAQ）](./13-faq.md)

---

## 快速入口

| 场景 | 命令 |
|------|------|
| 安装依赖 | `pnpm install` |
| Web 开发 | `pnpm run dev` |
| Web 构建 | `pnpm run build` |
| 桌面开发 | `pnpm run electron:dev` |
| 打包 Windows exe | `pnpm run electron:build:win` |
| 打包 macOS | `pnpm run electron:build:mac` |
| 打包 Linux | `pnpm run electron:build:linux` |

## 测试账号

- 邮箱：`dev_user@coze.dev`
- 密码：`dev123456`
- 验证码：任意 6 位数字

## 技术支持

- 设计规范：见仓库根目录 `DESIGN.md`
- Agent 指引：见仓库根目录 `AGENTS.md`
