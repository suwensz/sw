import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { ReturnRequest, ReturnStatus, PlatformOrder, DistributeRecord } from '@/types'
import { MOCK_RETURNS, MOCK_PLATFORM_ORDERS } from '@/mock/tradeData'

const STORAGE_RETURNS = 'qh_returns_state'
const STORAGE_DISTRIBUTE = 'qh_distribute_state'

interface DistributeSettings {
  defaultProfitPct: number
  autoPct: boolean
}

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (raw) return JSON.parse(raw) as T
  } catch { /* ignore */ }
  return fallback
}

export const useTradeStore = defineStore('trade', () => {
  // ===== 退货售后 =====
  const returns = ref<ReturnRequest[]>(load<ReturnRequest[]>(STORAGE_RETURNS, [...MOCK_RETURNS]))

  function persistReturns() {
    localStorage.setItem(STORAGE_RETURNS, JSON.stringify(returns.value))
  }

  function setReturnStatus(id: string, status: ReturnStatus) {
    const r = returns.value.find((x) => x.id === id)
    if (r) {
      r.status = status
      persistReturns()
    }
  }

  const returnStats = computed(() => ({
    pending: returns.value.filter((r) => r.status === 'pending').length,
    processing: returns.value.filter((r) => r.status === 'approved' || r.status === 'refunding').length,
    completed: returns.value.filter((r) => r.status === 'completed').length,
    refundTotal: Math.round(returns.value.filter((r) => r.status === 'completed').reduce((s, r) => s + r.amount, 0) * 10) / 10,
  }))

  // ===== 平台订单 =====
  const orders = ref<PlatformOrder[]>([...MOCK_PLATFORM_ORDERS])

  const orderStats = computed(() => ({
    pdd: orders.value.filter((o) => o.platform === 'pdd').length,
    jd: orders.value.filter((o) => o.platform === 'jd').length,
    taobao: orders.value.filter((o) => o.platform === 'taobao').length,
    totalAmount: Math.round(orders.value.reduce((s, o) => s + o.amount, 0) * 10) / 10,
  }))

  // ===== 分发订单 =====
  const distributeSettings = ref<DistributeSettings>(load<DistributeSettings>(STORAGE_DISTRIBUTE, { defaultProfitPct: 10, autoPct: true }))
  const distributeRecords = ref<DistributeRecord[]>([])

  function persistDistribute() {
    localStorage.setItem(STORAGE_DISTRIBUTE, JSON.stringify(distributeSettings.value))
  }

  function setDefaultProfitPct(pct: number) {
    distributeSettings.value.defaultProfitPct = pct
    persistDistribute()
  }

  function setAutoPct(on: boolean) {
    distributeSettings.value.autoPct = on
    persistDistribute()
  }

  /** 微信/QQ 一键分享分发（生成分享文案并写入分发记录） */
  function distributeOrder(
    order: PlatformOrder, channel: 'wechat' | 'qq', partner: string, profitPct: number,
  ): { record: DistributeRecord; shareText: string } {
    const pct = distributeSettings.value.autoPct ? distributeSettings.value.defaultProfitPct : profitPct
    const profit = Math.round(order.amount * (pct / 100) * 100) / 100
    const record: DistributeRecord = {
      id: `dr${Date.now()}`,
      orderNo: order.orderNo,
      product: order.product,
      amount: order.amount,
      channel,
      partner,
      profitPct: pct,
      profitAmount: profit,
      sharedAt: new Date().toLocaleString('sv-GB').replace('T', ' ').slice(0, 16),
    }
    distributeRecords.value.unshift(record)
    const chName = channel === 'wechat' ? '微信' : 'QQ'
    const productZh = order.product.zh
    const shareText = `【素衡OS 分发订单】\n订单号：${order.orderNo}\n商品：${productZh}\n订单金额：¥${order.amount}\n分润比例：${pct}%（预计分润 ¥${profit}）\n合作人：${partner}\n渠道：${chName}\n请点击链接确认接单 → https://suheng.os/d/${record.id}`
    return { record, shareText }
  }

  return {
    returns, setReturnStatus, returnStats,
    orders, orderStats,
    distributeSettings, distributeRecords, setDefaultProfitPct, setAutoPct, distributeOrder,
  }
})
