import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type {
  FamilyMember,
  SmartWatch,
  HealthAlert,
  AlertSeverity,
  AlertCategory,
  Relationship,
  WuYunLiuQi,
  ForecastDay,
  PushSettings,
  MetricThreshold,
} from '@/types'
import { calculateWuYunLiuQi, generateForecast, calculateConstitutionFromBirth, DIET_RECIPES } from '@/mock/wuyun'
import { createWatch } from '@/mock/watch'
import { getLocale, tText } from '@/i18n'

const STORAGE_FAMILY = 'qh_family_members'
const STORAGE_WATCHES = 'qh_watches'
const STORAGE_ALERTS = 'qh_health_alerts'
const STORAGE_PUSH_SETTINGS = 'qh_push_settings_v2'

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}
function save<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value))
}

// 生成初始 Mock 家人
function defaultFamilyMembers(): FamilyMember[] {
  return [
    {
      id: 'm_self',
      name: '我',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=self',
      relationship: 'self',
      gender: 'male',
      birthDate: '1990-06-15',
      birthTime: '08:30',
      height: 172,
      weight: 68,
      constitution: 'shirong',
      watchId: 'w1',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'm_mom',
      name: '妈妈',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=mom',
      relationship: 'parent',
      gender: 'female',
      birthDate: '1965-03-22',
      birthTime: '06:00',
      height: 160,
      weight: 58,
      constitution: 'yinxu',
      watchId: 'w2',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'm_dad',
      name: '爸爸',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=dad',
      relationship: 'parent',
      gender: 'male',
      birthDate: '1962-11-08',
      height: 175,
      weight: 75,
      constitution: 'tanshi',
      watchId: 'w3',
      createdAt: new Date().toISOString(),
    },
  ]
}

function defaultWatches(): SmartWatch[] {
  return [
    createWatch('w1', 'm_self', '我', { battery: 78, templateIdx: 0 }),
    createWatch('w2', 'm_mom', '妈妈', { abnormal: true, battery: 45, templateIdx: 1 }),
    createWatch('w3', 'm_dad', '爸爸', { battery: 92, templateIdx: 2 }),
  ]
}

const T = (zh: string, en: string, ja: string, ko: string, es: string, fr: string) => ({ zh, en, ja, ko, es, fr })

// ========== 推送设置：默认风险阈值（ clinically common reference ranges ） ==========
export const DEFAULT_METRIC_THRESHOLDS: Record<string, MetricThreshold> = {
  blood_pressure_systolic: { low: 90, high: 140, critical: 180 }, // 收缩压 mmHg
  blood_pressure_diastolic: { low: 60, high: 90, critical: 110 }, // 舒张压 mmHg
  blood_glucose: { low: 3.9, high: 6.1, critical: 11.1 }, // 空腹血糖 mmol/L
  blood_lipid: { low: 2.5, high: 5.2, critical: 6.2 }, // 总血脂 mmol/L
  uric_acid: { low: 150, high: 420, critical: 480 }, // 尿酸 μmol/L
  creatinine: { low: 44, high: 115, critical: 133 }, // 肌酐 μmol/L
  heart_rate: { low: 50, high: 100, critical: 130 }, // 心率 bpm
  blood_oxygen: { low: 95, high: 100, critical: 100 }, // 血氧 %（低于 95 告警，低于 90 紧急）
  body_temperature: { low: 36.1, high: 37.2, critical: 38.5 }, // 体温 °C
  respiratory_rate: { low: 12, high: 20, critical: 26 }, // 呼吸频率 /min
  sleep_duration: { low: 6, high: 9, critical: 12 }, // 睡眠时长 h
  stress_index: { low: 20, high: 60, critical: 85 }, // 压力指数
}

