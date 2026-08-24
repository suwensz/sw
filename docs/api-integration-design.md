# 素衡OS · 多平台电商 API + AI 图片/视频 统一接入设计方案

> 版本：v1.0（阶段4）
> 范围：1688 / 淘宝 / 京东 / 亚马逊 / 电商大数据 / 图片优化 / 视频生成 共 7 类能力的统一接入
> 相关代码：`scripts/gateway/vault.cjs`、`scripts/gateway/tools/index.cjs`、`scripts/gateway/tools/suwensz.cjs`（新增）、`scripts/gateway/tools/ali1688.cjs`（保留兼容）

---

## 1. 架构总览

### 1.1 分层结构

```
┌────────────────────────────────────────────────────────────────┐
│ 前端（Vue3 + Electron，三端：开发/管理/运营）                      │
│    调试面板 · 选品工作台 · 商品素材工坊                             │
└──────────────┬─────────────────────────────────────────────────┘
               │ http://127.0.0.1:8898（suheng-gateway，密钥不出网关）
┌──────────────▼─────────────────────────────────────────────────┐
│ suheng-gateway（llm-proxy.cjs）                                  │
│  /llm /llm/agent  /vault /tools/list /tools/invoke /kb/*        │
├────────────────────────────────────────────────────────────────┤
│ 工具注册表 tools/index.cjs（OpenAI Function Calling）              │
│  IMPLEMENTATIONS：L2 → L1 → L0 逐级降级（见 §1.3）               │
├──────────────┬──────────────────┬───────────────────────────────┤
│ L1 客户端层   │ suwensz.cjs      │ ali1688.cjs（保留，官方直连）    │
│              │ 素问Tokens分发器   │ image/video 走分发器或独立槽位   │
├──────────────▼──────────────────┴───────────────────────────────┤
│ 密钥保险箱 vault.cjs（AES-256-GCM 落盘 scripts/.vault.json）        │
│  keys: llm / embedding / ali1688 / suwensz / ecomData /          │
│        imageOpt / videoGen                                       │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 分发器统一代理模式

素问数字（素衡品牌方）的 Tokens 分发器 `https://api.suwensz.com/` 是 **OpenAI 兼容网关**，一个 key 同时承载两类流量：

- **LLM 转发**：`/v1/chat/completions`、`/v1/models`（可直接作为素衡OS的 LLM provider，与 DeepSeek/豆包并列）
- **电商数据代理**：以 `platform` 参数区分 1688 / taobao / jd / amazon，由分发器侧持有各平台官方凭据，素衡OS 无需逐平台申请 AppKey、无需各自签名

好处：
1. **零资质冷启动**——淘宝/京东/亚马逊官方 API 需要企业资质+审核（见 §7），分发器让 P0 阶段当天可用；
2. **统一计费与密钥轮换**——只需保管一个 `sk-` key，泄露/失效只需换一处；
3. **保留官方直连逃生通道**——1688 走 `ali1688.cjs`（HMAC-SHA1 签名直连），未来量大或分发器不稳定时可平移到各平台官方 SDK，vault 槽位已预留。

### 1.3 L0 / L1 / L2 分级降级策略

| 级别 | 含义 | 数据来源 | 触发条件 |
|------|------|----------|----------|
| **L2** | 分发器代理（suwensz） | api.suwensz.com 转发各平台官方 API | vault `keys.suwensz.apiKey` 有效 |
| **L1** | 平台官方直连 | ali1688.cjs 签名直连（仅 1688 已实现，其余预留槽位） | vault `keys.ali1688` 已配置且 L2 失败/未配置 |
| **L0** | 本地兜底 | local-data.cjs 离线数据 / 结构化"待接入"响应 | 上层全部失败，**永不让工具报错中断对话** |

降级链（以商品搜索为例）：

