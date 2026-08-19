# 电商运营工具模块

## 文件位置
- `src/views/ops/CompetitorPage.vue` — 竞品分析
- `src/views/ops/SupplyPage.vue` — 供应链
- `src/views/ops/DemandPage.vue` — 市场需求抓拍
- `src/views/ops/CreativePage.vue` — 创意工坊
- `src/views/ops/ListingPage.vue` — 自动上架
- `src/stores/ops.ts`
- `src/mock/operations.ts`

## 1. 竞品分析 `/ops/competitor`
覆盖平台：Shopee、Lazada、TikTok Shop、Tokopedia、JD Central、Taobao、Pinduoduo
- 关键词搜索
- 平台多选过滤
- 竞品列表：价格、评分、销量、好评率
- 价格分布
- 好评/差评词云（标签云形式）

## 2. 供应链 `/ops/supply`
- 供应商列表（亳州本草堂、云南三七基地、宁夏中宁枸杞合作社等）
- 认证状态：GMP / ISO / 有机 / HACCP
- 起订量（MOQ）、单价、交期
- 匹配度评分（0-100）
- 12 国物流时效（美/英/日/韩/新/马/泰/越/印尼/菲/澳/德）

## 3. 市场需求抓拍 `/ops/demand`
- 热搜趋势关键词（艾草贴、枸杞原浆、阿胶糕、艾灸盒等）
- 增长率、竞争度
- **供需缺口评分**（0-100，越高越值得进入）
- 搜索量趋势（12 个月迷你图）
- 推荐选品 → 一键加入创意生成

## 4. 创意工坊 `/ops/creative`
- **AI 修图**：去背景、色彩增强、智能修图（处理进度模拟）
- **短视频生成**：5-60 秒、3 种比例（9:16 / 16:9 / 1:1）
- 素材库网格：按图片/视频筛选、下载、用于上架、删除

## 5. 自动上架 `/ops/listing`
- 平台授权状态卡片（已授权/未授权）
- 选品（从商品库选择）
- 自动生成：6 语标题、描述、关键词、建议价格、库存
- 任务进度条（选品 → 文案生成 → 图片处理 → 平台提交 → 完成）
- 一键发布至多平台

## Store 关键 API

```ts
const ops = useOpsStore()

// 竞品
ops.fetchCompetitors(keyword, platforms)
// 供应链
ops.fetchSuppliers(productCategory)
// 需求
ops.fetchDemandTrends()
// 创意
ops.generateImage(productId, mode)
ops.generateVideo(productId, duration, ratio)
ops.deleteAsset(id)
// 上架
ops.generateListing(productId)
ops.publishListing(taskId, platformIds)
```

## 扩展真实 API
当前均为 Mock。接入真实服务时：
1. 创建 `src/api/ops.ts`
2. 在 store action 中替换 Mock 数据为 axios 调用
3. AI 修图/短视频生成通常为异步任务，需轮询任务状态或 WebSocket 推送
