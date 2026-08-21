import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

/**
 * 素衡OS · 智能体中心（运营端）
 * 统一管理系统全部智能体的激活/停用状态，localStorage 持久化。
 * 智能体按业务域分组：中医健康智能体（tcm）/ 电商智能体（ecom）。
 */

export type AgentId =
  | 'order-alert'
  | 'auto-reply'
  | 'competitor'
  | 'supply'
  | 'demand'
  | 'creative'
  | 'listing'
  | 'logistics'
  | 'procurement'
  | 'returns'
  | 'distribution'
  | 'pricing'
  | 'constitution'
  | 'health-alert'
  | 'health-advice'

/** 智能体业务分组：中医健康 / 电商 */
export type AgentGroup = 'tcm' | 'ecom'

export interface AgentMeta {
  id: AgentId
  /** 业务分组：tcm = 中医健康智能体，ecom = 电商智能体 */
  group: AgentGroup
  /** i18n key：portal.agentsCenter.names.xxx */
  nameKey: string
  /** i18n key：portal.agentsCenter.descs.xxx */
  descKey: string
  /** Element Plus 图标名（全局注册） */
  icon: string
  /** 强调色 */
  accent: string
}

export const AGENT_LIST: AgentMeta[] = [
  // ---- 中医健康智能体 ----
  { id: 'constitution', group: 'tcm', nameKey: 'portal.agentsCenter.names.constitution', descKey: 'portal.agentsCenter.descs.constitution', icon: 'FirstAidKit', accent: '#8a5a2b' },
  { id: 'health-alert', group: 'tcm', nameKey: 'portal.agentsCenter.names.healthAlert', descKey: 'portal.agentsCenter.descs.healthAlert', icon: 'Warning', accent: '#c05f3a' },
  { id: 'health-advice', group: 'tcm', nameKey: 'portal.agentsCenter.names.healthAdvice', descKey: 'portal.agentsCenter.descs.healthAdvice', icon: 'Sunny', accent: '#4a8a3c' },
  // ---- 电商智能体 ----
  { id: 'order-alert', group: 'ecom', nameKey: 'portal.agentsCenter.names.orderAlert', descKey: 'portal.agentsCenter.descs.orderAlert', icon: 'Bell', accent: '#1a6b5c' },
  { id: 'auto-reply', group: 'ecom', nameKey: 'portal.agentsCenter.names.autoReply', descKey: 'portal.agentsCenter.descs.autoReply', icon: 'ChatDotRound', accent: '#2f7d5f' },
  { id: 'competitor', group: 'ecom', nameKey: 'portal.agentsCenter.names.competitor', descKey: 'portal.agentsCenter.descs.competitor', icon: 'DataAnalysis', accent: '#b8860b' },
  { id: 'supply', group: 'ecom', nameKey: 'portal.agentsCenter.names.supply', descKey: 'portal.agentsCenter.descs.supply', icon: 'Box', accent: '#3a7ca5' },
  { id: 'demand', group: 'ecom', nameKey: 'portal.agentsCenter.names.demand', descKey: 'portal.agentsCenter.descs.demand', icon: 'TrendCharts', accent: '#c05f3a' },
  { id: 'creative', group: 'ecom', nameKey: 'portal.agentsCenter.names.creative', descKey: 'portal.agentsCenter.descs.creative', icon: 'MagicStick', accent: '#8a5fbf' },
  { id: 'listing', group: 'ecom', nameKey: 'portal.agentsCenter.names.listing', descKey: 'portal.agentsCenter.descs.listing', icon: 'Upload', accent: '#4a8a3c' },
  { id: 'logistics', group: 'ecom', nameKey: 'portal.agentsCenter.names.logistics', descKey: 'portal.agentsCenter.descs.logistics', icon: 'Van', accent: '#34618e' },
  { id: 'procurement', group: 'ecom', nameKey: 'portal.agentsCenter.names.procurement', descKey: 'portal.agentsCenter.descs.procurement', icon: 'ShoppingCart', accent: '#a8642a' },
  { id: 'returns', group: 'ecom', nameKey: 'portal.agentsCenter.names.returns', descKey: 'portal.agentsCenter.descs.returns', icon: 'RefreshLeft', accent: '#6d7f3a' },
  { id: 'distribution', group: 'ecom', nameKey: 'portal.agentsCenter.names.distribution', descKey: 'portal.agentsCenter.descs.distribution', icon: 'Share', accent: '#3f8f8a' },
  { id: 'pricing', group: 'ecom', nameKey: 'portal.agentsCenter.names.pricing', descKey: 'portal.agentsCenter.descs.pricing', icon: 'PriceTag', accent: '#a04a58' },
]

const STORAGE_KEY = 'qh_ops_agents'

function loadActive(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Record<string, boolean>
      if (parsed && typeof parsed === 'object') return parsed
    }
  } catch {
    /* ignore */
  }
  // 默认激活：接单提醒 + 自动回复
  return { 'order-alert': true, 'auto-reply': true }
}

export const useAgentsStore = defineStore('opsAgents', () => {
  const active = ref<Record<string, boolean>>(loadActive())

  function persist() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(active.value))
  }

  function isActive(id: AgentId): boolean {
    return !!active.value[id]
  }

  function setActive(id: AgentId, on: boolean) {
    active.value[id] = on
    persist()
  }

  function toggle(id: AgentId) {
    setActive(id, !isActive(id))
  }

  const activeCount = computed(() => AGENT_LIST.filter((a) => !!active.value[a.id]).length)
  const totalCount = computed(() => AGENT_LIST.length)
  const allActive = computed(() => activeCount.value === totalCount.value)
  const automationRate = computed(() => Math.round((activeCount.value / totalCount.value) * 100))

  function activateAll() {
    AGENT_LIST.forEach((a) => {
      active.value[a.id] = true
    })
    persist()
  }

  function deactivateAll() {
    AGENT_LIST.forEach((a) => {
      active.value[a.id] = false
    })
    persist()
  }

  return {
    active,
    isActive,
    setActive,
    toggle,
    activeCount,
    totalCount,
    allActive,
    automationRate,
    activateAll,
    deactivateAll,
  }
})
