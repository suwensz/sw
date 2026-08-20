<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { qingflowApi, type QingFlowApp, type QingFlowRecord } from '@/api'

/**
 * 轻流数据打通（运营端）
 * 与轻流 A/B/C 应用数据同步：
 *   A — 跨境订单管理
 *   B — 供应链采购单
 *   C — 仓储物流跟踪
 */

const loading = ref(false)
const syncing = ref(false)
const apps = ref<QingFlowApp[]>([])
const records = ref<Record<string, QingFlowRecord[]>>({})
const activeApp = ref<string>('')

const categoryLabels: Record<string, string> = {
  A: 'A · 订单',
  B: 'B · 采购',
  C: 'C · 物流',
}

const categoryColors: Record<string, string> = {
  A: '#1a6b5c',
  B: '#b45309',
  C: '#6366f1',
}

const statusTags: Record<string, { type: string; label: string }> = {
  active: { type: 'success', label: '运行中' },
  paused: { type: 'warning', label: '已暂停' },
  error: { type: 'danger', label: '异常' },
}

onMounted(async () => {
  await loadApps()
})

async function loadApps() {
  loading.value = true
  try {
    apps.value = await qingflowApi.getApps()
    // 默认加载第一个应用的记录
    if (apps.value.length > 0) {
      activeApp.value = apps.value[0].id
      await loadRecords(apps.value[0].id)
    }
  } catch (err) {
    ElMessage.error('加载轻流应用失败')
    console.error(err)
  } finally {
    loading.value = false
  }
}

async function loadRecords(appId: string) {
  activeApp.value = appId
  try {
    const list = await qingflowApi.getRecords(appId)
    records.value[appId] = list
  } catch (err) {
    ElMessage.error('加载记录失败')
    console.error(err)
  }
}

async function syncApp(appId: string) {
  syncing.value = true
  try {
    const result = await qingflowApi.sync(appId)
    // 刷新应用列表与记录
    await loadApps()
    await loadRecords(appId)
    ElMessage.success(`同步完成：${result.recordCount} 条记录 · ${new Date(result.syncedAt).toLocaleTimeString('zh-CN', { hour12: false })}`)
  } catch (err) {
    ElMessage.error('同步失败')
    console.error(err)
  } finally {
    syncing.value = false
  }
}

async function syncAll() {
  syncing.value = true
  try {
    for (const app of apps.value) {
      await qingflowApi.sync(app.id)
    }
    await loadApps()
    ElMessage.success(`全部同步完成（${apps.value.length} 个应用）`)
  } catch (err) {
    ElMessage.error('同步失败')
    console.error(err)
  } finally {
    syncing.value = false
  }
}

// 当前选中应用的记录
const currentRecords = computed(() => {
  return records.value[activeApp.value] || []
})

// 当前应用对象
const currentApp = computed(() => {
  return apps.value.find((a) => a.id === activeApp.value)
})

// 统计数据
const totalRecords = computed(() =>
  apps.value.reduce((sum, app) => sum + app.recordCount, 0),
)

const activeCount = computed(() =>
  apps.value.filter((a) => a.status === 'active').length,
)

// 格式化字段值
function formatValue(value: string | number, type: string): string {
  if (type === 'number' && typeof value === 'number') {
    return value.toLocaleString()
  }
  if (type === 'date' && typeof value === 'string') {
    return new Date(value).toLocaleDateString('zh-CN')
  }
  return String(value)
}

function formatTime(ts: string): string {
  return new Date(ts).toLocaleString('zh-CN', { hour12: false })
}

// 判断值是否为状态字段（用于着色）
const statusValues = new Set(['pending', 'paid', 'shipped', 'completed', 'refunded', 'in_transit', 'delivered', 'customs'])

function isStatusField(value: string | number): boolean {
  return typeof value === 'string' && statusValues.has(value)
}

const statusLabels: Record<string, string> = {
  pending: '待处理',
  paid: '已付款',
  shipped: '已发货',
  completed: '已完成',
  refunded: '已退款',
  in_transit: '运输中',
  delivered: '已送达',
  customs: '清关中',
  active: '运行中',
  paused: '已暂停',
  error: '异常',
}
</script>

