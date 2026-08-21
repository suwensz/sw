// 用户与认证相关类型
export type LoginMethod = 'password' | 'code'

export interface UserInfo {
  id: string
  email: string
  phone?: string
  name: string
  nickname: string
  avatar: string
  role: 'user' | 'admin'
  locale: string
  healthProfile?: HealthProfile
  createdAt: string
}

export interface HealthProfile {
  gender?: 'male' | 'female' | 'other'
  age?: number
  birthYear?: number
  height?: number
  weight?: number
  constitution?: string
  allergies?: string[]
  conditions?: string[]
  chronicConditions?: string[]
}

export interface LoginPayload {
  account: string
  password?: string
  code?: string
  method: LoginMethod
}

export interface RegisterPayload {
  account: string
  password: string
  nickname: string
  verificationCode: string
  healthProfile?: HealthProfile
}

// 商品相关类型
export interface Product {
  id: string
  slug: string
  category: string
  price: number
  currency: string
  originalPrice?: number
  rating: number
  reviewCount: number
  image: string
  images?: string[]
  stock: number
  sales: number
  tags: string[]
  constitutionTags?: string[]
  name: LocaleText
  description: LocaleText
  detail: LocaleText
  ingredients: LocaleText
  usage: LocaleText
}

export interface LocaleText {
  zh: string
  /** 港澳：繁體中文（未提供时回退 zh） */
  'zh-TW'?: string
  en: string
  ja: string
  ko: string
  es: string
  fr: string
  /** 中东：阿拉伯语 */
  ar?: string
  /** 东南亚：印尼语 / 马来语 / 越南语 / 泰语 / 菲律宾语 */
  id?: string
  ms?: string
  vi?: string
  th?: string
  fil?: string
}

export interface CartItem {
  productId: string
  quantity: number
  product: Product
}

export interface ShippingMethod {
  id: string
  name: LocaleText
  description: LocaleText
  price: number
  estimatedDays: string
}

export interface CurrencyOption {
  code: string
  symbol: string
  rate: number
  label: LocaleText
}

// 体质测评相关类型
export interface ConstitutionQuestion {
  id: number
  dimension: string
  question: LocaleText
  options: Array<{
    score: number
    label: LocaleText
  }>
}

export interface ConstitutionType {
  id: string
  name: LocaleText
  description: LocaleText
  characteristics: LocaleText
  suggestions: LocaleText
  dietTips: LocaleText
  color: string
}

export interface AssessmentResult {
  primaryType: string
  scores: Record<string, number>
  completedAt: string
}

// 对话相关类型
export interface Conversation {
  id: string
  title: string
  lastMessage: string
  updatedAt: string
  unread: number
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  products?: Product[]
}

// 多语言类型
// 基础 6 语言 + 港澳（zh-TW 繁體中文）+ 中东（ar 阿拉伯语）+ 东南亚（id 印尼语、ms 马来语、vi 越南语、th 泰语、fil 菲律宾语）
export type LocaleCode = 'zh' | 'zh-TW' | 'en' | 'ja' | 'ko' | 'es' | 'fr' | 'ar' | 'id' | 'ms' | 'vi' | 'th' | 'fil'

/** 语言所属区域分组（多语言选择栏按区域展示） */
export type LangRegion = 'mainland' | 'hkmo' | 'mideast' | 'sea' | 'global'

// ========== 家人管理 ==========
/** 预设关系 + 允许自定义关系（如：爷爷、外婆、岳母等直接输入） */
export type Relationship = 'self' | 'parent' | 'spouse' | 'child' | 'sibling' | 'other' | (string & {})

export interface FamilyMember {
  id: string
  name: string
  avatar: string
  relationship: Relationship
  gender: 'male' | 'female' | 'other'
  birthDate: string // 阳历 YYYY-MM-DD（用于年龄与五运六气推算）
  birthTime?: string // 出生时辰 HH:mm
  /** 出生日期历法类型：solar=阳历（默认），lunar=阴历 */
  calendarType?: 'solar' | 'lunar'
  /** 阴历出生日期（阴历模式录入时保存） */
  lunarBirth?: {
    year: number
    month: number
    day: number
    isLeap: boolean
  }
  height?: number
  weight?: number
  constitution?: string
  watchId?: string
  createdAt: string
}

