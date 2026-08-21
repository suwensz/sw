<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useProcurementStore } from '@/stores/procurement'
import { countryInfo } from '@/mock/socialData'
import { tText } from '@/i18n'
import { localizeNumber } from '@/utils/numbers'

const { t, locale } = useI18n()
const procurement = useProcurementStore()

const sideTab = ref<'all' | 'B2B' | 'B2C'>('all')

const sourceMeta: Record<string, { label: string; color: string }> = {
  customs: { label: '海关 HS', color: '#8e44ad' },
  google: { label: 'Google', color: '#4285f4' },
  facebook: { label: 'Facebook', color: '#1877f2' },
  social_me: { label: t('procurement.srcME'), color: '#c0392b' },
  social_sea: { label: t('procurement.srcSEA'), color: '#16a085' },
}

const filteredLeads = computed(() =>
  procurement.leads.filter((l) => sideTab.value === 'all' || l.side === sideTab.value),
)

function countryLabel(code: string) {
  const info = countryInfo(code)
  return info ? `${info.flag} ${tText(info.name)}` : code
}

function heatColor(heat: number) {
  if (heat >= 85) return '#d96b5c'
  if (heat >= 70) return '#e6a23c'
  return '#52a67a'
}

function runCrawlNow() {
  procurement.runCrawl()
}

const b2bCount = computed(() => procurement.leads.filter((l) => l.side === 'B2B').length)
const b2cCount = computed(() => procurement.leads.filter((l) => l.side === 'B2C').length)
</script>

<template>
  <div class="procure-page qh-container">
    <div class="page-head">
      <h1>{{ t('procurement.title') }}</h1>
      <p>{{ t('procurement.subtitle') }}</p>
    </div>

    <!-- 抓取设置条 -->
    <div class="crawl-bar qh-card">
      <div class="crawl-status">
        <span :class="['crawl-dot', { on: procurement.crawl.enabled, busy: procurement.crawling }]"></span>
        <span class="crawl-text">
          {{ procurement.crawl.enabled ? t('procurement.crawlOn', {
            freq: procurement.crawl.frequency === 'hourly' ? t('procurement.freqHourly') : t('procurement.freqDaily')
          }) : t('procurement.crawlOff') }}
        </span>
        <span v-if="procurement.lastCrawlAt" class="crawl-last">
          {{ t('procurement.lastCrawl') }}: {{ procurement.lastCrawlAt }}
        </span>
      </div>
      <div class="crawl-actions">
        <el-switch v-model="procurement.crawl.enabled" @change="procurement.updateCrawl({ enabled: procurement.crawl.enabled })" />
        <el-radio-group
          :model-value="procurement.crawl.frequency"
          size="small"
          @update:model-value="(v: any) => procurement.updateCrawl({ frequency: v })"
        >
          <el-radio-button value="hourly">{{ t('procurement.freqHourly') }}</el-radio-button>
          <el-radio-button value="daily">{{ t('procurement.freqDaily') }}</el-radio-button>
        </el-radio-group>
        <el-button type="primary" size="small" :loading="procurement.crawling" @click="runCrawlNow">
          {{ t('procurement.crawlNow') }}
        </el-button>
      </div>
    </div>

    <!-- 数据源开关 -->
    <div class="sources-bar qh-card">
      <span class="sources-title">{{ t('procurement.sources') }}：</span>
      <el-checkbox v-model="procurement.crawl.sourceCustoms" @change="procurement.updateCrawl({ sourceCustoms: procurement.crawl.sourceCustoms })">海关 HS 编码</el-checkbox>
      <el-checkbox v-model="procurement.crawl.sourceGoogle" @change="procurement.updateCrawl({ sourceGoogle: procurement.crawl.sourceGoogle })">Google</el-checkbox>
      <el-checkbox v-model="procurement.crawl.sourceFacebook" @change="procurement.updateCrawl({ sourceFacebook: procurement.crawl.sourceFacebook })">Facebook</el-checkbox>
      <el-checkbox v-model="procurement.crawl.sourceSocialME" @change="procurement.updateCrawl({ sourceSocialME: procurement.crawl.sourceSocialME })">{{ t('procurement.srcME') }}</el-checkbox>
      <el-checkbox v-model="procurement.crawl.sourceSocialSEA" @change="procurement.updateCrawl({ sourceSocialSEA: procurement.crawl.sourceSocialSEA })">{{ t('procurement.srcSEA') }}</el-checkbox>
    </div>

    <!-- B/C 端统计 -->
    <div class="side-stats">
      <button :class="['side-chip', { active: sideTab === 'all' }]" @click="sideTab = 'all'">
        {{ t('procurement.all') }} <b>{{ procurement.leads.length }}</b>
      </button>
      <button :class="['side-chip b2b', { active: sideTab === 'B2B' }]" @click="sideTab = 'B2B'">
        {{ t('procurement.b2bTitle') }} <b>{{ b2bCount }}</b>
      </button>
      <button :class="['side-chip b2c', { active: sideTab === 'B2C' }]" @click="sideTab = 'B2C'">
        {{ t('procurement.b2cTitle') }} <b>{{ b2cCount }}</b>
      </button>
    </div>

    <!-- 采购需求列表 -->
    <el-table :data="filteredLeads" class="qh-card lead-table">
      <el-table-column prop="hsCode" :label="t('procurement.colHs')" width="100">
        <template #default="{ row }"><code class="hs-code">{{ row.hsCode }}</code></template>
      </el-table-column>
      <el-table-column :label="t('procurement.colKeyword')">
        <template #default="{ row }">
          <strong>{{ tText(row.keyword) }}</strong>
          <div class="src-dots">
            <span
              v-for="s in row.sources" :key="s"
              class="src-tag" :style="{ background: sourceMeta[s]?.color + '18', color: sourceMeta[s]?.color }"
            >{{ sourceMeta[s]?.label || s }}</span>
          </div>
        </template>
      </el-table-column>
      <el-table-column :label="t('procurement.colSide')" width="80">
        <template #default="{ row }">
          <span :class="['side-tag', row.side]">{{ row.side }}</span>
        </template>
      </el-table-column>
      <el-table-column :label="t('procurement.colBuyer')" width="110">
        <template #default="{ row }">{{ row.buyerType }}</template>
      </el-table-column>
      <el-table-column :label="t('procurement.colCountry')" width="120">
        <template #default="{ row }">{{ countryLabel(row.country) }}</template>
      </el-table-column>
      <el-table-column :label="t('procurement.colDemand')" width="110" sortable sort-by="demandQty">
        <template #default="{ row }">
          <span class="demand-num">{{ localizeNumber(row.demandQty, locale) }} {{ row.unit }}</span>
        </template>
      </el-table-column>
      <el-table-column :label="t('procurement.colPrice')" width="120">
        <template #default="{ row }">${{ row.priceRangeUsd[0] }}-{{ row.priceRangeUsd[1] }}</template>
      </el-table-column>
      <el-table-column :label="t('procurement.colHeat')" width="150">
        <template #default="{ row }">
          <div class="heat-cell">
            <div class="heat-track"><div class="heat-fill" :style="{ width: row.heat + '%', background: heatColor(row.heat) }"></div></div>
            <span class="trend" :class="row.trend >= 0 ? 'up' : 'down'">{{ row.trend >= 0 ? '▲' : '▼' }} {{ Math.abs(row.trend) }}%</span>
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="capturedAt" :label="t('procurement.colCaptured')" width="140" />
    </el-table>
  </div>
