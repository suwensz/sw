<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useHealthStore, DEFAULT_METRIC_THRESHOLDS, METRIC_UNITS } from '@/stores/health'
import { tText } from '@/i18n'
import { localizeNumber, localizeDigits } from '@/utils/numbers'
import { isSpeaking, speakAlertsSequence, stopSpeak } from '@/composables/useSpeech'
import type { AlertCategory, HealthAlert, MetricThreshold } from '@/types'
import { ElMessage } from 'element-plus'

const { t, locale } = useI18n()
const health = useHealthStore()

const activeCategory = ref<AlertCategory | 'all'>('all')
const activeMember = ref<string>('all')
const voiceLoading = ref(false)
const pushedIds = ref<Set<string>>(new Set())
const showPushDrawer = ref(false)

// 阈值表格行定义（监测指标 → 单位与文案键）
const thresholdRows = computed(() => [
  { key: 'blood_pressure_systolic', label: t('watch.metrics.systolic'), unit: METRIC_UNITS.blood_pressure_systolic },
  { key: 'blood_pressure_diastolic', label: t('watch.metrics.diastolic'), unit: METRIC_UNITS.blood_pressure_diastolic },
  { key: 'blood_glucose', label: t('watch.metrics.blood_glucose'), unit: METRIC_UNITS.blood_glucose },
  { key: 'blood_lipid', label: t('watch.metrics.blood_lipid'), unit: METRIC_UNITS.blood_lipid },
  { key: 'uric_acid', label: t('watch.metrics.uric_acid'), unit: METRIC_UNITS.uric_acid },
  { key: 'creatinine', label: t('watch.metrics.creatinine'), unit: METRIC_UNITS.creatinine },
  { key: 'heart_rate', label: t('watch.metrics.heart_rate'), unit: METRIC_UNITS.heart_rate },
])

function getThreshold(key: string): MetricThreshold {
  return health.pushSettings.metricThresholds[key] || DEFAULT_METRIC_THRESHOLDS[key]
}

function onThresholdChange(key: string, field: 'low' | 'high' | 'critical', value: number | undefined) {
  if (value === undefined) return
  const cur = getThreshold(key)
  health.setMetricThreshold(key, { ...cur, [field]: value })
}

function memberAge(birthDate: string): number {
  const today = new Date()
  const birth = new Date(birthDate)
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
  return age
}

function crowdTag(m: { birthDate: string }): string {
  const age = memberAge(m.birthDate)
  if (age >= 60) return t('alerts.crowdElderlyShort')
  if (age <= 12) return t('alerts.crowdChildrenShort')
  return t('alerts.crowdAdultShort')
}

const isDaytime = computed(() => health.isDaytimeNow())

function pushAll() {
  const ids = health.alerts.filter((a) => !a.isPushed).map((a) => a.id)
  if (ids.length) {
    health.markPushed(ids)
    ElMessage.success(t('alerts.alertPushed'))
  }
}

function onDrawerSaved() {
  health.updatePushSettings({})
  ElMessage.success(t('alerts.settingsSaved'))
}

const categories = computed(() => [
  { key: 'all' as const, label: t('alerts.all') },
  { key: 'vital' as const, label: t('alerts.categories.vital') },
  { key: 'chronic' as const, label: t('alerts.categories.chronic') },
  { key: 'climate' as const, label: t('alerts.categories.climate') },
  { key: 'device' as const, label: t('alerts.categories.device') },
  { key: 'medicine' as const, label: t('alerts.categories.medicine') },
  { key: 'family' as const, label: t('alerts.categories.family') },
])

