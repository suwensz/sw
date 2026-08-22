#!/usr/bin/env node
/**
 * 素衡OS · 系统内置数据库 → AI 知识库 同步脚本
 *
 * 作用：把前端系统实际展示的业务数据（src/mock/*.ts）与网关本地工具数据
 * （gateway/tools/local-data.cjs）提取为自然语言文档，导入 scripts/suheng.db，
 * 使 AI 对话（RAG 检索）能引用与前端一致的真实业务数据。
 *
 * 数据源 → 域（与 gateway/tools/index.cjs 的 DOMAIN_TOOLS 对齐）：
 *   ecom      : 跨境商品池(products) / 运营端展示(ecomShowcase) / 采购线索(tradeData)
 *               物流轨迹 / 退换货 / 平台订单 / 运力渠道 / 平台列表(operations)
 *               情报渠道 + 供应链源(intelSources) / 供应商品池 + 供应商档案(local-data)
 *   domestic  : 国内电商商品(domesticData) / 平台与类目
 *   tcm       : 已由 scripts/kb/seed-tcm.json 覆盖，本脚本不重复导入
 *
 * 特性：
 *   - 幂等：source 固定为 suheng-system-sync，重跑前先整批删除旧文档再导入
 *   - TypeScript 提取：用项目自带 esbuild 把 mock 模块打包成 CJS 后取值（零新依赖）
 *   - 导入后自动补算向量（vault 已配置 Embedding Key 时）
 *
 * 用法：node scripts/kb/sync-system.cjs
 */
const path = require('path')
const fs = require('fs')
const { DatabaseSync } = require('node:sqlite')

const ROOT = path.join(__dirname, '..', '..')
const SRC = path.join(ROOT, 'src')

const SOURCE = 'suheng-system-sync'

/* ============== 1. 用 esbuild 提取 mock 数据（TS → 运行时对象） ============== */

async function extractMockData() {
  const esbuild = require(path.join(ROOT, 'node_modules', 'esbuild'))
  const p = (f) => JSON.stringify(path.join(SRC, 'mock', f))
  const entry = `
import { mockProducts } from ${p('products')}
import { SHOWCASE_PRODUCTS } from ${p('ecomShowcase')}
import { MOCK_DOMESTIC_PRODUCTS, DOMESTIC_PLATFORMS, DOMESTIC_CATEGORIES } from ${p('domesticData')}
import { MARKETPLACES } from ${p('operations')}
import { FREIGHT_CHANNELS, ZONE_FACTORS, MOCK_SHIPMENTS, MOCK_RETURNS, MOCK_PROCURE_LEADS, MOCK_PLATFORM_ORDERS } from ${p('tradeData')}
import { INTEL_CHANNELS, SUPPLY_SOURCES } from ${p('intelSources')}
import { shippingMethods } from ${p('shop')}
const local = require(${JSON.stringify(path.join(ROOT, 'scripts', 'gateway', 'tools', 'local-data.cjs'))})
export const data = {
  mockProducts, SHOWCASE_PRODUCTS, MOCK_DOMESTIC_PRODUCTS, DOMESTIC_PLATFORMS, DOMESTIC_CATEGORIES,
  MARKETPLACES, FREIGHT_CHANNELS, ZONE_FACTORS, MOCK_SHIPMENTS, MOCK_RETURNS,
  MOCK_PROCURE_LEADS, MOCK_PLATFORM_ORDERS, INTEL_CHANNELS, SUPPLY_SOURCES, shippingMethods,
  supplyProducts: local.SUPPLY_PRODUCTS, suppliers: local.SUPPLIERS,
}
`
  const result = await esbuild.build({
    stdin: { contents: entry, resolveDir: ROOT, loader: 'ts' },
    bundle: true,
    platform: 'node',
    format: 'cjs',
    write: false,
    alias: { '@': path.join(SRC) },
    logLevel: 'silent',
  })
  const code = result.outputFiles[0].text
  const mod = { exports: {} }
  // eslint-disable-next-line no-new-func
  new Function('module', 'exports', 'require', code)(mod, mod.exports, require)
  return mod.exports.data
}