// ========== 五运六气 / 三因司天 ==========
export interface WuYunLiuQi {
  year: number
  yearGan: string // 年干
  yearZhi: string // 年支
  zhuYun: string // 主运（五步）
  siTian: string // 司天
  zaiQuan: string // 在泉
  keQi: string[] // 客气六步
  zhuQi: string[] // 主气六步
  climateRisk: LocaleText // 气候健康风险
  susceptibleOrgans: string[] // 易感脏腑
  advice: LocaleText // 调养建议
}

export interface ForecastDay {
  date: string
  solarTerm: string // 节气
  qiPhase: string // 气位
  weather: string
  temperatureRange: string
  riskLevel: 'low' | 'medium' | 'high'
  riskOrgans: string[]
  advice: LocaleText
  dietRecipes: DietRecipe[]
}

export interface DietRecipe {
  id: string
  name: LocaleText
  ingredients: string[]
  effect: LocaleText
  constitution: string[]
}

// ========== 健康预警 ==========
export type AlertSeverity = 'critical' | 'warning' | 'info' | 'success'
export type AlertCategory = 'vital' | 'chronic' | 'climate' | 'device' | 'medicine' | 'family'

export interface HealthAlert {
  id: string
  memberId: string
  memberName: string
  category: AlertCategory
  severity: AlertSeverity
  title: LocaleText
  content: LocaleText
  metric?: { label: string; value: string; unit: string; threshold: string }
  suggestion: LocaleText
  source: 'watch' | 'wuyun' | 'sanyin' | 'ai'
  createdAt: string
  isRead: boolean
  isPushed: boolean
  voiceText?: LocaleText
}

// ========== 智能手表 ==========
export type WatchStatus = 'online' | 'offline' | 'charging' | 'syncing'

export interface VitalReading {
  timestamp: string
  value: number
}

export interface EcgPoint {
  t: number
  v: number
}

export interface HealthMetric {
  key: string
  label: LocaleText
  value: number
  unit: string
  status: 'normal' | 'low' | 'high' | 'critical'
  normalRange: string
  trend: 'up' | 'down' | 'stable'
  history: VitalReading[]
  lastSync: string
}

export interface SmartWatch {
  id: string
  name: string
  model: string
  serial: string
  mac: string
  firmware: string
  battery: number
  status: WatchStatus
  lastSync: string
  memberId: string
  memberName: string
  metrics: HealthMetric[]
  ecg?: EcgPoint[]
  worn: boolean
}

// ========== 健康预警推送设置 ==========
/** 单项监测指标风险阈值（低于 low / 高于 high 为警告，越过 critical 为紧急） */
export interface MetricThreshold {
  /** 低限（低于此值预警） */
  low: number
  /** 高限（高于此值预警） */
  high: number
  /** 紧急限（越过此值紧急推送） */
  critical: number
}

/** 人群推送规则 */
export interface CrowdPushRules {
  /** 老年人（≥60岁）推送 */
  elderly: boolean
  /** 慢病人群（有慢病指标异常史）推送 */
  chronic: boolean
  /** 儿童（≤12岁）推送 */
  children: boolean
}

export interface PushSettings {
  /** 推送总开关 */
  enabled: boolean
  /** 白天时段开始 HH:mm */
  dayStart: string
  /** 白天时段结束 HH:mm（此后进入夜间节奏） */
  dayEnd: string
  /** 白天推送最小间隔（分钟） */
  dayIntervalMin: number
  /** 夜间推送最小间隔（分钟） */
  nightIntervalMin: number
  /** 夜间免打扰：仅推送紧急级别 */
  nightCriticalOnly: boolean
  /** 各监测指标风险阈值（key 同 HealthMetric.key） */
  metricThresholds: Record<string, MetricThreshold>
  /** 人群推送规则 */
  crowdRules: CrowdPushRules
  /** 按家人启用推送（ memberId -> enabled ） */
  memberPush: Record<string, boolean>
}

// ========== 电商运营工具 ==========
export type MarketplaceId = 'shopee' | 'lazada' | 'tiktok' | 'tokopedia' | 'noon' | 'amazon_me' | 'jd' | 'taobao' | 'pinduoduo'

export interface Marketplace {
  id: MarketplaceId
  name: string
  region: LocaleText
  currency: string
  flag: string
  connected: boolean
}

export interface CompetitorProduct {
  id: string
  title: string
  platform: MarketplaceId
  price: number
  currency: string
  sales30d: number
  rating: number
  reviews: number
  stockStatus: 'in_stock' | 'low' | 'out'
  url: string
  image: string
  delta?: number
}

