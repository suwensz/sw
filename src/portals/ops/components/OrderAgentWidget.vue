<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElNotification } from 'element-plus'
import { useAgentsStore } from '@/stores/agents'
import { useAgentOrdersStore, type AgentOrderRecord } from '@/stores/agentOrders'
import { broadcastEnabled, isSpeaking, setBroadcastEnabled, speakBroadcast } from '@/composables/useSpeech'
import { useWakeWord } from '@/composables/useWakeWord'

/**
 * 接单提醒智能体（运营端 · 悬浮球可拖拽，默认右下角）
 * - 订单数据库：1000 条跨境订单（来源国家、客户、品名、数量、金额、发货/质量要求、
 *   样品、批发、发货时间、预计到货时间），统一写入 stores/agentOrders.ts
 *   与「订单管理」页实时联动
 * - AI 询价机器人：客户按国外采购询价单数据库提问，询价数据库自动应答
 *   （阶梯价 / MOQ / 交期 / 认证 / 样品），支持运营人员手动提问
 * - 声音提醒：新订单/新消息到达时播放提示音（Web Audio 合成）；
 *   优雅女声 TTS 播报订单全部内容；语音唤醒「素衡素衡」
 * - 激活状态：由「智能体中心」(src/stores/agents.ts) 统一控制
 */

type AgentOrder = AgentOrderRecord

type ChatRole = 'customer' | 'agent' | 'me'
type ReplyCat = 'greeting' | 'price' | 'shipping' | 'quality' | 'sample'
type InquiryCat = 'price' | 'moq' | 'lead' | 'cert' | 'sample' | 'general'

interface ChatMsg {
  id: number
  role: ChatRole
  name?: string
  country?: string
  text: string
  cat?: ReplyCat
  time: number
  auto?: boolean
}

const { t, locale } = useI18n()
const agentsStore = useAgentsStore()
const agentOrdersStore = useAgentOrdersStore()

const open = ref(false)
const activeTab = ref<'orders' | 'messages' | 'inquiry'>('orders')
/** 订单数据来自共享 store：与「订单管理」页实时同步 */
const orders = computed<AgentOrder[]>(() => agentOrdersStore.orders)
const messages = ref<ChatMsg[]>([])
const agentTyping = ref(false)
const manualInput = ref('')
let nextId = 1
let nextMsgId = 1
let pushTimer: ReturnType<typeof setInterval> | null = null
let msgTimer: ReturnType<typeof setInterval> | null = null
let inquiryTimer: ReturnType<typeof setInterval> | null = null

/* ---------------- 智能体激活状态（智能体中心） ---------------- */
const orderAgentActive = computed(() => agentsStore.isActive('order-alert'))
const autoReplyAgentActive = computed(() => agentsStore.isActive('auto-reply'))

/* ---------------- 语音唤醒（素衡素衡） ---------------- */
const wake = useWakeWord()

/* ---------------- 语音播报开关（优雅女声 TTS） ---------------- */
function toggleVoice() {
  setBroadcastEnabled(!broadcastEnabled.value)
  if (broadcastEnabled.value) {
    // 开启发生在用户手势内：立即用女声应答一声确认
    speakBroadcast(t('portal.agent.voiceOnReply'))
  }
}

/* ---------------- 声音提醒（Web Audio 合成提示音） ---------------- */
const SOUND_KEY = 'qh_agent_sound'
const soundEnabled = ref(localStorage.getItem(SOUND_KEY) !== 'off')
let audioCtx: AudioContext | null = null
/** 因浏览器自动播放策略被挂起的提示音，解锁后补播 */
let pendingChime: 'order' | 'message' | null = null
let audioUnlocked = false

function getAudioCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null
  try {
    if (!audioCtx) {
      const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      audioCtx = new Ctor()
    }
    if (audioCtx.state === 'suspended') void audioCtx.resume()
    return audioCtx
  } catch {
    return null
  }
}

/** 播放音符序列：[[频率(Hz), 起始(s), 时长(s)], ...] */
function playNotes(notes: Array<[number, number, number]>, gainValue = 0.12) {
  const ctx = getAudioCtx()
  if (!ctx) return
  try {
    const now = ctx.currentTime
    for (const [freq, start, dur] of notes) {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.value = freq
      gain.gain.setValueAtTime(0, now + start)
      gain.gain.linearRampToValueAtTime(gainValue, now + start + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.0001, now + start + dur)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(now + start)
      osc.stop(now + start + dur + 0.05)
    }
  } catch {
    /* 音频不可用时静默忽略 */
  }
}

/** 新订单提示音：清脆双音（E5 → G5） */
function playOrderChimeNotes() {
  playNotes([
    [659.25, 0, 0.16],
    [987.77, 0.14, 0.28],
  ])
}

/** 新客户消息提示音：轻柔单音（C6） */
function playMessageChimeNotes() {
  playNotes([[1046.5, 0, 0.2]])
}

/**
 * 播放提示音（含自动播放策略兜底）：
 * Chrome/Safari 要求首次播放必须发生在用户手势内，否则 AudioContext 处于
 * suspended 状态。此时将提示音记入待播队列，等首次手势解锁后自动补播。
 */
function playChime(kind: 'order' | 'message') {
  if (!soundEnabled.value) return
  const ctx = getAudioCtx()
  if (!ctx) return
  if (ctx.state !== 'running') {
    pendingChime = pendingChime || kind
    return
  }
  if (kind === 'order') playOrderChimeNotes()
  else playMessageChimeNotes()
}

/** 用户手势中解锁音频：任何点击/按键都会触发，成功后补播挂起的提示音 */
function unlockAudio() {
  const ctx = getAudioCtx()
  if (!ctx) return
  if (ctx.state === 'suspended') {
    void ctx
      .resume()
      .then(() => {
        audioUnlocked = ctx.state === 'running'
        flushPendingChime()
      })
      .catch(() => {
        /* 个别环境需多次手势，保持监听即可 */
      })
  } else {
    audioUnlocked = ctx.state === 'running'
    flushPendingChime()
  }
}

function flushPendingChime() {
  if (!pendingChime) return
  const kind = pendingChime
  pendingChime = null
  if (!soundEnabled.value) return
  if (kind === 'order') playOrderChimeNotes()
  else playMessageChimeNotes()
}

function toggleSound() {
  soundEnabled.value = !soundEnabled.value
  localStorage.setItem(SOUND_KEY, soundEnabled.value ? 'on' : 'off')
  if (soundEnabled.value) {
    // 开启提示音发生在用户手势内：直接解锁并试播一声
    unlockAudio()
    playOrderChimeNotes()
  }
}

/* ---------------- 基础数据 ---------------- */
const COUNTRY_FLAGS: Record<string, string> = {
  AE: '🇦🇪',
  SA: '🇸🇦',
  TH: '🇹🇭',
  VN: '🇻🇳',
  ID: '🇮🇩',
  MY: '🇲🇾',
  PH: '🇵🇭',
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  AE: 'AED',
  SA: 'SAR',
  TH: 'THB',
  VN: '₫',
  ID: 'Rp',
  MY: 'RM',
  PH: '₱',
}

const PRODUCT_POOL = [
  { name: 'Herbal Tea Gift Box（草本养生茶礼盒）', unit: 'box' },
  { name: 'Cupping Therapy Set（拔罐理疗套装）', unit: 'set' },
  { name: 'Smart Blood Pressure Watch（智能血压手表）', unit: 'pcs' },
  { name: 'Moxibustion Sticks（艾灸条）', unit: 'carton' },
  { name: 'Ginseng Essence Mask（人参精华面膜）', unit: 'pack' },
  { name: 'Massage Gun Pro（筋膜枪 Pro）', unit: 'pcs' },
]

const SHIP_REQUIREMENTS = [
  'DHL express, 周三前发出 / DHL express, ship before Wednesday',
  '海运整柜，木质包装 / Sea FCL, wooden packaging',
  '空运直发，防潮包装 / Air direct, moisture-proof packaging',
  '陆运冷链，温控 2-8°C / Land cold-chain, 2-8°C',
]

const QUALITY_REQUIREMENTS = [
  '通过 CE 认证，破损率 <0.5% / CE certified, breakage <0.5%',
  '符合 GCC 标准并提供质检报告 / GCC standard with QC report',
  '每批次抽检 3%，附 SGS 报告 / 3% sampling per batch, SGS report',
  '食品级材质，保质期 ≥18 个月 / Food-grade material, shelf life ≥18 months',
]

const BUYER_POOL = [
  { name: 'Ahmed Al-Farsi', country: 'AE' },
  { name: 'Fatima Hassan', country: 'SA' },
  { name: 'Somchai W.', country: 'TH' },
  { name: 'Nguyễn Thị Lan', country: 'VN' },
  { name: 'Budi Santoso', country: 'ID' },
  { name: 'Aisyah Rahman', country: 'MY' },
  { name: 'Maria Santos', country: 'PH' },
]

/* ---------------- 订单渠道（跨境 / 淘宝 / 拼多多 / 京东 / 抖音 / 快速订单） ---------------- */
type Channel = AgentOrderRecord['channel']

const DOMESTIC_CHANNELS: Channel[] = ['taobao', 'pdd', 'jd', 'douyin', 'quick']

/** 渠道主题色（淘宝橙 / 拼多多红 / 京东红 / 抖音黑青 / 快速订单金） */
const CHANNEL_COLORS: Record<Channel, string> = {
  overseas: '#1a6b5c',
  taobao: '#ff6a00',
  pdd: '#e02e24',
  jd: '#e1251b',
  douyin: '#161823',
  quick: '#a5761c',
}

const CHANNEL_NO_PREFIX: Record<Channel, string> = {
  overseas: 'SO',
  taobao: 'TB',
  pdd: 'PDD',
  jd: 'JD',
  douyin: 'DY',
  quick: 'QK',
}

function channelName(channel: Channel): string {
  return t(`portal.agent.channels.${channel}`)
}

function channelStyle(channel: Channel): Record<string, string> {
  const c = CHANNEL_COLORS[channel]
  return { color: c, borderColor: `${c}66`, background: `${c}12` }
}

