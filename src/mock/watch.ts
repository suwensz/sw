// 智能手表 Mock 数据生成器
import type { SmartWatch, HealthMetric, EcgPoint, VitalReading } from '@/types'

const METRIC_META: Record<string, { normalRange: string; unit: string; base: number; variance: number; min: number; max: number; criticalLow: number; criticalHigh: number }> = {
  blood_pressure_systolic: { normalRange: '90-140', unit: 'mmHg', base: 125, variance: 8, min: 90, max: 140, criticalLow: 85, criticalHigh: 160 },
  blood_pressure_diastolic: { normalRange: '60-90', unit: 'mmHg', base: 80, variance: 5, min: 60, max: 90, criticalLow: 55, criticalHigh: 100 },
  blood_glucose: { normalRange: '3.9-6.1', unit: 'mmol/L', base: 5.4, variance: 0.4, min: 3.9, max: 6.1, criticalLow: 3.5, criticalHigh: 7.8 },
  blood_lipid: { normalRange: '<5.2', unit: 'mmol/L', base: 4.8, variance: 0.3, min: 3, max: 5.2, criticalLow: 2.5, criticalHigh: 6.5 },
  uric_acid: { normalRange: '150-420', unit: 'μmol/L', base: 360, variance: 25, min: 150, max: 420, criticalLow: 120, criticalHigh: 480 },
  creatinine: { normalRange: '44-115', unit: 'μmol/L', base: 82, variance: 8, min: 44, max: 115, criticalLow: 40, criticalHigh: 133 },
  heart_rate: { normalRange: '60-100', unit: 'bpm', base: 72, variance: 6, min: 60, max: 100, criticalLow: 50, criticalHigh: 115 },
  // 市场主流监测功能扩展
  blood_oxygen: { normalRange: '95-100', unit: '%', base: 97, variance: 1.5, min: 95, max: 100, criticalLow: 90, criticalHigh: 100 },
  body_temperature: { normalRange: '36.1-37.2', unit: '°C', base: 36.6, variance: 0.25, min: 36.1, max: 37.2, criticalLow: 35.3, criticalHigh: 38.5 },
  respiratory_rate: { normalRange: '12-20', unit: '/min', base: 16, variance: 2, min: 12, max: 20, criticalLow: 8, criticalHigh: 26 },
  sleep_duration: { normalRange: '6-9', unit: 'h', base: 7.2, variance: 0.8, min: 6, max: 9, criticalLow: 4, criticalHigh: 12 },
  stress_index: { normalRange: '20-60', unit: '', base: 45, variance: 10, min: 20, max: 60, criticalLow: 0, criticalHigh: 85 },
}

const LABELS: Record<string, { zh: string; en: string; ja: string; ko: string; es: string; fr: string }> = {
  blood_pressure_systolic: { zh: '收缩压', en: 'Systolic BP', ja: '収縮期血圧', ko: '수축기혈압', es: 'Sistólica', fr: 'Systolique' },
  blood_pressure_diastolic: { zh: '舒张压', en: 'Diastolic BP', ja: '拡張期血圧', ko: '이완기혈압', es: 'Diastólica', fr: 'Diastolique' },
  blood_glucose: { zh: '血糖', en: 'Glucose', ja: '血糖', ko: '혈당', es: 'Glucosa', fr: 'Glycémie' },
  blood_lipid: { zh: '血脂', en: 'Blood Lipid', ja: '血脂', ko: '혈중지질', es: 'Lípidos', fr: 'Lipides' },
  uric_acid: { zh: '尿酸', en: 'Uric Acid', ja: '尿酸', ko: '요산', es: 'Ácido úrico', fr: 'Acide urique' },
  creatinine: { zh: '肌酐', en: 'Creatinine', ja: 'クレアチニン', ko: '크레아티닌', es: 'Creatinina', fr: 'Créatinine' },
  heart_rate: { zh: '心率', en: 'Heart Rate', ja: '心拍数', ko: '심박수', es: 'Pulso', fr: 'Pouls' },
  blood_oxygen: { zh: '血氧饱和度', en: 'Blood Oxygen', ja: '血中酸素', ko: '혈중산소', es: 'Oxígeno', fr: 'Oxygène' },
  body_temperature: { zh: '体温', en: 'Temperature', ja: '体温', ko: '체온', es: 'Temperatura', fr: 'Température' },
  respiratory_rate: { zh: '呼吸频率', en: 'Respiratory Rate', ja: '呼吸数', ko: '호흡수', es: 'Frecuencia respiratoria', fr: 'Fréquence respiratoire' },
  sleep_duration: { zh: '睡眠时长', en: 'Sleep Duration', ja: '睡眠時間', ko: '수면 시간', es: 'Duración del sueño', fr: 'Durée du sommeil' },
  stress_index: { zh: '压力指数', en: 'Stress Index', ja: 'ストレス指数', ko: '스트레스 지수', es: 'Índice de estrés', fr: 'Indice de stress' },
}

