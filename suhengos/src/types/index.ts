// 用户与认证相关类型
export type LoginMethod = 'password' | 'code'

export interface UserInfo {
  id: string
  email: string
  phone?: string
  name: string
  nickname: string
  avatar: string
  /** user 普通用户 / admin 管理员 / ops 运营 / dev 开发 */
  role: 'user' | 'admin' | 'ops' | 'dev'
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
// 基础 6 语言 + 中东（ar 阿拉伯语）+ 东南亚（id 印尼语、ms 马来语、vi 越南语、th 泰语、fil 菲律宾语）
export type LocaleCode = 'zh' | 'en' | 'ja' | 'ko' | 'es' | 'fr' | 'ar' | 'id' | 'ms' | 'vi' | 'th' | 'fil'

// ========== 家人管理 ==========
export type Relationship = 'self' | 'parent' | 'spouse' | 'child' | 'sibling' | 'other'

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
  supplier: string
  origin: string
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