/** 办公文件制作订单：PPT / PDF / 项目可研报告 / 立项报告 / 环境设计（环评）报告等 */
const DOC_SERVICE_POOL = [
  { name: 'PPT 演示文稿制作 / PPT Presentation Design', docType: 'PPT 制作 / PPT Design', base: 380 },
  { name: 'PDF 电子画册排版 / PDF Brochure Layout', docType: 'PDF 制作 / PDF Design', base: 260 },
  { name: '项目可行性研究报告 / Project Feasibility Study Report', docType: '项目可研报告 / Feasibility Report', base: 2600 },
  { name: '项目立项报告 / Project Proposal Report', docType: '立项报告 / Proposal Report', base: 2200 },
  { name: '环境影响评价报告 / Environmental Impact Assessment Report', docType: '环境设计（环评）报告 / EIA Report', base: 3200 },
  { name: '商业计划书撰写 / Business Plan Writing', docType: '商业计划书 / Business Plan', base: 1800 },
  { name: '投标文件制作 / Bid Document Preparation', docType: '标书制作 / Bid Document', base: 1500 },
  { name: '企业宣传册设计 / Corporate Brochure Design', docType: '宣传册设计 / Brochure Design', base: 420 },
]

const DOC_SHIP_REQUIREMENTS = [
  '交付源文件（PPT/PDF），含 2 次免费修改 / Source files (PPT/PDF) with 2 free revisions',
  '加急 48 小时交付，支持售后修改 / Express 48h delivery with after-sales revisions',
  '分章节交付，验收后交付终稿 / Chapter-by-chapter delivery, final draft upon acceptance',
]

const DOC_QUALITY_REQUIREMENTS = [
  '原创撰写，查重率低于 5% / Original writing, similarity below 5%',
  '符合行业报告规范，数据来源可溯 / Industry report standards with traceable data sources',
  '排版精美，可提供印前版本 / Polished layout with print-ready version',
]

const DOMESTIC_BUYERS = ['王女士', '李先生', '张经理', '陈老师', '刘总', '赵主管', '孙女士', '周老师', '吴经理', '郑助理']

/** 渠道权重：跨境 45%，淘宝/拼多多/京东/抖音/快速订单各 11% */
function randomChannel(): Channel {
  const r = Math.random()
  if (r < 0.45) return 'overseas'
  const idx = Math.min(Math.floor((r - 0.45) / 0.11), DOMESTIC_CHANNELS.length - 1)
  return DOMESTIC_CHANNELS[idx]
}

const MESSAGE_POOL: Array<{ text: string; cat: ReplyCat }> = [
  { text: '请问这批货的批发价格是多少？500 件起订有优惠吗？ / What is the wholesale price? Any discount for 500+ pcs?', cat: 'price' },
  { text: '订单什么时候发货？到迪拜大概要多久？ / When will you ship? How long does it take to Dubai?', cat: 'shipping' },
  { text: '质量有认证吗？我们需要 SGS 检测报告 / Any certifications? We need SGS test reports', cat: 'quality' },
  { text: '可以先寄一个样品看看质量吗？ / Could you send a sample first to check the quality?', cat: 'sample' },
  { text: '你好，想了解一下你们的产品目录 / Hello, I would like to see your product catalog', cat: 'greeting' },
]