export const METRIC_UNITS: Record<string, string> = {
  blood_pressure_systolic: 'mmHg',
  blood_pressure_diastolic: 'mmHg',
  blood_glucose: 'mmol/L',
  blood_lipid: 'mmol/L',
  uric_acid: 'μmol/L',
  creatinine: 'μmol/L',
  heart_rate: 'bpm',
  blood_oxygen: '%',
  body_temperature: '°C',
  respiratory_rate: '/min',
  sleep_duration: 'h',
  stress_index: '',
}

function defaultPushSettings(): PushSettings {
  return {
    enabled: true,
    dayStart: '07:00',
    dayEnd: '22:00',
    dayIntervalMin: 60,
    nightIntervalMin: 240,
    nightCriticalOnly: true,
    metricThresholds: JSON.parse(JSON.stringify(DEFAULT_METRIC_THRESHOLDS)),
    crowdRules: { elderly: true, chronic: true, children: true },
    memberPush: {},
  }
}

function loadPushSettings(): PushSettings {
  const base = defaultPushSettings()
  try {
    const raw = localStorage.getItem(STORAGE_PUSH_SETTINGS)
    if (!raw) return base
    const saved = JSON.parse(raw) as Partial<PushSettings>
    return {
      ...base,
      ...saved,
      metricThresholds: { ...base.metricThresholds, ...(saved.metricThresholds || {}) },
      crowdRules: { ...base.crowdRules, ...(saved.crowdRules || {}) },
      memberPush: { ...(saved.memberPush || {}) },
    }
  } catch {
    return base
  }
}

/** 依据用户设定的阈值判定指标状态（critical 仅作用于高侧；低侧以 low 为界） */
export function evaluateByThreshold(key: string, value: number, th: MetricThreshold): 'normal' | 'low' | 'high' | 'critical' {
  if (value >= th.critical) return 'critical'
  if (value > th.high) return 'high'
  if (value < th.low) return 'low'
  return 'normal'
}

// 基于手表数据生成预警
function deriveAlerts(member: FamilyMember, watch: SmartWatch | undefined): HealthAlert[] {
  const alerts: HealthAlert[] = []
  if (!watch) return alerts
  const now = new Date().toISOString()

  for (const m of watch.metrics) {
    if (m.status === 'critical' || m.status === 'high' || m.status === 'low') {
      const severity: AlertSeverity = m.status === 'critical' ? 'critical' : 'warning'
      const category: AlertCategory =
        m.key.includes('pressure') || m.key === 'heart_rate' ? 'vital' : 'chronic'
      const threshold = m.normalRange
      const label = tText(m.label, getLocale())
      alerts.push({
        id: `alert-${member.id}-${m.key}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        memberId: member.id,
        memberName: member.name,
        category,
        severity,
        title: T(
          `${member.name}的${label}异常`,
          `${member.name}'s ${label} abnormal`,
          `${member.name}の${label}異常`,
          `${member.name} ${label} 이상`,
          `${label} de ${member.name} anormal`,
          `${label} de ${member.name} anormal`,
        ),
        content: T(
          `当前${label}：${m.value} ${m.unit}，参考范围 ${threshold}，请关注`,
          `Current ${label}: ${m.value} ${m.unit}, range ${threshold}`,
          `現在${label}：${m.value} ${m.unit}、基準 ${threshold}`,
          `현재 ${label}: ${m.value} ${m.unit}, 기준 ${threshold}`,
          `${label}: ${m.value} ${m.unit}, rango ${threshold}`,
          `${label}: ${m.value} ${m.unit}, plage ${threshold}`,
        ),
        metric: { label, value: String(m.value), unit: m.unit, threshold },
        suggestion: T(
          m.key.includes('pressure') ? '建议休息，减少盐分摄入，必要时就医' :
          m.key === 'blood_glucose' ? '建议控制碳水摄入，监测空腹血糖' :
          m.key === 'uric_acid' ? '建议低嘌呤饮食，多饮水，避免酒精' :
          m.key === 'blood_lipid' ? '建议低脂饮食，适度有氧运动' :
          m.key === 'heart_rate' ? '建议静息后复测，如持续异常请就医' :
          m.key === 'blood_oxygen' ? '血氧偏低，建议深呼吸休息并复测，持续偏低请就医' :
          m.key === 'body_temperature' ? '体温异常，建议多饮水休息并复测体温' :
          m.key === 'respiratory_rate' ? '呼吸频率异常，建议静坐休息，观察是否伴随胸闷' :
          m.key === 'sleep_duration' ? '睡眠时长不足，建议规律作息、避免熬夜' :
          m.key === 'stress_index' ? '压力偏高，建议放松训练、适度运动、保证睡眠' :
          '建议规律作息，持续监测',
          'Take rest, monitor and consult doctor if persistent.',
          '安静にして経過観察',
          '안정을 취하고 관찰',
          'Descanse y consulte al médico',
          'Reposez-vous et consultez un médecin',
        ),
        source: 'watch',
        createdAt: now,
        isRead: false,
        isPushed: false,
        voiceText: T(
          `注意，${member.name}的${label}为${m.value}${m.unit}，${m.status === 'critical' ? '已达紧急水平，' : ''}请及时关注。`,
          `Alert: ${member.name}'s ${label} is ${m.value} ${m.unit}.`,
          `注意：${member.name}の${label}が${m.value}${m.unit}です。`,
          `주의: ${member.name}의 ${label} ${m.value}${m.unit}.`,
          `Alerta: ${label} de ${member.name} es ${m.value} ${m.unit}.`,
          `Alerte: ${label} de ${member.name} est ${m.value} ${m.unit}.`,
        ),
      })
    }
  }
  return alerts
}