const filteredAlerts = computed<HealthAlert[]>(() => {
  return health.alerts.filter((a) => {
    if (activeCategory.value !== 'all' && a.category !== activeCategory.value) return false
    if (activeMember.value !== 'all' && a.memberId !== activeMember.value) return false
    return true
  }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
})

const criticalAlerts = computed(() => health.alerts.filter((a) => a.severity === 'critical'))
const warningAlerts = computed(() => health.alerts.filter((a) => a.severity === 'warning'))

const wuyun = computed(() => health.currentYearWuYun)
const forecast = computed(() => health.forecast7d)

const todayRiskLevel = computed(() => {
  const today = forecast.value[0]
  return today?.riskLevel || 'low'
})

function severityClass(sev: string) {
  return `sev-${sev}`
}
function severityIcon(sev: string) {
  return sev === 'critical' ? 'Warning' : sev === 'warning' ? 'Bell' : sev === 'success' ? 'CircleCheck' : 'InfoFilled'
}
function sourceLabel(src: string) {
  const map: Record<string, string> = {
    watch: t('alerts.sourceWatch'),
    wuyun: t('alerts.sourceWuyun'),
    sanyin: t('alerts.sourceSanyin'),
    ai: t('alerts.sourceAi'),
  }
  return map[src] || src
}

function playVoice() {
  if (isSpeaking.value) {
    stopSpeak()
    return
  }
  if (!filteredAlerts.value.length) return
  voiceLoading.value = true
  // 标记推送
  const ids = filteredAlerts.value.filter((a) => !a.isPushed).map((a) => a.id)
  if (ids.length) {
    health.markPushed(ids)
    ids.forEach((id) => pushedIds.value.add(id))
  }
  setTimeout(() => {
    voiceLoading.value = false
    speakAlertsSequence(filteredAlerts.value, () => {
      // 完成
    })
  }, 300)
}

function formatTime(iso: string) {
  const d = new Date(iso)
  const s = `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  return localizeDigits(s, locale.value)
}

onMounted(() => {
  // 首次加载若开启推送，自动标记
  if (health.pushEnabled && health.alerts.length) {
    // 不自动推送，由用户点击
  }
})
onUnmounted(() => stopSpeak())
</script>

<template>
  <div class="alerts-page qh-container">
    <!-- 头部概览 -->
    <section class="overview-card qh-card">
      <div class="overview-left">
        <div class="overview-title">
          <el-icon :size="24" color="var(--color-primary)"><Bell /></el-icon>
          <h1>{{ t('alerts.title') }}</h1>
        </div>
        <p class="overview-sub">{{ t('alerts.subtitle') }}</p>
        <div class="overview-stats">
          <div class="stat critical">
            <span class="stat-num">{{ localizeNumber(criticalAlerts.length, locale) }}</span>
            <span class="stat-label">{{ t('alerts.critical') }}</span>
          </div>
          <div class="stat warning">
            <span class="stat-num">{{ localizeNumber(warningAlerts.length, locale) }}</span>
            <span class="stat-label">{{ t('alerts.warning') }}</span>
          </div>
          <div class="stat unread">
            <span class="stat-num">{{ health.unreadCount }}</span>
            <span class="stat-label">{{ t('alerts.unread') }}</span>
          </div>
          <div class="stat risk" :class="todayRiskLevel">
            <span class="stat-num">{{ t(`alerts.${todayRiskLevel}`) }}</span>
            <span class="stat-label">{{ t('alerts.todayRisk') }}</span>
          </div>
        </div>
      </div>
      <div class="overview-actions">
        <el-switch
          :model-value="health.voiceEnabled"
          @update:model-value="(v: string | number | boolean) => health.setVoiceEnabled(Boolean(v))"
          :active-text="t('alerts.enableVoice')"
          class="voice-switch"
        />
        <el-switch
          :model-value="health.pushEnabled"
          @update:model-value="(v: string | number | boolean) => health.setPushEnabled(Boolean(v))"
          :active-text="t('alerts.enablePush')"
        />
        <el-button type="primary" @click="playVoice" :loading="voiceLoading">
          <el-icon style="margin-right: 4px"><component :is="isSpeaking ? 'VideoPause' : 'VideoPlay'" /></el-icon>
          {{ isSpeaking ? t('alerts.voiceStop') : t('alerts.voicePlay') }}
        </el-button>
        <el-button type="primary" @click="showPushDrawer = true">
          <el-icon style="margin-right: 4px"><Setting /></el-icon>
          {{ t('alerts.pushSettings') }}
        </el-button>
      </div>
    </section>

    <div class="content-grid">
      <!-- 左侧：五运六气 + 预警列表 -->
      <div class="main-col">
        <!-- 五运六气面板 -->
        <section class="wuyun-card qh-card">
          <div class="card-header">
            <h2><el-icon><Sunny /></el-icon> {{ t('alerts.wuyunLiuqi') }} · {{ localizeNumber(wuyun.year, locale) }}</h2>
          </div>
          <div class="wuyun-grid">
            <div class="wuyun-item">
              <label>年运</label>
              <strong>{{ wuyun.yearGan }}{{ wuyun.yearZhi }}年</strong>
              <span>{{ wuyun.zhuYun }}</span>
            </div>
            <div class="wuyun-item">
              <label>司天</label>
              <strong>{{ wuyun.siTian }}</strong>
            </div>
            <div class="wuyun-item">
              <label>在泉</label>
              <strong>{{ wuyun.zaiQuan }}</strong>
            </div>
            <div class="wuyun-item">
              <label>{{ t('alerts.susceptibleOrgans') }}</label>
              <strong>{{ wuyun.susceptibleOrgans.join('、') }}</strong>
            </div>
          </div>
          <p class="wuyun-advice">{{ tText(wuyun.advice, locale as any) }}</p>

          <!-- 7天气候预报 -->
          <h3 class="forecast-title">{{ t('alerts.forecast') }}</h3>
          <div class="forecast-list">
            <div v-for="day in forecast" :key="day.date" class="forecast-item" :class="`risk-${day.riskLevel}`">
              <div class="forecast-date">
                <strong>{{ localizeDigits(day.date.slice(5), locale) }}</strong>
                <span class="solar-term">{{ day.solarTerm }}</span>
              </div>
              <div class="forecast-weather">
                <span>{{ day.weather }}</span>
                <span class="temp">{{ day.temperatureRange }}</span>
              </div>
              <div class="forecast-phase">{{ day.qiPhase }}</div>
              <div class="forecast-risk">
                <el-tag :type="day.riskLevel === 'high' ? 'danger' : day.riskLevel === 'medium' ? 'warning' : 'success'" size="small">
                  {{ t(`alerts.${day.riskLevel}`) }}
                </el-tag>
              </div>
            </div>
          </div>
        </section>

        <!-- 筛选 -->
        <section class="filter-bar qh-card">
          <div class="filter-group">
            <span class="filter-label">分类：</span>
            <button
              v-for="c in categories"
              :key="c.key"
              :class="['filter-chip', { active: activeCategory === c.key }]"
              @click="activeCategory = c.key"
            >
              {{ c.label }}
            </button>
          </div>
          <div class="filter-group">
            <span class="filter-label">{{ t('alerts.member') }}：</span>
            <select v-model="activeMember" class="filter-select">
              <option value="all">{{ t('alerts.all') }}</option>
              <option v-for="m in health.familyMembers" :key="m.id" :value="m.id">{{ m.name }}</option>
            </select>
          </div>
          <el-button text type="primary" @click="health.markAllRead()">{{ t('alerts.markRead') }}</el-button>
        </section>

        <!-- 预警列表 -->
        <section class="alert-list">
          <div v-if="!filteredAlerts.length" class="empty qh-card">
            <el-icon :size="48" color="var(--color-success)"><CircleCheckFilled /></el-icon>
            <p>{{ t('alerts.noAlerts') }}</p>
          </div>
          <div
            v-for="alert in filteredAlerts"
            :key="alert.id"
            :class="['alert-card qh-card', severityClass(alert.severity), { unread: !alert.isRead, pushed: alert.isPushed }]"
            @click="health.markRead(alert.id)"
          >
            <div class="alert-icon">
              <el-icon :size="22"><component :is="severityIcon(alert.severity)" /></el-icon>
            </div>
            <div class="alert-body">
              <div class="alert-head">
                <h3>{{ tText(alert.title, locale as any) }}</h3>
                <div class="alert-meta">
                  <el-tag size="small" effect="plain">{{ sourceLabel(alert.source) }}</el-tag>
                  <el-tag size="small" type="info" effect="plain">{{ alert.memberName }}</el-tag>
                  <span v-if="alert.isPushed" class="pushed-tag"><el-icon><Promotion /></el-icon></span>
                  <span class="alert-time">{{ formatTime(alert.createdAt) }}</span>
                </div>
              </div>
              <p class="alert-content">{{ tText(alert.content, locale as any) }}</p>
              <div v-if="alert.metric" class="alert-metric">
                <span class="metric-label">{{ alert.metric.label }}</span>
                <span class="metric-value">{{ alert.metric.value }} {{ alert.metric.unit }}</span>
                <span class="metric-threshold">{{ t('alerts.threshold') }}: {{ alert.metric.threshold }}</span>
              </div>
              <div class="alert-suggestion">
                <el-icon><MagicStick /></el-icon>
                <span>{{ tText(alert.suggestion, locale as any) }}</span>
              </div>
            </div>
          </div>
        </section>
      </div>

      <!-- 右侧：药食同源 -->
      <aside class="side-col">
        <section class="recipe-card qh-card">
          <h2><el-icon><Dish /></el-icon> {{ t('alerts.dietTherapy') }}</h2>
          <div class="recipe-list">
            <div v-for="r in health.dietRecipes" :key="r.id" class="recipe-item">
              <h3>{{ tText(r.name, locale as any) }}</h3>
              <div class="recipe-tags">
                <el-tag v-for="ing in r.ingredients" :key="ing" size="small" type="warning" effect="plain">{{ ing }}</el-tag>
              </div>
              <p class="recipe-effect">{{ tText(r.effect, locale as any) }}</p>
              <div class="recipe-constitution">
                <span>{{ t('alerts.suitableFor') }}：</span>
                <el-tag v-for="c in r.constitution" :key="c" size="small" type="success">{{ c }}</el-tag>
              </div>
            </div>
          </div>
        </section>
      </aside>
    </div>

    <!-- 推送设置抽屉 -->
    <el-drawer v-model="showPushDrawer" :title="t('alerts.pushSettings')" size="560px" class="push-drawer">
      <div class="push-settings">
        <!-- ① 推送时间 -->
        <section class="ps-section">
          <h4 class="ps-title"><el-icon><Clock /></el-icon> {{ t('alerts.pushTimeSection') }}</h4>
          <div class="ps-row">
            <span class="ps-label">{{ t('alerts.enablePush') }}</span>
            <el-switch
              :model-value="health.pushSettings.enabled"
              @update:model-value="(v: string | number | boolean) => health.updatePushSettings({ enabled: Boolean(v) })"
            />
          </div>
          <div class="ps-row">
            <span class="ps-label">{{ t('alerts.pushWindow') }}</span>
            <div class="ps-time-range">
              <el-time-picker
                :model-value="health.pushSettings.dayStart"
                @update:model-value="(v: string | null) => v && health.updatePushSettings({ dayStart: v })"
                format="HH:mm"
                value-format="HH:mm"
                :clearable="false"
                size="small"
              />
              <span class="ps-sep">{{ t('alerts.pushTo') }}</span>
              <el-time-picker
                :model-value="health.pushSettings.dayEnd"
                @update:model-value="(v: string | null) => v && health.updatePushSettings({ dayEnd: v })"
                format="HH:mm"
                value-format="HH:mm"
                :clearable="false"
                size="small"
              />
            </div>
          </div>
          <div class="ps-row">
            <el-tag :type="isDaytime ? 'success' : 'info'" size="small">
              {{ isDaytime ? t('alerts.daytimeNow') : t('alerts.nighttimeNow') }}
            </el-tag>
          </div>
        </section>

        <!-- ② 风险阈值设定 -->
        <section class="ps-section">
          <div class="ps-title-row">
            <h4 class="ps-title"><el-icon><DataLine /></el-icon> {{ t('alerts.thresholdSection') }}</h4>
            <el-button text type="primary" size="small" @click="health.resetMetricThresholds()">
              {{ t('alerts.resetDefaults') }}
            </el-button>
          </div>
          <div class="th-table">
            <div class="th-head th-row">
              <span class="th-metric">{{ t('alerts.metricName') }}</span>
              <span class="th-val">{{ t('alerts.thLow') }}</span>
              <span class="th-val">{{ t('alerts.thHigh') }}</span>
              <span class="th-val th-critical">{{ t('alerts.thCritical') }}</span>
            </div>
            <div v-for="row in thresholdRows" :key="row.key" class="th-row">
              <span class="th-metric">{{ row.label }}<i class="th-unit">{{ row.unit }}</i></span>
              <el-input-number
                :model-value="getThreshold(row.key).low"
                @update:model-value="(v: number | undefined) => onThresholdChange(row.key, 'low', v)"
                :step="row.key === 'blood_glucose' || row.key === 'blood_lipid' ? 0.1 : 1"
                :controls="false"
                size="small"
                class="th-input"
              />
              <el-input-number
                :model-value="getThreshold(row.key).high"
                @update:model-value="(v: number | undefined) => onThresholdChange(row.key, 'high', v)"
                :step="row.key === 'blood_glucose' || row.key === 'blood_lipid' ? 0.1 : 1"
                :controls="false"
                size="small"
                class="th-input"
              />
              <el-input-number
                :model-value="getThreshold(row.key).critical"
                @update:model-value="(v: number | undefined) => onThresholdChange(row.key, 'critical', v)"
                :step="row.key === 'blood_glucose' || row.key === 'blood_lipid' ? 0.1 : 1"
                :controls="false"
                size="small"
                class="th-input th-input-critical"
              />
            </div>
          </div>
          <p class="ps-hint">{{ t('alerts.thresholdHint') }}</p>
        </section>

        <!-- ③ 昼夜推送节奏 -->
        <section class="ps-section">
          <h4 class="ps-title"><el-icon><Timer /></el-icon> {{ t('alerts.rhythmSection') }}</h4>
          <div class="ps-row">
            <span class="ps-label">{{ t('alerts.dayInterval') }}</span>
            <div class="ps-slider">
              <el-slider
                :model-value="health.pushSettings.dayIntervalMin"
                @update:model-value="(v: number | number[]) => health.updatePushSettings({ dayIntervalMin: Number(v) })"
                :min="10" :max="240" :step="10" show-input input-size="small" :show-input-controls="false"
              />
            </div>
          </div>
          <div class="ps-row">
            <span class="ps-label">{{ t('alerts.nightInterval') }}</span>
            <div class="ps-slider">
              <el-slider
                :model-value="health.pushSettings.nightIntervalMin"
                @update:model-value="(v: number | number[]) => health.updatePushSettings({ nightIntervalMin: Number(v) })"
                :min="30" :max="480" :step="30" show-input input-size="small" :show-input-controls="false"
              />
            </div>
          </div>
          <div class="ps-row">
            <div>
              <span class="ps-label">{{ t('alerts.nightCriticalOnly') }}</span>
              <p class="ps-hint">{{ t('alerts.nightCriticalOnlyHint') }}</p>
            </div>
            <el-switch
              :model-value="health.pushSettings.nightCriticalOnly"
              @update:model-value="(v: string | number | boolean) => health.updatePushSettings({ nightCriticalOnly: Boolean(v) })"
            />
          </div>
        </section>

        <!-- ④ 人群推送设定 -->
        <section class="ps-section">
          <h4 class="ps-title"><el-icon><User /></el-icon> {{ t('alerts.crowdSection') }}</h4>
          <div class="crowd-grid">
            <div class="crowd-item">
              <div>
                <strong>{{ t('alerts.crowdElderly') }}</strong>
                <p>{{ t('alerts.crowdElderlyDesc') }}</p>
              </div>
              <el-switch
                :model-value="health.pushSettings.crowdRules.elderly"
                @update:model-value="(v: string | number | boolean) => health.updatePushSettings({ crowdRules: { ...health.pushSettings.crowdRules, elderly: Boolean(v) } })"
              />
            </div>
            <div class="crowd-item">
              <div>
                <strong>{{ t('alerts.crowdChronic') }}</strong>
                <p>{{ t('alerts.crowdChronicDesc') }}</p>
              </div>
              <el-switch
                :model-value="health.pushSettings.crowdRules.chronic"
                @update:model-value="(v: string | number | boolean) => health.updatePushSettings({ crowdRules: { ...health.pushSettings.crowdRules, chronic: Boolean(v) } })"
              />
            </div>
            <div class="crowd-item">
              <div>
                <strong>{{ t('alerts.crowdChildren') }}</strong>
                <p>{{ t('alerts.crowdChildrenDesc') }}</p>
              </div>
              <el-switch
                :model-value="health.pushSettings.crowdRules.children"
                @update:model-value="(v: string | number | boolean) => health.updatePushSettings({ crowdRules: { ...health.pushSettings.crowdRules, children: Boolean(v) } })"
              />
            </div>
          </div>

          <h5 class="ps-subtitle">{{ t('alerts.memberPushSection') }}</h5>
          <div class="member-push-list">
            <div v-for="m in health.familyMembers" :key="m.id" class="member-push-item">
              <img :src="m.avatar" :alt="m.name" class="mp-avatar" />
              <div class="mp-info">
                <strong>{{ m.name }}</strong>
                <span>{{ crowdTag(m) }} · {{ localizeNumber(memberAge(m.birthDate), locale) }}{{ t('family.age') }}</span>
              </div>
              <el-switch
                :model-value="health.pushSettings.memberPush[m.id] !== false"
                @update:model-value="(v: string | number | boolean) => health.setMemberPush(m.id, Boolean(v))"
                size="small"
              />
            </div>
          </div>
        </section>
      </div>
      <template #footer>
        <div class="drawer-footer">
          <el-button @click="pushAll" :disabled="!health.alerts.length">
            <el-icon style="margin-right: 4px"><Promotion /></el-icon>{{ t('alerts.pushNow') }}
          </el-button>
          <el-button type="primary" @click="onDrawerSaved(); showPushDrawer = false">{{ t('common.save') }}</el-button>
        </div>
      </template>
    </el-drawer>
  </div>
</template>

<style scoped>
.alerts-page { padding: 24px 0 48px; }

.overview-card {
  display: flex;
  justify-content: space-between;
  gap: 24px;
  padding: 28px;
  margin-bottom: 24px;
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%);
  color: #fff;
  border: none;
}
.overview-title { display: flex; align-items: center; gap: 12px; margin-bottom: 8px; }
.overview-title h1 { font-size: 22px; font-weight: 600; margin: 0; color: #fff; }
.overview-sub { opacity: 0.85; font-size: 14px; margin: 0 0 20px; }
.overview-stats { display: flex; gap: 28px; }
.stat { display: flex; flex-direction: column; }
.stat-num { font-size: 28px; font-weight: 700; line-height: 1; }
.stat-label { font-size: 12px; opacity: 0.8; margin-top: 6px; }
.stat.critical .stat-num { color: #ff9b8a; }
.stat.warning .stat-num { color: var(--color-accent-light); }

.overview-actions { display: flex; flex-direction: column; gap: 12px; min-width: 240px; align-items: stretch; }
.overview-actions :deep(.el-switch__label) { color: #fff; }
.overview-actions :deep(.el-switch.is-checked .el-switch__label) { color: #fff; }

.content-grid { display: grid; grid-template-columns: 1fr 340px; gap: 24px; }
.card-header { margin-bottom: 16px; }
.card-header h2 { font-size: 17px; font-weight: 600; margin: 0; display: flex; align-items: center; gap: 8px; color: var(--color-primary); }

.wuyun-card { margin-bottom: 20px; }
.wuyun-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 16px; }
.wuyun-item { background: var(--color-bg-soft); border-radius: 10px; padding: 14px; display: flex; flex-direction: column; gap: 4px; }
.wuyun-item label { font-size: 12px; color: var(--color-text-secondary); }
.wuyun-item strong { font-size: 16px; color: var(--color-primary); }
.wuyun-item span { font-size: 12px; color: var(--color-accent); font-weight: 500; }
.wuyun-advice { font-size: 13px; color: var(--color-text-regular); line-height: 1.7; padding: 12px; background: rgba(26, 107, 92, 0.04); border-radius: 8px; margin: 0; }

.forecast-title { font-size: 14px; font-weight: 600; margin: 18px 0 10px; color: var(--color-text-primary); }
.forecast-list { display: grid; grid-template-columns: repeat(7, 1fr); gap: 8px; }
.forecast-item { padding: 10px 8px; border-radius: 8px; background: var(--color-bg); text-align: center; font-size: 12px; border-left: 3px solid var(--color-border); }
.forecast-item.risk-high { border-left-color: var(--color-danger); background: rgba(217, 107, 92, 0.06); }
.forecast-item.risk-medium { border-left-color: var(--color-warning); background: rgba(230, 162, 60, 0.06); }
.forecast-item.risk-low { border-left-color: var(--color-success); }
.forecast-date { display: flex; flex-direction: column; }
.forecast-date strong { font-size: 13px; }
.solar-term { font-size: 11px; color: var(--color-accent); font-weight: 500; }
.forecast-weather { display: flex; flex-direction: column; margin: 6px 0; color: var(--color-text-regular); }
.temp { font-size: 11px; color: var(--color-text-secondary); }
.forecast-phase { font-size: 11px; color: var(--color-primary); margin-bottom: 6px; }

.filter-bar { display: flex; align-items: center; gap: 16px; padding: 14px 20px; margin-bottom: 16px; flex-wrap: wrap; }
.filter-group { display: flex; align-items: center; gap: 8px; }
.filter-label { font-size: 13px; color: var(--color-text-secondary); white-space: nowrap; }
.filter-chip { padding: 5px 14px; border: 1px solid var(--color-border); background: #fff; border-radius: 999px; font-size: 13px; color: var(--color-text-regular); cursor: pointer; transition: all 0.2s; }
.filter-chip:hover { border-color: var(--color-primary); color: var(--color-primary); }
.filter-chip.active { background: var(--color-primary); color: #fff; border-color: var(--color-primary); }
.filter-select { padding: 6px 10px; border: 1px solid var(--color-border); border-radius: 8px; font-size: 13px; background: #fff; color: var(--color-text-primary); outline: none; }

.alert-list { display: flex; flex-direction: column; gap: 12px; }
.empty { padding: 48px; text-align: center; color: var(--color-text-secondary); }
.empty .el-icon { margin-bottom: 12px; }

.alert-card { display: flex; gap: 16px; padding: 18px 20px; cursor: pointer; transition: all 0.2s; position: relative; }
.alert-card:hover { transform: translateY(-1px); box-shadow: var(--color-hover-shadow, 0 4px 20px rgba(26, 107, 92, 0.12)); }
.alert-card.unread::before { content: ''; position: absolute; left: 0; top: 16px; bottom: 16px; width: 3px; border-radius: 0 2px 2px 0; }
.alert-card.sev-critical { border-left: 3px solid var(--color-danger); }
.alert-card.sev-critical.unread::before { background: var(--color-danger); }
.alert-card.sev-critical .alert-icon { background: rgba(217, 107, 92, 0.1); color: var(--color-danger); }
.alert-card.sev-warning { border-left: 3px solid var(--color-warning); }
.alert-card.sev-warning .alert-icon { background: rgba(230, 162, 60, 0.1); color: var(--color-warning); }
.alert-card.sev-info { border-left: 3px solid var(--color-primary); }
.alert-card.sev-info .alert-icon { background: rgba(26, 107, 92, 0.1); color: var(--color-primary); }
.alert-card.sev-success .alert-icon { background: rgba(82, 166, 122, 0.1); color: var(--color-success); }
.alert-card.pushed { opacity: 0.85; }

.alert-icon { width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.alert-body { flex: 1; min-width: 0; }
.alert-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; margin-bottom: 6px; flex-wrap: wrap; }
.alert-head h3 { font-size: 15px; font-weight: 600; margin: 0; color: var(--color-text-primary); }
.alert-meta { display: flex; align-items: center; gap: 8px; font-size: 12px; color: var(--color-text-secondary); }
.alert-time { white-space: nowrap; }
.pushed-tag { color: var(--color-primary); display: inline-flex; }
.alert-content { font-size: 13px; color: var(--color-text-regular); line-height: 1.6; margin: 0 0 10px; }
.alert-metric { display: flex; align-items: center; gap: 12px; padding: 8px 12px; background: var(--color-bg-soft); border-radius: 8px; font-size: 13px; margin-bottom: 8px; flex-wrap: wrap; }
.metric-label { color: var(--color-text-secondary); }
.metric-value { font-size: 16px; font-weight: 700; color: var(--color-danger); }
.metric-threshold { color: var(--color-text-secondary); font-size: 12px; }
.alert-suggestion { display: flex; gap: 8px; align-items: flex-start; font-size: 13px; color: var(--color-primary-dark); line-height: 1.6; padding: 8px 12px; background: rgba(26, 107, 92, 0.05); border-radius: 8px; }
.alert-suggestion .el-icon { flex-shrink: 0; margin-top: 2px; color: var(--color-accent); }

.side-col { display: flex; flex-direction: column; gap: 20px; }
.recipe-card h2 { font-size: 16px; font-weight: 600; margin: 0 0 16px; display: flex; align-items: center; gap: 8px; color: var(--color-primary); }
.recipe-list { display: flex; flex-direction: column; gap: 16px; }
.recipe-item { padding: 14px; background: var(--color-bg-soft); border-radius: 10px; }
.recipe-item h3 { font-size: 14px; font-weight: 600; margin: 0 0 8px; color: var(--color-text-primary); }
.recipe-tags { display: flex; flex-wrap: wrap; gap: 4px; margin-bottom: 8px; }
.recipe-effect { font-size: 12px; color: var(--color-text-regular); line-height: 1.6; margin: 0 0 8px; }
.recipe-constitution { display: flex; align-items: center; flex-wrap: wrap; gap: 4px; font-size: 12px; color: var(--color-text-secondary); }

@media (max-width: 1024px) {
  .content-grid { grid-template-columns: 1fr; }
  .wuyun-grid { grid-template-columns: repeat(2, 1fr); }
  .forecast-list { grid-template-columns: repeat(4, 1fr); }
}

/* ===== 推送设置抽屉 ===== */
.push-settings { display: flex; flex-direction: column; gap: 8px; }
.ps-section { background: var(--color-bg-soft); border-radius: 12px; padding: 16px; margin-bottom: 14px; }
.ps-title { font-size: 15px; font-weight: 600; margin: 0 0 14px; display: flex; align-items: center; gap: 8px; color: var(--color-primary); }
.ps-title-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
.ps-title-row .ps-title { margin: 0; }
.ps-subtitle { font-size: 13px; font-weight: 600; margin: 16px 0 10px; color: var(--color-text-primary); }
.ps-row { display: flex; justify-content: space-between; align-items: center; gap: 16px; padding: 8px 0; }
.ps-label { font-size: 13px; color: var(--color-text-regular); }
.ps-hint { font-size: 12px; color: var(--color-text-secondary); margin: 6px 0 0; line-height: 1.5; }
.ps-time-range { display: flex; align-items: center; gap: 8px; }
.ps-sep { color: var(--color-text-secondary); font-size: 13px; }
.ps-slider { flex: 1; max-width: 280px; }

.th-table { border: 1px solid var(--color-border); border-radius: 10px; overflow: hidden; background: #fff; }
.th-row { display: grid; grid-template-columns: 1.4fr 1fr 1fr 1fr; align-items: center; gap: 6px; padding: 8px 10px; border-bottom: 1px solid var(--color-border); font-size: 13px; }
.th-row:last-child { border-bottom: none; }
.th-head { background: var(--color-bg-soft); font-weight: 600; color: var(--color-text-secondary); font-size: 12px; }
.th-metric { color: var(--color-text-primary); }
.th-unit { font-style: normal; font-size: 11px; color: var(--color-text-secondary); margin-left: 4px; }
.th-val { text-align: center; color: var(--color-text-secondary); font-size: 12px; }
.th-critical { color: var(--color-danger); }
.th-input { width: 100%; }
.th-input :deep(.el-input__inner) { text-align: center; font-variant-numeric: tabular-nums; }
.th-input-critical :deep(.el-input__inner) { color: var(--color-danger); }

.crowd-grid { display: grid; grid-template-columns: 1fr; gap: 10px; }
.crowd-item { display: flex; justify-content: space-between; align-items: center; gap: 12px; background: #fff; border: 1px solid var(--color-border); border-radius: 10px; padding: 12px 14px; }
.crowd-item strong { font-size: 13px; color: var(--color-text-primary); display: block; margin-bottom: 3px; }
.crowd-item p { font-size: 12px; color: var(--color-text-secondary); margin: 0; line-height: 1.5; }

.member-push-list { display: flex; flex-direction: column; gap: 8px; }
.member-push-item { display: flex; align-items: center; gap: 10px; background: #fff; border: 1px solid var(--color-border); border-radius: 10px; padding: 10px 14px; }
.mp-avatar { width: 34px; height: 34px; border-radius: 50%; border: 1px solid var(--color-border); }
.mp-info { flex: 1; display: flex; flex-direction: column; }
.mp-info strong { font-size: 13px; }
.mp-info span { font-size: 11px; color: var(--color-text-secondary); }

.drawer-footer { display: flex; justify-content: flex-end; gap: 8px; }
@media (max-width: 640px) {
  .overview-card { flex-direction: column; padding: 20px; }
  .overview-stats { gap: 18px; }
  .stat-num { font-size: 22px; }
  .wuyun-grid { grid-template-columns: 1fr 1fr; }
  .forecast-list { grid-template-columns: repeat(2, 1fr); }
  .alert-meta { width: 100%; }
}
</style>