/* ---------------- 询价单数据库（AI 询价机器人自动应答） ---------------- */
interface KbProduct {
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

const INQUIRY_KB: KbProduct[] = [
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

/** 模拟国外客户按采购询价单数据库提出的典型问题（自动演示） */
const INQUIRY_DEMO: Array<{ text: string; country: string }> = [
  { text: 'Hello, what is your wholesale price for moxibustion sticks? We need 3,000 cartons for the Saudi market.', country: 'SA' },
  { text: '拔罐理疗套装的起订量是多少？迪拜门店想先试单。', country: 'AE' },
  { text: 'How long is the lead time for the smart blood pressure watch? Any CE certificate available?', country: 'TH' },
  { text: '人参精华面膜可以寄样品吗？我们需要检测成分后再下正式订单。', country: 'VN' },
  { text: 'Please quote the herbal tea gift box for 2,000 boxes, DDP Jakarta. What certifications do you have?', country: 'ID' },
  { text: '筋膜枪 Pro 500 台价格多少？到吉隆坡的时效怎么样？', country: 'MY' },
  { text: 'Can you send a sample of the business backpack? We are a distributor in Manila.', country: 'PH' },
  { text: '节能循环风扇出口沙特需要什么认证？100 台起订可以吗？', country: 'SA' },
]

function matchKbProduct(question: string): KbProduct | null {
  const s = question.toLowerCase()
  for (const item of INQUIRY_KB) {
    if (item.keys.some((k) => s.includes(k.toLowerCase()))) return item
  }
  return null
}

function classifyQuestion(question: string): InquiryCat {
  const s = question.toLowerCase()
  if (/价格|报价|多少钱|批发价|多少|price|quote|how much|cost/.test(s)) return 'price'
  if (/起订|最低|最小|moq|minimum/.test(s)) return 'moq'
  if (/交货|交期|多久|货期|时效|lead|delivery|ship/.test(s)) return 'lead'
  if (/认证|证书|ce|gcc|sgs|fda|certif|certificate/.test(s)) return 'cert'
  if (/样品|sample/.test(s)) return 'sample'
  return 'general'
}

/** 询价数据库自动应答：按问题类别从知识库生成结构化答案 */
function answerInquiry(question: string): string {
  const item = matchKbProduct(question)
  if (!item) {
    return t('portal.agent.inquiryNoMatch', { keyword: question.slice(0, 24) })
  }
  const params = {
    product: bilingualLabel(item.product),
    tiers: item.tiers.map(([qty, p]) => `${qty.toLocaleString()}+ × $${p}`).join('  /  '),
    moq: item.moq.toLocaleString(),
    unit: item.unit,
    lead: item.lead,
    cert: item.cert,
    supply: item.supply,
    sampleFee: item.sampleFee,
    spec: item.spec,
  }
  switch (classifyQuestion(question)) {
    case 'price':
      return t('portal.agent.inquiryAnsPrice', params)
    case 'moq':
      return t('portal.agent.inquiryAnsMoq', params)
    case 'lead':
      return t('portal.agent.inquiryAnsLead', params)
    case 'cert':
      return t('portal.agent.inquiryAnsCert', params)
    case 'sample':
      return t('portal.agent.inquiryAnsSample', params)
    default:
      return t('portal.agent.inquiryAnsGeneral', params)
  }
}

function buyerFor(country: string): string {
  const buyers = BUYER_POOL.filter((b) => b.country === country)
  return buyers.length ? buyers[0].name : BUYER_POOL[0].name
}

/* ---------------- AI 询价对话 ---------------- */
const inquiryMsgs = ref<ChatMsg[]>([])
const inquiryTyping = ref(false)
const inquiryInput = ref('')
let nextInquiryId = 1

function sendInquiry() {
  const q = inquiryInput.value.trim()
  if (!q || inquiryTyping.value) return
  inquiryMsgs.value.push({
    id: nextInquiryId++,
    role: 'me',
    text: q,
    time: Date.now(),
  })
  inquiryInput.value = ''
  inquiryTyping.value = true
  window.setTimeout(() => {
    inquiryTyping.value = false
    inquiryMsgs.value.push({
      id: nextInquiryId++,
      role: 'agent',
      text: answerInquiry(q),
      time: Date.now(),
      auto: true,
    })
  }, 1300)
}

/** 自动演示：模拟国外客户按询价单数据库提问，AI 自动应答 */
function startInquiryDemo() {
  let demoIdx = 0
  inquiryTimer = setInterval(() => {
    if (!orderAgentActive.value) return
    const demo = INQUIRY_DEMO[demoIdx % INQUIRY_DEMO.length]
    demoIdx++
    const msg: ChatMsg = {
      id: nextInquiryId++,
      role: 'customer',
      name: buyerFor(demo.country),
      country: demo.country,
      text: demo.text,
      time: Date.now(),
    }
    inquiryMsgs.value.push(msg)
    if (inquiryMsgs.value.length > 40) inquiryMsgs.value.shift()
    ElNotification({
      title: `${t('portal.agent.inquiryTitle')} · ${COUNTRY_FLAGS[demo.country] || ''} ${msg.name || ''}`,
      message: demo.text,
      type: 'info',
      duration: 5000,
      position: 'bottom-right',
    })
    playChime('message')
    inquiryTyping.value = true
    window.setTimeout(() => {
      inquiryTyping.value = false
      inquiryMsgs.value.push({
        id: nextInquiryId++,
        role: 'agent',
        text: answerInquiry(demo.text),
        time: Date.now(),
        auto: true,
      })
    }, 2000)
  }, 70_000)
}

/* ---------------- 订单生成与推送 ---------------- */
function fmtDate(offsetDays: number): string {
  const d = new Date(Date.now() + offsetDays * 24 * 3600 * 1000)
  const m = `${d.getMonth() + 1}`.padStart(2, '0')
  const day = `${d.getDate()}`.padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

function randomOf<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function makeOrder(minutesAgo = 0, forceChannel?: Channel): AgentOrder {
  const channel = forceChannel || randomChannel()
  const orderNo = `${CHANNEL_NO_PREFIX[channel]}-${new Date().getFullYear()}${`${Date.now()}`.slice(-6)}-${`${nextId}`.padStart(3, '0')}`

  // 国内渠道：办公文件制作订单（PPT / PDF / 项目可研报告 / 立项报告 / 环境设计报告等）
  if (channel !== 'overseas') {
    const doc = randomOf(DOC_SERVICE_POOL)
    const qty = 1 + Math.floor(Math.random() * 4)
    const amount = +(doc.base * qty * (0.85 + Math.random() * 0.5)).toFixed(2)
    return {
      id: Date.now() % 1e9 + nextId++,
      channel,
      country: 'CN',
      customerName: randomOf(DOMESTIC_BUYERS),
      orderNo,
      productName: doc.name,
      docType: doc.docType,
      unit: locale.value === 'zh' || locale.value === 'zh-TW' ? '份' : 'pc',
      quantity: qty,
      amount,
      currency: '¥',
      shipRequirement: randomOf(DOC_SHIP_REQUIREMENTS),
      qualityRequirement: randomOf(DOC_QUALITY_REQUIREMENTS),
      sample: false,
      isWholesale: false,
      shipDate: fmtDate(Math.floor(Math.random() * 4) + 1),
      eta: fmtDate(Math.floor(Math.random() * 8) + 3),
      createdAt: Date.now() - minutesAgo * 60 * 1000,
      status: 'pending',
    }
  }

  // 跨境批发订单
  const country = randomOf(Object.keys(COUNTRY_FLAGS))
  const product = randomOf(PRODUCT_POOL)
  const buyers = BUYER_POOL.filter((b) => b.country === country)
  const buyer = buyers.length ? randomOf(buyers) : randomOf(BUYER_POOL)
  const isWholesale = Math.random() > 0.3
  const qtyBase = isWholesale ? [500, 1000, 2000, 3000, 5000] : [50, 100, 200]
  const qty = randomOf(qtyBase)
  const unitPrice = +(Math.random() * 15 + 2).toFixed(2)
  return {
    id: Date.now() % 1e9 + nextId++,
    channel,
    country,
    customerName: buyer.name,
    orderNo,
    productName: product.name,
    unit: product.unit,
    quantity: qty,
    amount: +(qty * unitPrice).toFixed(2),
    currency: CURRENCY_SYMBOLS[country],
    shipRequirement: randomOf(SHIP_REQUIREMENTS),
    qualityRequirement: randomOf(QUALITY_REQUIREMENTS),
    sample: Math.random() > 0.5,
    isWholesale,
    shipDate: fmtDate(Math.floor(Math.random() * 5) + 2),
    eta: fmtDate(Math.floor(Math.random() * 15) + 10),
    createdAt: Date.now() - minutesAgo * 60 * 1000,
    status: 'pending',
  }
}

/** 订单数据库：预置 1000 条历史订单（约 60 天跨度，最近 3 条待接单） */
function seedOrderDatabase() {
  const list: AgentOrder[] = []
  for (let i = 0; i < 1000; i++) {
    // 时间跨度约 60 天：最近的在前（新订单 unshift 语义保持一致）
    const minutesAgo = 8 + i * 85 + Math.floor(Math.random() * 60)
    const order = makeOrder(minutesAgo)
    order.status = i < 3 ? 'pending' : Math.random() > 0.15 ? 'handled' : 'ignored'
    list.push(order)
  }
  agentOrdersStore.seedOrders(list)
}

/** 双语字段（"中文 / English"）按当前界面语言取一半，保证播报语言同步 */
function bilingualLabel(text: string): string {
  const parts = text.split(' / ')
  if (parts.length < 2) return text
  return locale.value === 'zh' || locale.value === 'zh-TW' ? parts[0] : parts[1]
}

/**
 * 订单全内容语音播报文本：订单渠道/国家、客户姓名、订单全部内容
 * （品名/文件类型/数量/金额/发货要求/质量要求/样品/发货时间/到货时间），结尾「主人，您是否接单」
 */
function orderSpeechText(order: AgentOrder): string {
  const sep = locale.value === 'zh' || locale.value === 'zh-TW' ? '，' : ', '
  const source =
    order.channel === 'overseas'
      ? `${countryName(order.country)} · ${t('portal.agent.customerLabel')} ${order.customerName || ''}`
      : `${channelName(order.channel)} · ${t('portal.agent.customerLabel')} ${order.customerName || ''}` +
        (order.docType ? ` · ${bilingualLabel(order.docType)}` : '')
  return [
    t('portal.agent.voiceOrderPrefix'),
    source,
    bilingualLabel(order.productName),
    `${t('portal.agent.quantity')} ${order.quantity.toLocaleString()} ${order.unit}`,
    `${t('portal.agent.amount')} ${order.currency} ${order.amount.toLocaleString()}`,
    `${t('portal.agent.shipRequirement')}: ${bilingualLabel(order.shipRequirement)}`,
    `${t('portal.agent.qualityRequirement')}: ${bilingualLabel(order.qualityRequirement)}`,
    `${t('portal.agent.sample')}: ${order.sample ? t('portal.agent.sampleYes') : t('portal.agent.sampleNo')}`,
    `${t('portal.agent.shipDate')} ${order.shipDate}`,
    `${t('portal.agent.eta')} ${order.eta}`,
    t('portal.agent.askAccept'),
  ].join(sep)
}

function notifyNewOrder(order: AgentOrder) {
  const sourceTitle =
    order.channel === 'overseas'
      ? `${COUNTRY_FLAGS[order.country]} ${countryName(order.country)}`
      : `${channelName(order.channel)}${order.docType ? ` · ${bilingualLabel(order.docType)}` : ''}`
  ElNotification({
    title: `${t('portal.agent.newOrderTip')} · ${sourceTitle}`,
    message: `${bilingualLabel(order.productName)}\n${t('portal.agent.customerLabel')}: ${order.customerName}\n${t('portal.agent.amount')}: ${order.currency} ${order.amount.toLocaleString()}`,
    type: 'success',
    duration: 6000,
    position: 'bottom-right',
  })
  playChime('order')
  // 优雅女声播报订单全部内容（由「语音播报」开关控制；提示音开关仅控制提示音）
  // 正在播报（循环提醒等）时本轮跳过，保证订单提醒不重叠播放
  if (!isSpeaking.value) speakBroadcast(orderSpeechText(order))
}

function startPushing() {
  pushTimer = setInterval(() => {
    if (!orderAgentActive.value) return
    const order = makeOrder(0)
    // 新订单同步写入共享 store → 「订单管理」页实时可见；列表回到第一页保证新提醒可见
    agentOrdersStore.receiveOrder(order)
    orderPage.value = 1
    notifyNewOrder(order)
  }, 45_000)
}

/* ---------------- 循环提醒播放（1 → 1.5 → 1.8 → 2 分钟依时间顺序循环） ---------------- */
/** 循环提醒间隔（分钟）：依时间顺序循环，播完再计时，不重叠 */
const REMIND_INTERVALS_MIN = [1, 1.5, 1.8, 2]
let remindTimer: ReturnType<typeof setTimeout> | null = null
let remindIdx = 0

function scheduleNextRemind() {
  const minutes = REMIND_INTERVALS_MIN[remindIdx % REMIND_INTERVALS_MIN.length]
  remindIdx++
  remindTimer = setTimeout(fireRemind, minutes * 60 * 1000)
}

/** 到点触发：存在待接单订单则女声循环提醒（播报完整订单内容，播完再进入下一个间隔计时） */
function fireRemind() {
  const pending = pendingOrders.value
  if (orderAgentActive.value && broadcastEnabled.value && pending.length && !isSpeaking.value) {
    // 提醒最早到达且仍未处理的订单
    const target = pending[pending.length - 1]
    playChime('order')
    speakBroadcast(orderSpeechText(target), { onEnd: scheduleNextRemind })
  } else {
    scheduleNextRemind()
  }
}

/* ---------------- 订单列表分页（1000 条数据库渐进加载） ---------------- */
const ORDER_PAGE_SIZE = 6
const orderPage = ref(1)
const visibleOrders = computed(() => orders.value.slice(0, orderPage.value * ORDER_PAGE_SIZE))
const hasMoreOrders = computed(() => visibleOrders.value.length < orders.value.length)

/* ---------------- 客户消息与自动回复 ---------------- */
const AUTO_REPLY_KEY = 'qh_agent_autoreply'
const autoReplyEnabled = ref(localStorage.getItem(AUTO_REPLY_KEY) !== 'off')
/** 自动回复实际生效 = 本地开关 && 智能体中心已激活 */
const autoReplyEffective = computed(() => autoReplyEnabled.value && autoReplyAgentActive.value)

function toggleAutoReply(on: boolean) {
  autoReplyEnabled.value = on
  localStorage.setItem(AUTO_REPLY_KEY, on ? 'on' : 'off')
}

function replyTemplate(cat: ReplyCat, name: string): string {
  return t(`portal.agent.replies.${cat}`, { name })
}

function pushCustomerMessage(minutesAgo = 0) {
  const buyer = randomOf(BUYER_POOL)
  const tpl = randomOf(MESSAGE_POOL)
  const msg: ChatMsg = {
    id: nextMsgId++,
    role: 'customer',
    name: buyer.name,
    country: buyer.country,
    text: tpl.text,
    cat: tpl.cat,
    time: Date.now() - minutesAgo * 60 * 1000,
  }
  messages.value.push(msg)
  if (messages.value.length > 30) messages.value.shift()
  return msg
}

function pushAgentReply(forMsg: ChatMsg) {
  agentTyping.value = true
  window.setTimeout(() => {
    agentTyping.value = false
    const reply: ChatMsg = {
      id: nextMsgId++,
      role: 'agent',
      text: replyTemplate(forMsg.cat || 'greeting', forMsg.name || ''),
      time: Date.now(),
      auto: true,
    }
    messages.value.push(reply)
  }, 2200)
}

function notifyNewMessage(msg: ChatMsg) {
  ElNotification({
    title: `${t('portal.agent.newMsgTip')} · ${COUNTRY_FLAGS[msg.country || 'AE'] || ''} ${msg.name || ''}`,
    message: msg.text.split(' / ')[0],
    type: 'info',
    duration: 5000,
    position: 'bottom-right',
  })
  playChime('message')
}

function startMessages() {
  msgTimer = setInterval(() => {
    const msg = pushCustomerMessage(0)
    notifyNewMessage(msg)
    if (autoReplyEffective.value) pushAgentReply(msg)
  }, 55_000)
}

function sendManualReply() {
  const text = manualInput.value.trim()
  if (!text) return
  messages.value.push({
    id: nextMsgId++,
    role: 'me',
    text,
    time: Date.now(),
  })
  manualInput.value = ''
}

/* ---------------- 展示辅助 ---------------- */
const pendingOrders = computed(() => orders.value.filter((o) => o.status === 'pending'))
const unreadCount = computed(() => pendingOrders.value.length)

/* ---------------- 订单详情（点击客户内容查看订单全部内容） ---------------- */
const detailOrder = ref<AgentOrder | null>(null)
const detailVisible = ref(false)

/** 订单卡片内联展开（点击卡片展开/收起完整详情） */
const expandedId = ref<number | null>(null)
function toggleExpand(order: AgentOrder) {
  expandedId.value = expandedId.value === order.id ? null : order.id
}

function openOrderDetail(order: AgentOrder) {
  detailOrder.value = order
  detailVisible.value = true
}

function acceptDetailOrder() {
  if (detailOrder.value && detailOrder.value.status === 'pending') {
    acceptOrder(detailOrder.value)
  }
  detailVisible.value = false
}

function timeLabel(ts: number): string {
  const mins = Math.floor((Date.now() - ts) / 60000)
  if (mins <= 0) return t('portal.agent.justNow')
  if (mins < 60) return `${mins} ${t('portal.agent.minutesAgo')}`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return t('portal.agent.hoursAgo', { n: hours })
  return t('portal.agent.daysAgo', { n: Math.floor(hours / 24) })
}

function countryName(code: string): string {
  return t(`portal.agent.countries.${code}`)
}

function amountLabel(order: AgentOrder): string {
  return `${order.currency} ${order.amount.toLocaleString(locale.value === 'zh' || locale.value === 'zh-TW' ? 'zh-CN' : 'en-US')}`
}

function acceptOrder(order: AgentOrder) {
  // 状态同步回共享 store → 「订单管理」页实时更新
  agentOrdersStore.setStatus(order.id, 'handled')
  ElNotification({
    title: t('portal.agent.remindSent'),
    message: `${t('portal.agent.remindSentDesc')} · ${order.orderNo}`,
    type: 'success',
    duration: 4000,
    position: 'bottom-right',
  })
}

function ignoreOrder(order: AgentOrder) {
  agentOrdersStore.setStatus(order.id, 'ignored')
}

function handleAll() {
  pendingOrders.value.forEach((o) => {
    agentOrdersStore.setStatus(o.id, 'handled')
  })
}

/* ---------------- 悬浮球拖拽（可移动，双击回到右下角） ---------------- */
const BALL_POS_KEY = 'qh_agent_ball_pos'
const BALL_SIZE = 62
const ballEl = ref<HTMLButtonElement | null>(null)
const ballPos = ref<{ x: number; y: number } | null>(null)
const ballStyle = ref<Record<string, string>>({})
const viewport = ref({ w: 1280, h: 800 })
let dragging = false
let dragMoved = false
let dragStartX = 0
let dragStartY = 0
let ballStartX = 0
let ballStartY = 0
let suppressClick = false

function loadBallPos(): { x: number; y: number } | null {
  try {
    const raw = localStorage.getItem(BALL_POS_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as { x: number; y: number }
      if (typeof parsed.x === 'number' && typeof parsed.y === 'number') return parsed
    }
  } catch {
    /* ignore */
  }
  return null
}

function applyBallPos(x: number, y: number) {
  const maxX = viewport.value.w - BALL_SIZE - 6
  const maxY = viewport.value.h - BALL_SIZE - 6
  const cx = Math.min(Math.max(x, 6), Math.max(6, maxX))
  const cy = Math.min(Math.max(y, 6), Math.max(6, maxY))
  ballPos.value = { x: cx, y: cy }
  ballStyle.value = { left: `${cx}px`, top: `${cy}px`, right: 'auto', bottom: 'auto' }
}

function saveBallPos(x: number, y: number) {
  try {
    localStorage.setItem(BALL_POS_KEY, JSON.stringify({ x, y }))
  } catch {
    /* ignore */
  }
}

function onBallPointerDown(e: PointerEvent) {
  const el = ballEl.value
  if (!el) return
  const rect = el.getBoundingClientRect()
  dragStartX = e.clientX
  dragStartY = e.clientY
  ballStartX = rect.left
  ballStartY = rect.top
  dragMoved = false
  dragging = true
  try {
    el.setPointerCapture(e.pointerId)
  } catch {
    /* pointer capture 不可用时仍可拖拽（事件冒泡到 window） */
  }
}

function onBallPointerMove(e: PointerEvent) {
  if (!dragging) return
  const dx = e.clientX - dragStartX
  const dy = e.clientY - dragStartY
  if (!dragMoved && Math.abs(dx) < 6 && Math.abs(dy) < 6) return
  dragMoved = true
  applyBallPos(ballStartX + dx, ballStartY + dy)
}

function onBallPointerUp() {
  if (!dragging) return
  dragging = false
  if (!dragMoved) return
  suppressClick = true
  const el = ballEl.value
  if (el) {
    const rect = el.getBoundingClientRect()
    // 磁性贴边：吸附到最近的左右边缘，纵向位置保留
    const centerX = rect.left + rect.width / 2
    const x = centerX < viewport.value.w / 2 ? 6 : viewport.value.w - rect.width - 6
    applyBallPos(x, rect.top)
    saveBallPos(x, rect.top)
  }
}

function onBallClick() {
  if (suppressClick) {
    suppressClick = false
    return
  }
  togglePanel()
}

/** 双击悬浮球：回到默认右下角位置 */
function resetBallPos() {
  ballPos.value = null
  ballStyle.value = {}
  try {
    localStorage.removeItem(BALL_POS_KEY)
  } catch {
    /* ignore */
  }
}

/** 提醒面板位置：跟随悬浮球（拖拽后），默认右下角 */
const PANEL_W = 432
const panelStyle = computed<Record<string, string>>(() => {
  if (!ballPos.value) return {} as Record<string, string>
  const pos = ballPos.value
  const left = Math.min(Math.max(pos.x + BALL_SIZE - PANEL_W, 8), Math.max(8, viewport.value.w - PANEL_W - 8))
  // 悬浮球在屏幕上半 → 面板出现在球下方；否则出现在球上方
  if (pos.y > viewport.value.h * 0.4) {
    return { left: `${left}px`, bottom: `${viewport.value.h - pos.y + 14}px`, right: 'auto', top: 'auto' }
  }
  return { left: `${left}px`, top: `${pos.y + BALL_SIZE + 14}px`, right: 'auto', bottom: 'auto' }
})

function onResize() {
  viewport.value = { w: window.innerWidth, h: window.innerHeight }
  if (ballPos.value) applyBallPos(ballPos.value.x, ballPos.value.y)
}

/* ---------------- 音频解锁与生命周期 ---------------- */
const unlockEvents = ['pointerdown', 'keydown', 'touchstart'] as const

function onFirstGesture() {
  if (audioUnlocked) return
  unlockAudio()
}

function togglePanel() {
  open.value = !open.value
  // 悬浮球点击是用户手势：立即解锁音频，保证后续提示音可播
  unlockAudio()
}

onMounted(() => {
  onResize()
  window.addEventListener('resize', onResize)
  const saved = loadBallPos()
  if (saved) {
    void nextTick(() => applyBallPos(saved.x, saved.y))
  }
  seedOrderDatabase()
  // 预置客户消息与自动回复记录
  const m1 = pushCustomerMessage(35)
  messages.value.push({
    id: nextMsgId++,
    role: 'agent',
    text: replyTemplate(m1.cat || 'greeting', m1.name || ''),
    time: m1.time + 120_000,
    auto: true,
  })
  const m2 = pushCustomerMessage(8)
  if (autoReplyEffective.value) {
    messages.value.push({
      id: nextMsgId++,
      role: 'agent',
      text: replyTemplate(m2.cat || 'greeting', m2.name || ''),
      time: m2.time + 130_000,
      auto: true,
    })
  } else {
    agentTyping.value = false
  }
  // 预置一条 AI 询价问答（客户按询价单数据库提问 → 数据库自动回答）
  const demo = INQUIRY_DEMO[1]
  inquiryMsgs.value.push({
    id: nextInquiryId++,
    role: 'customer',
    name: buyerFor(demo.country),
    country: demo.country,
    text: demo.text,
    time: Date.now() - 42 * 60_000,
  })
  inquiryMsgs.value.push({
    id: nextInquiryId++,
    role: 'agent',
    text: answerInquiry(demo.text),
    time: Date.now() - 41 * 60_000,
    auto: true,
  })
  startPushing()
  startMessages()
  startInquiryDemo()
  // 循环提醒播放：1 → 1.5 → 1.8 → 2 分钟依时间顺序循环（首轮 1 分钟后触发）
  scheduleNextRemind()
  // 浏览器自动播放策略：监听首次用户手势解锁音频（解锁前提示音进入补播队列）
  unlockEvents.forEach((ev) => {
    window.addEventListener(ev, onFirstGesture, { capture: true, passive: true })
  })
})

onBeforeUnmount(() => {
  if (pushTimer) clearInterval(pushTimer)
  if (msgTimer) clearInterval(msgTimer)
  if (inquiryTimer) clearInterval(inquiryTimer)
  if (remindTimer) clearTimeout(remindTimer)
  window.removeEventListener('resize', onResize)
  unlockEvents.forEach((ev) => {
    window.removeEventListener(ev, onFirstGesture, { capture: true })
  })
})
</script>

<template>
  <!-- 悬浮球（可拖拽，双击回到右下角） -->
  <button
    ref="ballEl"
    class="agent-ball"
    :class="{ 'is-off': !orderAgentActive, 'is-urgent': unreadCount > 0, 'is-dragging': dragging }"
    :style="ballStyle"
    :title="`${t('portal.agent.ballTip')} · ${t('portal.agent.dragTip')}`"
    :aria-label="t('portal.agent.ballTip')"
    @pointerdown="onBallPointerDown"
    @pointermove="onBallPointerMove"
    @pointerup="onBallPointerUp"
    @pointercancel="onBallPointerUp"
    @click="onBallClick"
    @dblclick="resetBallPos"
  >
    <span class="agent-ball-shine"></span>
    <el-badge :value="unreadCount" :hidden="unreadCount === 0" :max="99" class="agent-ball-badge">
      <el-icon :size="24"><Bell /></el-icon>
    </el-badge>
    <span class="agent-ball-ring"></span>
    <span class="agent-ball-ring is-late"></span>
    <span class="agent-ball-status" :class="orderAgentActive ? 'is-on' : 'is-off'"></span>
    <span class="agent-ball-grip"></span>
  </button>

  <!-- 提醒面板 -->
  <transition name="agent-pop">
    <section v-if="open" class="agent-panel" :style="panelStyle">
      <header class="agent-header">
        <span class="agent-avatar">
          <el-icon :size="20"><MagicStick /></el-icon>
          <span class="agent-avatar-dot" :class="{ 'is-on': orderAgentActive }"></span>
        </span>
        <div class="agent-header-text">
          <div class="agent-title">
            <template v-if="activeTab === 'orders'">
              {{ t('portal.agent.title') }}
              <span v-if="unreadCount" class="agent-title-count">{{ unreadCount }}</span>
            </template>
            <template v-else-if="activeTab === 'messages'">{{ t('portal.agent.replyTitle') }}</template>
            <template v-else>{{ t('portal.agent.inquiryTitle') }}</template>
          </div>
          <div class="agent-subtitle">
            {{ activeTab === 'orders'
              ? t('portal.agent.subtitle')
              : activeTab === 'messages'
                ? (autoReplyEffective ? t('portal.agent.replyOnDesc') : t('portal.agent.replyOffDesc'))
                : t('portal.agent.inquiryDesc') }}
          </div>
        </div>
        <div class="agent-header-tools">
          <el-tooltip :content="soundEnabled ? t('portal.agent.soundOn') : t('portal.agent.soundOff')" placement="top">
            <button class="agent-sound-btn" :class="{ 'is-muted': !soundEnabled }" :aria-label="t('portal.agent.soundTip')" @click="toggleSound">
              <el-icon v-if="soundEnabled" :size="16"><Headset /></el-icon>
              <el-icon v-else :size="16"><Mute /></el-icon>
            </button>
          </el-tooltip>
          <el-tooltip :content="broadcastEnabled ? t('portal.agent.voiceOn') : t('portal.agent.voiceOff')" placement="top">
            <button
              class="agent-sound-btn"
              :class="{ 'is-muted': !broadcastEnabled }"
              :aria-label="t('portal.agent.voiceTip')"
              @click="toggleVoice"
            >
              <el-icon v-if="broadcastEnabled" :size="16"><Microphone /></el-icon>
              <el-icon v-else :size="16"><MuteNotification /></el-icon>
            </button>
          </el-tooltip>
          <el-tooltip :content="wake.enabled.value ? t('portal.agent.wakeOn') : t('portal.agent.wakeOff')" placement="top">
            <button
              class="agent-sound-btn"
              :class="{ 'is-muted': !wake.enabled.value }"
              :aria-label="t('portal.agent.wakeLabel')"
              @click="wake.toggle()"
            >
              <el-icon :size="16"><AlarmClock /></el-icon>
            </button>
          </el-tooltip>
          <el-tooltip v-if="ballPos" :content="t('portal.agent.dragTip')" placement="top">
            <button class="agent-sound-btn" :aria-label="t('portal.agent.dragTip')" @click="resetBallPos">
              <el-icon :size="16"><Position /></el-icon>
            </button>
          </el-tooltip>
          <el-button class="agent-close-btn" size="small" text circle @click="open = false">
            <el-icon><Close /></el-icon>
          </el-button>
        </div>
      </header>

      <!-- 页签切换 -->
      <nav class="agent-tabs">
        <button
          class="agent-tab"
          :class="{ 'is-active': activeTab === 'orders' }"
          @click="activeTab = 'orders'"
        >
          <el-icon :size="14"><Bell /></el-icon>
          {{ t('portal.agent.tabOrders') }}
        </button>
        <button
          class="agent-tab"
          :class="{ 'is-active': activeTab === 'messages' }"
          @click="activeTab = 'messages'"
        >
          <el-icon :size="14"><ChatDotRound /></el-icon>
          {{ t('portal.agent.tabMessages') }}
        </button>
        <button
          class="agent-tab"
          :class="{ 'is-active': activeTab === 'inquiry' }"
          @click="activeTab = 'inquiry'"
        >
          <el-icon :size="14"><Cpu /></el-icon>
          {{ t('portal.agent.tabInquiry') }}
        </button>
      </nav>

      <!-- 订单提醒页签（订单数据库） -->
      <div v-show="activeTab === 'orders'" class="agent-list">
        <div class="agent-voice-toolbar">
          <label class="agent-voice-item">
            <span class="agent-voice-ico"><el-icon :size="13"><Microphone /></el-icon></span>
            <span class="agent-voice-label">{{ t('portal.agent.voiceTip') }}</span>
            <el-switch :model-value="broadcastEnabled" size="small" @change="toggleVoice" />
          </label>
          <label class="agent-voice-item" :class="{ 'is-dim': !wake.supported }">
            <span class="agent-voice-ico"><el-icon :size="13"><AlarmClock /></el-icon></span>
            <span class="agent-voice-label">{{ t('portal.agent.wakeLabel') }}</span>
            <el-switch :model-value="wake.enabled.value" :disabled="!wake.supported" size="small" @change="wake.toggle()" />
          </label>
        </div>

        <!-- 订单数据库徽标 -->
        <div class="agent-db-bar">
          <span class="agent-db-ico"><el-icon :size="14"><Coin /></el-icon></span>
          <span class="agent-db-label">{{ t('portal.agent.dbLabel') }}</span>
          <span class="agent-db-count">{{ t('portal.agent.dbCount', { n: orders.length.toLocaleString() }) }}</span>
        </div>

        <!-- 循环提醒播放说明 -->
        <div class="agent-remind-bar">
          <span class="agent-remind-ico"><el-icon :size="12"><AlarmClock /></el-icon></span>
          {{ t('portal.agent.remindLoopTip') }}
        </div>

        <el-alert
          v-if="!orderAgentActive"
          class="agent-deactivated"
          type="warning"
          :closable="false"
          show-icon
          :title="t('portal.agent.agentDeactivated')"
        >
          <router-link class="agent-goto-agents" to="/agents">
            {{ t('portal.agent.gotoAgents') }} →
          </router-link>
        </el-alert>

        <el-empty v-if="orders.length === 0" :description="t('portal.agent.empty')" />

        <article
          v-for="order in visibleOrders"
          :key="order.id"
          class="agent-card"
          :class="{ 'is-handled': order.status !== 'pending', 'is-expanded': expandedId === order.id }"
        >
          <!-- 点击整卡展开/收起完整订单内容 -->
          <div class="agent-card-main" @click="toggleExpand(order)">
            <div class="agent-card-top">
              <span v-if="order.channel === 'overseas'" class="agent-country">
                <span class="agent-flag">{{ COUNTRY_FLAGS[order.country] }}</span>
                <span class="agent-country-name">{{ countryName(order.country) }}</span>
              </span>
              <span v-else class="agent-channel" :style="channelStyle(order.channel)">
                {{ channelName(order.channel) }}
              </span>
              <el-tag v-if="order.docType" size="small" effect="plain" class="agent-doc-tag">
                {{ bilingualLabel(order.docType) }}
              </el-tag>
              <el-tag v-else-if="order.isWholesale" size="small" type="warning" effect="plain">
                {{ t('portal.agent.orderWholesale') }}
              </el-tag>
              <span class="agent-time">{{ timeLabel(order.createdAt) }}</span>
              <span class="agent-expand-hint">
                <el-icon :size="12"><ArrowDown /></el-icon>
              </span>
            </div>

            <div class="agent-product">
              <span class="agent-order-no">{{ order.orderNo }}</span>
              {{ bilingualLabel(order.productName) }}
            </div>

            <div class="agent-customer-line">
              {{ t('portal.agent.customerLabel') }}：<b>{{ order.customerName }}</b>
            </div>

            <div class="agent-grid">
              <div class="agent-field">
                <label>{{ t('portal.agent.quantity') }}</label>
                <span>{{ order.quantity.toLocaleString() }} {{ order.unit }}</span>
              </div>
              <div class="agent-field agent-field-amount">
                <label>{{ t('portal.agent.amount') }}</label>
                <span class="agent-amount">{{ amountLabel(order) }}</span>
              </div>
            </div>

            <!-- 展开详情 -->
            <div v-if="expandedId === order.id" class="agent-card-detail">
              <div class="agent-field">
                <label>{{ t('portal.agent.shipRequirement') }}</label>
                <span>{{ bilingualLabel(order.shipRequirement) }}</span>
              </div>
              <div class="agent-field">
                <label>{{ t('portal.agent.qualityRequirement') }}</label>
                <span>{{ bilingualLabel(order.qualityRequirement) }}</span>
              </div>
              <div class="agent-grid">
                <div class="agent-field">
                  <label>{{ t('portal.agent.sample') }}</label>
                  <el-tag size="small" :type="order.sample ? 'success' : 'info'" effect="plain">
                    {{ order.sample ? t('portal.agent.sampleYes') : t('portal.agent.sampleNo') }}
                  </el-tag>
                </div>
                <div class="agent-field">
                  <label>{{ t('portal.agent.channelLabel') }}</label>
                  <span class="agent-channel-text" :style="{ color: channelStyle(order.channel).color }">
                    {{ channelName(order.channel) }}
                  </span>
                </div>
              </div>
              <div class="agent-grid">
                <div class="agent-field">
                  <label>{{ t('portal.agent.shipDate') }}</label>
                  <span>{{ order.shipDate }}</span>
                </div>
                <div class="agent-field">
                  <label>{{ t('portal.agent.eta') }}</label>
                  <span>{{ order.eta }}</span>
                </div>
              </div>
            </div>
          </div>

          <footer class="agent-actions" @click.stop>
            <el-button size="small" text type="primary" @click="openOrderDetail(order)">
              <el-icon><View /></el-icon>
              {{ t('portal.agent.viewDetail') }}
            </el-button>
            <template v-if="order.status === 'pending'">
              <el-button size="small" type="primary" @click="acceptOrder(order)">
                <el-icon><Check /></el-icon>
                {{ t('portal.agent.accept') }}
              </el-button>
              <el-button size="small" @click="ignoreOrder(order)">
                {{ t('portal.agent.ignore') }}
              </el-button>
            </template>
            <el-tag v-else size="small" :type="order.status === 'handled' ? 'success' : 'info'">
              {{ order.status === 'handled' ? t('portal.agent.handled') : t('portal.agent.ignored') }}
            </el-tag>
          </footer>
        </article>

        <div v-if="unreadCount" class="agent-list-footer">
          <el-button size="small" type="primary" plain @click="handleAll">
            {{ t('portal.agent.allHandled') }}
          </el-button>
        </div>
        <div v-if="hasMoreOrders" class="agent-list-footer">
          <el-button size="small" plain @click="orderPage++">
            {{ t('portal.agent.loadMore') }} · {{ visibleOrders.length }}/{{ orders.length.toLocaleString() }}
          </el-button>
        </div>
        <div v-else-if="orders.length > ORDER_PAGE_SIZE" class="agent-list-footer agent-no-more">
          {{ t('portal.agent.noMore') }}
        </div>
      </div>

      <!-- 客户消息页签（自动回复） -->
      <div v-show="activeTab === 'messages'" class="agent-chat">
        <div class="agent-chat-toolbar">
          <el-switch
            :model-value="autoReplyEffective"
            :disabled="!autoReplyAgentActive"
            size="small"
            @change="(v: string | number | boolean) => toggleAutoReply(!!v)"
          />
          <span class="agent-chat-toolbar-label">{{ t('portal.agent.replySwitch') }}</span>
          <el-tag v-if="!autoReplyAgentActive" size="small" type="info" effect="plain">
            {{ t('portal.agent.replyPausedByCenter') }}
          </el-tag>
        </div>

        <div class="agent-chat-list">
          <div
            v-for="msg in messages"
            :key="msg.id"
            class="chat-row"
            :class="`is-${msg.role}`"
          >
            <div class="chat-meta">
              <template v-if="msg.role === 'customer'">
                <span class="chat-flag">{{ COUNTRY_FLAGS[msg.country || ''] || '' }}</span>
                <span class="chat-name">{{ msg.name }}</span>
              </template>
              <template v-else-if="msg.role === 'agent'">
                <el-icon :size="12" color="#1a6b5c"><MagicStick /></el-icon>
                <span class="chat-name">{{ t('portal.agent.autoReplyTag') }}</span>
                <el-tag v-if="msg.auto" size="small" type="success" effect="plain" round>
                  {{ t('portal.agent.replySwitch') }}
                </el-tag>
              </template>
              <span v-else class="chat-name">{{ t('portal.agent.replyTitle') }}</span>
              <span class="chat-time">{{ timeLabel(msg.time) }}</span>
            </div>
            <div class="chat-bubble" :class="`bubble-${msg.role}`">{{ msg.text }}</div>
          </div>

          <div v-if="agentTyping" class="chat-row is-agent">
            <div class="chat-meta">
              <el-icon :size="12" color="#1a6b5c"><MagicStick /></el-icon>
              <span class="chat-name">{{ t('portal.agent.autoReplyTag') }}</span>
            </div>
            <div class="chat-bubble bubble-agent is-typing">
              <span class="dot"></span><span class="dot"></span><span class="dot"></span>
              {{ t('portal.agent.typing') }}
            </div>
          </div>
        </div>

        <footer class="agent-chat-input">
          <el-input
            v-model="manualInput"
            size="small"
            :placeholder="t('portal.agent.inputPlaceholder')"
            @keyup.enter="sendManualReply"
          />
          <el-button size="small" type="primary" @click="sendManualReply">
            <el-icon><Promotion /></el-icon>
          </el-button>
        </footer>
      </div>

      <!-- AI 询价页签（询价数据库自动应答） -->
      <div v-show="activeTab === 'inquiry'" class="agent-inquiry">
        <!-- 询价数据库卡片 -->
        <div class="kb-card">
          <span class="kb-ico"><el-icon :size="16"><Coin /></el-icon></span>
          <div class="kb-text">
            <div class="kb-title">{{ t('portal.agent.inquiryDbTip') }}</div>
            <div class="kb-sub">{{ t('portal.agent.inquiryDbCount', { n: INQUIRY_KB.length }) }}</div>
          </div>
          <span class="kb-pulse"></span>
          <span class="kb-pulse is-late"></span>
        </div>

        <div class="agent-chat-list">
          <div
            v-for="msg in inquiryMsgs"
            :key="msg.id"
            class="chat-row"
            :class="`is-${msg.role}`"
          >
            <div class="chat-meta">
              <template v-if="msg.role === 'customer'">
                <span class="chat-flag">{{ COUNTRY_FLAGS[msg.country || ''] || '' }}</span>
                <span class="chat-name">{{ msg.name }}</span>
              </template>
              <template v-else-if="msg.role === 'agent'">
                <span class="chat-robot"><el-icon :size="11"><Cpu /></el-icon></span>
                <span class="chat-name">{{ t('portal.agent.inquiryAutoTag') }}</span>
                <el-tag v-if="msg.auto" size="small" type="success" effect="plain" round>
                  {{ t('portal.agent.inquiryDbTip') }}
                </el-tag>
              </template>
              <span v-else class="chat-name">{{ t('portal.agent.inquiryYou') }}</span>
              <span class="chat-time">{{ timeLabel(msg.time) }}</span>
            </div>
            <div class="chat-bubble" :class="`bubble-${msg.role}`">{{ msg.text }}</div>
          </div>

          <div v-if="inquiryTyping" class="chat-row is-agent">
            <div class="chat-meta">
              <span class="chat-robot"><el-icon :size="11"><Cpu /></el-icon></span>
              <span class="chat-name">{{ t('portal.agent.inquiryAutoTag') }}</span>
            </div>
            <div class="chat-bubble bubble-agent is-typing">
              <span class="dot"></span><span class="dot"></span><span class="dot"></span>
              {{ t('portal.agent.inquirySearching') }}
            </div>
          </div>
        </div>

        <footer class="agent-chat-input">
          <el-input
            v-model="inquiryInput"
            size="small"
            :placeholder="t('portal.agent.inquiryInputPh')"
            :disabled="inquiryTyping"
            @keyup.enter="sendInquiry"
          />
          <el-button size="small" type="primary" :disabled="inquiryTyping" @click="sendInquiry">
            <el-icon><Promotion /></el-icon>
          </el-button>
        </footer>
      </div>
    </section>
  </transition>

  <!-- 订单详情弹窗（点击客户内容查看订单全部内容） -->
  <el-dialog
    v-model="detailVisible"
    :title="t('portal.agent.detailTitle')"
    width="520px"
    append-to-body
    class="agent-detail-dialog"
  >
    <template v-if="detailOrder">
      <div class="agent-detail-head">
        <span v-if="detailOrder.channel === 'overseas'" class="agent-country">
          <span class="agent-flag">{{ COUNTRY_FLAGS[detailOrder.country] }}</span>
          <span class="agent-country-name">{{ countryName(detailOrder.country) }}</span>
        </span>
        <span v-else class="agent-channel" :style="channelStyle(detailOrder.channel)">
          {{ channelName(detailOrder.channel) }}
        </span>
        <el-tag v-if="detailOrder.docType" size="small" effect="plain" class="agent-doc-tag">
          {{ bilingualLabel(detailOrder.docType) }}
        </el-tag>
        <el-tag v-else-if="detailOrder.isWholesale" size="small" type="warning" effect="plain">
          {{ t('portal.agent.orderWholesale') }}
        </el-tag>
      </div>

      <div class="agent-detail-grid">
        <div class="agent-detail-field">
          <label>{{ t('portal.agent.orderNoLabel') }}</label>
          <span class="agent-detail-order-no">{{ detailOrder.orderNo }}</span>
        </div>
        <div class="agent-detail-field">
          <label>{{ t('portal.agent.customerLabel') }}</label>
          <span class="agent-detail-customer">{{ detailOrder.customerName }}</span>
        </div>
        <div class="agent-detail-field is-wide">
          <label>{{ t('portal.agent.productLabel') }}</label>
          <span>{{ bilingualLabel(detailOrder.productName) }}</span>
        </div>
        <div class="agent-detail-field">
          <label>{{ t('portal.agent.quantity') }}</label>
          <span>{{ detailOrder.quantity.toLocaleString() }} {{ detailOrder.unit }}</span>
        </div>
        <div class="agent-detail-field">
          <label>{{ t('portal.agent.amount') }}</label>
          <span class="agent-amount">{{ amountLabel(detailOrder) }}</span>
        </div>
        <div class="agent-detail-field is-wide">
          <label>{{ t('portal.agent.shipRequirement') }}</label>
          <span>{{ bilingualLabel(detailOrder.shipRequirement) }}</span>
        </div>
        <div class="agent-detail-field is-wide">
          <label>{{ t('portal.agent.qualityRequirement') }}</label>
          <span>{{ bilingualLabel(detailOrder.qualityRequirement) }}</span>
        </div>
        <div class="agent-detail-field">
          <label>{{ t('portal.agent.sample') }}</label>
          <el-tag size="small" :type="detailOrder.sample ? 'success' : 'info'" effect="plain">
            {{ detailOrder.sample ? t('portal.agent.sampleYes') : t('portal.agent.sampleNo') }}
          </el-tag>
        </div>
        <div class="agent-detail-field">
          <label>{{ t('portal.agent.channelLabel') }}</label>
          <span class="agent-channel-text" :style="{ color: channelStyle(detailOrder.channel).color }">
            {{ channelName(detailOrder.channel) }}
          </span>
        </div>
        <div class="agent-detail-field">
          <label>{{ t('portal.agent.shipDate') }}</label>
          <span>{{ detailOrder.shipDate }}</span>
        </div>
        <div class="agent-detail-field">
          <label>{{ t('portal.agent.eta') }}</label>
          <span>{{ detailOrder.eta }}</span>
        </div>
      </div>
    </template>

    <template #footer>
      <el-button size="small" @click="detailVisible = false">
        {{ t('portal.agent.close') }}
      </el-button>
      <el-button
        v-if="detailOrder && detailOrder.status === 'pending'"
        size="small"
        type="primary"
        @click="acceptDetailOrder"
      >
        <el-icon><Check /></el-icon>
        {{ t('portal.agent.accept') }}
      </el-button>
    </template>
  </el-dialog>
</template>

<style scoped>
/* ================= 悬浮球 ================= */
.agent-ball {
  position: fixed;
  right: 30px;
  bottom: 30px;
  z-index: 1200;
  width: 62px;
  height: 62px;
  border-radius: 50%;
  border: none;
  cursor: grab;
  touch-action: none;
  user-select: none;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #faf8f3;
  background:
    radial-gradient(circle at 30% 24%, rgba(255, 255, 255, 0.38), transparent 46%),
    linear-gradient(140deg, #2f8f74 0%, #1a6b5c 55%, #0f3f36 100%);
  box-shadow:
    0 10px 28px rgba(18, 77, 66, 0.5),
    inset 0 1px 1px rgba(255, 255, 255, 0.28);
  transition: transform 0.28s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.28s ease;
}
.agent-ball:hover {
  transform: translateY(-3px) scale(1.06);
  box-shadow:
    0 16px 36px rgba(18, 77, 66, 0.55),
    inset 0 1px 1px rgba(255, 255, 255, 0.28);
}
.agent-ball:active,
.agent-ball.is-dragging {
  cursor: grabbing;
  transform: scale(1.02);
  transition: none;
}
.agent-ball-shine {
  position: absolute;
  top: 8px;
  left: 14px;
  width: 20px;
  height: 10px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.42);
  filter: blur(3px);
  transform: rotate(-24deg);
  pointer-events: none;
}
.agent-ball.is-off {
  background:
    radial-gradient(circle at 30% 24%, rgba(255, 255, 255, 0.26), transparent 46%),
    linear-gradient(140deg, #9aa5a0, #6b7a74);
  box-shadow: 0 8px 20px rgba(107, 122, 116, 0.4);
}
.agent-ball.is-off .agent-ball-ring {
  animation: none;
  opacity: 0;
}
.agent-ball.is-urgent {
  animation: ball-bounce 2.4s ease-in-out infinite;
}
.agent-ball.is-dragging {
  animation: none;
}
@keyframes ball-bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-4px); }
}
.agent-ball-ring {
  position: absolute;
  inset: -6px;
  border-radius: 50%;
  border: 2px solid rgba(212, 168, 83, 0.65);
  animation: agent-pulse 2.4s ease-out infinite;
  pointer-events: none;
}
.agent-ball-ring.is-late {
  animation-delay: 1.2s;
}
.agent-ball-status {
  position: absolute;
  right: 2px;
  bottom: 2px;
  width: 13px;
  height: 13px;
  border-radius: 50%;
  border: 2.5px solid #fdfdfb;
  background: #3ecf8e;
}
.agent-ball-status.is-off {
  background: #b9c2bd;
}
.agent-ball-grip {
  position: absolute;
  bottom: 16px;
  right: 18px;
  width: 16px;
  height: 7px;
  border-radius: 4px;
  background: repeating-linear-gradient(
    90deg,
    rgba(250, 248, 243, 0.5) 0 2px,
    transparent 2px 4px
  );
  pointer-events: none;
  opacity: 0.75;
}
@keyframes agent-pulse {
  0% { transform: scale(0.9); opacity: 0.9; }
  70% { transform: scale(1.28); opacity: 0; }
  100% { transform: scale(1.28); opacity: 0; }
}

/* ================= 提醒面板 ================= */
.agent-panel {
  position: fixed;
  right: 30px;
  bottom: 108px;
  z-index: 1200;
  width: 432px;
  max-height: min(680px, calc(100vh - 150px));
  display: flex;
  flex-direction: column;
  background: #ffffff;
  border: 1px solid #dde5e0;
  border-radius: 14px;
  box-shadow:
    0 20px 48px rgba(15, 43, 36, 0.22),
    0 2px 8px rgba(15, 43, 36, 0.1);
  overflow: hidden;
  transform-origin: bottom right;
}

/* 头部：经典商务标题栏（纯色深绿，无氛围光装饰） */
.agent-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 14px;
  background: linear-gradient(180deg, #1f7868, #16604f);
  color: #faf8f3;
}
.agent-avatar {
  position: relative;
  flex: none;
  width: 38px;
  height: 38px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #faf8f3;
  background: rgba(255, 255, 255, 0.16);
  border: 1.5px solid rgba(255, 255, 255, 0.5);
  box-shadow: 0 3px 10px rgba(10, 35, 29, 0.3);
}
.agent-avatar-dot {
  position: absolute;
  right: -1px;
  bottom: -1px;
  width: 11px;
  height: 11px;
  border-radius: 50%;
  border: 2px solid #16604f;
  background: #b9c2bd;
}
.agent-avatar-dot.is-on {
  background: #3ecf8e;
  animation: dot-breathe 2s ease-in-out infinite;
}
@keyframes dot-breathe {
  0%, 100% { box-shadow: 0 0 0 0 rgba(62, 207, 142, 0.55); }
  50% { box-shadow: 0 0 0 4px rgba(62, 207, 142, 0); }
}
.agent-header-text {
  flex: 1;
  min-width: 0;
}
.agent-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 700;
  letter-spacing: 0.5px;
}
.agent-title-count {
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
  color: #ffffff;
  background: #e0523f;
  box-shadow: 0 2px 6px rgba(224, 82, 63, 0.45);
}
.agent-subtitle {
  margin-top: 3px;
  font-size: 12px;
  color: rgba(250, 248, 243, 0.8);
  line-height: 1.5;
}
.agent-header-tools {
  display: flex;
  align-items: center;
  gap: 5px;
}
.agent-sound-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: 1px solid rgba(250, 248, 243, 0.32);
  border-radius: 8px;
  background: rgba(250, 248, 243, 0.1);
  color: #eaf3ef;
  cursor: pointer;
  transition: background 0.2s ease, transform 0.2s ease;
}
.agent-sound-btn:hover {
  background: rgba(250, 248, 243, 0.22);
  transform: translateY(-1px);
}
.agent-sound-btn.is-muted {
  color: rgba(250, 248, 243, 0.45);
  background: transparent;
}

