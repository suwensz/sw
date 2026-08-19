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
} from '@/types'
import { calculateWuYunLiuQi, generateForecast, calculateConstitutionFromBirth, DIET_RECIPES } from '@/mock/wuyun'
import { createWatch } from '@/mock/watch'
import { getLocale, tText } from '@/i18n'

const STORAGE_FAMILY = 'qh_family_members'
const STORAGE_WATCHES = 'qh_watches'
const STORAGE_ALERTS = 'qh_health_alerts'

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
    calculateConstitutionFromBirth,
  }
})
