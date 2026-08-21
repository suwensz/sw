<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import * as echarts from 'echarts'
import { useAdminStore } from '@/stores/admin'
import { useAgentOrdersStore } from '@/stores/agentOrders'
import { useAgentsStore } from '@/stores/agents'
import { generateUserGrowth } from '@/mock/adminData'

const { t } = useI18n()
const router = useRouter()
const admin = useAdminStore()
const agentOrders = useAgentOrdersStore()
const agents = useAgentsStore()

const userGrowth = generateUserGrowth(14)

const stats = computed(() => [
  { label: t('admin.dashboard.totalUsers'), value: admin.users.length + 120, desc: `管理端可见 ${admin.users.length} 条`, icon: 'User' },
  { label: t('admin.dashboard.activeUsers'), value: admin.users.filter((u) => u.status === 'active').length + 88, desc: '今日活跃 23 人', icon: 'UserFilled' },
  { label: '累计订单', value: Math.max(1286, agentOrders.orders.length), desc: `接单智能体数据库 ${agentOrders.orders.length} 条`, icon: 'Tickets' },
  { label: '待处理订单', value: agentOrders.pendingCount, desc: `待接单总额 ${agentOrders.pendingAmount}`, icon: 'AlarmClock' },
  { label: '健康预警', value: '47', desc: 'danger 级 3 条', icon: 'Warning' },
  { label: t('admin.dashboard.totalAgents'), value: `${agents.activeCount}/${agents.totalCount}`, desc: `${t('admin.dashboard.agentStatus')} · ${agents.automationRate}%`, icon: 'MagicStick' },
])

const quickLinks = computed(() => [
  { label: t('admin.menu.users'), to: '/users', icon: 'User' },
  { label: t('admin.menu.roles'), to: '/roles', icon: 'UserFilled' },
  { label: t('admin.menu.stats'), to: '/stats', icon: 'PieChart' },
  { label: t('admin.menu.monitor'), to: '/monitor', icon: 'Monitor' },
])

const chartRef = ref<HTMLDivElement | null>(null)
let chart: echarts.ECharts | null = null

function renderChart() {
  if (!chartRef.value) return
  if (!chart) chart = echarts.init(chartRef.value)
  chart.setOption({
    tooltip: { trigger: 'axis' },
    grid: { left: 50, right: 20, top: 30, bottom: 30 },
    xAxis: { type: 'category', boundaryGap: false, data: userGrowth.map((d) => d.date) },
    yAxis: { type: 'value' },
    series: [
      {
        name: t('admin.dashboard.userGrowth'),
        type: 'line',
        smooth: true,
        symbolSize: 5,
        itemStyle: { color: '#1a6b5c' },
        lineStyle: { width: 2.5 },
        areaStyle: { color: 'rgba(26, 107, 92, 0.12)' },
        data: userGrowth.map((d) => d.value),
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
    <h2>{{ t('admin.menu.dashboard') }}</h2>
    <p class="portal-stat-desc">素衡OS 平台管理后台，用户、订单与智能体运行状态一览。</p>

    <div class="portal-stat-grid">
      <div v-for="s in stats" :key="s.label" class="portal-stat-card">
        <div class="portal-stat-label">{{ s.label }}</div>
        <div class="portal-stat-value">{{ s.value }}</div>
        <div class="portal-stat-desc">{{ s.desc }}</div>
      </div>
    </div>

    <el-row :gutter="16">
      <el-col :span="10" :xs="24">
        <el-card shadow="never" style="margin-bottom: 16px">
          <template #header><b>{{ t('admin.dashboard.quickEntry') }}</b></template>
          <div class="quick-grid">
            <div v-for="link in quickLinks" :key="link.to" class="quick-item" @click="router.push(link.to)">
              <el-icon :size="22" style="color: var(--color-primary)"><component :is="link.icon" /></el-icon>
              <span class="quick-label">{{ link.label }}</span>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="14" :xs="24">
        <el-card shadow="never" style="margin-bottom: 16px">
          <template #header><b>{{ t('admin.dashboard.userGrowth') }}</b></template>
          <div ref="chartRef" style="height: 230px"></div>
        </el-card>
      </el-col>
    </el-row>

    <el-card shadow="never">
      <template #header><b>{{ t('admin.dashboard.recentUsers') }}</b></template>
      <el-table :data="admin.users.slice(0, 5)" size="small">
        <el-table-column prop="name" label="姓名" />
        <el-table-column prop="email" label="邮箱" min-width="150" />
        <el-table-column :label="t('admin.common.role')" width="110">
          <template #default="{ row }">
            <el-tag size="small" effect="plain">{{ row.role }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column :label="t('admin.common.status')" width="80">
          <template #default="{ row }">
            <el-tag :type="row.status === 'active' ? 'success' : 'info'" size="small">
              {{ row.status === 'active' ? t('admin.common.enabled') : t('admin.common.disabled') }}
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
.quick-item {
  border: 1px solid var(--color-border);
  border-radius: 10px;
  padding: 14px;
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  color: var(--color-text-primary);
}
.quick-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 20px rgba(26, 107, 92, 0.12);
}
.quick-label {
  font-weight: 600;
}
</style>