/* 页签：经典 Tab 栏（与头部一体，激活项品牌色） */
.agent-tabs {
  position: relative;
  z-index: 2;
  display: flex;
  gap: 2px;
  padding: 6px 10px 0;
  background: #ffffff;
  border-bottom: 1px solid #e6ece8;
}
.agent-tab {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  padding: 9px 6px;
  border: none;
  border-bottom: 2px solid transparent;
  background: transparent;
  color: #6f7d77;
  font-size: 13px;
  cursor: pointer;
  transition: color 0.2s ease, border-color 0.2s ease, background 0.2s ease;
}
.agent-tab:hover {
  color: #1a6b5c;
  background: #f4f8f6;
}
.agent-tab.is-active {
  color: #16604f;
  font-weight: 700;
  border-bottom-color: #1a6b5c;
  background: #f2f8f5;
}

.agent-list {
  flex: 1;
  overflow-y: auto;
  padding: 12px 14px 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  background: #f7faf8;
}
.agent-list::-webkit-scrollbar,
.agent-chat-list::-webkit-scrollbar {
  width: 6px;
}
.agent-list::-webkit-scrollbar-thumb,
.agent-chat-list::-webkit-scrollbar-thumb {
  border-radius: 999px;
  background: #cdd9d3;
}
.agent-list::-webkit-scrollbar-thumb:hover,
.agent-chat-list::-webkit-scrollbar-thumb:hover {
  background: #b3c4bc;
}
.agent-deactivated {
  border-radius: 12px;
}
.agent-goto-agents {
  color: #1a6b5c;
  font-weight: 600;
  text-decoration: none;
}
.agent-list-footer {
  display: flex;
  justify-content: center;
  padding-bottom: 2px;
}
.agent-no-more {
  font-size: 12px;
  color: #9aa5a0;
}

