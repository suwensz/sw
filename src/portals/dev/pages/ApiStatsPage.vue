<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import * as echarts from 'echarts'
import { generateCallTrend, TOP_APIS } from '@/mock/devData'

const { t } = useI18n()

const range = ref<'7d' | '30d'>('7d')
const chartRef = ref<HTMLDivElement | null>(null)
let chart: echarts.ECharts | null = null

const trend = computed(() => generateCallTrend(range.value === '7d' ? 7 : 30))

const totalCalls = computed(() => trend.value.reduce((s, d) => s + d.value, 0))
const successRate = '99.2%'
const avgLatency = '46ms'
const quotaRemain = '68%'

const stats = computed(() => [
  { label: t('dev.apiStats.totalCalls'), value: totalCalls.value.toLocaleString(), desc: `${range.value === '7d' ? '7' : '30'} 日累计`, icon: 'DataLine' },
  { label: t('dev.apiStats.successRate'), value: successRate, desc: '错误率 0.8%', icon: 'CircleCheck' },
  { label: t('dev.apiStats.avgLatency'), value: avgLatency, desc: 'P95 118ms', icon: 'Timer' },
  { label: t('dev.apiStats.quotaRemain'), value: quotaRemain, desc: '本月配额 500 万次', icon: 'PieChart' },
])

const maxTop = Math.max(...TOP_APIS.map((a) => a.calls))

function renderChart() {
  if (!chartRef.value) return
  if (!chart) chart = echarts.init(chartRef.value)
  chart.setOption({
    tooltip: { trigger: 'axis' },
    grid: { left: 50, right: 20, top: 30, bottom: 30 },
    xAxis: { type: 'category', boundaryGap: false, data: trend.value.map((d) => d.date) },
    yAxis: { type: 'value' },
    series: [
      {
        name: '调用量',
        type: 'line',
        smooth: true,
        symbolSize: 6,
        itemStyle: { color: '#1a6b5c' },
        lineStyle: { width: 2.5 },
        areaStyle: { color: 'rgba(26, 107, 92, 0.12)' },
        data: trend.value.map((d) => d.value),
      },
    ],
  })
}

function handleResize() {
  chart?.resize()
}

watch(range, () => renderChart())

onMounted(() => {
  renderChart()
  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  chart?.dispose()
  chart = null
})
</script>

<template>
  <div class="portal-page">
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px">
      <h2 style="margin: 0">{{ t('dev.menu.apiStats') }}</h2>
      <el-radio-group v-model="range" size="small">
        <el-radio-button value="7d">{{ t('dev.apiStats.range7d') }}</el-radio-button>
        <el-radio-button value="30d">{{ t('dev.apiStats.range30d') }}</el-radio-button>
      </el-radio-group>
    </div>
    <p class="portal-stat-desc">开放平台接口调用观测（演示数据，基于前端 Mock）。</p>

    <div class="portal-stat-grid">
      <div v-for="s in stats" :key="s.label" class="portal-stat-card">
        <div class="portal-stat-label">{{ s.label }}</div>
        <div class="portal-stat-value">{{ s.value }}</div>
        <div class="portal-stat-desc">{{ s.desc }}</div>
      </div>
    </div>

    <el-card shadow="never" style="margin-bottom: 16px">
      <template #header><b>{{ t('dev.apiStats.callTrend') }}</b></template>
      <div ref="chartRef" style="height: 300px"></div>
    </el-card>

    <el-card shadow="never">
      <template #header><b>{{ t('dev.apiStats.topApis') }}</b></template>
      <div v-for="api in TOP_APIS" :key="api.path" class="top-api-row">
        <code class="top-api-path">{{ api.path }}</code>
        <el-progress
          :percentage="Math.round((api.calls / maxTop) * 100)"
          :stroke-width="10"
          :format="() => api.calls.toLocaleString()"
        />
      </div>
    </el-card>
  </div>
</template>

<style scoped>
.top-api-row {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 12px;
}
.top-api-path {
  font-family: Consolas, monospace;
  font-size: 13px;
  color: var(--color-primary-dark);
  width: 200px;
  flex-shrink: 0;
}
.top-api-row .el-progress {
  flex: 1;
}
</style>
