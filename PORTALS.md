# 素衡OS · 三端门户

素衡OS 源码在原有「主站（用户端）」基础上，拆分出 **开发端 / 运营端 / 管理端** 三个独立入口门户。
三者共用同一份源码与依赖（Vue3 + Vite + Element Plus + Pinia），各自拥有独立路由、独立导航、可独立启动与独立构建。

## 入口总览

| 端 | 入口 HTML | 开发端口 | 生产产物 | 说明 |
|----|-----------|----------|----------|------|
| 主站（用户端） | `index.html` | 5000 | `dist/` | 原有素衡OS，中医健康 + 跨境电商 |
| 开发端 | `dev-portal.html` | 6101 | `dist/dev-portal.html` | 开发者控制台：API 文档 / 接入指南 / 应用管理 / 密钥管理 |
| 运营端 | `ops-portal.html` | 6102 | `dist/ops-portal.html` | 运营工具台：竞品 / 供应链 / 需求 / 创意 / 上架 / 物流 / 采购 / 国内电商 |
| 管理端 | `admin-portal.html` | 6103 | `dist/admin-portal.html` | 管理后台：用户 / 角色权限 / 数据统计 / 系统设置 |

## 目录结构

```
src/portals/
├── common/
│   ├── createPortal.ts        # 门户统一引导（Pinia + Router + i18n + Element Plus 中文）
│   ├── PortalLayout.vue       # 通用门户布局（侧边栏 + 顶栏 + 内容区）
│   └── portal.css             # 门户通用样式
├── dev/                       # 开发端
│   ├── main.ts / App.vue / router.ts / menu.ts
│   └── pages/                 # 总览 / API文档 / 接入指南 / 应用管理 / 密钥管理
├── ops/                       # 运营端
│   ├── main.ts / App.vue / router.ts / menu.ts
│   └── pages/DashboardPage.vue  # 运营概览（其余页面复用 src/views/ops、src/views/domestic）
└── admin/                     # 管理端
    ├── main.ts / App.vue / router.ts / menu.ts
    ├── pages/                 # 概览 / 用户 / 角色 / 统计 / 设置
    └── src/stores/admin.ts    # 管理端 Mock 数据（用户/角色/设置）
```

## 使用方式

环境要求：Node.js ≥ 18（推荐 20+），pnpm ≥ 9。

```bash
# 1. 安装依赖（在项目根目录，即含 package.json 的目录）
pnpm install

# 2. 独立启动（三个端各自独立 dev server）
pnpm dev:dev-portal       # http://localhost:6101  开发端
pnpm dev:ops-portal       # http://localhost:6102  运营端
pnpm dev:admin-portal     # http://localhost:6103  管理端

# 3. 独立构建（产物输出到 dist-portals/<端名>/）
pnpm build:dev-portal
pnpm build:ops-portal
pnpm build:admin-portal

# 4. 一次构建全部门户
pnpm build:portals

# 5. 构建整个项目（主站 + 三个门户，产物在 dist/）
pnpm build
```

> 说明：`pnpm build` 会通过 vite 多入口把三个门户一并打进 `dist/`，
> 生成的 HTML 为 `dist/dev-portal.html`、`dist/ops-portal.html`、`dist/admin-portal.html`。

## 端口规划

| 服务 | 端口 |
|------|------|
| 主站 dev server | 5000 |
| 开发端 dev server | 6101 |
| 运营端 dev server | 6102 |
| 管理端 dev server | 6103 |

如需调整，修改 `vite.portal.config.ts` 中 `PORTALS` 的 `port` 字段即可。

## 数据说明

- 三端均为**前端 Mock 数据**，无真实后端，与主站保持一致。
- 开发端「应用管理 / 密钥管理」、管理端「用户 / 设置」使用 localStorage 持久化，刷新不丢失。
- 重置数据：清除浏览器 localStorage 中 `qh_admin_users`、`qh_admin_settings`、`qh_dev_apps`、`qh_dev_keys` 键即可恢复默认。

## 自定义新页面

1. 在 `src/portals/<端>/pages/` 下新建页面组件；
2. 在对应 `router.ts` 添加路由（`meta.title` 会显示在门户顶栏）；
3. 在对应 `menu.ts` 添加菜单项（icon 使用 Element Plus 图标名，已在全局注册）。