```
search_platform_products(platform='jd')
  ├─ L2 suwensz.searchProducts('jd', ...)   → 成功返回 provider='suwensz-proxy'
  │    └─ 401 KEY_INVALID → 不降级直接提示"去 api.suwensz.com 换 key"（见 §4）
  ├─ L1 platform==='1688' && ali1688 已配置 → ali.callApi(...)  provider='1688-open'
  └─ L0 local.searchProducts(...)           provider='local-fallback'（附 degraded 标记）
```

> 例外：**鉴权失败（401）不静默降级**。密钥失效是用户必须处理的事件，静默降级到 L0 会让用户误以为拿到的是真实行情。此时工具返回明确的指引信息。

---

## 2. vault 槽位设计

### 2.1 槽位清单

现有槽位保留：`llm`、`embedding`、`ali1688`。新增 4 个：

```jsonc
{
  "keys": {
    "llm":       { "apiKey": "" },                    // 现有
    "embedding": { "provider": "...", "apiKey": "", "endpoint": "", "model": "" },  // 现有
    "ali1688":   { "appKey": "", "appSecret": "", "accessToken": "", "expireAt": null },  // 现有

    // ── 以下为本次新增 ──
    "suwensz":  { "apiKey": "", "endpoint": "https://api.suwensz.com" },   // 素问Tokens分发器（统一槽位）
    "ecomData": { "provider": "", "apiKey": "", "endpoint": "" },          // 电商大数据（数据威/魔镜等，P2 预留）
    "imageOpt": { "provider": "kling", "apiKey": "", "endpoint": "" },     // 图片优化（默认可灵AI）
    "videoGen": { "provider": "kling", "apiKey": "", "endpoint": "" }      // 视频生成（默认可灵AI）
  }
}
```

### 2.2 为什么 suwensz 用「统一槽位」而不是分平台槽位

**推荐：统一槽位。** 理由：

1. **分发器本身就是"分平台槽位"的替代品**——平台差异（1688/taobao/jd/amazon）作为请求参数 `platform` 传入，而非配置差异，一个 apiKey 覆盖全部；
2. **密钥治理成本低**——N 个平台槽位 = N 次脱敏/轮换/权限审计；分发器模式下失效只改一处；
3. **与现有 llm 槽位语义一致**——都是"Bearer token + endpoint"，客户端代码可完全复用 `suwensz.cjs` 的 `callApi`；
4. **逃生通道不受影响**——真需要官方直连时，1688 已有独立槽位 `ali1688`；taobao/jd/amazon 若未来直连，届时再按需加槽位（vault 深合并结构天然支持增量扩展，不动旧数据）。

### 2.3 图片/视频为何独立槽位（不并入 suwensz）

- 图片/视频是**计费重、时效长（异步任务）**的能力，与电商数据同步查询的 key 轮换周期不同；
- 首选服务商可灵AI（见 §5/§6）是独立账号体系，与 suwensz 无绑定关系；
- 独立槽位使未来更换服务商（provider 字段）不牵动分发器配置。

### 2.4 权限与脱敏

沿用现有三端权限：开发端可写、管理端未锁定可写、运营端只读。`vaultView()` 对新槽位 apiKey 一律 `maskKey()`（仅露末 4 位），`setVaultConfig()` 合并循环加入 4 个新 slot，`***` 开头的脱敏占位不覆盖原值。

---

## 3. 工具 Schema 设计（Function Calling）

新增 3 个工具，全部挂载到 `ecom` / `domestic` 域（`general` = 全量自动包含）：

| 工具 | 覆盖能力 | 关键参数 | 降级 |
|------|----------|----------|------|
| `search_platform_products` | 1688/淘宝/京东/亚马逊/电商大数据 商品搜索 | `platform`(enum: 1688/taobao/jd/amazon)、`keywords`、`price_min/max`、`page_size` | L2→L1(仅1688)→L0 |
| `optimize_product_image` | 商品主图优化/白底图/多语言文案图 | `image_url`、`mode`(enum: main/white_bg/copywriting)、`language`(enum: zh/en/ja/de/fr/es/ru)、`prompt` | 待接入提示（骨架） |
| `generate_product_video` | 商品短视频自动生成 | `image_url`/`product_title`、`duration_seconds`(3-15)、`ratio`(enum: 16:9/9:16/1:1)、`script` | 待接入提示（骨架） |

