// 素衡OS · AI 知识库回答引擎（本地规则检索）
// 根据问题域从系统内置数据库检索并组织回答：
//   tcm      → 中医健康大数据：TCM_KNOWLEDGE 方剂/本草/穴位/食疗/典籍 + 五运六气 + 九种体质
//   ecom     → 采购信息数据库：询价单 INQUIRY_KB + 跨境电商平台 MARKETPLACES + 供应链
//   domestic → 国内电商数据库：淘宝/拼多多/京东 平台 + 商品 + 订单
//   general  → 综合（语音唤醒等场景）
// 此引擎为 LLM 未配置/失败时的本地回退；配置 AI 服务后由 services/llm 优先调用
import { getLocale } from '@/i18n'
import type { LocaleText } from '@/types'
import { TCM_KNOWLEDGE } from '@/mock/tcmKnowledge'
import { calculateWuYunLiuQi, generateForecast, DIET_RECIPES } from '@/mock/wuyun'
import { constitutionTypes } from '@/mock/constitution'
import { MARKETPLACES } from '@/mock/operations'
import {
  DOMESTIC_PLATFORMS,
  MOCK_DOMESTIC_PRODUCTS,
  MOCK_DOMESTIC_ORDERS,
} from '@/mock/domesticData'

export type Domain = 'tcm' | 'ecom' | 'domestic' | 'general'

export interface LocalAnswer {
  answer: string
  source: 'local'
  /** 命中的知识库来源标签（用于 UI 展示） */
  hits: string[]
}

/* ---------------- 工具 ---------------- */

/** 取 LocaleText 当前语言文本（回退 en → zh） */
function pick(t: LocaleText): string {
  const loc = getLocale()
  const v = (t as unknown as Record<string, string>)[loc]
  if (v) return v
  return (t as unknown as Record<string, string>).en || (t as unknown as Record<string, string>).zh || ''
}

/** 文本归一化：小写 + 去空格标点 */
function norm(s: string): string {
  return s.toLowerCase().replace(/[\s,，.。!！?？、;；:：'"'“”‘’·—\-]/g, '')
}

/** 命中计数：问题文本里出现的关键词数量 */
function hitCount(text: string, keywords: string[]): number {
  const n = norm(text)
  return keywords.filter((k) => n.includes(norm(k))).length
}

/* ---------------- 跨境采购询价数据库（与接单智能体 INQUIRY_KB 同步） ---------------- */

export interface KbProduct {
  keys: string[]
  product: string
  spec: string
  unit: string
  moq: number
  tiers: Array<[number, number]>
  lead: string
  cert: string
  supply: string
  sampleFee: string
}

