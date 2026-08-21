import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { ProcureLead, CrawlSettings } from '@/types'
import { MOCK_PROCURE_LEADS } from '@/mock/tradeData'

const STORAGE_KEY = 'qh_crawl_settings'

const DEFAULT_CRAWL: CrawlSettings = {
  enabled: true,
  frequency: 'hourly',
  sourceCustoms: true,
  sourceGoogle: true,
  sourceFacebook: true,
  sourceSocialME: true,
  sourceSocialSEA: true,
}

function loadSettings(): CrawlSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return { ...DEFAULT_CRAWL, ...JSON.parse(raw) }
  } catch { /* ignore */ }
  return { ...DEFAULT_CRAWL }
}

export const useProcurementStore = defineStore('procurement', () => {
  const leads = ref<ProcureLead[]>([...MOCK_PROCURE_LEADS])
  const crawl = ref<CrawlSettings>(loadSettings())
  const lastCrawlAt = ref<string>('')
  const crawling = ref(false)

  function persist() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(crawl.value))
  }

  function updateCrawl(patch: Partial<CrawlSettings>) {
    crawl.value = { ...crawl.value, ...patch }
    persist()
  }

  /** 模拟抓取运算：随机扰动需求量/热度/趋势，刷新 capturedAt */
  function runCrawl() {
    if (crawling.value) return
    crawling.value = true
    window.setTimeout(() => {
      leads.value = leads.value.map((l) => ({
        ...l,
        demandQty: Math.max(100, Math.round(l.demandQty * (0.9 + Math.random() * 0.25))),
        heat: Math.min(100, Math.max(30, Math.round(l.heat + (Math.random() * 10 - 5)))),
        trend: Math.round((l.trend + (Math.random() * 6 - 3)) * 10) / 10,
        capturedAt: new Date().toLocaleString('sv-GB').replace('T', ' ').slice(0, 16),
      }))
      lastCrawlAt.value = new Date().toLocaleString('sv-GB').replace('T', ' ').slice(0, 16)
      crawling.value = false
    }, 1200)
  }

  return { leads, crawl, lastCrawlAt, crawling, updateCrawl, runCrawl }
})
