<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useHealthStore } from '@/stores/health'
import { tText } from '@/i18n'
import { localizeNumber } from '@/utils/numbers'
import EcgChart from '@/components/EcgChart.vue'
import type { HealthMetric, SmartWatch } from '@/types'
import { ElMessage } from 'element-plus'

const { t, locale } = useI18n()
const health = useHealthStore()

const showAddDialog = ref(false)
const newDevice = ref({ memberId: '', name: '', model: '', serial: '', mac: '' })

// 选中成员（默认第一个）
const activeMemberId = ref(health.familyMembers[0]?.id || '')
const activeWatch = computed<SmartWatch | undefined>(() =>
  health.watches.find((w) => w.memberId === activeMemberId.value),
)

function selectMember(id: string) {
  activeMemberId.value = id
}

function statusType(s: string) {
  return s === 'online' ? 'success' : s === 'offline' ? 'info' : s === 'charging' ? 'warning' : 'primary'
}
function batteryColor(b: number) {
  if (b > 50) return 'var(--color-success)'
  if (b > 20) return 'var(--color-warning)'
  return 'var(--color-danger)'
}

function statusClass(m: HealthMetric) {
  return `metric-${m.status}`
}
function trendIcon(trend: string) {
  return trend === 'up' ? 'CaretTop' : trend === 'down' ? 'CaretBottom' : 'Minus'
}
function trendColor(m: HealthMetric) {
  if (m.trend === 'stable') return 'var(--color-text-secondary)'
  // 对血压/血糖/血脂/尿酸，升高是坏事
  const badHigh = ['blood_pressure_systolic', 'blood_pressure_diastolic', 'blood_glucose', 'blood_lipid', 'uric_acid', 'creatinine']
  if (badHigh.includes(m.key)) {
    return m.trend === 'up' ? 'var(--color-danger)' : 'var(--color-success)'
  }
  return m.trend === 'up' ? 'var(--color-success)' : 'var(--color-danger)'
}

