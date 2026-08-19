// 五运六气与三因司天数据（中医运气学说）
// 包含年运推算、客气六步、气候风险、药食同源方案
import type { WuYunLiuQi, ForecastDay, DietRecipe, LocaleText } from '@/types'

const T = (zh: string, en: string, ja: string, ko: string, es: string, fr: string): LocaleText => ({
  zh, en, ja, ko, es, fr,
})

// 天干
const TIAN_GAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸']
// 地支
const DI_ZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥']

// 五运：甲己土、乙庚金、丙辛水、丁壬木、戊癸火
const WU_YUN_MAP: Record<string, string> = {
  甲: '土运', 己: '土运', 乙: '金运', 庚: '金运',
  丙: '水运', 辛: '水运', 丁: '木运', 壬: '木运',
  戊: '火运', 癸: '火运',
}

// 司天：子午少阴君火、丑未太阴湿土、寅申少阳相火、卯酉阳明燥金、辰戌太阳寒水、巳亥厥阴风木
const SI_TIAN_MAP: Record<string, string> = {
  子: '少阴君火', 午: '少阴君火',
  丑: '太阴湿土', 未: '太阴湿土',
  寅: '少阳相火', 申: '少阳相火',
  卯: '阳明燥金', 酉: '阳明燥金',
  辰: '太阳寒水', 戌: '太阳寒水',
  巳: '厥阴风木', 亥: '厥阴风木',
}

// 脏腑易感
const ORGANS_MAP: Record<string, string[]> = {
  土运: ['脾', '胃'],
  金运: ['肺', '大肠'],
  水运: ['肾', '膀胱'],
  木运: ['肝', '胆'],
  火运: ['心', '小肠'],
}

// 主气六步固定：厥阴风木→少阴君火→少阳相火→太阴湿土→阳明燥金→太阳寒水
const ZHU_QI = ['厥阴风木', '少阴君火', '少阳相火', '太阴湿土', '阳明燥金', '太阳寒水']

// 药食同源方案库
export const DIET_RECIPES: DietRecipe[] = [
  {
    id: 'r1',
    name: T('山药薏米粥', 'Yam & Barley Porridge', '山芋ハトムギ粥', '산약의이죽', 'Gachas de ñame y cebada', 'Porridge d\'igname et orge'),
    ingredients: ['山药', '薏米', '粳米', '红枣'],
    effect: T('健脾祛湿，和胃止泻', 'Spleen tonic, removes dampness', '健脾祛湿', '비장을 튼튼히', 'Tonifica el bazo', 'Tonifie la rate'),
    constitution: ['qixu', 'tanshi'],
  },
  {
    id: 'r2',
    name: T('枸杞菊花茶', 'Goji Chrysanthemum Tea', 'クコ菊花茶', '구기국화차', 'Té de goji y crisantemo', 'Thé goji-chrysanthème'),
    ingredients: ['枸杞子', '菊花', '决明子'],
    effect: T('清肝明目，滋补肝肾', 'Clears liver, improves vision', '肝を清める', '간을 맑게', 'Limpia el hígado', 'Nettoie le foie'),
    constitution: ['yinxu', 'qiyu'],
  },
  {
    id: 'r3',
    name: T('当归生姜羊肉汤', 'Angelica Ginger Lamb Soup', '当帰生姜羊肉スープ', '당귀생강양고기탕', 'Sopa de angélica y cordero', 'Soupe d\'angélique et agneau'),
    ingredients: ['当归', '生姜', '羊肉', '红枣'],
    effect: T('温经散寒，补血益气', 'Warms meridians, nourishes blood', '温経散寒', '온경산한', 'Calienta los meridianos', 'Réchauffe les méridiens'),
    constitution: ['yangxu', 'xueyu'],
  },
  {
    id: 'r4',
    name: T('百合银耳莲子羹', 'Lily Tremella Lotus Soup', '百合キクラギ蓮子羹', '백합은이련자羹', 'Sopa de lirio y tremella', 'Soupe de lys et tremella'),
    ingredients: ['百合', '银耳', '莲子', '冰糖'],
    effect: T('滋阴润肺，养心安神', 'Nourishes yin, moistens lungs', '滋陰潤肺', '자음윤폐', 'Nutre el yin', 'Nourrit le yin'),
    constitution: ['yinxu', 'pinghe'],
  },
  {
    id: 'r5',
    name: T('陈皮茯苓茶', 'Tangerine Poria Tea', '陳皮茯苓茶', '진피복령차', 'Té de tangerina y poria', 'Thé de zeste et poria'),
    ingredients: ['陈皮', '茯苓', '白术'],
    effect: T('理气健脾，燥湿化痰', 'Regulates qi, resolves phlegm', '理気健脾', '이기건비', 'Regula el qi', 'Régule le qi'),
    constitution: ['tanshi', 'qiyu'],
  },
  {
    id: 'r6',
    name: T('绿豆莲藕汤', 'Mung Bean Lotus Root Soup', '緑豆レンコンスープ', '녹두연근탕', 'Sopa de frijol mungo', 'Soupe de haricot mungo'),
    ingredients: ['绿豆', '莲藕', '百合'],
    effect: T('清热凉血，生津止渴', 'Clears heat, cools blood', '清熱涼血', '청열양혈', 'Refresca el calor', 'Évacue la chaleur'),
    constitution: ['yinxu', 'shire'],
  },
]