<template>
  <div class="qingflow-page" v-loading="loading">
    <el-alert
      type="success"
      :closable="false"
      show-icon
      title="轻流数据打通"
      description="与轻流 A/B/C 应用数据同步：A=跨境订单管理，B=供应链采购单，C=仓储物流跟踪。支持查看记录与触发同步。"
      class="page-alert"
    />

    <!-- 顶部统计 -->
    <div class="stats-row">
      <div class="stat-mini">
        <div class="stat-mini-label">接入应用</div>
        <div class="stat-mini-value">{{ apps.length }}</div>
      </div>
      <div class="stat-mini">
        <div class="stat-mini-label">运行中</div>
        <div class="stat-mini-value" style="color: #1a6b5c">{{ activeCount }}</div>
      </div>
      <div class="stat-mini">
        <div class="stat-mini-label">总记录数</div>
        <div class="stat-mini-value">{{ totalRecords.toLocaleString() }}</div>
      </div>
      <div class="stat-mini">
        <div class="stat-mini-label">最近同步</div>
        <div class="stat-mini-value" style="font-size: 13px">
          {{ apps.length ? formatTime(apps[0].lastSync) : '—' }}
        </div>
      </div>
      <el-button type="primary" size="small" :loading="syncing" @click="syncAll" style="margin-left: auto">
        <el-icon><Refresh /></el-icon>&nbsp;全部同步
      </el-button>
    </div>

    <!-- 应用列表 -->
    <div class="app-cards">
      <div
        v-for="app in apps"
        :key="app.id"
        class="app-card"
        :class="{ active: activeApp === app.id }"
        @click="loadRecords(app.id)"
      >
        <div class="app-card-head">
          <span class="app-category" :style="{ background: categoryColors[app.category] }">{{ categoryLabels[app.category] }}</span>
          <el-tag size="small" :type="statusTags[app.status]?.type as 'success' | 'warning' | 'danger'">
            {{ statusTags[app.status]?.label }}
          </el-tag>
        </div>
        <div class="app-card-name">{{ app.name }}</div>
        <div class="app-card-meta">
          <span>{{ app.recordCount }} 条记录</span>
          <span>{{ formatTime(app.lastSync) }}</span>
        </div>
        <el-button
          size="small"
          :loading="syncing"
          @click.stop="syncApp(app.id)"
          style="margin-top: 8px; width: 100%"
        >
          同步
        </el-button>
      </div>
    </div>

    <!-- 数据记录表 -->
    <div class="records-panel" v-if="currentApp">
      <div class="records-head">
        <h3 class="records-title">{{ currentApp.name }} · 数据记录</h3>
        <span class="records-count">{{ currentRecords.length }} 条</span>
      </div>

      <div class="table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th v-for="field in currentApp.fields" :key="field.key">{{ field.label }}</th>
              <th>更新时间</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="record in currentRecords" :key="record.id">
              <td v-for="field in currentApp.fields" :key="field.key">
                <span
                  v-if="isStatusField(record.data[field.key])"
                  class="status-chip"
                  :class="`status-${record.data[field.key]}`"
                >{{ statusLabels[record.data[field.key] as string] || record.data[field.key] }}</span>
                <span v-else>{{ formatValue(record.data[field.key], field.type) }}</span>
              </td>
              <td class="col-time">{{ formatTime(record.updatedAt) }}</td>
            </tr>
            <tr v-if="!currentRecords.length">
              <td :colspan="currentApp.fields.length + 1" class="empty-row">暂无记录</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<style scoped>
.qingflow-page {
  max-width: 1100px;
}

.page-alert {
  margin-bottom: 16px;
}

.stats-row {
  display: flex;
  align-items: center;
  gap: 24px;
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 16px 20px;
  margin-bottom: 16px;
}

.stat-mini {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-mini-label {
  font-size: 12px;
  color: var(--color-text-secondary);
}

.stat-mini-value {
  font-size: 20px;
  font-weight: 700;
  color: var(--color-text-primary);
}

.app-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 12px;
  margin-bottom: 18px;
}

.app-card {
  background: var(--color-bg-card);
  border: 2px solid transparent;
  border-radius: 12px;
  padding: 16px;
  cursor: pointer;
  transition: border-color 0.15s, box-shadow 0.15s;
}

.app-card:hover {
  border-color: var(--color-border);
}

.app-card.active {
  border-color: #1a6b5c;
  box-shadow: 0 0 0 2px rgba(26, 107, 92, 0.1);
}

.app-card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.app-category {
  color: #fff;
  font-size: 11px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 4px;
}

.app-card-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-primary);
}

.app-card-meta {
  display: flex;
  justify-content: space-between;
  margin-top: 6px;
  font-size: 12px;
  color: var(--color-text-secondary);
}

.records-panel {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 18px;
}

.records-head {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 14px;
}

.records-title {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: var(--color-text-primary);
}

.records-count {
  font-size: 12px;
  color: var(--color-text-secondary);
}

.table-wrapper {
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.data-table th {
  text-align: left;
  padding: 10px 14px;
  font-weight: 600;
  font-size: 12px;
  color: var(--color-text-secondary);
  border-bottom: 1px solid var(--color-border);
  white-space: nowrap;
  background: var(--color-bg-soft);
}

.data-table td {
  padding: 10px 14px;
  border-bottom: 1px solid var(--color-border);
}

.col-time {
  font-family: Consolas, Menlo, monospace;
  font-size: 12px;
  color: var(--color-text-secondary);
  white-space: nowrap;
}

.status-chip {
  display: inline-block;
  font-size: 11px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 4px;
}

.status-pending { background: #fef3c7; color: #92400e; }
.status-paid { background: #dbeafe; color: #1e40af; }
.status-shipped { background: #c7d2fe; color: #3730a3; }
.status-completed { background: #d1fae5; color: #065f46; }
.status-refunded { background: #fee2e2; color: #991b1b; }
.status-in_transit { background: #dbeafe; color: #1e40af; }
.status-delivered { background: #d1fae5; color: #065f46; }
.status-customs { background: #fef3c7; color: #92400e; }

.empty-row {
  text-align: center;
  padding: 32px;
  color: var(--color-text-placeholder);
}

@media (max-width: 768px) {
  .stats-row {
    flex-wrap: wrap;
    gap: 12px;
  }
}
</style>
