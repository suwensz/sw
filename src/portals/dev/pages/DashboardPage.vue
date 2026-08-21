<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import * as echarts from 'echarts'
import { useDevStore } from '@/stores/dev'
import { generateCallTrend } from '@/mock/devData'

const { t } = useI18n()
const router = useRouter()
const dev = useDevStore()

const trend = generateCallTrend(14)

const stats = computed(() => [
  { label: t('dev.dashboard.totalApps'), value: dev.apps.length, desc: `启用 ${dev.apps.filter((a) => a.status === 'active').length} 个`, icon: 'Grid' },
  { label: t('dev.dashboard.apiCalls'), value: (trend.reduce((s, d) => s + d.value, 0)).toLocaleString(), desc: '近 14 日', icon: 'DataLine' },
  { label: t('dev.dashboard.totalKeys'), value: dev.keys.filter((k) => k.status === 'active').length, desc: `密钥 ${dev.keys.length} 个`, icon: 'Key' },
  { label: t('dev.dashboard.quotaUsed'), value: '68%', desc: '本月配额 500 万次', icon: 'PieChart' },
])

const quickLinks = computed(() => [
  { title: t('dev.menu.apiStats'), desc: '调用量 / 成功率 / 延迟', to: '/api-stats', icon: 'DataLine' },
  { title: t('dev.menu.webhooks'), desc: '事件回调推送管理', to: '/webhooks', icon: 'Connection' },
  { title: t('dev.menu.sandbox'), desc: '沙箱联调环境', to: '/sandbox', icon: 'Monitor' },
  { title: t('dev.menu.alerts'), desc: '监控告警规则', to: '/alerts', icon: 'Bell' },
])

const chartRef = ref<HTMLDivElement | null>(null)
let chart: echarts.ECharts | null = null

function renderChart() {
  if (!chartRef.value) return
  if (!chart) chart = echarts.init(chartRef.value)
  chart.setOption({
    tooltip: { trigger: 'axis' },
    grid: { left: 50, right: 20, top: 30, bottom: 30 },
    xAxis: { type: 'category', boundaryGap: false, data: trend.map((d) => d.date) },
    yAxis: { type: 'value' },
    series: [
      {
        name: t('dev.dashboard.callTrend'),
        type: 'line',
        smooth: true,
        symbolSize: 5,
        itemStyle: { color: '#1a6b5c' },
        lineStyle: { width: 2.5 },
        areaStyle: { color: 'rgba(26, 107, 92, 0.12)' },
        data: trend.map((d) => d.value),
      },
    ],
  })
}

function handleResize() {
  chart?.resize()
}

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
    <h2>{{ t('dev.menu.dashboard') }}</h2>
    <p class="portal-stat-desc">欢迎使用素衡OS开放平台，在这里管理你的应用、密钥与 API 接入。</p>

    <div class="portal-stat-grid">
      <div v-for="s in stats" :key="s.label" class="portal-stat-card">
        <div class="portal-stat-label">{{ s.label }}</div>
        <div class="portal-stat-value">{{ s.value }}</div>
        <div class="portal-stat-desc">{{ s.desc }}</div>
      </div>
    </div>

    <el-row :gutter="16">
      <el-col :span="12" :xs="24">
        <el-card shadow="never" style="margin-bottom: 16px">
          <template #header><b>{{ t('dev.dashboard.quickEntry') }}</b></template>
          <div class="quick-grid">
            <div v-for="link in quickLinks" :key="link.to" class="quick-card" @click="router.push(link.to)">
              <el-icon :size="26" style="color: var(--color-primary)"><component :is="link.icon" /></el-icon>
              <div class="quick-title">{{ link.title }}</div>
              <div class="quick-desc">{{ link.desc }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="12" :xs="24">
        <el-card shadow="never" style="margin-bottom: 16px">
          <template #header><b>{{ t('dev.dashboard.callTrend') }}</b></template>
          <div ref="chartRef" style="height: 240px"></div>
        </el-card>
      </el-col>
    </el-row>

    <el-card shadow="never">
      <template #header><b>{{ t('dev.dashboard.appStatus') }}</b></template>
      <el-table :data="dev.apps" size="small">
        <el-table-column :label="t('dev.common.name')" min-width="160">
          <template #default="{ row }">
            <el-icon style="color: var(--color-primary); vertical-align: -2px"><Grid /></el-icon>
            <span style="margin-left: 6px">{{ row.name }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="domain" :label="t('dev.apps.domain')" min-width="120" />
        <el-table-column prop="desc" :label="t('dev.apps.appDesc')" min-width="140" />
        <el-table-column :label="t('dev.common.status')" width="90">
          <template #default="{ row }">
            <el-tag :type="row.status === 'active' ? 'success' : 'info'" size="small">
              {{ row.status === 'active' ? t('dev.common.enabled') : t('dev.common.disabled') }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<style scoped>
.quick-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}
.quick-card {
  border: 1px solid var(--color-border);
  border-radius: 10px;
  padding: 14px;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}
.quick-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 20px rgba(26, 107, 92, 0.12);
}
.quick-title {
  font-weight: 600;
  margin-top: 8px;
  color: var(--color-text-primary);
}
.quick-desc {
  font-size: 12px;
  color: var(--color-text-secondary);
  margin-top: 4px;
}
</style>