</template>

<style scoped>
.procure-page { padding: 32px 48px; }
.page-head { margin-bottom: 20px; }
.page-head h1 { font-size: 26px; font-weight: 600; margin: 0 0 6px; }
.page-head p { color: var(--color-text-secondary); margin: 0; }
.crawl-bar { padding: 14px 20px; display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 12px; flex-wrap: wrap; }
.crawl-status { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.crawl-dot { width: 10px; height: 10px; border-radius: 50%; background: var(--color-text-secondary); }
.crawl-dot.on { background: var(--color-success); }
.crawl-dot.busy { animation: crawl-blink 0.8s infinite; }
@keyframes crawl-blink { 50% { opacity: 0.3; } }
.crawl-text { font-size: 14px; font-weight: 500; }
.crawl-last { font-size: 12px; color: var(--color-text-secondary); }
.crawl-actions { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
.sources-bar { padding: 12px 20px; display: flex; align-items: center; gap: 16px; flex-wrap: wrap; margin-bottom: 16px; }
.sources-title { font-size: 13px; font-weight: 600; }
.side-stats { display: flex; gap: 10px; margin-bottom: 14px; }
.side-chip {
  padding: 8px 18px; border-radius: 999px; border: 1px solid var(--color-border);
  background: var(--color-bg-card); cursor: pointer; font-size: 14px; color: var(--color-text-regular);
}
.side-chip b { margin-left: 4px; color: var(--color-primary); }
.side-chip.active { border-color: var(--color-primary); color: var(--color-primary); background: rgba(26, 107, 92, 0.06); }
.side-chip.b2b.active { border-color: #8e44ad; color: #8e44ad; background: rgba(142, 68, 173, 0.06); }
.side-chip.b2c.active { border-color: #d96b5c; color: #d96b5c; background: rgba(217, 107, 92, 0.06); }
.lead-table { padding: 8px; }
.hs-code { font-family: monospace; background: var(--color-bg-soft); padding: 2px 6px; border-radius: 4px; font-size: 12px; }
.src-dots { display: flex; gap: 6px; margin-top: 6px; flex-wrap: wrap; }
.src-tag { font-size: 11px; padding: 1px 8px; border-radius: 999px; font-weight: 500; }
.side-tag { font-size: 12px; font-weight: 700; padding: 2px 8px; border-radius: 4px; }
.side-tag.B2B { color: #8e44ad; background: rgba(142, 68, 173, 0.1); }
.side-tag.B2C { color: #d96b5c; background: rgba(217, 107, 92, 0.1); }
.demand-num { font-weight: 600; color: var(--color-primary); }
.heat-cell { display: flex; align-items: center; gap: 8px; }
.heat-track { flex: 1; height: 8px; border-radius: 4px; background: var(--color-bg-soft); overflow: hidden; min-width: 60px; }
.heat-fill { height: 100%; border-radius: 4px; transition: width 0.4s; }
.trend { font-size: 12px; font-weight: 600; }
.trend.up { color: var(--color-danger); }
.trend.down { color: var(--color-success); }
@media (max-width: 768px) { .procure-page { padding: 16px; } }
</style>