// 节气列表（简版，24 节气近似日期）
const SOLAR_TERMS: Array<{ name: string; month: number; day: number; phase: number }> = [
  { name: '立春', month: 2, day: 4, phase: 0 },
  { name: '雨水', month: 2, day: 19, phase: 0 },
  { name: '惊蛰', month: 3, day: 6, phase: 1 },
  { name: '春分', month: 3, day: 21, phase: 1 },
  { name: '清明', month: 4, day: 5, phase: 1 },
  { name: '谷雨', month: 4, day: 20, phase: 2 },
  { name: '立夏', month: 5, day: 6, phase: 2 },
  { name: '小满', month: 5, day: 21, phase: 2 },
  { name: '芒种', month: 6, day: 6, phase: 3 },
  { name: '夏至', month: 6, day: 21, phase: 3 },
  { name: '小暑', month: 7, day: 7, phase: 3 },
  { name: '大暑', month: 7, day: 23, phase: 4 },
  { name: '立秋', month: 8, day: 8, phase: 4 },
  { name: '处暑', month: 8, day: 23, phase: 4 },
  { name: '白露', month: 9, day: 8, phase: 5 },
  { name: '秋分', month: 9, day: 23, phase: 5 },
  { name: '寒露', month: 10, day: 8, phase: 5 },
  { name: '霜降', month: 10, day: 23, phase: 0 },
  { name: '立冬', month: 11, day: 7, phase: 0 },
  { name: '小雪', month: 11, day: 22, phase: 0 },
  { name: '大雪', month: 12, day: 7, phase: 1 },
  { name: '冬至', month: 12, day: 22, phase: 1 },
  { name: '小寒', month: 1, day: 6, phase: 2 },
  { name: '大寒', month: 1, day: 20, phase: 2 },
]

function getCurrentSolarTerm(date: Date): { name: string; phase: number } {
  const m = date.getMonth() + 1
  const d = date.getDate()
  // 找到最近一个已过的节气
  let current = SOLAR_TERMS[0]
  for (const term of SOLAR_TERMS) {
    const termDate = new Date(date.getFullYear(), term.month - 1, term.day)
    if (date >= termDate) {
      current = term
    }
  }
  return { name: current.name, phase: current.phase }
}

// 推算年运
export function calculateWuYunLiuQi(year: number): WuYunLiuQi {
  const ganIdx = (year - 4) % 10
  const zhiIdx = (year - 4) % 12
  const gan = TIAN_GAN[ganIdx]
  const zhi = DI_ZHI[zhiIdx]
  const zhuYun = WU_YUN_MAP[gan]
  const siTian = SI_TIAN_MAP[zhi]

  // 客气计算（简化）：根据司天推算
  const zaiQuan = getZaiQuan(siTian)
  const keQi = getKeQi(siTian)

  const organs = ORGANS_MAP[zhuYun] || []
  const riskText = generateClimateRisk(zhuYun, siTian)

  return {
    year,
    yearGan: gan,
    yearZhi: zhi,
    zhuYun,
    siTian,
    zaiQuan,
    keQi,
    zhuQi: ZHU_QI,
    climateRisk: riskText,
    susceptibleOrgans: organs,
    advice: T(
      `本年${zhuYun}主事，${siTian}司天，宜${getAdvice(zhuYun)}，注意${organs.join('、')}调养`,
      `This year ${zhuYun} governs, ${siTian} oversees. Focus on ${organs.join('/')} health.`,
      `本年は${zhuYun}、${siTian}。${organs.join('/')}を養生`,
      `올해 ${zhuYun}, ${siTian}. ${organs.join('/')} 보양`,
      `Este año ${zhuYun}, ${siTian}. Cuide ${organs.join('/')}`,
      `Cette année ${zhuYun}, ${siTian}. Prenez soin de ${organs.join('/')}`,
    ),
  }
}

