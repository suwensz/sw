# 3. 目录结构

```
tcm-ecommerce-agent/                  # 仓库根目录
├── .coze                             # Coze CLI 构建/运行配置
├── package.json                      # 依赖与脚本（含 electron-builder 配置）
├── vite.config.ts                    # Vite 配置（Electron 构建自动切相对路径）
├── tsconfig.json                     # TS 配置
├── index.html                        # HTML 入口
├── AGENTS.md                         # AI Agent 开发指引
├── DESIGN.md                         # 设计规范
├── docs/                             # 📖 开发文档（本目录）
│
├── electron/                         # 🖥️ 素衡OS 桌面端
│   ├── main.cjs                      # Electron 主进程（窗口/托盘/通知/IPC）
│   └── preload.cjs                   # 预加载脚本（contextBridge 安全桥接）
│
├── build/                            # 桌面打包资源（图标）
│   ├── icon.ico                      # Windows 图标（256×256）
│   ├── icon.icns                     # macOS 图标
│   └── icon.png                      # Linux 图标（512×512）
│
├── release/                          # 打包产物（gitignore）
│   ├── 素衡OS-1.0.0-setup.exe        # Windows 安装包
│   ├── 素衡OS-1.0.0-portable.exe     # Windows 便携版
│   ├── 素衡OS-1.0.0.dmg              # macOS 镜像
│   └── 素衡OS-1.0.0.AppImage         # Linux
│
├── public/                           # 静态资源（favicon 等）
└── src/                              # 🌐 Web 应用源码
    ├── main.ts                       # 应用入口（注册 Element Plus/i18n/Pinia/Router）
    ├── App.vue                       # 根组件
    ├── env.d.ts                      # Vite 环境类型
    ├── electron.d.ts                 # window.suhengOS 类型声明
    │
    ├── assets/                       # 图片、字体等
    ├── styles/
    │   └── index.css                 # 全局样式 + Design Tokens（CSS 变量）
    │
    ├── components/                   # 通用组件
    │   ├── AppNavbar.vue             # 顶部双导航栏（健康/电商）
    │   ├── AppFooter.vue             # 页脚
    │   ├── LanguageSwitcher.vue      # 6 语言切换
    │   ├── ProductCard.vue           # 商品卡片
    │   └── EcgChart.vue              # 心电图 SVG 波形
    │
    ├── composables/                  # 组合式函数
    │   ├── useSpeech.ts              # 语音播报（Web Speech API）
    │   └── useDesktop.ts             # 桌面端能力桥接（通知/悬浮窗/自启）
    │
    ├── layouts/
    │   ├── AuthLayout.vue            # 登录/注册布局（左右分栏）
    │   └── MainLayout.vue            # 主布局（导航+内容+页脚）
    │
    ├── router/
    │   └── index.ts                  # 路由配置 + 登录守卫
    │
    ├── stores/                       # Pinia（Composition 风格）
    │   ├── auth.ts                   # 用户/登录注册/BMI
    │   ├── cart.ts                   # 购物车
    │   ├── chat.ts                   # 智能体会话
    │   ├── app.ts                    # 语言/币种/测评结果
    │   ├── health.ts                 # 家人/手表/预警
    │   └── ops.ts                    # 竞品/供应链/需求/创意/上架
    │
    ├── i18n/
    │   ├── index.ts                  # i18n 实例 + setLocale/tText
    │   ├── extensions.ts             # V2 模块文案（6 语言）
    │   └── locales/                  # 基础文案（zh/en/ja/ko/es/fr）
    │
    ├── mock/                         # Mock 数据
    │   ├── products.ts               # 8 款中医药商品（含 6 语名称）
    │   ├── constitution.ts           # 九种体质 + 问卷题
    │   ├── conversation.ts           # 智能体会话
    │   ├── shop.ts                   # 分类、币种
    │   ├── wuyun.ts                  # 五运六气/流年气候/三因司天/药食同源
    │   ├── watch.ts                  # 智能手表设备/指标/心电图
    │   └── operations.ts             # 竞品/供应链/需求/创意/上架任务
    │
    ├── types/
    │   └── index.ts                  # 全部 TypeScript 类型
    │
    └── views/                        # 页面
        ├── auth/                     # Login / Register / ForgotPassword
        ├── account/AccountPage.vue
        ├── health/                   # Alerts / Family / Watch（V2 健康）
        ├── ops/                      # Competitor/Supply/Demand/Creative/Listing（V2 运营）
        ├── shop/                     # ProductList / ProductDetail / Cart / Checkout
        ├── HomePage.vue
        ├── ChatPage.vue
        ├── AssessmentPage.vue
        └── NotFoundPage.vue
```

## 命名约定

| 类型 | 约定 | 示例 |
|------|------|------|
| Vue 组件文件 | PascalCase | `ProductCard.vue` |
| 页面文件 | PascalCase + `Page` 后缀 | `AlertsPage.vue` |
| Store 文件 | camelCase | `health.ts`（导出名 `useHealthStore`） |
| Mock 文件 | camelCase | `wuyun.ts` |
| 类型 | PascalCase 接口/类型 | `FamilyMember`、`HealthAlert` |
| 路由路径 | kebab-case | `/health/alerts` |
| CSS 变量 | `--color-xxx` / `--radius-xxx` | `--color-primary` |