function sparklinePoints(history: { value: number }[], width = 120, height = 36): string {
  if (!history.length) return ''
  const values = history.map((h) => h.value)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1
  return history.map((h, i) => {
    const x = (i / (history.length - 1)) * width
    const y = height - ((h.value - min) / range) * height
    return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`
  }).join(' ')
}

function syncCurrent() {
  if (activeWatch.value) health.syncWatch(activeWatch.value.id)
}

function addDevice() {
  if (!newDevice.value.memberId || !newDevice.value.name) return
  health.addWatch({ ...newDevice.value })
  showAddDialog.value = false
  newDevice.value = { memberId: '', name: '', model: '', serial: '', mac: '' }
  ElMessage.success('✓')
}

function removeWatch(id: string) {
  if (confirm(t('watch.confirmDelete'))) health.deleteWatch(id)
}

function formatSync(iso: string) {
  const d = new Date(iso)
  const diff = Date.now() - d.getTime()
  if (diff < 60000) return t('watch.online')
  if (diff < 3600000) return `${Math.floor(diff / 60000)} min`
  return d.toLocaleString()
}

const ecgNormal = computed(() => {
  if (!activeWatch.value?.ecg) return true
  // 简化：检测是否有异常高值
  return !activeWatch.value.ecg.some((p) => p.v > 1.0)
})
</script>

<template>
  <div class="watch-page qh-container">
    <div class="page-header">
      <div>
        <h1>{{ t('watch.title') }}</h1>
        <p>{{ t('watch.subtitle') }}</p>
      </div>
      <el-button type="primary" @click="showAddDialog = true">
        <el-icon style="margin-right: 4px"><Plus /></el-icon>{{ t('watch.addDevice') }}
      </el-button>
    </div>

    <!-- 设备卡片列表 -->
    <section class="device-grid">
      <div
        v-for="w in health.watches"
        :key="w.id"
        :class="['device-card qh-card', { active: w.memberId === activeMemberId, offline: w.status === 'offline' }]"
        @click="selectMember(w.memberId)"
      >
        <div class="device-top">
          <div class="watch-icon">
            <el-icon :size="28"><Watch /></el-icon>
          </div>
          <div class="device-info">
            <strong>{{ w.memberName }}</strong>
            <span class="device-name">{{ w.name }}</span>
          </div>
          <el-tag :type="statusType(w.status)" size="small">{{ t(`watch.${w.status}`) }}</el-tag>
        </div>
        <div class="device-meta">
          <div class="battery">
            <el-icon><Cellphone /></el-icon>
            <div class="battery-bar">
              <div class="battery-fill" :style="{ width: `${w.battery}%`, background: batteryColor(w.battery) }"></div>
            </div>
            <span>{{ localizeNumber(w.battery, locale) }}%</span>
          </div>
          <span class="sync-time">{{ formatSync(w.lastSync) }}</span>
        </div>
      </div>
    </section>

    <!-- 选中设备详情 -->
    <section v-if="activeWatch" class="watch-detail">
      <div class="detail-toolbar qh-card">
        <div>
          <h2>{{ activeWatch.memberName }} · {{ activeWatch.name }}</h2>
          <p>{{ activeWatch.model }} · SN: {{ activeWatch.serial }} · {{ activeWatch.firmware }}</p>
        </div>
        <div class="toolbar-actions">
          <el-button @click="syncCurrent" :loading="activeWatch.status === 'syncing'">
            <el-icon style="margin-right: 4px"><Refresh /></el-icon>{{ t('watch.syncNow') }}
          </el-button>
          <el-button type="danger" plain @click="removeWatch(activeWatch.id)">
            <el-icon style="margin-right: 4px"><Delete /></el-icon>{{ t('watch.delete') }}
          </el-button>
        </div>
      </div>

      <!-- 指标网格 -->
      <div class="metrics-grid">
        <div v-for="m in activeWatch.metrics" :key="m.key" :class="['metric-card qh-card', statusClass(m)]">
          <div class="metric-head">
            <span class="metric-label">{{ tText(m.label, locale as any) }}</span>
            <span class="metric-status">{{ t(`watch.${m.status}`) }}</span>
          </div>
          <div class="metric-value-row">
            <span class="metric-value">{{ localizeNumber(m.value, locale) }}</span>
            <span class="metric-unit">{{ m.unit }}</span>
            <span class="metric-trend" :style="{ color: trendColor(m) }">
              <el-icon><component :is="trendIcon(m.trend)" /></el-icon>
            </span>
          </div>
          <div class="metric-footer">
            <span class="metric-range">{{ t('watch.normalRange') }}: {{ m.normalRange }}</span>
            <svg class="sparkline" width="80" height="28" viewBox="0 0 120 36" preserveAspectRatio="none">
              <path :d="sparklinePoints(m.history)" fill="none" :stroke="m.status === 'normal' ? '#1a6b5c' : m.status === 'critical' ? '#d96b5c' : '#e6a23c'" stroke-width="1.5" vector-effect="non-scaling-stroke" />
            </svg>
          </div>
        </div>
      </div>

      <!-- 心电图 -->
      <div class="ecg-section qh-card">
        <div class="ecg-head">
          <h3><el-icon><Monitor /></el-icon> {{ t('watch.ecg') }}</h3>
          <el-tag :type="ecgNormal ? 'success' : 'danger'">
            {{ ecgNormal ? t('watch.ecgNormal') : 'Arrhythmia detected' }}
          </el-tag>
        </div>
        <EcgChart v-if="activeWatch.ecg" :data="activeWatch.ecg" :height="180" />
        <p class="ecg-time">{{ t('watch.lastSync') }}: {{ new Date(activeWatch.lastSync).toLocaleString() }}</p>
      </div>
    </section>

    <section v-else class="no-watch qh-card">
      <el-icon :size="48"><Watch /></el-icon>
      <p>{{ t('watch.noDevice') }}</p>
      <el-button type="primary" @click="showAddDialog = true">{{ t('watch.addDevice') }}</el-button>
    </section>

    <!-- 添加设备弹窗 -->
    <el-dialog v-model="showAddDialog" :title="t('watch.addDevice')" width="460px">
      <el-form label-position="top">
        <el-form-item :label="t('watch.bindMember')">
          <el-select v-model="newDevice.memberId" style="width: 100%">
            <el-option v-for="m in health.familyMembers" :key="m.id" :value="m.id" :label="m.name" />
          </el-select>
        </el-form-item>
        <el-form-item :label="t('watch.deviceName')">
          <el-input v-model="newDevice.name" placeholder="素衡 Watch Pro" />
        </el-form-item>
        <el-form-item :label="t('watch.model')">
          <el-input v-model="newDevice.model" placeholder="SH-WP2024" />
        </el-form-item>
        <div class="form-row">
          <el-form-item :label="t('watch.serial')">
            <el-input v-model="newDevice.serial" />
          </el-form-item>
          <el-form-item :label="t('watch.mac')">
            <el-input v-model="newDevice.mac" />
          </el-form-item>
        </div>
      </el-form>
      <template #footer>
        <el-button @click="showAddDialog = false">{{ t('watch.cancel') }}</el-button>
        <el-button type="primary" @click="addDevice">{{ t('watch.save') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.watch-page { padding: 24px 0 48px; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
.page-header h1 { font-size: 24px; margin: 0 0 4px; }
.page-header p { color: var(--color-text-secondary); margin: 0; font-size: 14px; }

.device-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; margin-bottom: 24px; }
.device-card { padding: 18px; cursor: pointer; transition: all 0.2s; border: 2px solid transparent; }
.device-card:hover { transform: translateY(-2px); }
.device-card.active { border-color: var(--color-primary); box-shadow: 0 4px 20px rgba(26, 107, 92, 0.15); }
.device-card.offline { opacity: 0.7; }
.device-top { display: flex; align-items: center; gap: 12px; margin-bottom: 14px; }
.watch-icon { width: 44px; height: 44px; border-radius: 12px; background: linear-gradient(135deg, var(--color-primary), var(--color-primary-light)); color: #fff; display: flex; align-items: center; justify-content: center; }
.device-info { flex: 1; display: flex; flex-direction: column; }
.device-info strong { font-size: 16px; }
.device-name { font-size: 12px; color: var(--color-text-secondary); }
.device-meta { display: flex; justify-content: space-between; align-items: center; }
.battery { display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--color-text-regular); }
.battery-bar { width: 50px; height: 8px; background: var(--color-bg-soft); border-radius: 4px; overflow: hidden; }
.battery-fill { height: 100%; border-radius: 4px; transition: width 0.3s; }
.sync-time { font-size: 11px; color: var(--color-text-secondary); }

.detail-toolbar { display: flex; justify-content: space-between; align-items: center; padding: 18px 24px; margin-bottom: 20px; }
.detail-toolbar h2 { font-size: 18px; margin: 0 0 4px; }
.detail-toolbar p { font-size: 12px; color: var(--color-text-secondary); margin: 0; }
.toolbar-actions { display: flex; gap: 8px; }

.metrics-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 16px; margin-bottom: 24px; }
.metric-card { padding: 18px; transition: all 0.2s; border-left: 3px solid transparent; }
.metric-card.metric-normal { border-left-color: var(--color-success); }
.metric-card.metric-high, .metric-card.metric-low { border-left-color: var(--color-warning); }
.metric-card.metric-critical { border-left-color: var(--color-danger); background: rgba(217, 107, 92, 0.03); }
.metric-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
.metric-label { font-size: 13px; color: var(--color-text-regular); }
.metric-status { font-size: 11px; padding: 2px 8px; border-radius: 999px; background: var(--color-bg-soft); color: var(--color-text-secondary); }
.metric-card.metric-normal .metric-status { background: rgba(82, 166, 122, 0.12); color: var(--color-success); }
.metric-card.metric-critical .metric-status { background: rgba(217, 107, 92, 0.12); color: var(--color-danger); }
.metric-card.metric-high .metric-status, .metric-card.metric-low .metric-status { background: rgba(230, 162, 60, 0.12); color: var(--color-warning); }
.metric-value-row { display: flex; align-items: baseline; gap: 6px; margin-bottom: 10px; }
.metric-value { font-size: 28px; font-weight: 700; color: var(--color-text-primary); font-variant-numeric: tabular-nums; }
.metric-card.metric-critical .metric-value { color: var(--color-danger); }
.metric-card.metric-high .metric-value, .metric-card.metric-low .metric-value { color: var(--color-warning); }
.metric-unit { font-size: 13px; color: var(--color-text-secondary); }
.metric-trend { margin-left: auto; display: flex; }
.metric-footer { display: flex; justify-content: space-between; align-items: center; }
.metric-range { font-size: 11px; color: var(--color-text-secondary); }
.sparkline { opacity: 0.8; }

.ecg-section { padding: 24px; margin-bottom: 24px; }
.ecg-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.ecg-head h3 { font-size: 16px; margin: 0; display: flex; align-items: center; gap: 8px; color: var(--color-primary); }
.ecg-time { font-size: 12px; color: var(--color-text-secondary); margin: 12px 0 0; text-align: right; }

.no-watch { padding: 60px 20px; text-align: center; color: var(--color-text-secondary); display: flex; flex-direction: column; align-items: center; gap: 16px; }

.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }

@media (max-width: 640px) {
  .device-grid { grid-template-columns: 1fr; }
  .metrics-grid { grid-template-columns: 1fr 1fr; gap: 10px; }
  .metric-card { padding: 14px; }
  .metric-value { font-size: 22px; }
  .detail-toolbar { flex-direction: column; gap: 12px; align-items: flex-start; }
}
</style>