function getZaiQuan(siTian: string): string {
  const map: Record<string, string> = {
    '少阴君火': '阳明燥金',
    '太阴湿土': '太阳寒水',
    '少阳相火': '厥阴风木',
    '阳明燥金': '少阴君火',
    '太阳寒水': '太阴湿土',
    '厥阴风木': '少阳相火',
  }
  return map[siTian] || '未知'
}

function getKeQi(siTian: string): string[] {
  // 客气六步：司天位于三之气，在泉位于终之气
  const order = ['厥阴风木', '少阴君火', '太阴湿土', '少阳相火', '阳明燥金', '太阳寒水']
  const siTianIdx = order.indexOf(siTian)
  if (siTianIdx === -1) return ZHU_QI
  const result: string[] = []
  for (let i = 0; i < 6; i++) {
    result.push(order[(siTianIdx - 2 + i + 6) % 6])
  }
  return result
}

function getAdvice(zhuYun: string): string {
  const map: Record<string, string> = {
    土运: '健脾祛湿',
    金运: '润肺防燥',
    水运: '温补肾阳',
    木运: '疏肝理气',
    火运: '清心降火',
  }
  return map[zhuYun] || '调养身心'
}

function generateClimateRisk(zhuYun: string, siTian: string): LocaleText {
  return T(
    `${zhuYun}配合${siTian}，气候可能出现${getClimateDesc(siTian)}，易感${(ORGANS_MAP[zhuYun] || []).join('、')}`,
    `${zhuYun} with ${siTian}: climate may ${getClimateDescEn(siTian)}.`,
    `${zhuYun}×${siTian}: ${getClimateDescJa(siTian)}`,
    `${zhuYun}×${siTian}: 기후 영향`,
    `${zhuYun} con ${siTian}: impacto climático`,
    `${zhuYun} avec ${siTian}: impact climatique`,
  )
}

function getClimateDesc(siTian: string): string {
  const map: Record<string, string> = {
    '少阴君火': '燥热偏盛',
    '太阴湿土': '湿热多雨',
    '少阳相火': '炎热酷暑',
    '阳明燥金': '干燥少雨',
    '太阳寒水': '寒冷多雪',
    '厥阴风木': '多风气郁',
  }
  return map[siTian] || '气候异常'
}
function getClimateDescEn(s: string): string {
  return { '少阴君火': 'be hot and dry', '太阴湿土': 'be humid and rainy', '少阳相火': 'be extremely hot', '阳明燥金': 'be dry', '太阳寒水': 'be cold and snowy', '厥阴风木': 'be windy' }[s] || 'be unusual'
}
function getClimateDescJa(s: string): string {
  return { '少阴君火': '乾燥傾向', '太阴湿土': '多湿', '少阳相火': '猛暑', '阳明燥金': '乾燥', '太阳寒水': '寒冷', '厥阴风木': '強風' }[s] || '異常気象'
}

// 生成未来7天气候预警
export function generateForecast(startDate: Date = new Date(), days: number = 7): ForecastDay[] {
  const result: ForecastDay[] = []
  const weatherOptions = ['晴', '多云', '小雨', '阴', '晴转多云', '阵雨']
  const wuyun = calculateWuYunLiuQi(startDate.getFullYear())

  for (let i = 0; i < days; i++) {
    const date = new Date(startDate)
    date.setDate(date.getDate() + i)
    const term = getCurrentSolarTerm(date)
    const isHighRisk = term.phase === 3 || term.phase === 4
    const isMediumRisk = term.phase === 2 || term.phase === 5

    result.push({
      date: date.toISOString().split('T')[0],
      solarTerm: term.name,
      qiPhase: ZHU_QI[term.phase],
      weather: weatherOptions[i % weatherOptions.length],
      temperatureRange: `${18 + ((i * 3) % 12)}-${26 + ((i * 5) % 10)}°C`,
      riskLevel: isHighRisk ? 'high' : isMediumRisk ? 'medium' : 'low',
      riskOrgans: wuyun.susceptibleOrgans,
      advice: T(
        `${term.name}时节，${wuyun.advice.zh}`,
        `During ${term.name}, follow seasonal care.`,
        `${term.name}の時期、養生を`,
        `${term.name} 절기, 보양`,
        `Durante ${term.name}, cuídese`,
        `Pendant ${term.name}, prenez soin`,
      ),
      dietRecipes: DIET_RECIPES.filter((r) => {
        if (term.phase === 3 || term.phase === 4) return r.constitution.includes('yinxu') || r.constitution.includes('shire')
        if (term.phase === 0) return r.constitution.includes('yangxu')
        return true
      }).slice(0, 2),
    })
  }
  return result
}