export const PROCURE_KB: KbProduct[] = [
  { keys: ['艾灸', '艾条', 'moxa', 'moxibustion'], product: '艾灸条 / Moxibustion Sticks', spec: '18mm × 200mm, 10g each', unit: 'carton', moq: 500, tiers: [[500, 1.2], [1000, 1.0], [3000, 0.85]], lead: '7-10 days', cert: 'CE / MSDS', supply: '50,000 cartons / month', sampleFee: 'USD 30' },
  { keys: ['拔罐', 'cupping'], product: '拔罐理疗套装 / Cupping Therapy Set', spec: '24 cups + vacuum pump gun', unit: 'set', moq: 300, tiers: [[300, 6.8], [1000, 5.9], [3000, 5.2]], lead: '10-12 days', cert: 'CE / ISO 13485', supply: '20,000 sets / month', sampleFee: 'USD 45' },
  { keys: ['血压', '手表', 'watch', 'blood pressure'], product: '智能血压手表 / Smart Blood Pressure Watch', spec: '1.43" AMOLED, IP68', unit: 'pcs', moq: 200, tiers: [[200, 32], [1000, 28], [5000, 24.5]], lead: '12-15 days', cert: 'CE / FCC / RoHS', supply: '80,000 pcs / month', sampleFee: 'USD 60' },
  { keys: ['茶', '茶包', 'herbal tea', 'tea'], product: '草本养生茶礼盒 / Herbal Tea Gift Box', spec: '30 bags × 5g, gift box', unit: 'box', moq: 500, tiers: [[500, 3.6], [2000, 3.1], [5000, 2.8]], lead: '8-10 days', cert: 'HACCP / Halal', supply: '100,000 boxes / month', sampleFee: 'USD 20' },
  { keys: ['面膜', 'mask', 'ginseng'], product: '人参精华面膜 / Ginseng Essence Mask', spec: '25ml × 10 pcs / box', unit: 'box', moq: 1000, tiers: [[1000, 2.4], [5000, 2.0], [10000, 1.75]], lead: '10-14 days', cert: 'GMP / FDA', supply: '200,000 boxes / month', sampleFee: 'USD 15' },
  { keys: ['筋膜枪', 'massage gun'], product: '筋膜枪 Pro / Massage Gun Pro', spec: '12mm stroke, 6 massage heads', unit: 'pcs', moq: 200, tiers: [[200, 38], [1000, 33], [5000, 29]], lead: '12-15 days', cert: 'CE / FCC / UL', supply: '50,000 pcs / month', sampleFee: 'USD 65' },
  { keys: ['五金', '工具', 'hardware', 'tool'], product: '精工五金工具套装 / Precision Hardware Tool Set', spec: '108 pcs, CR-V steel', unit: 'set', moq: 300, tiers: [[300, 14.5], [1000, 12.8], [3000, 11.2]], lead: '10-12 days', cert: 'GS / ISO 9001', supply: '30,000 sets / month', sampleFee: 'USD 40' },
  { keys: ['家电', '风扇', 'appliance', 'fan'], product: '节能循环风扇 / Energy-saving Tower Fan', spec: 'DC motor, 45W, remote control', unit: 'pcs', moq: 100, tiers: [[100, 42], [500, 37.5], [2000, 33]], lead: '15-18 days', cert: 'CE / CB / SASO', supply: '25,000 pcs / month', sampleFee: 'USD 75' },
  { keys: ['手机', 'phone', 'smartphone'], product: '商务智能手机 / Business Smartphone', spec: '6.7" AMOLED, 6000mAh', unit: 'pcs', moq: 500, tiers: [[500, 118], [2000, 105], [10000, 96]], lead: '20-25 days', cert: 'CE / FCC / GCF', supply: '40,000 pcs / month', sampleFee: 'USD 130' },
  { keys: ['箱包', '背包', 'bag', 'backpack'], product: '防泼水商务背包 / Water-repellent Business Backpack', spec: '25L, USB charging port', unit: 'pcs', moq: 500, tiers: [[500, 9.8], [2000, 8.6], [5000, 7.5]], lead: '12-15 days', cert: 'BSCI / REACH', supply: '60,000 pcs / month', sampleFee: 'USD 25' },
  { keys: ['养生', '健康', 'wellness', 'health'], product: '中医养生礼盒 / TCM Wellness Gift Box', spec: 'herbs + tea + moxa combo', unit: 'box', moq: 500, tiers: [[500, 5.2], [2000, 4.6], [5000, 4.1]], lead: '8-12 days', cert: 'HACCP / GMP', supply: '40,000 boxes / month', sampleFee: 'USD 28' },
  { keys: ['中药', '药茶', 'medicinal tea'], product: '中药茶包 / Medicinal Tea Bags', spec: '5g × 20 bags, individually packed', unit: 'box', moq: 1000, tiers: [[1000, 1.9], [5000, 1.65], [10000, 1.45]], lead: '7-10 days', cert: 'GMP / ISO 22000', supply: '150,000 boxes / month', sampleFee: 'USD 12' },
]

function fmtKb(p: KbProduct): string {
  const tier = p.tiers.map(([q, price]) => `${q} 件 / USD ${price}`).join('；')
  return `${p.product}｜规格 ${p.spec}｜MOQ ${p.moq} ${p.unit}｜阶梯价：${tier}｜交期 ${p.lead}｜认证 ${p.cert}｜产能 ${p.supply}｜样品费 ${p.sampleFee}`
}

/* ---------------- 中医健康 ---------------- */