export interface SupplyChainItem {
  id: string
  productId: string
  productName: LocaleText
  /** 供应商（多语言：zh/en，其余语言回退英文） */
  supplier: Partial<LocaleText> & Pick<LocaleText, 'zh' | 'en'>
  /** 产地（多语言：zh/en，其余语言回退英文） */
  origin: Partial<LocaleText> & Pick<LocaleText, 'zh' | 'en'>
  batch: string
  stock: number
  inboundDate: string
  leadTimeDays: number
  cost: number
  status: 'in_stock' | 'transit' | 'production' | 'shortage'
  qualityGrade: 'A' | 'B' | 'C'
}

export interface MarketDemand {
  id: string
  keyword: LocaleText
  category: string
  region: MarketplaceId
  searchVolume: number
  growthRate: number
  competition: 'low' | 'medium' | 'high'
  trend: number[] // 12 周趋势
  avgPrice: number
  opportunity: number
}

export type ListingTaskStatus = 'draft' | 'generating' | 'pending' | 'published' | 'failed'

export interface ListingTask {
  id: string
  productId: string
  productName: LocaleText
  marketplaces: MarketplaceId[]
  titles: Partial<Record<MarketplaceId, string>>
  status: ListingTaskStatus
  coverImage?: string
  videoUrl?: string
  createdAt: string
  publishedAt?: string
  progress: number
}

export type AssetType = 'image' | 'video'

export interface CreativeAsset {
  id: string
  type: AssetType
  productId?: string
  url: string
  thumbnail?: string
  prompt?: string
  duration?: number
  size?: string
  createdAt: string
}

// ========= 竞品分析：需求情报 / 供应链源 / 采购数据库 =========

/** 需求情报渠道类型 */
export type IntelChannelType = 'social' | 'search' | 'b2b'

export interface IntelChannel {
  id: string
  name: LocaleText
  type: IntelChannelType
  region: LocaleText
  audience: 'B2B' | 'B2C' | 'B2B+B2C'
  desc: LocaleText
  connected: boolean
}

export interface DemandLead {
  id: string
  channelId: string
  keyword: LocaleText
  side: 'B2B' | 'B2C'
  market: LocaleText
  demandCount: number
  buyers: number
  avgOrderValue: number
  currency: string
  hot: boolean
}

export type SupplySourceType = 'cloud' | 'dropship' | 'domestic' | 'overseas'

export interface SupplySource {
  id: string
  name: LocaleText
  type: SupplySourceType
  region: LocaleText
  categories: LocaleText
  moq: number
  priceIndex: number
  leadTimeDays: number
  rating: number
  connected: boolean
}

export interface ProcurementRecord {
  id: string
  name: string
  category: string
  price: number
  currency: string
  supplier: string
  source: string
  moq: number
  note?: string
  importedAt: string
}

// ========= 社交软件 / 国家匹配 =========

export type SocialAppId =
  | 'wechat' | 'qq' | 'skype' | 'msn' | 'yahoo'
  | 'whatsapp' | 'line' | 'zalo' | 'messenger' | 'telegram' | 'viber'

export interface SocialApp {
  id: SocialAppId
  name: LocaleText
  color: string
}

export type CountryRegion = 'east_asia' | 'southeast_asia' | 'middle_east' | 'europe' | 'americas' | 'oceania'

export interface CountrySocialInfo {
  code: string
  flag: string
  name: LocaleText
  region: CountryRegion
  apps: SocialAppId[]          // 按主流程度排序
}

// ========= 物流 =========

export type ShipmentStatus = 'pending' | 'shipped' | 'transit' | 'delivered' | 'exception'

export interface Shipment {
  id: string
  trackingNo: string
  orderNo: string
  platform: string
  carrier: string
  channel: string
  destination: string          // 国家代码
  weightKg: number
  freight: number              // USD
  status: ShipmentStatus
  updatedAt: string
  events: { time: string; text: LocaleText }[]
}

export interface LogisticsSettings {
  autoOrder: boolean           // 物流下单自动/手动
  defaultChannel: string
  autoSyncTracking: boolean
}

// ========= 退货售后 =========

export type ReturnStatus = 'pending' | 'approved' | 'refunding' | 'completed' | 'rejected'