设计要点：
- `platform` 用**枚举参数**而非拆成 4 个工具——LLM 选择成本低，schema 数量不膨胀，新增平台只需扩枚举；
- 图片/视频工具不阻塞智能体循环：未配置/未接入时返回 `{status:'pending', message}` 结构化数据，LLM 可向用户解释下一步；
- 现有 `search_supply_products` 保留不动（1688 语义、L1 直连），新工具是超集。

---

## 4. 分发器（suwensz）接入方案

### 4.1 双角色接入

**角色A · LLM provider（可选）**：把素衡OS主配置切到分发器——
```
vault 顶层: provider='suwensz', endpoint='https://api.suwensz.com/v1/chat/completions',
            model=<分发器上选的模型>, apiKey=<sk-...>
```
`/llm` 与 `/llm/agent` 的 vault 补全逻辑无需任何改动（OpenAI 兼容）。

**角色B · 电商数据代理（默认）**：`tools/suwensz.cjs` 提供：
- `suwenszConfig()`：读 vault `keys.suwensz`，未配置返回 null
- `callApi(path, params)`：通用 Bearer 认证调用（GET query / POST JSON 自动选择）
- `callLLM(messages, model)`：`POST /v1/chat/completions` 转发
- `listModels()`：`GET /v1/models`（探测 key 有效性）
- `searchProducts(platform, keywords, opts)`：`POST /v1/ecom/products/search`，body `{platform, keywords, ...opts}`（路径若与分发器文档不符，改 `ECOM_SEARCH_PATH` 常量一处即可）

### 4.2 key 失效的提示链路（当前该 key 已 401）

1. `suwensz.cjs` 检测到 HTTP 401/403 → 抛出 `code='KEY_INVALID'` 的错误；
2. 工具层**不降级 L0**，返回 `{status:'key_invalid', guidance: 'API Key 已失效，请登录 https://api.suwensz.com （测试账号 ceshi）重新生成 Tokens，并填入 开发端→密钥保险箱→suwensz 槽位'}`；
3. 前端调试面板 `/vault/probe` 探测同样收到 KEY_INVALID，UI 显示黄色告警条；
4. 用户换 key：开发端 `PUT /vault`，body `{"keys":{"suwensz":{"apiKey":"sk-新key"}}}`，`X-Portal: dev`。

---

## 5. 图片优化方案推荐

**推荐：可灵AI（Kling AI）为主，腾讯云 AI 为备。**

| 维度 | 可灵AI | 腾讯云AI（数据万象/特效） | 阿里云鹿班 |
|------|--------|--------------------------|------------|
| 接入成本 | **WorkBuddy 内置 kling-ai-plugin，已有现成通道** | 需注册腾讯云+开通数据万象，SecretId/Key 管理 | 鹿班主打 banner 模板投放，开放 API 面向大客户 |
| 图生图能力 | 强（商品图风格迁移/扩图/重绘） | 中（裁剪/抠图/增强为主，生成类较弱） | 弱（模板合成，非生成式） |
| 商品场景契合 | 高：多语言文案图可用图生图+文字模板 | 中 | 低（面向国内营销图） |

**理由**：素衡OS三大图片需求——主图优化（图生图重绘）、白底图（抠图+纯色背景合成）、多语言文案图（图生图+文案叠加）。可灵AI的图生图质量与中文商品语义理解最佳，且**本机已内置插件、零额外账号成本**；腾讯云抠图/增强 API 可作白底图的补充管线（P2）。

**接入方式**：vault `keys.imageOpt = {provider:'kling', apiKey, endpoint}`；`tools/index.cjs` 的 `optimize_product_image` 先走分发器 OpenAI 兼容 `/v1/images/generations`（若分发器提供），可灵插件直连为 TODO 骨架（P1 完成管线）。

## 6. 视频生成方案推荐

**推荐：可灵AI 视频生成（图生视频）。**

