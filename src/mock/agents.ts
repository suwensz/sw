// 素衡OS 全系统智能体注册表 + 系统内容统计
// 「素衡素衡」总唤醒时，按此注册表逐个点亮智能体，并汇总系统全部内容
import { lt } from '@/utils/locale'
import type { LocaleText } from '@/types'
import { mockProducts } from '@/mock/products'
import { MOCK_DOMESTIC_PRODUCTS, DOMESTIC_CATEGORIES } from '@/mock/domesticData'
import { TCM_KNOWLEDGE } from '@/mock/tcmKnowledge'
import { SOCIAL_APPS, COUNTRY_SOCIAL_MAP } from '@/mock/socialData'
import { MARKETPLACES } from '@/mock/operations'

export type AgentGroupId = 'core' | 'health' | 'commerce' | 'social' | 'domestic'

export interface AgentInfo {
  id: string
  name: LocaleText
  group: AgentGroupId
  icon: string
  desc: LocaleText
  path: string
}

export const AGENT_GROUPS: Array<{ key: AgentGroupId; label: LocaleText; color: string }> = [
  { key: 'core', label: lt('中枢主控', 'Core Control'), color: '#8b5cf6' },
  { key: 'health', label: lt('中医健康', 'TCM Health'), color: '#1a6b5c' },
  { key: 'commerce', label: lt('跨境电商', 'Cross-Border'), color: '#d4a853' },
  { key: 'social', label: lt('社交客服', 'Social Support'), color: '#0ea5e9' },
  { key: 'domestic', label: lt('国内电商', 'Domestic E-commerce'), color: '#e02020' },
]

export const SYSTEM_AGENTS: AgentInfo[] = [
  // ===== 中枢主控 =====
  {
    id: 'master',
    group: 'core',
    icon: '🧠',
    path: '/chat',
    name: lt('素衡主控智能体', 'Suheng Master Agent'),
    desc: lt('唤醒响应、指令理解与任务分派的总调度中枢', 'Wake response, intent understanding and task dispatch'),
  },
  {
    id: 'i18n',
    group: 'core',
    icon: '🌐',
    path: '/profile',
    name: lt('多语言中枢', 'Multilingual Hub'),
    desc: lt('13 种语言实时互译与本地化适配', 'Real-time translation across 13 languages'),
  },

  // ===== 中医健康 =====
  {
    id: 'tcm-kb',
    group: 'health',
    icon: '📖',
    path: '/chat',
    name: lt('中医知识问答智能体', 'TCM Knowledge Agent'),
    desc: lt('方剂、药材、穴位、食疗知识问答', 'Formula, herb, acupoint and diet Q&A'),
  },
  {
    id: 'constitution',
    group: 'health',
    icon: '🩺',
    path: '/health/watch',
    name: lt('体质辨识智能体', 'Constitution Agent'),
    desc: lt('九种体质测评与五运六气推演', 'Nine-constitution test and Wu-Yun-Liu-Qi analysis'),
  },
  {
    id: 'family',
    group: 'health',
    icon: '👨‍👩‍👧',
    path: '/health/family',
    name: lt('家庭健康管家智能体', 'Family Health Agent'),
    desc: lt('家庭成员健康档案与守护', 'Family member profiles and health guard'),
  },
  {
    id: 'alert',
    group: 'health',
    icon: '🚨',
    path: '/health/alerts',
    name: lt('健康预警监控智能体', 'Health Alert Agent'),
    desc: lt('体征异常实时预警与分级推送', 'Real-time vital anomaly alerts'),
  },

  // ===== 跨境电商 =====
  {
    id: 'inquiry',
    group: 'commerce',
    icon: '💬',
    path: '/shop',
    name: lt('询盘接待智能体', 'Inquiry Reception Agent'),
    desc: lt('海外客户询盘 AI 自动接待与跟单', 'AI auto-reply and follow-up for overseas inquiries'),
  },
  {
    id: 'competitor',
    group: 'commerce',
    icon: '🔭',
    path: '/ops/competitor',
    name: lt('竞品监控智能体', 'Competitor Watch Agent'),
    desc: lt('全网竞品价格与动态监控', 'Global competitor price and trend monitoring'),
  },
  {
    id: 'supply',
    group: 'commerce',
    icon: '🏭',
    path: '/ops/supply',
    name: lt('供应链智能体', 'Supply Chain Agent'),
    desc: lt('供应商匹配、采购与货源管理', 'Supplier matching and procurement'),
  },
  {
    id: 'creative',
    group: 'commerce',
    icon: '🎨',
    path: '/ops/creative',
    name: lt('创意文案智能体', 'Creative Copy Agent'),
    desc: lt('多语言 Listing 文案与素材生成', 'Multilingual listing copy and assets'),
  },
  {
    id: 'logistics',
    group: 'commerce',
    icon: '🚢',
    path: '/ops/logistics',
    name: lt('物流跟踪智能体', 'Logistics Agent'),
    desc: lt('国际物流渠道比价与轨迹跟踪', 'Freight comparison and shipment tracking'),
  },
  {
    id: 'returns',
    group: 'commerce',
    icon: '↩️',
    path: '/ops/returns',
    name: lt('售后退换智能体', 'Returns Agent'),
    desc: lt('退换货审核、政策配置与分销', 'Return review, policy and distribution'),
  },

  // ===== 社交客服 =====
  {
    id: 'social-hub',
    group: 'social',
    icon: '📡',
    path: '/shop',
    name: lt('跨国社交客服智能体', 'Social Support Agent'),
    desc: lt('11 国主流社交软件客户在线沟通', 'Customer chat on 11 mainstream social apps'),
  },

  // ===== 国内电商 =====
  {
    id: 'seller',
    group: 'domestic',
    icon: '🧾',
    path: '/domestic/dashboard',
    name: lt('卖家接单智能体', 'Seller Order Agent'),
    desc: lt('淘宝/京东/拼多多订单自动接收与处理', 'Auto order intake for Taobao/JD/PDD'),
  },
  {
    id: 'domestic-product',
    group: 'domestic',
    icon: '📦',
    path: '/domestic/products',
    name: lt('商品管理智能体', 'Product Mgmt Agent'),
    desc: lt('办公、项目书、漫剧、短剧多平台上架管理', 'Multi-platform listing of office/plan/comic/drama'),
  },
  {
    id: 'domestic-ops',
    group: 'domestic',
    icon: '⚡',
    path: '/domestic/orders',
    name: lt('订单履约智能体', 'Order Fulfillment Agent'),
    desc: lt('接单-发货-完成全流程自动流转', 'Full accept-ship-complete workflow'),
  },
]

export function agentsByGroup(group: AgentGroupId): AgentInfo[] {
  return SYSTEM_AGENTS.filter((a) => a.group === group)
}

/** 系统全部内容统计（唤醒报告用） */
export interface SystemContentStats {
  agents: number
  crossBorderProducts: number
  domesticProducts: number
  domesticCategories: number
  knowledgeEntries: number
  socialApps: number
  countries: number
  languages: number
  marketplaces: number
}

export function systemContentStats(): SystemContentStats {
  return {
    agents: SYSTEM_AGENTS.length,
    crossBorderProducts: mockProducts.length,
    domesticProducts: MOCK_DOMESTIC_PRODUCTS.length,
    domesticCategories: DOMESTIC_CATEGORIES.length,
    knowledgeEntries: TCM_KNOWLEDGE.length,
    socialApps: SOCIAL_APPS.length,
    countries: COUNTRY_SOCIAL_MAP.length,
    languages: 13,
    marketplaces: MARKETPLACES.length,
  }
}