/* ============== 2. 文档组装工具 ============== */

/** LocaleText/lt() → 中文字符串（缺失回退英文/原值） */
function zh(v) {
  if (v == null) return ''
  if (typeof v === 'string') return v
  if (typeof v === 'object') {
    for (const k of ['zh', 'en', 'ja', 'ko', 'es', 'fr']) {
      if (typeof v[k] === 'string' && v[k]) return v[k]
    }
  }
  return String(v)
}

function doc(domain, docType, title, text, meta) {
  return { domain, doc_type: docType, title, source: SOURCE, meta: meta || undefined, text }
}

const COUNTRY_NAMES = {
  AE: '阿联酋', SA: '沙特', VN: '越南', TH: '泰国', US: '美国', JP: '日本',
  ID: '印尼', MY: '马来西亚', TR: '土耳其', CN: '中国', QA: '卡塔尔',
}

const ORDER_STATUS_ZH = {
  paid: '已付款', shipped: '已发货', completed: '已完成', refunding: '退款中',
  pending: '待发货', transit: '运输中', delivered: '已签收', exception: '异常',
  approved: '已同意退款', refunding: '退款中', rejected: '已拒绝',
}
const RETURN_REASON_ZH = {
  wrong: '拍错/不喜欢', damaged: '运输破损', quality: '质量问题',
  not_as_described: '与描述不符', no_reason: '无理由退货',
}

/* ============== 3. 各数据源 → 文档 ============== */

