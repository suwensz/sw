import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Shipment, LogisticsSettings, ShipmentStatus } from '@/types'
import { MOCK_SHIPMENTS, FREIGHT_CHANNELS, ZONE_FACTORS } from '@/mock/tradeData'
import { tText } from '@/i18n'
import { lt } from '@/utils/locale'

const STORAGE_SETTINGS = 'qh_logistics_settings'

const DEFAULT_SETTINGS: LogisticsSettings = {
  autoOrder: true,
  defaultChannel: 'yunexpress',
  autoSyncTracking: true,
}

function loadSettings(): LogisticsSettings {
  try {
    const raw = localStorage.getItem(STORAGE_SETTINGS)
    if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) }
  } catch { /* ignore */ }
  return { ...DEFAULT_SETTINGS }
}

export const useLogisticsStore = defineStore('logistics', () => {
  const shipments = ref<Shipment[]>([...MOCK_SHIPMENTS])
  const settings = ref<LogisticsSettings>(loadSettings())

  function persist() {
    localStorage.setItem(STORAGE_SETTINGS, JSON.stringify(settings.value))
  }

  function updateSettings(patch: Partial<LogisticsSettings>) {
    settings.value = { ...settings.value, ...patch }
    persist()
  }

  function findByTracking(no: string): Shipment | undefined {
    return shipments.value.find((s) => s.trackingNo.toLowerCase() === no.trim().toLowerCase())
  }

  function markShipped(id: string) {
    const s = shipments.value.find((x) => x.id === id)
    if (s) {
      s.status = 'shipped'
      s.updatedAt = new Date().toLocaleString('sv-GB').replace('T', ' ').slice(0, 16)
      s.events.unshift({ time: s.updatedAt, text: lt('已手动下单并发货', 'Booked & shipped manually') })
    }
  }

  function countByStatus(st: ShipmentStatus) {
    return shipments.value.filter((s) => s.status === st).length
  }

  /** 运费计算：渠道基准 + 目的区域系数 + 重量 */
  function calcFreight(channelId: string, zoneCode: string, weightKg: number): {
    freight: number; days: string; channelName: string; zoneName: string
  } {
    const ch = FREIGHT_CHANNELS.find((c) => c.id === channelId) || FREIGHT_CHANNELS[0]
    const zone = ZONE_FACTORS.find((z) => z.code === zoneCode) || ZONE_FACTORS[0]
    const freight = Math.round((ch.base + ch.perKg * Math.max(0.1, weightKg)) * zone.factor * 100) / 100
    return { freight, days: ch.days, channelName: tText(ch.name), zoneName: tText(zone.label) }
  }

  return { shipments, settings, updateSettings, findByTracking, markShipped, countByStatus, calcFreight }
})
