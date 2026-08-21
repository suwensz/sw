# AGENTS.md

## 项目概览
**素衡OS（Suheng OS）**：融合中医健康管理与跨境电商的智能体平台。用户通过中医智能体获取健康咨询、体质辨识，系统智能推荐中医药产品并完成跨境购买。

**V2 扩展**：新增双导航体系（中医健康 + 跨境电商）、五运六气健康预警、家人健康管理、素衡智能手表监测、跨境电商运营工具（竞品/供应链/修图短视频/市场需求/自动上架）。

## 技术栈
- **框架**：Vue 3 + TypeScript 5 + Vite 6
- **状态管理**：Pinia
- **UI 组件库**：Element Plus + @element-plus/icons-vue（全局注册）
- **国际化**：Vue I18n v10（Composition API 模式，`legacy: false`）
- **图表**：ECharts 6 + vue-echarts（体质测评雷达图，按需引入）
- **路由**：Vue Router 4（History 模式）
- **语音**：Web Speech API（SpeechSynthesis，预警语音播报，见 `composables/useSpeech.ts`）
- **包管理器**：pnpm

## 导航体系（V2）
登录后顶部显示**左右两组导航**：
- **左上角 Logo + 中医健康导航**：`nav.tcm`（首页/对话/测评/预警/家人/手表）
- **右上角跨境电商导航 + 工具 + 用户区**：`nav.ecom`（商城/购物车/订单/竞品/供应链/需求/创意/上架）
- 路由 meta 中通过 `module: 'health' | 'ecom'` 标识所属模块，`AppNavbar.vue` 按模块分流渲染两组导航
- 未登录仍显示主品牌导航

## 目录结构
```
src/
├── assets/              # 静态资源
├── components/          # 通用组件
│   ├── AppNavbar.vue    # 顶部双导航栏（V2：左健康/右电商）
│   ├── AppFooter.vue    # 页脚
│   ├── LanguageSwitcher.vue  # 语言下拉切换
│   ├── ProductCard.vue  # 商品卡片
│   └── EcgChart.vue     # 心电图波形组件（SVG 动画）
├── composables/
│   └── useSpeech.ts     # 语音播报 composable（Web Speech API）
├── layouts/
│   ├── AuthLayout.vue   # 认证页布局（左右分栏、品牌展示）
│   └── MainLayout.vue   # 主布局（导航+内容+页脚）
├── i18n/
│   ├── index.ts         # i18n 实例、setLocale/getLocale/tText、mergeLocale
│   ├── extensions.ts    # V2 新增模块文案（health/family/watch/ops/speech，6语言）
│   └── locales/         # zh/en/ja/ko/es/fr 基础六种语言
├── mock/                # Mock 数据
│   ├── products.ts      # 8 款中医药商品
│   ├── constitution.ts  # 九种体质 + 问卷题
│   ├── conversation.ts  # 智能体会话与消息
│   ├── shop.ts          # 分类、币种等
│   ├── wuyun.ts         # 五运六气/流年气候/三因司天/药食同源数据库
│   ├── watch.ts         # 智能手表设备、监测指标、心电图数据
│   └── operations.ts    # 竞品/供应链/市场需求/创意素材/上架任务
│   ├── products.ts      # 8 款中医药商品
│   ├── constitution.ts  # 九种体质 + 问卷题
│   ├── conversation.ts  # 智能体会话与消息
│   └── shop.ts          # 分类、币种等
├── router/index.ts      # 路由配置与守卫
├── stores/              # Pinia stores
│   ├── auth.ts          # 用户、登录注册、BMI
│   ├── cart.ts          # 购物车（勾选、数量、结算）
│   ├── chat.ts          # 智能体会话
│   ├── app.ts           # 语言、币种、测评结果
│   ├── health.ts        # 家人管理、智能手表、预警生成与已读
│   └── ops.ts           # 竞品/供应链/需求/创意/上架任务
├── styles/index.css     # 全局样式 + CSS 变量（青瓷色调）
├── types/index.ts       # TypeScript 类型定义
└── views/
    ├── auth/            # LoginPage / RegisterPage / ForgotPasswordPage
    ├── account/AccountPage.vue
    ├── shop/            # ProductList / ProductDetail / Cart / Checkout
    ├── health/          # AlertsPage / FamilyPage / WatchPage（V2 健康模块）
    ├── ops/             # CompetitorPage / SupplyPage / DemandPage / CreativePage / ListingPage（V2 电商运营）
    ├── HomePage.vue
    ├── ChatPage.vue
    ├── AssessmentPage.vue
    └── NotFoundPage.vue
```

## V2 核心模块说明