function answerTcm(q: string): LocalAnswer {
  const hits: string[] = ['中医知识库']

  // 五运六气 / 今年运势 / 养生气候
  if (/五运六气|今年|运气|节气|司天|在泉|岁运|天干|地支/.test(q)) {
    const wy = calculateWuYunLiuQi(new Date().getFullYear())
    const forecast = generateForecast(new Date(), 7)
    const today = forecast[0]
    const lines: string[] = []
    lines.push(`今年是${wy.yearGan}${wy.yearZhi}年，年运为「${wy.zhuYun}」，司天「${wy.siTian}」，在泉「${wy.zaiQuan}」。`)
    lines.push(`易感脏腑：${wy.susceptibleOrgans.join('、')}。`)
    lines.push(`健康调养建议：${pick(wy.advice)}。`)
    if (today) {
      lines.push(`今日${today.solarTerm}${today.qiPhase}，气候${today.weather}，${pick(today.advice)}。`)
      if (today.dietRecipes?.length) {
        lines.push(`推荐食养：${today.dietRecipes.map((r) => pick(r.name)).join('、')}。`)
      }
    }
    hits.push('五运六气数据库')
    return { answer: lines.join('\n'), source: 'local', hits }
  }

  // 体质辨识
  if (/体质|气虚|阳虚|阴虚|湿热|痰湿|血瘀|气郁|特禀|平和/.test(q)) {
    const names = constitutionTypes.map((c) => pick(c.name)).join('、')
    const target = constitutionTypes.find((c) => {
      const extra = (c as unknown as { tags?: string[] }).tags ?? []
      return hitCount(q, [pick(c.name), ...extra]) > 0
    })
    if (target) {
      hits.push('九种体质数据库')
      return {
        answer: `「${pick(target.name)}」的主要特征是：${pick(target.description)}。日常调养建议：${pick(target.suggestions)}。${pick(target.dietTips)}。${DIET_RECIPES.filter((r) => r.constitution.includes(target.id)).length ? `药食同源推荐：${DIET_RECIPES.filter((r) => r.constitution.includes(target.id)).map((r) => `${pick(r.name)}（${pick(r.effect)}）`).join('、')}。` : ''}`,
        source: 'local',
        hits,
      }
    }
    hits.push('九种体质数据库')
    return { answer: `素衡中医数据库收录九种体质：${names}。您可以告诉我具体体质类型（如气虚、阳虚、湿热），我将给出针对性的调养与药食同源建议。`, source: 'local', hits }
  }

  // 食疗
  if (/食|汤|粥|茶|煲|炖|喝/.test(q)) {
    const matched = DIET_RECIPES.filter((r) => hitCount(q, [...r.ingredients, pick(r.name)]) > 0)
    const list = matched.length ? matched : DIET_RECIPES.slice(0, 3)
    hits.push('药食同源食谱库')
    return {
      answer: `推荐${list.length > 1 ? '以下' : ''}食疗方案：\n${list.map((r) => `${pick(r.name)}｜食材：${r.ingredients.join('、')}｜功效：${pick(r.effect)}`).join('\n')}。`,
      source: 'local',
      hits,
    }
  }

  // 知识库条目检索
  const scored = TCM_KNOWLEDGE.map((e) => {
    const score = hitCount(q, e.tags) * 2 + hitCount(q, [pick(e.title)]) * 3 + (hitCount(q, [pick(e.summary)]) ? 1 : 0)
    return { e, score }
  })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)

  if (scored.length) {
    hits.push('中医知识库')
    return {
      answer: scored
        .map(({ e }) => `${pick(e.title)}：${pick(e.summary)}`)
        .join('\n'),
      source: 'local',
      hits,
    }
  }

  hits.push('中医健康大数据')
  return {
    answer: `素衡中医健康大数据已收录方剂、本草、穴位、食疗、典籍等 ${TCM_KNOWLEDGE.length} 条知识，以及五运六气与九种体质数据库。您可以询问：失眠调理、祛湿食疗、气虚体质养生、今年五运六气等。`,
    source: 'local',
    hits,
  }
}

/* ---------------- 跨境电商（采购信息数据库） ---------------- */

function answerEcom(q: string): LocalAnswer {
  const hits: string[] = ['采购信息数据库']

  // 询价/采购/报价/MOQ
  if (/询盘|询价|采购|报价|moq|价格|单价|样品|交期|产能|批发|采购单|多少钱|多少.*钱/.test(q)) {
    const scored = PROCURE_KB.map((p) => ({ p, score: hitCount(q, p.keys) }))
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score)
    const list = scored.length ? scored.map((x) => x.p) : PROCURE_KB.slice(0, 3)
    return {
      answer: `为您检索到以下采购询盘信息：\n${list.map((p, i) => `${i + 1}. ${fmtKb(p)}`).join('\n')}`,
      source: 'local',
      hits,
    }
  }

  // 平台
  if (/平台|哪个.*好|市场|shopee|lazada|tiktok|noon|亚马逊|temu|跨境/.test(q)) {
    hits.push('跨境电商平台数据库')
    const connected = MARKETPLACES.filter((m) => m.connected)
    return {
      answer: `素衡跨境电商数据库已接入 ${MARKETPLACES.length} 个平台：${MARKETPLACES.map((m) => `${m.name}（${pick(m.region)}·${m.currency}${m.connected ? '·已连接' : '·待连接'}）`).join('、')}。当前已连接 ${connected.length} 个平台，可通过「供应链 / 自动上架」模块协同运营。`,
      source: 'local',
      hits,
    }
  }

  hits.push('采购信息数据库')
  return {
    answer: `素衡采购信息数据库收录 ${PROCURE_KB.length} 条跨境采购询盘（含艾灸、养生茶、血压手表、筋膜枪、五金、家电、箱包等），涵盖规格、MOQ、阶梯价、交期、认证、产能与样品费。您可以询问：艾灸条报价、养生茶 MOQ、血压手表采购等。`,
    source: 'local',
    hits,
  }
}