function buildDocs(d) {
  const docs = []

  // ---- ecom：跨境商品池（商城主站）----
  for (const p of d.mockProducts || []) {
    const lines = [
      `商品「${zh(p.name)}」是素衡OS跨境商城在售商品（编号 ${p.id}，slug ${p.slug}）。`,
      `售价 ${p.price} ${p.currency}${p.originalPrice ? `（原价 ${p.originalPrice} ${p.currency}）` : ''}，类目 ${p.category}，评分 ${p.rating}（${p.reviewCount || 0} 条评价），库存 ${p.stock}，已售 ${p.sales}。`,
      `简介：${zh(p.description)}`,
      zh(p.detail) ? `详情：${zh(p.detail)}` : '',
      p.tags && p.tags.length ? `标签：${p.tags.join('、')}。` : '',
      p.constitutionTags && p.constitutionTags.length ? `适合体质标签：${p.constitutionTags.join('、')}。` : '',
      zh(p.usage) ? `用法：${zh(p.usage)}` : '',
    ]
    docs.push(doc('ecom', 'product', `商品：${zh(p.name)}`, lines.filter(Boolean).join('\n'), { id: p.id, kind: 'shop_product' }))
  }

  // ---- ecom：运营端展示商品 ----
  for (const p of d.SHOWCASE_PRODUCTS || []) {
    const lines = [
      `「${zh(p.name)}」是运营端电商展示产品（编号 ${p.id}，类目 ${p.category}${p.sub ? '/' + p.sub : ''}${p.edge ? '，边缘产品' : ''}）。`,
      `价格 ${p.price}${p.originalPrice ? `（原价 ${p.originalPrice}）` : ''}，库存 ${p.stock}，销量 ${p.sales}，评分 ${p.rating}。`,
      `简介：${zh(p.description)}`,
      zh(p.detail) ? `详情：${zh(p.detail)}` : '',
    ]
    docs.push(doc('ecom', 'showcase_product', `展示商品：${zh(p.name)}`, lines.filter(Boolean).join('\n'), { id: p.id, kind: 'showcase_product' }))
  }

  // ---- ecom：采购需求线索（B端/C端）----
  for (const l of d.MOCK_PROCURE_LEADS || []) {
    const lines = [
      `采购需求线索「${zh(l.keyword)}」（编号 ${l.id}）：${l.side} ${l.buyerType}，来自 ${COUNTRY_NAMES[l.country] || l.country}，HS编码 ${l.hsCode}。`,
      `需求量 ${l.demandQty.toLocaleString()} ${l.unit}，意向价格区间 ${l.priceRangeUsd[0]}-${l.priceRangeUsd[1]} 美元，热度 ${l.heat}/100，近30天趋势 ${l.trend > 0 ? '+' : ''}${l.trend}%。`,
      `情报来源：${(l.sources || []).join('、')}；抓取时间 ${l.capturedAt}。`,
    ]
    docs.push(doc('ecom', 'procure_lead', `采购线索：${zh(l.keyword)}（${COUNTRY_NAMES[l.country] || l.country}）`, lines.join('\n'), { id: l.id, kind: 'procure_lead' }))
  }

  // ---- ecom：供应商品池（网关本地工具数据，与智能体 search_supply_products 工具同源）----
  for (const p of d.supplyProducts || []) {
    const lines = [
      `供应市场商品「${p.keywords[0]}」（别名：${p.keywords.join('、')}），类目 ${p.category}。`,
      `采购价格区间 ${p.priceRange[0]}-${p.priceRange[1]} ${p.currency}，起订量 MOQ ${p.moq} ${p.unit}，可选供应商约 ${p.supplierCount} 家，交期约 ${p.leadTimeDays} 天。`,
      `主产区：${p.hotRegion}。HS编码 ${p.hsCode}。`,
    ]
    docs.push(doc('ecom', 'supply_market', `供应商品：${p.keywords[0]}`, lines.join('\n'), { kind: 'supply_market' }))
  }

  // ---- ecom：供应商档案 ----
  for (const s of d.suppliers || []) {
    const lines = [
      `供应商「${s.companyName}」（${s.basic.region}）：成立于 ${s.basic.founded}，法定代表人 ${s.basic.legalPerson}，注册资本 ${s.basic.registeredCapital}，员工 ${s.basic.employees}。`,
      `主营产品：${s.capacity.mainProducts}；月产能 ${s.capacity.monthlyOutput}；认证 ${s.capacity.certifications}；出口占比 ${s.capacity.exportShare}。`,
      `风险等级 ${s.risk.level}（涉诉 ${s.risk.disputes} 起，税务评级 ${s.risk.taxRating}${s.risk.abnormalOps ? '，经营异常' : ''}）。`,
    ]
    docs.push(doc('ecom', 'supplier', `供应商：${s.companyName}`, lines.join('\n'), { kind: 'supplier' }))
  }

  // ---- ecom：供应链源（云仓/一件代发）----
  for (const s of d.SUPPLY_SOURCES || []) {
    const lines = [
      `供应链源「${zh(s.name)}」（${s.connected ? '已接入' : '未接入'}）：区域 ${zh(s.region)}，类型 ${s.type}。`,
      `品类：${zh(s.categories)}。起订量 ${s.moq}，价格指数 ${s.priceIndex}（相对基准），交期 ${s.leadTimeDays} 天，评分 ${s.rating}。`,
    ]
    docs.push(doc('ecom', 'supply_source', `供应链源：${zh(s.name)}`, lines.join('\n'), { id: s.id, kind: 'supply_source' }))
  }

  // ---- ecom：物流轨迹 ----
  for (const s of d.MOCK_SHIPMENTS || []) {
    const lines = [
      `物流运单 ${s.trackingNo}（订单 ${s.orderNo}，${s.platform} 平台，承运 ${s.carrier}）：目的地 ${COUNTRY_NAMES[s.destination] || s.destination}，重量 ${s.weightKg}kg，运费 ${s.freight}，当前状态：${ORDER_STATUS_ZH[s.status] || s.status}（更新于 ${s.updatedAt}）。`,
      ...(s.events || []).map((e) => `· ${e.time} ${zh(e.text)}`),
    ]
    docs.push(doc('ecom', 'shipment', `运单：${s.trackingNo}`, lines.join('\n'), { id: s.id, kind: 'shipment' }))
  }

  // ---- ecom：退换货 ----
  for (const r of d.MOCK_RETURNS || []) {
    const lines = [
      `退换货申请 ${r.id}（订单 ${r.orderNo}）：买家 ${r.buyer}（${COUNTRY_NAMES[r.country] || r.country}），商品「${zh(r.product)}」×${r.qty}，金额 ${r.amount}。`,
      `原因：${RETURN_REASON_ZH[r.reason] || r.reason}；状态：${ORDER_STATUS_ZH[r.status] || r.status}；申请时间 ${r.appliedAt}。`,
    ]
    docs.push(doc('ecom', 'return_request', `退换货：${r.orderNo}（${zh(r.product)}）`, lines.join('\n'), { id: r.id, kind: 'return' }))
  }

  // ---- ecom：平台订单（拼多多/JD/淘宝）----
  for (const o of d.MOCK_PLATFORM_ORDERS || []) {
    const lines = [
      `平台订单 ${o.orderNo}（${o.platform} 平台）：商品「${zh(o.product)}」×${o.qty}，金额 ${o.amount}，买家 ${o.buyer}，状态：${ORDER_STATUS_ZH[o.status] || o.status}，下单时间 ${o.createdAt}。`,
    ]
    docs.push(doc('ecom', 'platform_order', `订单：${o.orderNo}`, lines.join('\n'), { id: o.id, kind: 'platform_order' }))
  }

  // ---- ecom：配送与运力方案（汇总1篇）----
  {
    const lines = [
      '素衡OS跨境配送方案与运力渠道如下。',
      ...(d.shippingMethods || []).map((m) => `· ${zh(m.name)}：${m.price} 美元，${zh(m.description)}。`),
      '国际物流运力渠道（基础费 + 每公斤费，时效）：',
      ...(d.FREIGHT_CHANNELS || []).map((c) => `· ${zh(c.name)}：基础费 ${c.base}、每公斤 ${c.perKg}，时效 ${c.days} 天。`),
      '目的地区域附加费系数：' + (d.ZONE_FACTORS || []).map((z) => `${zh(z.label)} ×${z.factor}`).join('；') + '。',
    ]
    docs.push(doc('ecom', 'logistics', '物流渠道与配送方案', lines.join('\n'), { kind: 'logistics' }))
  }

  // ---- ecom：跨境电商平台（汇总1篇）----
  {
    const lines = [
      '素衡OS已接入的跨境电商平台（名称 / 区域 / 结算币种 / 连接状态）：',
      ...(d.MARKETPLACES || []).map((m) => `· ${m.name}（${zh(m.region)}，${m.currency}）：${m.connected ? '已连接' : '未连接'}。`),
    ]
    docs.push(doc('ecom', 'marketplace', '跨境电商平台清单', lines.join('\n'), { kind: 'marketplace' }))
  }

  // ---- ecom：需求情报渠道（汇总1篇）----
  {
    const lines = [
      '素衡OS海外需求情报渠道（用于抓取 B端/C端 采购需求）：',
      ...(d.INTEL_CHANNELS || []).map((c) => `· ${zh(c.name)}（${c.type}，${zh(c.region)}，受众 ${c.audience}）：${zh(c.desc)}。${c.connected ? '已接入。' : '未接入。'}`),
    ]
    docs.push(doc('ecom', 'intel_channel', '海外需求情报渠道清单', lines.join('\n'), { kind: 'intel_channel' }))
  }

  // ---- domestic：国内电商商品 ----
  for (const p of d.MOCK_DOMESTIC_PRODUCTS || []) {
    const cats = { office: '办公', project_doc: '项目书', comic: '漫剧', short_drama: '短剧' }
    const platforms = (p.platforms || []).map((x) => ({ taobao: '淘宝', jd: '京东', pinduoduo: '拼多多' }[x] || x))
    const lines = [
      `国内电商商品「${p.title}」（编号 ${p.id}）：类目 ${cats[p.category] || p.category}，${p.format === 'digital' ? '虚拟商品' : '实物商品'}，上架平台：${platforms.join('、')}。`,
      `价格 ¥${p.price}${p.originalPrice ? `（原价 ¥${p.originalPrice}）` : ''}，库存 ${p.stock}，销量 ${p.sales}，状态 ${p.status === 'listed' ? '在售' : p.status}。`,
      `描述：${p.description}`,
    ]
    docs.push(doc('domestic', 'product', `国内商品：${p.title}`, lines.join('\n'), { id: p.id, kind: 'domestic_product' }))
  }

  // ---- domestic：平台与类目（汇总1篇）----
  {
    const lines = [
      '素衡OS国内电商板块覆盖平台：淘宝、京东、拼多多。',
      '经营类目：' + (d.DOMESTIC_CATEGORIES || []).map((c) => `${c.name}（${c.desc}）`).join('；') + '。',
    ]
    docs.push(doc('domestic', 'platform', '国内电商平台与类目', lines.join('\n'), { kind: 'domestic_platform' }))
  }

  return docs
}