### 健康预警（`/health/alerts`）
- 融合三大中医数据库：五运六气（WuyunLiuqi）、流年气候（ClimateData）、三因司天（SanyinShit ian）
- 根据家人出生年月日推算主运/客运/司天/在泉，结合当前节气气候精准运算疾病倾向
- 输出 4 级预警（info/warning/danger/success），含症状、风险等级、药食同源方案（方剂/食材/穴位/药膳）
- 支持语音播报（useSpeech composable，自动跟随 i18n locale）、单条朗读、全部朗读、已读标记
- 预警来源标签：五运六气 / 流年气候 / 三因司天 / 手表监测

### 家人管理（`/health/family`）
- 添加/编辑/删除家人（姓名、性别、出生年月日、关系、身高体重、过敏史、既往病史）
- 自动推算年龄、生肖、中医体质倾向、BMI
- 出生年月日参与五运六气运算（天干地支、主运客运、司天在泉）
- 每位家人绑定 0~N 台智能手表

### 智能手表监测（`/health/watch`）
- 支持素衡智能手表配对，6 项核心指标：血压/血糖/血脂/尿酸/肌酐/心电图
- 设备状态：电量百分比、在线/离线/同步中、最后同步时间
- 心电图 SVG 实时波形（EcgChart 组件），异常时自动生成 danger 级预警
- 家人切换、指标状态色（正常/偏高/偏低）、趋势箭头
- 异常指标推送至预警中心

### 跨境电商运营工具
- **竞品分析**（`/ops/competitor`）：覆盖 Shopee/Lazada/TikTok Shop/Tokopedia/JD/Taobao/Pinduoduo 等平台，关键词分析、价格分布、销量趋势、好评差评词云
- **供应链**（`/ops/supply`）：供应商列表、认证状态（GMP/ISO/有机）、起订量、单价、交期、匹配度评分、12国物流时效
- **市场需求抓拍**（`/ops/demand`）：热搜趋势、增长率、竞争度、供需缺口评分（0-100）、推荐选品
- **创意工坊**（`/ops/creative`）：AI 商品图生成（修图/去背景/增强）、短视频生成（时长/比例可调）、素材库筛选下载
- **自动上架**（`/ops/listing`）：平台授权状态、选品→生成6语标题/描述/关键词→任务进度→一键发布至多平台

## 构建与运行
- 开发：`pnpm run dev`（端口读取 `process.env.DEPLOY_RUN_PORT`，HMR 走 6000 端口 `/hot/vite-hmr`）
- 构建：`pnpm run build`（先 `vue-tsc -b` 类型检查，再 `vite build`）
- 预览：`pnpm run preview`

## 开发规范

### 组件开发
- 全部使用 `<script setup lang="ts">` 语法
- 组件名使用 PascalCase，文件名 PascalCase
- Element Plus 图标已在 main.ts 全局注册，直接 `<el-icon><IconName /></el-icon>` 使用
- Element Plus 组件通过 `unplugin-vue-components` 按需自动引入，无需手动 import

### 国际化
- 新增文案：同时在 `src/i18n/locales/` 下所有 6 个语言文件补充
- 模板中使用 `$t('key')` 或 `const { t } = useI18n()`
- 多语言字段（如商品名）使用 `LocaleText` 类型，通过 `tText(obj, locale)` 读取
- 切换语言调用 `setLocale(code)`，会持久化到 localStorage 并立即响应

### 状态管理
- Store 使用 Composition API 风格（`defineStore('name', () => {...})`）
- 认证状态持久化到 localStorage（`qh_auth_user` / `qh_auth_token`）
- 购物车状态仅存内存（登录后可扩展持久化）

### 样式
- 设计 Token 全部定义在 `src/styles/index.css` 的 `:root` CSS 变量中
- 主色：`--color-primary: #1a6b5c`（深青绿），点缀：`--color-accent: #d4a853`（暖金）
- 通用类：`.qh-container`（最大宽度 1280 居中）、`.qh-card`（白色卡片+米色边框+淡青阴影）
- 响应式断点：sm 640 / md 768 / lg 1024 / xl 1280

### Mock 接口约定
- 所有数据为前端 Mock，无真实后端
- 登录：密码任意 6 位以上即可；验证码任意 6 位数字即可
- 开发测试账号：`dev_user@coze.dev` / `dev123456`
- 注册信息存 localStorage，下次可用相同密码登录

## 设计禁忌
- 不要使用科技蓝/紫蓝渐变
- 不要使用高饱和大红大绿
- 不要做古风边框/纹样堆砌
- 不要使用冷灰色调
- 金色仅作点缀，不要大面积使用