/* ---------------- 国内电商（淘宝/拼多多/京东数据库） ---------------- */

function answerDomestic(q: string): LocalAnswer {
  const hits: string[] = ['国内电商数据库']

  // 平台
  if (/平台|淘宝|拼多多|京东|哪个|渠道/.test(q)) {
    hits.push('淘宝/拼多多/京东数据库')
    return {
      answer: `素衡国内电商数据库已接入 ${DOMESTIC_PLATFORMS.length} 大平台：${DOMESTIC_PLATFORMS.map((p) => `${p.icon}${p.name}`).join('、')}，覆盖办公、项目书、漫剧、短剧 4 大品类。`,
      source: 'local',
      hits,
    }
  }

  // 订单
  if (/订单|销量|成交|发货|最近|待办|售后/.test(q)) {
    hits.push('订单数据库')
    const orders = MOCK_DOMESTIC_ORDERS
    const pending = orders.filter((o) => o.status === 'pending' || o.status === 'confirmed').length
    const total = orders.reduce((s, o) => s + (o.amount ?? 0), 0)
    return {
      answer: `当前国内电商订单数据库共 ${orders.length} 笔订单，待处理 ${pending} 笔，累计成交额约 ¥${total.toFixed(0)}。`,
      source: 'local',
      hits,
    }
  }

  // 商品
  if (/商品|热卖|什么.*好|畅销|爆款|卖得/.test(q)) {
    hits.push('商品数据库')
    const top = [...MOCK_DOMESTIC_PRODUCTS].sort((a, b) => b.sales - a.sales).slice(0, 3)
    return {
      answer: `国内电商数据库当前热卖商品 TOP3：\n${top.map((p, i) => `${i + 1}. ${p.title}｜¥${p.price}｜已售 ${p.sales}`).join('\n')}。`,
      source: 'local',
      hits,
    }
  }

  hits.push('淘宝/拼多多/京东数据库')
  return {
    answer: `素衡国内电商数据库收录 ${MOCK_DOMESTIC_PRODUCTS.length} 款商品、${MOCK_DOMESTIC_ORDERS.length} 笔订单，覆盖淘宝、拼多多、京东三平台与办公/项目书/漫剧/短剧品类。您可以询问：有哪些平台、热卖商品、最近订单情况等。`,
    source: 'local',
    hits,
  }
}

/* ---------------- 综合 ---------------- */

function answerGeneral(q: string): LocalAnswer {
  // 问候 / 自我介绍
  if (/你好|您好|你是谁|自我介绍|早上好|下午好|晚上好|hello|hi\b|在吗/.test(q)) {
    return {
      answer:
        '主人您好，我是素衡AI智能体，一直陪伴在您身边。我内置了中医健康大数据、五运六气数据库、九种体质数据库、跨境采购信息数据库，以及淘宝、拼多多、京东国内电商数据库，可以随时为您解答健康养生、跨境采购、国内电商等问题。请问有什么需要？',
      source: 'local',
      hits: ['素衡主控智能体'],
    }
  }

  // 依次尝试各域，取命中度最高
  const attempts: Array<{ domain: Domain; fn: (s: string) => LocalAnswer }> = [
    { domain: 'tcm', fn: answerTcm },
    { domain: 'ecom', fn: answerEcom },
    { domain: 'domestic', fn: answerDomestic },
  ]
  let best = attempts[0].fn(q)
  for (const a of attempts) {
    const r = a.fn(q)
    if (r.hits.length > best.hits.length) best = r
  }
  return best
}

/* ---------------- 统一入口 ---------------- */

export function localAnswer(domain: Domain, question: string): LocalAnswer {
  const q = question.trim() || ''
  if (!q) return { answer: '请问您需要了解什么？', source: 'local', hits: [] }
  switch (domain) {
    case 'tcm':
      return answerTcm(q)
    case 'ecom':
      return answerEcom(q)
    case 'domestic':
      return answerDomestic(q)
    case 'general':
      return answerGeneral(q)
  }
}