function buildClimateAlerts(members: FamilyMember[]): HealthAlert[] {
  const wuyun = calculateWuYunLiuQi(new Date().getFullYear())
  const forecast = generateForecast(new Date(), 3)
  const alerts: HealthAlert[] = []
  const today = forecast[0]
  if (!today) return alerts
  const now = new Date().toISOString()

  for (const member of members) {
    // 根据体质与气候风险匹配
    const constitution = member.constitution || 'pinghe'
    const isHighRiskConstitution = ['qixu', 'yangxu', 'tanshi', 'qiyu'].includes(constitution)
    if (today.riskLevel === 'high' || isHighRiskConstitution) {
      alerts.push({
        id: `climate-${member.id}-${Date.now()}`,
        memberId: member.id,
        memberName: member.name,
        category: 'climate',
        severity: today.riskLevel === 'high' ? 'warning' : 'info',
        title: T(
          `${today.solarTerm}节气 · ${wuyun.siTian}气候预警`,
          `${today.solarTerm} · ${wuyun.siTian} Climate Alert`,
          `${today.solarTerm}節気 · 気候注意`,
          `${today.solarTerm} 절기 · 기후 주의`,
          `${today.solarTerm} · Alerta climática`,
          `${today.solarTerm} · Alerte climatique`,
        ),
        content: T(
          `${today.weather}，${today.temperatureRange}。${wuyun.climateRisk.zh}`,
          `${today.weather}, ${today.temperatureRange}. ${wuyun.climateRisk.en}`,
          `${today.weather}、${today.temperatureRange}。${wuyun.climateRisk.ja}`,
          `${today.weather}, ${today.temperatureRange}. ${wuyun.climateRisk.ko}`,
          `${today.weather}, ${today.temperatureRange}. ${wuyun.climateRisk.es}`,
          `${today.weather}, ${today.temperatureRange}. ${wuyun.climateRisk.fr}`,
        ),
        suggestion: T(
          `易感${today.riskOrgans.join('、')}，推荐：${today.dietRecipes.map((r) => r.name.zh).join('、')}`,
          `Susceptible: ${today.riskOrgans.join(', ')}. Recipes: ${today.dietRecipes.map((r) => r.name.en).join(', ')}`,
          `注意臓器：${today.riskOrgans.join('/')}。薬膳：${today.dietRecipes.map((r) => r.name.ja).join('、')}`,
          `주의 장기: ${today.riskOrgans.join('/')}. 약선: ${today.dietRecipes.map((r) => r.name.ko).join(', ')}`,
          `Órganos: ${today.riskOrgans.join(', ')}. Recetas: ${today.dietRecipes.map((r) => r.name.es).join(', ')}`,
          `Organes: ${today.riskOrgans.join(', ')}. Recettes: ${today.dietRecipes.map((r) => r.name.fr).join(', ')}`,
        ),
        source: 'wuyun',
        createdAt: now,
        isRead: false,
        isPushed: false,
        voiceText: T(
          `节气提醒，今日${today.solarTerm}，${wuyun.climateRisk.zh}，请注意${today.riskOrgans.join('、')}保养。`,
          `Solar term reminder: ${today.solarTerm}. Take care of ${today.riskOrgans.join(', ')}.`,
          `節気リマインダー：${today.solarTerm}。${today.riskOrgans.join('/')}を養生`,
          `절기 알림: ${today.solarTerm}. ${today.riskOrgans.join('/')} 보양`,
          `Recordatorio: ${today.solarTerm}. Cuide ${today.riskOrgans.join(', ')}.`,
          `Rappel: ${today.solarTerm}. Prenez soin de ${today.riskOrgans.join(', ')}.`,
        ),
      })
    }
  }
  return alerts
}

