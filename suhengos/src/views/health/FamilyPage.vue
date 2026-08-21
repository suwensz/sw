<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useHealthStore } from '@/stores/health'
import { tText } from '@/i18n'
import { localizeNumber } from '@/utils/numbers'
import type { FamilyMember, Relationship } from '@/types'
import { ElMessage } from 'element-plus'
import {
  lunar2solar,
  lunarMonthDaysOf,
  lunarMonthOptions,
  lunarYearRange,
  solarStr2lunar,
  formatLunarBirth,
  leapMonth,
} from '@/utils/lunar'

const { t, locale } = useI18n()
const health = useHealthStore()

const showDialog = ref(false)
const editingId = ref<string | null>(null)
const form = ref({
  name: '',
  relationship: 'parent' as Relationship,
  gender: 'male' as 'male' | 'female' | 'other',
  calendarType: 'solar' as 'solar' | 'lunar',
  birthDate: '',
  lunarYear: new Date().getFullYear(),
  lunarMonthKey: '1-false',
  lunarDay: 1,
  birthTime: '',
  height: undefined as number | undefined,
  weight: undefined as number | undefined,
})

const constitutionLabels: Record<string, { zh: string; en: string; ja: string; ko: string; es: string; fr: string }> = {
  pinghe: { zh: '平和质', en: 'Balanced', ja: '平和質', ko: '평화질', es: 'Equilibrado', fr: 'Équilibré' },
  qixu: { zh: '气虚质', en: 'Qi Deficiency', ja: '気虚質', ko: '기허질', es: 'Deficiencia de Qi', fr: 'Déficience en Qi' },
  yangxu: { zh: '阳虚质', en: 'Yang Deficiency', ja: '陽虚質', ko: '양허질', es: 'Deficiencia de Yang', fr: 'Déficience en Yang' },
  yinxu: { zh: '阴虚质', en: 'Yin Deficiency', ja: '陰虚質', ko: '음허질', es: 'Deficiencia de Yin', fr: 'Déficience en Yin' },
  tanshi: { zh: '痰湿质', en: 'Phlegm-Dampness', ja: '痰湿質', ko: '담습질', es: 'Flema-Humedad', fr: 'Glaires-Humidité' },
  shire: { zh: '湿热质', en: 'Damp-Heat', ja: '湿熱質', ko: '습열질', es: 'Humedad-Calor', fr: 'Humidité-Chaleur' },
  xueyu: { zh: '血瘀质', en: 'Blood Stasis', ja: '血瘀質', ko: '혈어질', es: 'Estasis sanguínea', fr: 'Stase sanguine' },
  qiyu: { zh: '气郁质', en: 'Qi Stagnation', ja: '気鬱質', ko: '기울질', es: 'Estancamiento de Qi', fr: 'Stagnation du Qi' },
  tebing: { zh: '特禀质', en: 'Inherited', ja: '特禀質', ko: '특이질', es: 'Especial', fr: 'Spécial' },
}

// 选中家人的体质推算结果
const calcResult = computed(() => {
  if (!health.selectedMember) return null
  return health.calculateConstitutionFromBirth(health.selectedMember.birthDate)
})

const selectedConstitutionLabel = computed(() => {
  if (!health.selectedMember?.constitution) return '-'
  const c = constitutionLabels[health.selectedMember.constitution]
  return c ? tText(c, locale as any) : health.selectedMember.constitution
})

function openAdd() {
  editingId.value = null
  form.value = {
    name: '', relationship: 'parent', gender: 'male',
    calendarType: 'solar', birthDate: '',
    lunarYear: new Date().getFullYear(), lunarMonthKey: '1-false', lunarDay: 1,
    birthTime: '', height: undefined, weight: undefined,
  }
  showDialog.value = true
}

