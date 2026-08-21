<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useOpsStore } from '@/stores/ops'
import { tText } from '@/i18n'
import { localizeNumber } from '@/utils/numbers'

const { t, locale } = useI18n()
const ops = useOpsStore()

const sortedDemands = computed(() => [...ops.demands].sort((a, b) => b.opportunity - a.opportunity))

function sparklinePoints(values: number[]) {
  const max = Math.max(...values)
  const min = Math.min(...values)
  const range = max - min || 1
  return values.map((v, i) => {
    const x = (i / (values.length - 1)) * 100
    const y = 100 - ((v - min) / range) * 100
    return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`
  }).join(' ')
}

function competitionType(c: string) {
  return c === 'low' ? 'success' : c === 'medium' ? 'warning' : 'danger'
}

function platformName(id: string) {
  return ops.marketplaces.find((m) => m.id === id)?.name || id
}
</script>

<template>
  <div class="demand-page qh-container">
    <div class="page-header">
      <h1>{{ t('ops.demand.title') }}</h1>
      <p>{{ t('ops.subtitle') }}</p>
    </div>

    <section class="hot-keywords qh-card">
      <h3><el-icon><TrendCharts /></el-icon> {{ t('ops.demand.hotKeywords') }}</h3>
      <div class="keywords-cloud">
        <span
          v-for="d in sortedDemands.slice(0, 12)"
          :key="d.id"
          class="keyword-tag"
          :style="{ fontSize: `${13 + d.opportunity / 8}px` }"
        >
          {{ tText(d.keyword, locale as any) }}
        </span>
      </div>
    </section>

    <section class="demand-grid">
      <div v-for="d in sortedDemands" :key="d.id" class="demand-card qh-card">
        <div class="demand-head">
          <h3>{{ tText(d.keyword, locale as any) }}</h3>
          <div class="opp-score" :title="t('ops.demand.opportunity')">
            <span>{{ localizeNumber(d.opportunity, locale) }}</span>
          </div>
        </div>
        <div class="demand-meta">
          <el-tag size="small" effect="plain">{{ platformName(d.region) }}</el-tag>
          <el-tag size="small" :type="competitionType(d.competition)">{{ t(`ops.demand.${d.competition}`) }}</el-tag>
        </div>
        <svg class="trend-chart" viewBox="0 0 100 100" preserveAspectRatio="none">
          <path :d="sparklinePoints(d.trend)" fill="none" stroke="var(--color-primary)" stroke-width="2" vector-effect="non-scaling-stroke" />
        </svg>
        <div class="demand-stats">
          <div>
            <label>{{ t('ops.demand.volume') }}</label>
            <strong>{{ localizeNumber(d.searchVolume, locale) }}</strong>
          </div>
          <div>
            <label>{{ t('ops.demand.growth') }}</label>
            <strong :class="d.growthRate > 0 ? 'up' : 'down'">
              {{ d.growthRate > 0 ? '+' : '' }}{{ localizeNumber(d.growthRate, locale) }}%
            </strong>
          </div>
          <div>
            <label>{{ t('ops.demand.avgPrice') }}</label>
            <strong>${{ localizeNumber(d.avgPrice, locale) }}</strong>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.demand-page { padding: 24px 0 48px; }
.page-header { margin-bottom: 20px; }
.page-header h1 { font-size: 24px; margin: 0 0 4px; }
.page-header p { color: var(--color-text-secondary); margin: 0; font-size: 14px; }

.hot-keywords { padding: 22px; margin-bottom: 20px; }
.hot-keywords h3 { font-size: 15px; margin: 0 0 14px; display: flex; align-items: center; gap: 8px; color: var(--color-primary); }
.keywords-cloud { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; }
.keyword-tag { padding: 6px 14px; background: var(--color-bg-soft); border-radius: 999px; color: var(--color-primary-dark); font-weight: 500; cursor: pointer; transition: all 0.2s; }
.keyword-tag:hover { background: var(--color-primary); color: #fff; }

.demand-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px; }
.demand-card { padding: 20px; transition: all 0.2s; }
.demand-card:hover { transform: translateY(-2px); box-shadow: 0 4px 20px rgba(26, 107, 92, 0.12); }
.demand-head { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px; }
.demand-head h3 { font-size: 16px; margin: 0; color: var(--color-text-primary); }
.opp-score { width: 44px; height: 44px; border-radius: 50%; background: linear-gradient(135deg, var(--color-primary), var(--color-accent)); color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 16px; flex-shrink: 0; }
.demand-meta { display: flex; gap: 6px; margin-bottom: 14px; }
.trend-chart { width: 100%; height: 60px; margin-bottom: 14px; }
.demand-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
.demand-stats > div { text-align: center; }
.demand-stats label { display: block; font-size: 11px; color: var(--color-text-secondary); margin-bottom: 4px; }
.demand-stats strong { font-size: 15px; color: var(--color-text-primary); }
.demand-stats strong.up { color: var(--color-success); }
.demand-stats strong.down { color: var(--color-danger); }
</style>
