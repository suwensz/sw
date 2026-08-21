# 5. 核心模块开发

本目录包含各业务模块的开发指南。

| 模块 | 文档 | 路由 | Store |
|------|------|------|-------|
| 认证与账户 | [auth.md](./auth.md) | `/login` `/register` `/forgot-password` `/account` | `useAuthStore` |
| 智能体对话 | [chat.md](./chat.md) | `/chat` | `useChatStore` |
| 体质测评 | [assessment.md](./assessment.md) | `/assessment` | `useAppStore` |
| 健康预警 | [health-alerts.md](./health-alerts.md) | `/health/alerts` | `useHealthStore` |
| 家人管理 | [family.md](./family.md) | `/health/family` | `useHealthStore` |
| 智能手表 | [watch.md](./watch.md) | `/health/watch` | `useHealthStore` |
| 商城 | [shop.md](./shop.md) | `/shop` `/cart` `/checkout` | `useCartStore` |
| 电商运营 | [ops.md](./ops.md) | `/ops/*` | `useOpsStore` |
