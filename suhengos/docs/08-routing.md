# 8. 路由体系

## 配置文件
`src/router/index.ts`

## 路由表

### 公开路由
| 路径 | 组件 | 说明 |
|------|------|------|
| `/` | HomePage | 首页/仪表盘 |
| `/login` | LoginPage | 登录 |
| `/register` | RegisterPage | 注册 |
| `/forgot-password` | ForgotPasswordPage | 忘记密码 |
| `/shop` | ProductListPage | 商品列表 |
| `/shop/:id` | ProductDetailPage | 商品详情 |
| `/:pathMatch(.*)*` | NotFoundPage | 404 |

### 需要登录（`requiresAuth: true`）
| 路径 | 组件 | 模块 |
|------|------|------|
| `/chat` | ChatPage | 中医智能体 |
| `/assessment` | AssessmentPage | 体质测评 |
| `/account` | AccountPage | 个人中心 |
| `/cart` | CartPage | 购物车 |
| `/checkout` | CheckoutPage | 结算 |
| `/health/alerts` | AlertsPage | 健康预警 |
| `/health/family` | FamilyPage | 家人管理 |
| `/health/watch` | WatchPage | 智能手表 |
| `/ops/competitor` | CompetitorPage | 竞品分析 |
| `/ops/supply` | SupplyPage | 供应链 |
| `/ops/demand` | DemandPage | 市场需求 |
| `/ops/creative` | CreativePage | 创意工坊 |
| `/ops/listing` | ListingPage | 自动上架 |

## 路由 Meta
```ts
{
  path: '/health/alerts',
  component: AlertsPage,
  meta: {
    requiresAuth: true,
    title: '健康预警',           // 文档标题
    module: 'health',          // 导航分组：'health' | 'ecom' | undefined
  },
}
```

- `module` 用于顶部双导航栏高亮分组
- `requiresAuth` 触发登录守卫

## 导航守卫
```ts
router.beforeEach((to) => {
  const auth = useAuthStore()
  if (to.meta.requiresAuth && !auth.isLoggedIn) {
    return { path: '/login', query: { redirect: to.fullPath } }
  }
})
```

## 双导航分组
- **健康（health）**：/chat, /assessment, /health/*
- **电商（ecom）**：/shop, /cart, /checkout, /ops/*

AppNavbar 根据 `route.meta.module` 决定高亮左侧还是右侧导航。

## 桌面端导航
桌面端通过 IPC 事件 `nav:go` 实现托盘菜单跳转：
```ts
// 主进程
mainWindow.webContents.send('nav:go', '/health/alerts')

// 渲染进程（useDesktop composable）
onNavigate((path) => router.push(path))
```