理由：
1. **账号/计费与图片统一**——同一 imageOpt/videoGen 槽位体系、同一服务商，运营侧只对接一家；
2. **图生视频最贴合电商**——直接以上架商品主图驱动 3~10s 动态展示（旋转/场景流转），无需从零文生视频；
3. 腾讯云智能创作偏向剪辑合成（素材拼接），生成式能力弱于可灵；Sora 类产品无稳定国内 API。

**接入方式**：vault `keys.videoGen = {provider:'kling', apiKey, endpoint}`；`generate_product_video` 为异步任务模型（提交→轮询），当前交付接口骨架（函数签名+TODO），P1 接可灵插件后补轮询逻辑。

---

## 7. 各平台官方 API 申请指引（备选路径）

即使走分发器，以下为官方直连的备选路径（L1）：

| 平台 | 入口 | 需要资质 | 审核周期 | 说明 |
|------|------|----------|----------|------|
| 1688 开放平台 | open.1688.com | 企业支付宝/营业执照、实名开发者 | 应用创建即审，约 1~3 天；API 权限包按需申请（更长） | 契约：AppKey/AppSecret + access_token（RSA 或 sessionKey），已有 `ali1688.cjs` |
| 淘宝开放平台 TOP | open.taobao.com | 淘宝/天猫店铺（卖家资质）、企业实名 | 应用审核约 3~7 天，API 权限分级（商品/订单类需高级权限，最长达 15 天） | 签名与 1688 同源（HMAC-SHA1），`ali1688.cjs` 的 sign() 可复用 |
| 京东开放平台（京麦/jos） | jos.jd.com | 京东店铺/供应商资质、企业营业执照 | 应用创建约 3~7 天；数据类 API 需商务对接 | OAuth2 + MD5/syskey 签名，与 TOP 不同，需新客户端 |
| 亚马逊 SP-API | developer.amazonservices.com | 专业销售账户或开发者注册（需二审） | 注册开发者约 1~4 周（含视频验证） | LWA OAuth2 + AWS SigV4，无中国国内代理时需海外主体更顺畅 |
| 电商大数据（数据威/魔镜/久谦） | 各官网商务通道 | 企业采购合同 | 1~2 周开通 | 按查询量计费，vault `ecomData` 槽位预留 |

> 结论：官方路径全部走完最长需 1~2 个月，故 P0 用分发器先行，官方直连作为 P2 的稳定性冗余。

---

## 8. 实现里程碑

| 阶段 | 交付 | 状态 |
|------|------|------|
| **P0（本次）** | vault 4 新槽位；suwensz.cjs 统一客户端；3 个新工具 schema+实现（图片/视频为骨架）；/tools/list、/vault 验证通过 | ✅ 本文档+代码 |
| **P1** | 用户在 api.suwensz.com 换有效 key → 跑通 4 平台真实商品搜索；可灵AI插件直连（图片优化+视频生成异步轮询）；前端素材工坊页面 | 待办 |
| **P2** | 淘宝/京东官方直连客户端（复用 TOP 签名）；电商大数据（ecomData）接入；get_supplier_info 接企查查；L2 缓存与配额看板 | 待办 |

---

## 附：本次代码改动清单

| 文件 | 改动 |
|------|------|
| `docs/api-integration-design.md` | 新增，本文档 |
| `scripts/gateway/vault.cjs` | keys 增 suwensz/ecomData/imageOpt/videoGen 槽位；loadVault 深合并、vaultView 脱敏、setVaultConfig 合并循环同步扩展 |
| `scripts/gateway/tools/suwensz.cjs` | 新增，素问分发器统一客户端（config/callApi/callLLM/listModels/searchProducts） |
| `scripts/gateway/tools/index.cjs` | TOOL_SCHEMAS +3 工具；IMPLEMENTATIONS +3 实现（含降级链）；DOMAIN_TOOLS 挂载 ecom/domestic；listTools 增 suwenszConfigured/imageOptConfigured/videoGenConfigured 状态位 |