/* ============== 4. 主流程 ============== */

async function main() {
  console.log('[sync] 提取 src/mock 业务数据（esbuild 转译）...')
  let data
  try {
    data = await extractMockData()
  } catch (err) {
    console.error('[sync] mock 数据提取失败:', err.message)
    process.exit(1)
  }
  const counts = Object.fromEntries(Object.entries(data).map(([k, v]) => [k, Array.isArray(v) ? v.length : typeof v]))
  console.log('[sync] 数据源规模:', JSON.stringify(counts))

  const docs = buildDocs(data)
  const byDomain = {}
  for (const x of docs) byDomain[x.domain] = (byDomain[x.domain] || 0) + 1
  console.log(`[sync] 组装文档 ${docs.length} 篇（${Object.entries(byDomain).map(([k, v]) => `${k}:${v}`).join(' / ')}）`)

  const kb = require('../gateway/kb.cjs')
  const dbFile = path.join(__dirname, '..', 'suheng.db')
  const db = new DatabaseSync(dbFile)
  // 幂等：整批删除本来源旧文档（chunks/embeddings 级联删除），再全量导入
  const del = db.prepare('DELETE FROM documents WHERE source = ?').run(SOURCE)
  db.close()
  if (del.changes > 0) console.log(`[sync] 已清理旧同步文档 ${del.changes} 篇（source=${SOURCE}）`)

  const r = kb.ingest({ docs })
  console.log(`[sync] 导入完成：${r.docs} 文档 / ${r.chunks} 切片`)

  const s = kb.stats()
  console.log(`[sync] 知识库现状: ${s.docs} 文档 / ${s.chunks} 切片 / ${s.embedded} 向量 · 域分布 ${s.domains.map((x) => `${x.domain}:${x.n}`).join(' / ')}`)

  if (s.embeddingConfigured) {
    console.log('[sync] 补算缺失向量...')
    const e = await kb.embedPending()
    console.log(`[sync] 向量补算: ${e.embedded} 条${e.error ? '（' + e.error + '）' : ''}`)
    const s2 = kb.stats()
    console.log(`[sync] 最终: ${s2.docs} 文档 / ${s2.chunks} 切片 / ${s2.embedded} 向量${s2.chunks === s2.embedded ? '（向量齐备）' : '（仍缺 ' + (s2.chunks - s2.embedded) + ' 条，可重跑本脚本或 POST /kb/embed/pending）'}`)
  } else {
    console.log('[sync] 未配置 Embedding Key，本次仅 BM25 关键词检索可用。')
  }
  process.exit(0)
}

main().catch((err) => {
  console.error('[sync] 失败:', err)
  process.exit(1)
})