function openEdit(m: FamilyMember) {
  editingId.value = m.id
  form.value = {
    name: m.name, relationship: m.relationship, gender: m.gender,
    calendarType: m.calendarType || 'solar',
    birthDate: m.birthDate, birthTime: m.birthTime || '',
    lunarYear: m.lunarBirth?.year ?? new Date().getFullYear(),
    lunarMonthKey: m.lunarBirth ? `${m.lunarBirth.month}-${m.lunarBirth.isLeap}` : '1-false',
    lunarDay: m.lunarBirth?.day ?? 1,
    height: m.height, weight: m.weight,
  }
  if (!m.lunarBirth && m.birthDate) syncLunarFromSolar()
  showDialog.value = true
}

function save() {
  if (!form.value.name) {
    ElMessage.warning(t('alerts.info'))
    return
  }
  let birthDate = form.value.birthDate
  let lunarBirth: { year: number; month: number; day: number; isLeap: boolean } | undefined
  if (form.value.calendarType === 'lunar') {
    const { month, isLeap } = selectedLunarMonth()
    try {
      const s = lunar2solar(form.value.lunarYear, month, form.value.lunarDay, isLeap)
      birthDate = formatSolarDate(s)
    } catch {
      ElMessage.warning(t('alerts.info'))
      return
    }
    lunarBirth = { year: form.value.lunarYear, month, day: form.value.lunarDay, isLeap }
  } else {
    if (!form.value.birthDate) {
      ElMessage.warning(t('alerts.info'))
      return
    }
    const l = solarStr2lunar(form.value.birthDate)
    if (l) lunarBirth = { year: l.year, month: l.month, day: l.day, isLeap: l.isLeap }
  }
  const payload = {
    name: form.value.name,
    relationship: form.value.relationship,
    gender: form.value.gender,
    calendarType: form.value.calendarType,
    birthDate,
    lunarBirth,
    birthTime: form.value.birthTime || undefined,
    height: form.value.height,
    weight: form.value.weight,
  }
  if (editingId.value) {
    health.updateMember(editingId.value, payload)
  } else {
    health.addMember(payload)
  }
  showDialog.value = false
  ElMessage.success('✓')
}

function remove(id: string) {
  if (confirm(t('family.confirmDelete'))) {
    health.deleteMember(id)
  }
}

function calcAge(birthDate: string): number {
  const today = new Date()
  const birth = new Date(birthDate)
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
  return age
}

function calcBMI(m: FamilyMember): string {
  if (!m.height || !m.weight) return '-'
  const bmi = m.weight / Math.pow(m.height / 100, 2)
  return bmi.toFixed(1)
}

const relationshipOptions = computed(() => [
  { value: 'self', label: t('family.relationships.self') },
  { value: 'parent', label: t('family.relationships.parent') },
  { value: 'spouse', label: t('family.relationships.spouse') },
  { value: 'child', label: t('family.relationships.child') },
  { value: 'sibling', label: t('family.relationships.sibling') },
  { value: 'other', label: t('family.relationships.other') },
])

const wuyun = computed(() => calcResult.value?.wuyun)

// ===== 阴历（农历）选择与换算 =====
const [minLunarYear, maxLunarYear] = lunarYearRange()
const lunarYearOptions = computed(() => {
  const opts: number[] = []
  for (let y = maxLunarYear; y >= minLunarYear; y--) opts.push(y)
  return opts
})

function selectedLunarMonth(): { month: number; isLeap: boolean } {
  const [m, leap] = form.value.lunarMonthKey.split('-')
  return { month: Number(m) || 1, isLeap: leap === 'true' }
}

const lunarMonthOpts = computed(() =>
  lunarMonthOptions(form.value.lunarYear).map((m) => ({
    label: m.isLeap ? `${t('family.leapMonthPrefix')}${m.value}` : `${m.value}`,
    value: `${m.value}-${m.isLeap}`,
  })),
)

const lunarDayMax = computed(() => {
  const { month, isLeap } = selectedLunarMonth()
  return lunarMonthDaysOf(form.value.lunarYear, month, isLeap)
})

const lunarDayOptions = computed(() => {
  const opts: number[] = []
  for (let d = 1; d <= lunarDayMax.value; d++) opts.push(d)
  return opts
})

watch(
  () => form.value.lunarYear,
  () => {
    const { month, isLeap } = selectedLunarMonth()
    const leap = leapMonth(form.value.lunarYear)
    form.value.lunarMonthKey = `${month}-${isLeap && leap === month ? 'true' : 'false'}`
  },
)