/* 语音控制行：播报 / 唤醒 双芯片 */
.agent-voice-toolbar {
  display: flex;
  gap: 8px;
}
.agent-voice-item {
  flex: 1;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  background: linear-gradient(180deg, #ffffff, #f7faf8);
  border: 1px solid #e6ece8;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text-primary, #303133);
  cursor: pointer;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}
.agent-voice-item:hover {
  border-color: #cfe0d8;
  box-shadow: 0 4px 10px rgba(15, 43, 36, 0.07);
}
.agent-voice-item.is-dim {
  opacity: 0.55;
  cursor: not-allowed;
}
.agent-voice-ico {
  flex: none;
  width: 24px;
  height: 24px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #eaf4f0, #dbece5);
  color: #1a6b5c;
}
.agent-voice-label {
  flex: 1;
  min-width: 0;
}

/* 订单数据库徽标条 */
.agent-db-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 10px;
  background: #ffffff;
  border: 1px solid #e6ece8;
}
.agent-db-ico {
  width: 26px;
  height: 26px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(180deg, #1a6b5c, #2f8f74);
  color: #ffffff;
  box-shadow: 0 3px 8px rgba(26, 107, 92, 0.3);
}
.agent-db-label {
  font-size: 12.5px;
  font-weight: 700;
  color: #16604f;
}
.agent-db-count {
  margin-left: auto;
  font-size: 11.5px;
  font-weight: 700;
  color: #a5761c;
  background: linear-gradient(135deg, #fdf6e7, #f9efda);
  border: 1px solid #f0e2c2;
  border-radius: 999px;
  padding: 2px 10px;
  font-variant-numeric: tabular-nums;
}

/* 订单卡片 */
.agent-card {
  position: relative;
  background: #ffffff;
  border: 1px solid #e8ede9;
  border-radius: 14px;
  padding: 12px 13px 12px 17px;
  display: flex;
  flex-direction: column;
  gap: 9px;
  box-shadow: 0 2px 8px rgba(15, 43, 36, 0.05);
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
}
.agent-card-main {
  display: flex;
  flex-direction: column;
  gap: 9px;
}
.agent-card::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  background: linear-gradient(180deg, #d4a853, #1a6b5c);
}
.agent-card:hover {
  transform: translateY(-2px);
  border-color: #c2d9cf;
  box-shadow: 0 10px 24px rgba(15, 43, 36, 0.12);
}
.agent-card.is-expanded {
  border-color: #1a6b5c;
  box-shadow: 0 10px 24px rgba(26, 107, 92, 0.16);
}
.agent-card.is-handled {
  opacity: 0.58;
  filter: saturate(0.35);
}
.agent-card.is-handled::before {
  background: #c7d0cb;
}
.agent-expand-hint {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: none;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  color: #8a958e;
  background: #f2f6f4;
  transition: transform 0.25s ease, background 0.25s ease, color 0.25s ease;
}
.agent-card.is-expanded .agent-expand-hint {
  transform: rotate(180deg);
  color: #fff;
  background: #1a6b5c;
}
.agent-card-detail {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-top: 9px;
  border-top: 1px dashed #dde8e2;
  animation: agent-detail-in 0.22s ease;
}
@keyframes agent-detail-in {
  from { opacity: 0; transform: translateY(-4px); }
  to { opacity: 1; transform: translateY(0); }
}
.agent-card-top {
  display: flex;
  align-items: center;
  gap: 8px;
}
.agent-country {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 3px 10px 3px 4px;
  border-radius: 999px;
  background: #f2f7f4;
  font-weight: 600;
  font-size: 13px;
  color: var(--color-text-primary, #303133);
}
.agent-flag {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: #ffffff;
  box-shadow: 0 1px 3px rgba(15, 43, 36, 0.14);
  font-size: 14px;
  line-height: 1;
}
.agent-time {
  margin-left: auto;
  font-size: 12px;
  color: var(--color-text-secondary, #909399);
}
.agent-product {
  font-size: 13.5px;
  font-weight: 600;
  color: var(--color-text-primary, #303133);
  line-height: 1.55;
}
.agent-order-no {
  display: block;
  margin-bottom: 2px;
  font-size: 11.5px;
  font-weight: 400;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  letter-spacing: 0.4px;
  color: #9aa5a0;
}
.agent-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}
.agent-field {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
  padding: 7px 9px;
  border-radius: 10px;
  background: #f7faf8;
}
.agent-field label {
  font-size: 10.5px;
  letter-spacing: 0.4px;
  color: #8a958e;
}
.agent-field span {
  font-size: 13px;
  color: var(--color-text-regular, #606266);
  word-break: break-word;
}
.agent-field-amount {
  background: linear-gradient(135deg, #fdf6e7, #f9efda);
  border: 1px solid #f0e2c2;
}
.agent-field-amount .agent-amount {
  color: #a5761c;
  font-weight: 700;
  font-size: 15px;
  font-variant-numeric: tabular-nums;
}
.agent-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  padding-top: 2px;
}
.agent-actions-done {
  justify-content: flex-end;
  padding-top: 0;
}

/* 订单渠道徽标（淘宝/拼多多/京东/抖音/快速/跨境） */
.agent-channel {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  height: 22px;
  padding: 0 9px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.3px;
  color: #fff;
  box-shadow: inset 0 1px 1px rgba(255, 255, 255, 0.25);
}
.agent-channel-text {
  font-weight: 700;
}
.agent-doc-tag {
  border-radius: 999px;
}

/* 客户名（点击卡片任意处即可展开详情） */
.agent-customer-line {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12.5px;
  color: var(--color-text-regular, #606266);
}
.agent-customer-line b {
  color: #1a6b5c;
}

/* 循环提醒播放说明条 */
.agent-remind-bar {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 6px 0 10px;
  padding: 6px 10px;
  border-radius: 10px;
  background: #eef7f2;
  border: 1px solid #dcebe3;
  font-size: 11.5px;
  color: #4a7a6b;
}
.agent-remind-ico {
  display: inline-flex;
  color: #1a6b5c;
}

/* 订单详情弹窗 */
.agent-detail-head {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 14px;
  padding: 10px 12px;
  border-radius: 10px;
  background: #f7faf8;
  border: 1px solid #e8ede9;
}
.agent-detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}
.agent-detail-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
  padding: 9px 12px;
  border-radius: 10px;
  background: #f7faf8;
}
.agent-detail-field.is-wide {
  grid-column: 1 / -1;
}
.agent-detail-field label {
  font-size: 11px;
  letter-spacing: 0.4px;
  color: #8a958e;
}
.agent-detail-field span {
  font-size: 14px;
  color: var(--color-text-regular, #606266);
  word-break: break-word;
}
.agent-detail-order-no {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-weight: 600;
  letter-spacing: 0.3px;
}
.agent-detail-customer {
  font-weight: 700;
  color: #1a6b5c !important;
}
.agent-detail-dialog .agent-amount {
  color: #a5761c;
  font-weight: 700;
  font-size: 16px;
  font-variant-numeric: tabular-nums;
}

/* 客户消息（自动回复） */
.agent-chat {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  background: #f7faf8;
}
.agent-chat-toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 10px 14px 0;
  padding: 8px 12px;
  background: #ffffff;
  border: 1px solid #e6ece8;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(15, 43, 36, 0.05);
}
.agent-chat-toolbar-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-primary, #303133);
}
.agent-chat-list {
  flex: 1;
  overflow-y: auto;
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.chat-row {
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-width: 86%;
}
.chat-row.is-customer {
  align-self: flex-start;
}
.chat-row.is-agent,
.chat-row.is-me {
  align-self: flex-end;
  align-items: flex-end;
}
.chat-meta {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  color: var(--color-text-secondary, #909399);
}
.chat-flag {
  font-size: 13px;
}
.chat-name {
  font-weight: 600;
}
.chat-time {
  font-weight: 400;
}
.chat-robot {
  width: 17px;
  height: 17px;
  border-radius: 6px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(180deg, #1a6b5c, #2f8f74);
  color: #ffffff;
}
.chat-bubble {
  padding: 9px 12px;
  border-radius: 14px;
  font-size: 13px;
  line-height: 1.65;
  word-break: break-word;
  white-space: pre-wrap;
  box-shadow: 0 2px 6px rgba(15, 43, 36, 0.06);
}
.bubble-customer {
  background: #ffffff;
  border: 1px solid #e8ede9;
  color: var(--color-text-regular, #606266);
  border-top-left-radius: 4px;
}
.bubble-agent {
  background: linear-gradient(135deg, #1a6b5c, #2f8f74);
  color: #faf8f3;
  border-top-right-radius: 4px;
  box-shadow: 0 2px 6px rgba(26, 107, 92, 0.2);
}
.bubble-me {
  background: #e9f3ee;
  border: 1px solid #cfe3dc;
  color: #124d42;
  border-top-right-radius: 4px;
}
.is-typing {
  display: flex;
  align-items: center;
  gap: 4px;
  font-style: italic;
}
.is-typing .dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: rgba(250, 248, 243, 0.85);
  animation: typing-blink 1.2s infinite ease-in-out;
}
.is-typing .dot:nth-child(2) { animation-delay: 0.2s; }
.is-typing .dot:nth-child(3) { animation-delay: 0.4s; }
@keyframes typing-blink {
  0%, 80%, 100% { opacity: 0.3; transform: translateY(0); }
  40% { opacity: 1; transform: translateY(-2px); }
}
.agent-chat-input {
  display: flex;
  gap: 8px;
  padding: 10px 12px;
  background: #ffffff;
  border-top: 1px solid #e9efeb;
}

/* AI 询价页签 */
.agent-inquiry {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  background: #f7faf8;
}
.kb-card {
  position: relative;
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 10px 14px 0;
  padding: 10px 12px;
  border-radius: 10px;
  background: #ffffff;
  border: 1px solid #e6ece8;
  color: #303133;
  box-shadow: 0 2px 8px rgba(15, 43, 36, 0.05);
}
.kb-ico {
  flex: none;
  width: 34px;
  height: 34px;
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(180deg, #1a6b5c, #2f8f74);
  color: #ffffff;
  box-shadow: 0 3px 8px rgba(26, 107, 92, 0.3);
}
.kb-text {
  flex: 1;
  min-width: 0;
}
.kb-title {
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.4px;
  color: #16604f;
}
.kb-sub {
  margin-top: 2px;
  font-size: 11.5px;
  color: #8a958e;
}
.kb-pulse {
  position: absolute;
  right: 14px;
  top: 12px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #3ecf8e;
  box-shadow: 0 0 0 0 rgba(62, 207, 142, 0.6);
  animation: kb-breathe 2.2s ease-out infinite;
}
.kb-pulse.is-late {
  animation-delay: 1.1s;
}
@keyframes kb-breathe {
  0% { box-shadow: 0 0 0 0 rgba(62, 207, 142, 0.55); }
  70% { box-shadow: 0 0 0 7px rgba(62, 207, 142, 0); }
  100% { box-shadow: 0 0 0 7px rgba(62, 207, 142, 0); }
}

/* RTL（阿拉伯语）适配 */
:global([dir='rtl']) .agent-ball,
:global([dir='rtl']) .agent-panel {
  right: auto;
  left: 30px;
}
:global([dir='rtl']) .agent-panel {
  transform-origin: bottom left;
}
:global([dir='rtl']) .agent-time {
  margin-left: 0;
  margin-right: auto;
}
:global([dir='rtl']) .chat-row.is-customer {
  align-self: flex-end;
  align-items: flex-end;
}
:global([dir='rtl']) .chat-row.is-agent,
:global([dir='rtl']) .chat-row.is-me {
  align-self: flex-start;
  align-items: flex-start;
}
:global([dir='rtl']) .agent-db-count {
  margin-left: 0;
  margin-right: auto;
}

/* 弹出动画（弹性缩放） */
.agent-pop-enter-active {
  transition: all 0.34s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.agent-pop-leave-active {
  transition: all 0.18s ease;
}
.agent-pop-enter-from,
.agent-pop-leave-to {
  opacity: 0;
  transform: translateY(22px) scale(0.94);
}
</style>
