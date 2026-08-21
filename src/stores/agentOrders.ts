import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

/**
 * 素衡OS · 接单智能体订单（运营端）
 * 接单提醒智能体产生的跨境订单唯一数据源：
 * - 悬浮球（OrderAgentWidget）实时写入新订单 / 更新状态
 * - 「订单管理」页（OrderManagePage · 接单智能体页签）实时读取
 * 两端通过 Pinia 响应式联动，localStorage 持久化。
 */

export type AgentOrderStatus = 'pending' | 'handled' | 'ignored'

/** 订单渠道：跨境批发 / 淘宝 / 拼多多 / 京东 / 抖音 / 快速订单 */
export type AgentOrderChannel = 'overseas' | 'taobao' | 'pdd' | 'jd' | 'douyin' | 'quick'

export interface AgentOrderRecord {
  id: number
  /** 订单渠道（跨境订单按国家，国内渠道为办公文件制作订单） */
  channel: AgentOrderChannel
  /** 订单来源国（ISO 代码：AE/SA/TH/VN/ID/MY/PH；国内渠道为 CN） */
  country: string
  /** 客户姓名（语音播报使用） */
  customerName: string
  orderNo: string
  productName: string
  /** 办公文件制作订单的文件类型（PPT/PDF/可研报告/立项报告/环评报告等） */
  docType?: string
  unit: string
  quantity: number
  /** 按国别本地币种计价金额 */
  amount: number
  /** 本地币种符号（AED/SAR/THB/₫/Rp/RM/₱/¥） */
  currency: string
  shipRequirement: string
  qualityRequirement: string
  sample: boolean
  isWholesale: boolean
  shipDate: string
  eta: string
  createdAt: number
  status: AgentOrderStatus
}

const STORAGE_KEY = 'qh_agent_orders_v2'
/** 订单数据库容量（接单智能体订单提醒 1000 条） */
const MAX_RECORDS = 1000

function loadOrders(): AgentOrderRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as AgentOrderRecord[]
      if (Array.isArray(parsed)) return parsed
    }
  } catch {
    /* ignore */
  }
  return []
}

export const useAgentOrdersStore = defineStore('agentOrders', () => {
  const orders = ref<AgentOrderRecord[]>(loadOrders())

  function persist() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(orders.value))
    } catch {
      /* ignore */
    }
  }

  /** 新订单到达（接单智能体推送） */
  function receiveOrder(order: AgentOrderRecord) {
    orders.value.unshift(order)
    if (orders.value.length > MAX_RECORDS) orders.value.length = MAX_RECORDS
    persist()
  }

  /** 批量预置（首次打开时填充历史订单；不足目标容量时补足至订单数据库规模） */
  function seedOrders(list: AgentOrderRecord[]) {
    const target = Math.min(list.length, MAX_RECORDS)
    if (orders.value.length >= target) return
    orders.value = [...list.slice(0, target), ...orders.value].slice(0, MAX_RECORDS)
    persist()
  }

  /** 更新订单处理状态（接单 / 忽略） */
  function setStatus(id: number, status: AgentOrderStatus) {
    const order = orders.value.find((o) => o.id === id)
    if (!order) return
    order.status = status
    persist()
  }

  const pendingOrders = computed(() => orders.value.filter((o) => o.status === 'pending'))
  const pendingCount = computed(() => pendingOrders.value.length)
  const handledCount = computed(() => orders.value.filter((o) => o.status === 'handled').length)

  /** 待处理订单总金额（按单汇总，多币种仅供运营参考） */
  const pendingAmount = computed(() =>
    Math.round(pendingOrders.value.reduce((s, o) => s + o.amount, 0) * 100) / 100,
  )

  return {
    orders,
    receiveOrder,
    seedOrders,
    setStatus,
    persist,
    pendingOrders,
    pendingCount,
    handledCount,
    pendingAmount,
  }
})