// 根据出生日期推算先天体质（基于运气学说简化版）
export function calculateConstitutionFromBirth(birthDate: string): {
  primary: string
  scores: Record<string, number>
  wuyun: WuYunLiuQi
  explanation: LocaleText
} {
  const date = new Date(birthDate)
  const year = date.getFullYear()
  const wuyun = calculateWuYunLiuQi(year)
  const term = getCurrentSolarTerm(date)

  // 根据出生时的运和气推算体质倾向（简化算法）
  const scores: Record<string, number> = {
    pinghe: 50,
    qixu: 40,
    yangxu: 35,
    yinxu: 35,
    tanshi: 30,
    shire: 30,
    xueyu: 25,
    qiyu: 35,
    tebing: 15,
  }

  // 根据五运调整
  const yunConstitutionMap: Record<string, Partial<Record<string, number>>> = {
    土运: { qixu: 25, tanshi: 20 },
    金运: { qiyu: 15, yinxu: 15 },
    水运: { yangxu: 25, xueyu: 10 },
    木运: { qiyu: 25, xueyu: 10 },
    火运: { yinxu: 20, shire: 15 },
  }
  const yunAdj = yunConstitutionMap[wuyun.zhuYun] || {}
  for (const [k, v] of Object.entries(yunAdj)) {
    scores[k] = (scores[k] || 0) + (v as number)
  }

  // 根据司天调整
  const sitianAdj: Record<string, Partial<Record<string, number>>> = {
    '少阴君火': { yinxu: 15 },
    '太阴湿土': { tanshi: 20 },
    '少阳相火': { shire: 15, yinxu: 10 },
    '阳明燥金': { yinxu: 10, qixu: 10 },
    '太阳寒水': { yangxu: 20 },
    '厥阴风木': { qiyu: 20 },
  }
  const stAdj = sitianAdj[wuyun.siTian] || {}
  for (const [k, v] of Object.entries(stAdj)) {
    scores[k] = (scores[k] || 0) + (v as number)
  }

  // 节气影响（出生在三之气/四之气热季增加阴虚/湿热）
  if (term.phase === 3 || term.phase === 4) {
    scores.yinxu += 10
    scores.shire += 10
  }
  if (term.phase === 0 || term.phase === 1) {
    scores.yangxu += 10
  }

  // 找出最高分（排除平和质作为基线）
  let primary = 'pinghe'
  let maxScore = 0
  for (const [k, v] of Object.entries(scores)) {
    if (k !== 'pinghe' && v > maxScore) {
      maxScore = v
      primary = k
    }
  }
  // 平和质：如果所有偏颇都不高
  if (maxScore < 55) {
    primary = 'pinghe'
    scores.pinghe = 75
  } else {
    scores.pinghe = Math.max(30, 70 - maxScore / 2)
  }

  return {
    primary,
    scores,
    wuyun,
    explanation: T(
      `出生于${year}年（${wuyun.yearGan}${wuyun.yearZhi}年，${wuyun.zhuYun}${wuyun.siTian}司天），${term.name}节气前后出生，先天体质偏向${primary}`,
      `Born in ${year} (${wuyun.zhuYun}, ${wuyun.siTian}), around ${term.name}, constitution tends to ${primary}.`,
      `${year}年生まれ（${wuyun.zhuYun}・${wuyun.siTian}）、${term.name}前後、体質は${primary}傾向`,
      `${year}년 출생 (${wuyun.zhuYun}·${wuyun.siTian}), ${term.name} 전후, 체질 ${primary} 경향`,
      `Nacido en ${year} (${wuyun.zhuYun}, ${wuyun.siTian}), constitución ${primary}`,
      `Né en ${year} (${wuyun.zhuYun}, ${wuyun.siTian}), constitution ${primary}`,
    ),
  }
}