function generateHistory(base: number, variance: number, points: number = 24): VitalReading[] {
  const now = Date.now()
  return Array.from({ length: points }, (_, i) => {
    const t = now - (points - i) * 3600 * 1000
    const value = base + (Math.sin(i / 3) * variance) + (Math.random() - 0.5) * variance * 0.5
    return { timestamp: new Date(t).toISOString(), value: Number(value.toFixed(1)) }
  })
}

function getStatus(value: number, meta: typeof METRIC_META[string]): 'normal' | 'low' | 'high' | 'critical' {
  if (value >= meta.criticalHigh || value <= meta.criticalLow) return 'critical'
  if (value > meta.max) return 'high'
  if (value < meta.min) return 'low'
  return 'normal'
}

function getTrend(history: VitalReading[]): 'up' | 'down' | 'stable' {
  if (history.length < 2) return 'stable'
  const recent = history.slice(-3).reduce((s, r) => s + r.value, 0) / 3
  const earlier = history.slice(-6, -3).reduce((s, r) => s + r.value, 0) / 3
  const diff = ((recent - earlier) / earlier) * 100
  if (diff > 3) return 'up'
  if (diff < -3) return 'down'
  return 'stable'
}

function generateEcg(normal: boolean = true, points: number = 200): EcgPoint[] {
  // 简化心电图波形：PQRST 复合波
  const result: EcgPoint[] = []
  for (let i = 0; i < points; i++) {
    const phase = (i % 40) / 40
    let v = 0
    // P 波
    if (phase > 0.05 && phase < 0.15) v = Math.sin((phase - 0.1) * Math.PI / 0.05) * 0.15
    // QRS 复合波
    if (phase > 0.22 && phase < 0.26) v = -0.2
    if (phase > 0.26 && phase < 0.3) v = 1.2 // R 波
    if (phase > 0.3 && phase < 0.33) v = -0.3
    // T 波
    if (phase > 0.45 && phase < 0.65) v = Math.sin((phase - 0.55) * Math.PI / 0.1) * 0.3
    // 基线噪声
    v += (Math.random() - 0.5) * 0.03
    if (!normal && i % 60 < 5) v += 0.4 // 异常早搏
    result.push({ t: i * 0.02, v: Number(v.toFixed(3)) })
  }
  return result
}

const WATCH_TEMPLATES = [
  { name: '素衡 Watch Pro', model: 'SH-WP2024', serial: 'SH2024', mac: 'A4:C1:38:XX:XX:01' },
  { name: '素衡 Watch Lite', model: 'SH-WL2024', serial: 'SH2024', mac: 'A4:C1:38:XX:XX:02' },
  { name: '素衡 Watch Mini', model: 'SH-WM2024', serial: 'SH2024', mac: 'A4:C1:38:XX:XX:03' },
]

export function createMetric(key: string, abnormal: boolean = false): HealthMetric {
  const meta = METRIC_META[key]
  const offset = abnormal
    ? key.includes('pressure') || key === 'blood_glucose' || key === 'uric_acid' || key === 'blood_lipid'
      ? meta.variance * 2.5
      : -meta.variance * 2
    : 0
  const value = Number((meta.base + offset + (Math.random() - 0.5) * meta.variance).toFixed(1))
  const history = generateHistory(meta.base + offset, meta.variance)
  return {
    key,
    label: LABELS[key],
    value,
    unit: meta.unit,
    status: getStatus(value, meta),
    normalRange: meta.normalRange,
    trend: getTrend(history),
    history,
    lastSync: new Date(Date.now() - Math.random() * 600000).toISOString(),
  }
}

export function createWatch(
  id: string,
  memberId: string,
  memberName: string,
  opts: { abnormal?: boolean; offline?: boolean; battery?: number; templateIdx?: number } = {},
): SmartWatch {
  const tpl = WATCH_TEMPLATES[opts.templateIdx ?? Math.floor(Math.random() * WATCH_TEMPLATES.length)]
  const battery = opts.battery ?? Math.floor(20 + Math.random() * 75)
  const abnormal = opts.abnormal ?? false

  return {
    id,
    name: tpl.name,
    model: tpl.model,
    serial: `${tpl.serial}${Math.floor(Math.random() * 9000 + 1000)}`,
    mac: tpl.mac,
    firmware: '2.4.1',
    battery,
    status: opts.offline ? 'offline' : battery < 15 ? 'charging' : 'online',
    lastSync: opts.offline
      ? new Date(Date.now() - 3600 * 1000 * 3).toISOString()
      : new Date(Date.now() - Math.random() * 600000).toISOString(),
    memberId,
    memberName,
    worn: !opts.offline,
    metrics: [
      createMetric('blood_pressure_systolic', abnormal),
      createMetric('blood_pressure_diastolic', abnormal),
      createMetric('blood_glucose', abnormal),
      createMetric('blood_lipid', abnormal),
      createMetric('uric_acid', abnormal),
      createMetric('creatinine', false),
      createMetric('heart_rate', abnormal),
      createMetric('blood_oxygen', abnormal),
      createMetric('body_temperature', false),
      createMetric('respiratory_rate', false),
      createMetric('sleep_duration', false),
      createMetric('stress_index', false),
    ],
    ecg: generateEcg(!abnormal),
  }
}