export interface ReturnRequest {
  id: string
  orderNo: string
  buyer: string
  country: string
  product: LocaleText
  qty: number
  amount: number               // USD
  reason: 'quality' | 'damaged' | 'wrong' | 'not_as_described' | 'no_reason' | 'late'
  status: ReturnStatus
  appliedAt: string
}

// ========= 采购信息（B/C 端）=========

export type ProcureSide = 'B2B' | 'B2C'

export interface ProcureLead {
  id: string
  hsCode: string
  keyword: LocaleText
  side: ProcureSide
  buyerType: string            // 海外批发商 / 零售卖家 / 个人买家
  country: string
  sources: string[]            // google / facebook / customs / social_me / social_sea
  demandQty: number
  unit: string
  priceRangeUsd: [number, number]
  heat: number                 // 0-100 运算热度
  trend: number                // 环比 %
  capturedAt: string
}

export interface CrawlSettings {
  enabled: boolean
  frequency: 'hourly' | 'daily'
  sourceCustoms: boolean
  sourceGoogle: boolean
  sourceFacebook: boolean
  sourceSocialME: boolean
  sourceSocialSEA: boolean
}

// ========= 我的订单 / 分发订单 =========

export type OrderPlatform = 'pdd' | 'jd' | 'taobao'

export interface PlatformOrder {
  id: string
  platform: OrderPlatform
  orderNo: string
  product: LocaleText
  qty: number
  amount: number               // CNY
  buyer: string
  status: 'paid' | 'shipped' | 'completed' | 'refunding'
  createdAt: string
}

export interface DistributeRecord {
  id: string
  orderNo: string
  product: LocaleText
  amount: number
  channel: 'wechat' | 'qq'
  partner: string
  profitPct: number
  profitAmount: number
  sharedAt: string
}

// ========= 支付端口 =========

export interface ExchangeRate {
  code: string                 // USD / EUR / AED ...
  symbol: string
  name: LocaleText
  rateToCny: number            // 1 外币 = ? 人民币
  autoDaily: boolean           // 按每天汇率自动计算
}

export interface PaymentSettings {
  settlementCny: boolean
  rates: ExchangeRate[]
  methods: { creditCard: boolean; wechat: boolean; alipay: boolean }
}

// ========= 国内电商（卖家角色）==========

/** 国内电商平台 */
export type DomesticPlatform = 'taobao' | 'jd' | 'pinduoduo'

/** 国内电商商品品类 */
export type DomesticCategory = 'office' | 'project_doc' | 'comic' | 'short_drama'

/** 商品上架状态 */
export type DomesticProductStatus = 'draft' | 'listed' | 'sold_out'

/** 国内电商商品 */
export interface DomesticProduct {
  id: string
  title: string
  category: DomesticCategory
  platforms: DomesticPlatform[]
  price: number                  // CNY
  originalPrice?: number
  stock: number
  sales: number
  image: string
  description: string
  status: DomesticProductStatus
  author?: string                // 漫剧/短剧作者
  episodes?: number              // 短剧集数
  format?: 'physical' | 'digital' // 实体/数字
  createdAt: number
  updatedAt: number
}

/** 订单状态 */
export type DomesticOrderStatus =
  | 'pending'      // 待接单
  | 'confirmed'    // 已接单
  | 'shipped'      // 已发货
  | 'completed'    // 已完成
  | 'refunded'     // 已退款
  | 'cancelled'    // 已取消

/** 国内电商订单 */
export interface DomesticOrder {
  id: string
  platform: DomesticPlatform
  orderNo: string
  productId: string
  productTitle: string
  productImage: string
  category: DomesticCategory
  qty: number
  amount: number                 // CNY
  buyer: string
  buyerAvatar?: string
  buyerPhone?: string
  address?: string
  remark?: string
  status: DomesticOrderStatus
  createdAt: number              // 下单时间戳
  confirmedAt?: number
  shippedAt?: number
  completedAt?: number
  trackingNo?: string
  carrier?: string
}

/** 卖家仪表盘统计 */
export interface DomesticDashboardStats {
  totalProducts: number
  totalOrders: number
  pendingOrders: number
  totalRevenue: number
  totalSales: number
  platformStats: {
    platform: DomesticPlatform
    productCount: number
    orderCount: number
    revenue: number
    pendingCount: number
  }[]
  categoryStats: {
    category: DomesticCategory
    productCount: number
    orderCount: number
    revenue: number
  }[]
}