export const useHealthStore = defineStore('health', () => {
  const familyMembers = ref<FamilyMember[]>(load(STORAGE_FAMILY, defaultFamilyMembers()))
  const watches = ref<SmartWatch[]>(load(STORAGE_WATCHES, defaultWatches()))
  const alerts = ref<HealthAlert[]>(load(STORAGE_ALERTS, []))
  const selectedMemberId = ref<string>(familyMembers.value[0]?.id || '')
  const voiceEnabled = ref<boolean>(localStorage.getItem('qh_voice_enabled') !== 'false')
  const pushEnabled = ref<boolean>(localStorage.getItem('qh_push_enabled') !== 'false')
  const pushSettings = ref<PushSettings>(loadPushSettings())

  const currentYearWuYun = computed<WuYunLiuQi>(() => calculateWuYunLiuQi(new Date().getFullYear()))
  const forecast7d = computed<ForecastDay[]>(() => generateForecast(new Date(), 7))
  const dietRecipes = DIET_RECIPES

  const selectedMember = computed(() =>
    familyMembers.value.find((m) => m.id === selectedMemberId.value),
  )
  const selectedWatch = computed(() =>
    watches.value.find((w) => w.memberId === selectedMemberId.value),
  )

  const watchByMember = computed(() => {
    const map: Record<string, SmartWatch | undefined> = {}
    for (const w of watches.value) map[w.memberId] = w
    return map
  })

  const unreadCount = computed(() => alerts.value.filter((a) => !a.isRead).length)
  const criticalCount = computed(() => alerts.value.filter((a) => a.severity === 'critical' && !a.isRead).length)

  const memberAlerts = computed(() =>
    selectedMemberId.value
      ? alerts.value.filter((a) => a.memberId === selectedMemberId.value)
      : alerts.value,
  )

  function persist() {
    save(STORAGE_FAMILY, familyMembers.value)
    save(STORAGE_WATCHES, watches.value)
    save(STORAGE_ALERTS, alerts.value)
  }

  function selectMember(id: string) {
    selectedMemberId.value = id
  }

  function addMember(payload: Omit<FamilyMember, 'id' | 'avatar' | 'createdAt'>): FamilyMember {
    const id = `m_${Date.now()}`
    // 基于出生日期推算体质
    const calc = calculateConstitutionFromBirth(payload.birthDate)
    const member: FamilyMember = {
      ...payload,
      id,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(payload.name)}`,
      constitution: payload.constitution || calc.primary,
      createdAt: new Date().toISOString(),
    }
    familyMembers.value.push(member)
    selectedMemberId.value = id
    persist()
    // 重新生成气候预警
    refreshAlerts()
    return member
  }

  function updateMember(id: string, patch: Partial<FamilyMember>) {
    const idx = familyMembers.value.findIndex((m) => m.id === id)
    if (idx >= 0) {
      familyMembers.value[idx] = { ...familyMembers.value[idx], ...patch }
      persist()
    }
  }

  function deleteMember(id: string) {
    familyMembers.value = familyMembers.value.filter((m) => m.id !== id)
    watches.value = watches.value.filter((w) => w.memberId !== id)
    alerts.value = alerts.value.filter((a) => a.memberId !== id)
    if (selectedMemberId.value === id) {
      selectedMemberId.value = familyMembers.value[0]?.id || ''
    }
    persist()
  }

  function addWatch(payload: { memberId: string; name: string; model: string; serial: string; mac: string }) {
    const member = familyMembers.value.find((m) => m.id === payload.memberId)
    if (!member) return
    const id = `w_${Date.now()}`
    const watch = createWatch(id, payload.memberId, member.name, { templateIdx: 0, battery: 80 })
    watch.name = payload.name
    watch.model = payload.model
    watch.serial = payload.serial
    watch.mac = payload.mac
    watches.value.push(watch)
    updateMember(payload.memberId, { watchId: id })
    persist()
  }

  function updateWatch(id: string, patch: Partial<SmartWatch>) {
    const idx = watches.value.findIndex((w) => w.id === id)
    if (idx >= 0) {
      watches.value[idx] = { ...watches.value[idx], ...patch }
      persist()
    }
  }

  function deleteWatch(id: string) {
    const w = watches.value.find((x) => x.id === id)
    if (w) {
      updateMember(w.memberId, { watchId: undefined })
    }
    watches.value = watches.value.filter((x) => x.id !== id)
    persist()
  }

  function syncWatch(id: string) {
    const idx = watches.value.findIndex((w) => w.id === id)
    if (idx < 0) return
    watches.value[idx].status = 'syncing'
    setTimeout(() => {
      const member = familyMembers.value.find((m) => m.id === watches.value[idx].memberId)
      const abnormal = watches.value[idx].metrics.some((m) => m.status !== 'normal')
      const fresh = createWatch(watches.value[idx].id, watches.value[idx].memberId, watches.value[idx].memberName, {
        battery: Math.min(100, watches.value[idx].battery + Math.floor(Math.random() * 5)),
        abnormal,
      })
      fresh.name = watches.value[idx].name
      fresh.model = watches.value[idx].model
      fresh.serial = watches.value[idx].serial
      fresh.mac = watches.value[idx].mac
      fresh.firmware = watches.value[idx].firmware
      watches.value[idx] = fresh
      persist()
      // 重新计算预警
      if (member) {
        const newAlerts = deriveAlerts(member, fresh)
        alerts.value = alerts.value.filter((a) => !(a.memberId === member.id && a.source === 'watch'))
        alerts.value.unshift(...newAlerts)
        persist()
      }
    }, 1500)
  }

  function refreshAlerts() {
    // 清理旧的手表和气候预警，重新生成
    alerts.value = alerts.value.filter((a) => a.source !== 'watch' && a.source !== 'wuyun')
    for (const member of familyMembers.value) {
      const watch = watches.value.find((w) => w.memberId === member.id)
      alerts.value.unshift(...deriveAlerts(member, watch))
    }
    alerts.value.unshift(...buildClimateAlerts(familyMembers.value))
    persist()
  }

  function markAllRead() {
    alerts.value.forEach((a) => (a.isRead = true))
    persist()
  }

  function markRead(id: string) {
    const a = alerts.value.find((x) => x.id === id)
    if (a) {
      a.isRead = true
      persist()
    }
  }

  function markPushed(ids: string[]) {
    alerts.value.forEach((a) => {
      if (ids.includes(a.id)) a.isPushed = true
    })
    persist()
  }

  function setVoiceEnabled(v: boolean) {
    voiceEnabled.value = v
    localStorage.setItem('qh_voice_enabled', String(v))
  }
  function setPushEnabled(v: boolean) {
    pushEnabled.value = v
    localStorage.setItem('qh_push_enabled', String(v))
    pushSettings.value.enabled = v
    persistPushSettings()
  }

  function persistPushSettings() {
    localStorage.setItem(STORAGE_PUSH_SETTINGS, JSON.stringify(pushSettings.value))
  }

  /** 更新推送设置（局部补丁） */
  function updatePushSettings(patch: Partial<PushSettings>) {
    pushSettings.value = { ...pushSettings.value, ...patch }
    persistPushSettings()
  }

  /** 设置单个指标的风险阈值 */
  function setMetricThreshold(key: string, th: MetricThreshold) {
    pushSettings.value.metricThresholds = { ...pushSettings.value.metricThresholds, [key]: { ...th } }
    persistPushSettings()
  }

  /** 阈值恢复默认 */
  function resetMetricThresholds() {
    pushSettings.value.metricThresholds = JSON.parse(JSON.stringify(DEFAULT_METRIC_THRESHOLDS))
    persistPushSettings()
  }

  /** 设置某位家人是否推送 */
  function setMemberPush(memberId: string, enabled: boolean) {
    pushSettings.value.memberPush = { ...pushSettings.value.memberPush, [memberId]: enabled }
    persistPushSettings()
  }

  /** 判断当前时刻是否处于白天时段 */
  function isDaytimeNow(): boolean {
    const now = new Date()
    const cur = now.getHours() * 60 + now.getMinutes()
    const [sh, sm] = pushSettings.value.dayStart.split(':').map(Number)
    const [eh, em] = pushSettings.value.dayEnd.split(':').map(Number)
    return cur >= sh * 60 + (sm || 0) && cur < eh * 60 + (em || 0)
  }

  /** 按人群规则判定家人是否应推送（年龄人群 × 总开关） */
  function shouldPushForMember(member: FamilyMember, severity: AlertSeverity = 'warning'): boolean {
    if (!pushSettings.value.enabled) return false
    const explicit = pushSettings.value.memberPush[member.id]
    if (explicit === false) return false
    // 夜间仅推送紧急
    if (!isDaytimeNow() && pushSettings.value.nightCriticalOnly && severity !== 'critical') return false
    // 人群规则
    const age = Math.floor((Date.now() - new Date(member.birthDate).getTime()) / (365.25 * 24 * 3600 * 1000))
    const rules = pushSettings.value.crowdRules
    if (age >= 60) return rules.elderly
    if (age <= 12) return rules.children
    // 中青年：默认推送（除非人群规则全关）
    return true
  }

  // 初始化：若无预警，生成
  if (alerts.value.length === 0) {
    refreshAlerts()
  }

  return {
    familyMembers,
    watches,
    alerts,
    selectedMemberId,
    selectedMember,
    selectedWatch,
    watchByMember,
    unreadCount,
    criticalCount,
    memberAlerts,
    voiceEnabled,
    pushEnabled,
    pushSettings,
    currentYearWuYun,
    forecast7d,
    dietRecipes,
    selectMember,
    addMember,
    updateMember,
    deleteMember,
    addWatch,
    updateWatch,
    deleteWatch,
    syncWatch,
    refreshAlerts,
    markAllRead,
    markRead,
    markPushed,
    setVoiceEnabled,
    setPushEnabled,
    updatePushSettings,
    setMetricThreshold,
    resetMetricThresholds,
    setMemberPush,
    isDaytimeNow,
    shouldPushForMember,
    calculateConstitutionFromBirth,
  }
})