watch(lunarDayMax, (max) => {
  if (form.value.lunarDay > max) form.value.lunarDay = max
})

function formatSolarDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function syncLunarFromSolar() {
  const l = solarStr2lunar(form.value.birthDate)
  if (l) {
    form.value.lunarYear = l.year
    form.value.lunarMonthKey = `${l.month}-${l.isLeap}`
    form.value.lunarDay = l.day
  }
}

function syncSolarFromLunar() {
  try {
    const { month, isLeap } = selectedLunarMonth()
    const s = lunar2solar(form.value.lunarYear, month, form.value.lunarDay, isLeap)
    form.value.birthDate = formatSolarDate(s)
  } catch {
    // 忽略非法换算
  }
}

function onCalendarTypeChange() {
  if (form.value.calendarType === 'lunar') {
    syncLunarFromSolar()
  } else {
    syncSolarFromLunar()
  }
}

function lunarDisplay(m: FamilyMember): string {
  const lb = m.lunarBirth || solarStr2lunar(m.birthDate)
  return lb ? formatLunarBirth(lb, locale.value) : ''
}
</script>

<template>
  <div class="family-page qh-container">
    <div class="page-header">
      <div>
        <h1>{{ t('family.title') }}</h1>
        <p>{{ t('family.subtitle') }}</p>
      </div>
      <el-button type="primary" @click="openAdd">
        <el-icon style="margin-right: 4px"><Plus /></el-icon>{{ t('family.addMember') }}
      </el-button>
    </div>

    <div class="family-layout">
      <!-- 左侧家人列表 -->
      <aside class="member-list qh-card">
        <div
          v-for="m in health.familyMembers"
          :key="m.id"
          :class="['member-item', { active: health.selectedMemberId === m.id }]"
          @click="health.selectMember(m.id)"
        >
          <div class="member-avatar">
            <img :src="m.avatar" :alt="m.name" />
            <span v-if="m.watchId && health.watchByMember[m.id]?.status === 'online'" class="online-dot"></span>
          </div>
          <div class="member-info">
            <strong>{{ m.name }}</strong>
            <span class="member-meta">
              {{ t(`family.relationships.${m.relationship}`) }} · {{ localizeNumber(calcAge(m.birthDate), locale) }}{{ t('family.age') }}
            </span>
            <span v-if="m.constitution" class="member-constitution">
              {{ tText(constitutionLabels[m.constitution] || { zh: m.constitution, en: m.constitution, ja: m.constitution, ko: m.constitution, es: m.constitution, fr: m.constitution }, locale as any) }}
            </span>
          </div>
        </div>
        <div v-if="!health.familyMembers.length" class="empty-hint">{{ t('family.noMembers') }}</div>
      </aside>

      <!-- 右侧详情 -->
      <section class="member-detail qh-card" v-if="health.selectedMember">
        <div class="detail-header">
          <div class="detail-avatar">
            <img :src="health.selectedMember.avatar" :alt="health.selectedMember.name" />
          </div>
          <div class="detail-title">
            <h2>{{ health.selectedMember.name }}</h2>
            <div class="detail-tags">
              <el-tag>{{ t(`family.relationships.${health.selectedMember.relationship}`) }}</el-tag>
              <el-tag type="info">{{ localizeNumber(calcAge(health.selectedMember.birthDate), locale) }}{{ t('family.age') }}</el-tag>
              <el-tag v-if="health.selectedMember.gender" type="success">
                {{ t(`family.${health.selectedMember.gender}`) }}
              </el-tag>
            </div>
          </div>
          <div class="detail-actions">
            <el-button @click="openEdit(health.selectedMember)">
              <el-icon style="margin-right: 4px"><Edit /></el-icon>{{ t('family.editMember') }}
            </el-button>
            <el-button type="danger" plain @click="remove(health.selectedMember.id)">
              <el-icon style="margin-right: 4px"><Delete /></el-icon>{{ t('family.delete') }}
            </el-button>
          </div>
        </div>

        <div class="detail-grid">
          <div class="info-block">
            <label>{{ t('family.birthDate') }}</label>
            <strong>{{ health.selectedMember.birthDate }}</strong>
            <span v-if="lunarDisplay(health.selectedMember)" class="info-sub">
              {{ lunarDisplay(health.selectedMember) }}
            </span>
          </div>
          <div class="info-block" v-if="health.selectedMember.birthTime">
            <label>{{ t('family.birthTime') }}</label>
            <strong>{{ health.selectedMember.birthTime }}</strong>
          </div>
          <div class="info-block" v-if="health.selectedMember.height">
            <label>{{ t('family.height') }}</label>
            <strong>{{ health.selectedMember.height }} cm</strong>
          </div>
          <div class="info-block" v-if="health.selectedMember.weight">
            <label>{{ t('family.weight') }}</label>
            <strong>{{ health.selectedMember.weight }} kg</strong>
          </div>
          <div class="info-block">
            <label>{{ t('family.bmi') }}</label>
            <strong>{{ calcBMI(health.selectedMember) }}</strong>
          </div>
        </div>

        <!-- 先天体质推算 -->
        <div class="calc-section" v-if="calcResult">
          <h3><el-icon><DataAnalysis /></el-icon> {{ t('family.constitutionCalc') }}</h3>
          <p class="calc-explanation">{{ tText(calcResult.explanation, locale as any) }}</p>

          <div class="calc-result">
            <div class="calc-primary">
              <label>{{ t('family.calcResult') }}</label>
              <strong :class="`const-${calcResult.primary}`">
                {{ tText(constitutionLabels[calcResult.primary] || { zh: calcResult.primary, en: calcResult.primary, ja: calcResult.primary, ko: calcResult.primary, es: calcResult.primary, fr: calcResult.primary }, locale as any) }}
              </strong>
            </div>
          </div>

          <!-- 九种体质得分条 -->
          <div class="score-bars">
            <div v-for="(score, key) in calcResult.scores" :key="key" class="score-row">
              <span class="score-label">{{ tText(constitutionLabels[key] || { zh: key, en: key, ja: key, ko: key, es: key, fr: key }, locale as any) }}</span>
              <div class="score-bar">
                <div class="score-fill" :class="{ active: key === calcResult.primary }" :style="{ width: `${Math.min(100, score)}%` }"></div>
              </div>
              <span class="score-value">{{ localizeNumber(Math.round(score), locale) }}</span>
            </div>
          </div>
        </div>

        <!-- 五运六气分析 -->
        <div class="wuyun-section" v-if="wuyun">
          <h3><el-icon><Sunny /></el-icon> {{ t('family.wuyunAnalysis') }}</h3>
          <div class="wuyun-cards">
            <div class="wy-card">
              <label>年运</label>
              <strong>{{ wuyun.yearGan }}{{ wuyun.yearZhi }} · {{ wuyun.zhuYun }}</strong>
            </div>
            <div class="wy-card">
              <label>司天 / 在泉</label>
              <strong>{{ wuyun.siTian }} / {{ wuyun.zaiQuan }}</strong>
            </div>
            <div class="wy-card">
              <label>{{ t('alerts.susceptibleOrgans') }}</label>
              <strong>{{ wuyun.susceptibleOrgans.join('、') }}</strong>
            </div>
          </div>
          <p class="wy-advice">{{ tText(wuyun.advice, locale as any) }}</p>
        </div>
      </section>

      <section v-else class="empty-detail qh-card">
        <el-icon :size="48" color="var(--color-text-secondary)"><User /></el-icon>
        <p>{{ t('family.selectToView') }}</p>
      </section>
    </div>

    <!-- 添加/编辑弹窗 -->
    <el-dialog v-model="showDialog" :title="editingId ? t('family.editMember') : t('family.addMember')" width="520px">
      <el-form :model="form" label-position="top" class="member-form">
        <el-form-item :label="t('family.name')">
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item :label="t('family.relationship')">
          <el-select v-model="form.relationship" style="width: 100%">
            <el-option v-for="opt in relationshipOptions" :key="opt.value" :value="opt.value" :label="opt.label" />
          </el-select>
        </el-form-item>
        <el-form-item :label="t('family.gender')">
          <el-radio-group v-model="form.gender">
            <el-radio value="male">{{ t('family.male') }}</el-radio>
            <el-radio value="female">{{ t('family.female') }}</el-radio>
            <el-radio value="other">{{ t('family.other') }}</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item :label="t('family.birthDate')" required>
          <div class="calendar-switch">
            <el-radio-group v-model="form.calendarType" @change="onCalendarTypeChange">
              <el-radio-button value="solar">{{ t('family.calendarSolar') }}</el-radio-button>
              <el-radio-button value="lunar">{{ t('family.calendarLunar') }}</el-radio-button>
            </el-radio-group>
          </div>
          <el-date-picker
            v-if="form.calendarType === 'solar'"
            v-model="form.birthDate"
            type="date"
            value-format="YYYY-MM-DD"
            style="width: 100%"
          />
          <template v-else>
            <div class="lunar-picker">
              <el-select v-model="form.lunarYear" style="width: 100%">
                <el-option
                  v-for="y in lunarYearOptions"
                  :key="y"
                  :value="y"
                  :label="`${y}${t('family.lunarYearSuffix')}`"
                />
              </el-select>
              <el-select v-model="form.lunarMonthKey" style="width: 100%">
                <el-option v-for="mo in lunarMonthOpts" :key="mo.value" :value="mo.value" :label="mo.label" />
              </el-select>
              <el-select v-model="form.lunarDay" style="width: 100%">
                <el-option v-for="d in lunarDayOptions" :key="d" :value="d" :label="String(d)" />
              </el-select>
            </div>
            <div class="form-hint">{{ t('family.lunarHint') }}</div>
          </template>
        </el-form-item>
        <el-form-item :label="t('family.birthTime')">
          <el-time-picker v-model="form.birthTime" format="HH:mm" value-format="HH:mm" placeholder="" style="width: 100%" />
          <div class="form-hint">{{ t('family.birthTimeHint') }}</div>
        </el-form-item>
        <div class="form-row">
          <el-form-item :label="t('family.height')">
            <el-input-number v-model="form.height" :min="50" :max="250" style="width: 100%" />
          </el-form-item>
          <el-form-item :label="t('family.weight')">
            <el-input-number v-model="form.weight" :min="10" :max="300" style="width: 100%" />
          </el-form-item>
        </div>
      </el-form>
      <template #footer>
        <el-button @click="showDialog = false">{{ t('family.cancel') }}</el-button>
        <el-button type="primary" @click="save">{{ t('family.save') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.family-page { padding: 24px 0 48px; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
.page-header h1 { font-size: 24px; font-weight: 600; margin: 0 0 4px; color: var(--color-text-primary); }
.page-header p { font-size: 14px; color: var(--color-text-secondary); margin: 0; }

.family-layout { display: grid; grid-template-columns: 280px 1fr; gap: 20px; align-items: start; }

.member-list { padding: 12px; max-height: calc(100vh - 200px); overflow-y: auto; }
.member-item { display: flex; gap: 12px; padding: 12px; border-radius: 10px; cursor: pointer; transition: all 0.2s; }
.member-item:hover { background: var(--color-bg-soft); }
.member-item.active { background: rgba(26, 107, 92, 0.08); }
.member-avatar { position: relative; width: 48px; height: 48px; border-radius: 50%; overflow: hidden; flex-shrink: 0; border: 2px solid var(--color-border); }
.member-avatar img { width: 100%; height: 100%; }
.online-dot { position: absolute; bottom: 0; right: 0; width: 12px; height: 12px; background: var(--color-success); border: 2px solid #fff; border-radius: 50%; }
.member-info { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.member-info strong { font-size: 15px; color: var(--color-text-primary); }
.member-meta { font-size: 12px; color: var(--color-text-secondary); }
.member-constitution { font-size: 11px; color: var(--color-primary); font-weight: 500; }
.empty-hint { padding: 32px; text-align: center; color: var(--color-text-secondary); font-size: 13px; }

.member-detail { padding: 28px; }
.detail-header { display: flex; align-items: center; gap: 20px; padding-bottom: 20px; border-bottom: 1px solid var(--color-border); margin-bottom: 24px; }
.detail-avatar { width: 72px; height: 72px; border-radius: 50%; overflow: hidden; border: 3px solid var(--color-primary); }
.detail-avatar img { width: 100%; height: 100%; }
.detail-title { flex: 1; }
.detail-title h2 { font-size: 22px; margin: 0 0 8px; }
.detail-tags { display: flex; gap: 8px; }
.detail-actions { display: flex; gap: 8px; }

.detail-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 16px; margin-bottom: 28px; }
.info-block { background: var(--color-bg-soft); padding: 14px 16px; border-radius: 10px; display: flex; flex-direction: column; gap: 4px; }
.info-block label { font-size: 12px; color: var(--color-text-secondary); }
.info-block strong { font-size: 17px; color: var(--color-primary); }

.calc-section, .wuyun-section { margin-bottom: 28px; }
.calc-section h3, .wuyun-section h3 { font-size: 16px; font-weight: 600; margin: 0 0 12px; display: flex; align-items: center; gap: 8px; color: var(--color-primary); }
.calc-explanation { font-size: 13px; color: var(--color-text-regular); line-height: 1.7; padding: 12px 16px; background: rgba(26, 107, 92, 0.04); border-radius: 8px; margin: 0 0 16px; }

.calc-result { display: flex; gap: 16px; margin-bottom: 20px; }
.calc-primary { flex: 1; padding: 16px; background: linear-gradient(135deg, rgba(26, 107, 92, 0.08), rgba(212, 168, 83, 0.08)); border-radius: 10px; }
.calc-primary label { font-size: 12px; color: var(--color-text-secondary); display: block; margin-bottom: 6px; }
.calc-primary strong { font-size: 24px; color: var(--color-primary); }

.score-bars { display: flex; flex-direction: column; gap: 8px; }
.score-row { display: grid; grid-template-columns: 100px 1fr 40px; align-items: center; gap: 12px; font-size: 13px; }
.score-label { color: var(--color-text-regular); }
.score-bar { height: 8px; background: var(--color-bg-soft); border-radius: 4px; overflow: hidden; }
.score-fill { height: 100%; background: var(--color-border); border-radius: 4px; transition: width 0.5s; }
.score-fill.active { background: linear-gradient(90deg, var(--color-primary), var(--color-accent)); }
.score-value { text-align: right; color: var(--color-text-secondary); font-variant-numeric: tabular-nums; }

.wuyun-cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; margin-bottom: 16px; }
.wy-card { background: var(--color-bg-soft); padding: 14px; border-radius: 10px; display: flex; flex-direction: column; gap: 4px; }
.wy-card label { font-size: 12px; color: var(--color-text-secondary); }
.wy-card strong { font-size: 14px; color: var(--color-primary); }
.wy-advice { font-size: 13px; color: var(--color-text-regular); line-height: 1.7; padding: 12px; background: rgba(212, 168, 83, 0.06); border-radius: 8px; margin: 0; }

.empty-detail { padding: 80px 20px; text-align: center; color: var(--color-text-secondary); display: flex; flex-direction: column; align-items: center; gap: 16px; }

.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.form-hint { font-size: 12px; color: var(--color-text-secondary); margin-top: 4px; }
.calendar-switch { margin-bottom: 10px; }
.lunar-picker { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; width: 100%; }
.info-sub { font-size: 12px; color: var(--color-text-secondary); margin-top: 2px; }

.const-qixu, .const-yangxu, .const-yinxu, .const-tanshi, .const-shire, .const-xueyu, .const-qiyu, .const-tebing { color: var(--color-accent); }

@media (max-width: 768px) {
  .family-layout { grid-template-columns: 1fr; }
  .member-list { max-height: none; display: flex; gap: 8px; overflow-x: auto; }
  .member-item { min-width: 180px; }
  .detail-header { flex-wrap: wrap; }
  .detail-actions { width: 100%; }
}
</style>
