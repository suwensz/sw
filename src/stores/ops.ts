import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type {
  Marketplace,
  CompetitorProduct,
  SupplyChainItem,
  MarketDemand,
  ListingTask,
  CreativeAsset,
  MarketplaceId,
  IntelChannel,
  DemandLead,
  SupplySource,
  ProcurementRecord,
  Product,
  LocaleText,
  LocaleCode,
} from '@/types'
import {
  MARKETPLACES,
  generateCompetitors,
  generateSupplyChain,
  generateMarketDemands,
} from '@/mock/operations'
import { INTEL_CHANNELS, generateDemandLeads, SUPPLY_SOURCES } from '@/mock/intelSources'
import { mockProducts as products } from '@/mock/products'
import { tText } from '@/i18n'
import { getLocale } from '@/i18n'

const STORAGE_CONNECTED = 'qh_connected_platforms'
const STORAGE_LISTINGS = 'qh_listing_tasks'
const STORAGE_CREATIVES = 'qh_creative_assets'
const STORAGE_PROCUREMENT = 'qh_procurement_db'
const STORAGE_PRODUCTS = 'qh_custom_products'

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}
function save<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value))
}

export const useOpsStore = defineStore('ops', () => {
  const connectedIds = ref<Set<MarketplaceId>>(
    new Set(load<MarketplaceId[]>(STORAGE_CONNECTED, MARKETPLACES.filter((m) => m.connected).map((m) => m.id))),
  )
  const marketplaces = ref<Marketplace[]>(MARKETPLACES)

  const competitors = ref<CompetitorProduct[]>(generateCompetitors())
  const supplyChain = ref<SupplyChainItem[]>(generateSupplyChain())
  const demands = ref<MarketDemand[]>(generateMarketDemands())

  const listingTasks = ref<ListingTask[]>(load<ListingTask[]>(STORAGE_LISTINGS, []))
  const creativeAssets = ref<CreativeAsset[]>(load<CreativeAsset[]>(STORAGE_CREATIVES, []))
  /** 自定义产品（创意工坊 → 自动上架：新增产品时由 AI 补全多语言信息） */
  const customProducts = ref<Product[]>(load<Product[]>(STORAGE_PRODUCTS, []))

  // ========= 需求情报 / 供应链源 / 采购数据库 =========
  const intelChannels = ref<IntelChannel[]>(INTEL_CHANNELS)
  const demandLeads = ref<DemandLead[]>(generateDemandLeads())
  const supplySources = ref<SupplySource[]>(SUPPLY_SOURCES)
  const procurementDb = ref<ProcurementRecord[]>(load<ProcurementRecord[]>(STORAGE_PROCUREMENT, []))

  function refreshDemandLeads() {
    demandLeads.value = generateDemandLeads()
  }

  function importProcurementCsv(text: string): number {
    const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)
    if (!lines.length) return 0
    // 解析表头：name,category,price,currency,supplier,source,moq,note
    const rows = lines[0].toLowerCase().includes('name') ? lines.slice(1) : lines
    const added: ProcurementRecord[] = []
    for (const row of rows) {
      const cols = row.split(',').map((c) => c.trim())
      if (cols.length < 4 || !cols[0]) continue
      added.push({
        id: `pr_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        name: cols[0],
        category: cols[1] || '-',
        price: Number(cols[2]) || 0,
        currency: cols[3] || 'USD',
        supplier: cols[4] || '-',
        source: cols[5] || '-',
        moq: Number(cols[6]) || 1,
        note: cols[7] || '',
        importedAt: new Date().toISOString(),
      })
    }
    procurementDb.value = [...added, ...procurementDb.value]
    save(STORAGE_PROCUREMENT, procurementDb.value)
    return added.length
  }

  function addProcurementRecord(rec: Omit<ProcurementRecord, 'id' | 'importedAt'>) {
    procurementDb.value.unshift({ ...rec, id: `pr_${Date.now()}`, importedAt: new Date().toISOString() })
    save(STORAGE_PROCUREMENT, procurementDb.value)
  }

  function deleteProcurementRecord(id: string) {
    procurementDb.value = procurementDb.value.filter((r) => r.id !== id)
    save(STORAGE_PROCUREMENT, procurementDb.value)
  }

  function clearProcurementDb() {
    procurementDb.value = []
    save(STORAGE_PROCUREMENT, procurementDb.value)
  }

  function exportProcurementCsv(): string {
    const header = 'name,category,price,currency,supplier,source,moq,note'
    const rows = procurementDb.value.map((r) =>
      [r.name, r.category, r.price, r.currency, r.supplier, r.source, r.moq, r.note || '']
        .map((c) => `"${String(c).replace(/"/g, '""')}"`)
        .join(','),
    )
    return [header, ...rows].join('\n')
  }

  const competitorKeyword = ref('')
  const competitorPlatform = ref<MarketplaceId | 'all'>('all')

  const filteredCompetitors = computed(() => {
    let list = competitors.value
    if (competitorKeyword.value) {
      const kw = competitorKeyword.value.toLowerCase()
      list = list.filter((c) => c.title.toLowerCase().includes(kw))
    }
    if (competitorPlatform.value !== 'all') {
      list = list.filter((c) => c.platform === competitorPlatform.value)
    }
    return list
  })

  const connectedMarketplaces = computed(() =>
    marketplaces.value.filter((m) => connectedIds.value.has(m.id)),
  )

  function togglePlatform(id: MarketplaceId) {
    if (connectedIds.value.has(id)) {
      connectedIds.value.delete(id)
    } else {
      connectedIds.value.add(id)
    }
    connectedIds.value = new Set(connectedIds.value)
    save(STORAGE_CONNECTED, Array.from(connectedIds.value))
  }

  function refreshCompetitors(keyword?: string) {
    competitors.value = generateCompetitors(keyword || competitorKeyword.value)
  }

  // AI 竞品洞察（Mock）
  function getCompetitorInsights(): string {
    const list = filteredCompetitors.value
    if (!list.length) return '暂无数据'
    const avgPrice = list.reduce((s, c) => s + c.price, 0) / list.length
    const totalSales = list.reduce((s, c) => s + c.sales30d, 0)
    const avgRating = list.reduce((s, c) => s + c.rating, 0) / list.length
    const top = [...list].sort((a, b) => b.sales30d - a.sales30d)[0]
    const locale = getLocale()
    return [
      `样本 ${list.length} 个竞品，30天总销量约 ${totalSales.toLocaleString()} 件`,
      `均价 ${avgPrice.toFixed(2)}，平均评分 ${avgRating.toFixed(1)}`,
      `销冠：${tText(top?.title ? { zh: top.title, en: top.title, ja: top.title, ko: top.title, es: top.title, fr: top.title } : { zh: '-', en: '-', ja: '-', ko: '-', es: '-', fr: '-' }, locale)}（${top.sales30d}件）`,
      '建议：价格锚定均价 90% 区间，主打"有机/无硫/原产地"差异化卖点',
    ].join('；')
  }

  // ========= 创意素材（Mock 生成，使用真实占位图） =========
  function generateImage(prompt: string, aspectRatio: string = '1:1'): Promise<CreativeAsset> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const [w, h] = aspectRatio === '16:9' ? [800, 450] : aspectRatio === '9:16' ? [450, 800] : [600, 600]
        const seed = Math.random().toString(36).slice(2, 8)
        const asset: CreativeAsset = {
          id: `img_${Date.now()}`,
          type: 'image',
          url: `https://picsum.photos/seed/${seed}/${w}/${h}`,
          thumbnail: `https://picsum.photos/seed/${seed}/200/200`,
          prompt,
          size: `${w}x${h}`,
          createdAt: new Date().toISOString(),
        }
        creativeAssets.value.unshift(asset)
        save(STORAGE_CREATIVES, creativeAssets.value)
        resolve(asset)
      }, 1200)
    })
  }

  function generateVideo(prompt: string, duration: number = 15): Promise<CreativeAsset> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const seed = Math.random().toString(36).slice(2, 8)
        const asset: CreativeAsset = {
          id: `vid_${Date.now()}`,
          type: 'video',
          url: `https://picsum.photos/seed/${seed}/640/360`,
          thumbnail: `https://picsum.photos/seed/${seed}/320/180`,
          prompt,
          duration,
          size: '640x360',
          createdAt: new Date().toISOString(),
        }
        creativeAssets.value.unshift(asset)
        save(STORAGE_CREATIVES, creativeAssets.value)
        resolve(asset)
      }, 2000)
    })
  }

  function deleteAsset(id: string) {
    creativeAssets.value = creativeAssets.value.filter((a) => a.id !== id)
    save(STORAGE_CREATIVES, creativeAssets.value)
  }

  // ========= 自动上架 =========

  /** 平台主语言映射：AI 生成标题时按目标市场语言输出 */
  const PLATFORM_LANG: Record<MarketplaceId, string> = {
    shopee: 'en',
    lazada: 'en',
    tiktok: 'en',
    tokopedia: 'id',
    noon: 'en',
    amazon_me: 'en',
    jd: 'zh',
    taobao: 'zh',
    pinduoduo: 'en',
  }

  /** 品类营销关键词（中英双语，随 AI 标题带入） */
  const CATEGORY_KW: Record<string, string> = {
    health_tonic: 'Organic Herbal Tonic · 天然草本',
    food_tea: 'Natural Wellness Tea · 天然养生',
    beauty: 'Natural Skincare · 天然护肤',
    electronics: 'New Tech · 新款科技',
    home_living: 'Home Essentials · 家居必备',
    fashion: 'Trendy Style · 时尚之选',
    outdoor: 'Outdoor Gear · 户外装备',
    crafts: 'Handmade Heritage · 匠心手作',
  }

  const TITLE_HOOKS = [
    'Wholesale · Fast Shipping',
    'Best Seller · Stock Ready',
    'Premium · Factory Direct',
    'Hot Sale · Global Delivery',
    'Top Rated · Bulk Discount',
    'New Arrival · Reliable Supplier',
  ]

  /** AI 生成多语言标题：按目标平台语言输出名称 + 品类卖点 + 营销钩子 */
  function generateProductTitles(product: Product, platformIds: MarketplaceId[]): Partial<Record<MarketplaceId, string>> {
    const titles: Partial<Record<MarketplaceId, string>> = {}
    platformIds.forEach((pid, i) => {
      const mp = marketplaces.value.find((m) => m.id === pid)
      const lang = PLATFORM_LANG[pid] || 'en'
      const base = tText(product.name, lang as LocaleCode)
      const kw = CATEGORY_KW[product.category] || 'Premium Quality · 高品质'
      const hook = TITLE_HOOKS[(pid.length + i + product.name.zh.length) % TITLE_HOOKS.length]
      titles[pid] = `${base} | ${kw} | ${hook} · ${mp?.name || ''}`
    })
    return titles
  }

  /**
   * 新增产品（创意工坊能力并入自动上架）：
   * 输入中英文名称即可，其余语言由 AI 自动补全，并生成默认主图与产品档案。
   */
  function addCustomProduct(input: {
    nameZh: string
    nameEn: string
    category: string
    price: number
    image?: string
  }): Product {
    const id = `cp_${Date.now()}`
    const name: LocaleText = {
      zh: input.nameZh,
      en: input.nameEn,
      ja: input.nameEn,
      ko: input.nameEn,
      es: input.nameEn,
      fr: input.nameEn,
      ar: input.nameEn,
      id: input.nameEn,
      ms: input.nameEn,
      vi: input.nameEn,
      th: input.nameEn,
      fil: input.nameEn,
    }
    const product: Product = {
      id,
      slug: id,
      category: input.category || 'health_tonic',
      price: input.price,
      currency: 'USD',
      rating: 5,
      reviewCount: 0,
      image: input.image || `https://picsum.photos/seed/${id}/400/400`,
      stock: 0,
      sales: 0,
      tags: [],
      name,
      description: name,
      detail: name,
      ingredients: name,
      usage: name,
    }
    customProducts.value.unshift(product)
    save(STORAGE_PRODUCTS, customProducts.value)
    return product
  }

  function deleteCustomProduct(id: string) {
    customProducts.value = customProducts.value.filter((p) => p.id !== id)
    save(STORAGE_PRODUCTS, customProducts.value)
  }

  function createListingTask(productId: string, platformIds: MarketplaceId[]): ListingTask {
    const product = products.find((p) => p.id === productId) || customProducts.value.find((p) => p.id === productId)
    const task: ListingTask = {
      id: `task_${Date.now()}`,
      productId,
      productName: product?.name || { zh: '未知', en: 'Unknown', ja: '不明', ko: '미상', es: 'Desconocido', fr: 'Inconnu' },
      marketplaces: platformIds,
      titles: {},
      status: 'generating',
      coverImage: product?.image,
      createdAt: new Date().toISOString(),
      progress: 10,
    }
    listingTasks.value.unshift(task)

    // 模拟 AI 生成多语言标题（按平台市场语言输出，标题间差异化）
    let p = 10
    const timer = setInterval(() => {
      p += 15
      task.progress = Math.min(p, 90)
      if (p >= 90) {
        clearInterval(timer)
        task.titles = product ? generateProductTitles(product, platformIds) : {}
        task.status = 'pending'
        save(STORAGE_LISTINGS, listingTasks.value)
      }
    }, 400)

    save(STORAGE_LISTINGS, listingTasks.value)
    return task
  }

  function publishTask(id: string) {
    const task = listingTasks.value.find((t) => t.id === id)
    if (task) {
      task.status = 'published'
      task.publishedAt = new Date().toISOString()
      task.progress = 100
      save(STORAGE_LISTINGS, listingTasks.value)
    }
  }

  function deleteListingTask(id: string) {
    listingTasks.value = listingTasks.value.filter((t) => t.id !== id)
    save(STORAGE_LISTINGS, listingTasks.value)
  }

  return {
    marketplaces,
    connectedIds,
    connectedMarketplaces,
    competitors,
    supplyChain,
    demands,
    listingTasks,
    creativeAssets,
    customProducts,
    competitorKeyword,
    competitorPlatform,
    filteredCompetitors,
    togglePlatform,
    refreshCompetitors,
    getCompetitorInsights,
    intelChannels,
    demandLeads,
    supplySources,
    procurementDb,
    refreshDemandLeads,
    importProcurementCsv,
    addProcurementRecord,
    deleteProcurementRecord,
    clearProcurementDb,
    exportProcurementCsv,
    generateImage,
    generateVideo,
    deleteAsset,
    generateProductTitles,
    addCustomProduct,
    deleteCustomProduct,
    createListingTask,
    publishTask,
    deleteListingTask,
  }
})
