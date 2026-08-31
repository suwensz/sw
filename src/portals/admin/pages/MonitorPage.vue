<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { generateMonitorMetrics } from '@/mock/adminData'
import type { MonitorMetric } from '@/mock/adminData'

const { t } = useI18n()

const metrics = ref<MonitorMetric[]>(generateMonitorMetrics())
const uptime = ref('30d 4h 12m')
const lastRefresh = ref('—')
let timer: ReturnType<typeof setInterval> | null = null

function refresh() {
  metrics.value = generateMonitorMetrics()
  lastRefresh.value = new Date().toLocaleTimeString()
}

onMounted(() => {
  refresh()
  timer = setInterval(refresh, 3000)
})

onBeforeUnmount(() => {
  if (timer) clearInterval(timer)
})

function keyLabel(key: string): string {
  const map: Record<string, string> = {
    cpu: t('admin.monitor.cpu'),
    memory: t('admin.monitor.memory'),
    disk: t('admin.monitor.disk'),
    network: t('admin.monitor.network'),
  }
  return map[key] || key
}

function statusLabel(metric: MonitorMetric): string {
  return metric.healthy ? t('admin.monitor.healthy') : t('admin.monitor.warning')
}
</script>

<template>
  <div class="portal-page">
    <div class="portal-page-head">
      <h2 style="margin: 0">{{ t('admin.menu.monitor') }}</h2>
      <el-button size="small" @click="refresh">
        <el-icon><Refresh /></el-icon> {{ t('admin.monitor.refresh') }}
      </el-button>
    </div>
    <p class="portal-stat-desc">
      {{ t('admin.monitor.uptime') }}：{{ uptime }} · 每 3s 自动刷新
    </p>

    <div class="monitor-grid">
      <div v-for="m in metrics" :key="m.key" class="monitor-card">
        <div class="monitor-head">
          <span class="monitor-label">{{ keyLabel(m.key) }}</span>
          <el-tag :type="m.healthy ? 'success' : 'warning'" size="small" effect="light">
            {{ statusLabel(m) }}
          </el-tag>
        </div>
        <div class="monitor-value">{{ m.value }}<span class="monitor-unit">{{ m.unit }}</span></div>
        <el-progress
          :percentage="Math.min(100, m.value)"
          :stroke-width="10"
          :color="m.healthy ? '#1a6b5c' : '#d4a853'"
        />
      </div>
    </div>

    <el-alert
      title="监控数据基于前端 Mock 模拟生成，用于展示系统监控面板形态。"
      type="info"
      :closable="false"
      show-icon
      style="margin-top: 16px"
    />
  </div>
</template>

<style scoped>
.monitor-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 16px;
}
.monitor-card {
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 18px;
  background: var(--color-bg-card);
  box-shadow: 0 2px 12px rgba(26, 107, 92, 0.06);
}
.monitor-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}
.monitor-label {
  font-size: 13px;
  color: var(--color-text-secondary);
}
.monitor-value {
  font-size: 30px;
  font-weight: 700;
  color: var(--color-primary);
}
.monitor-unit {
  font-size: 13px;
  color: var(--color-text-secondary);
  font-weight: 400;
  margin-left: 4px;
}
</style>
