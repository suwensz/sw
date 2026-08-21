<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { Microphone, Mute, Bell, Promotion } from '@element-plus/icons-vue'
import { useSocialStore } from '@/stores/social'
import { useWakeWord, dispatchFullWake } from '@/composables/useWakeWord'
import { SOCIAL_APP_MAP, countryInfo, COUNTRY_BUYER_NAMES } from '@/mock/socialData'
import { mockProducts } from '@/mock/products'
import { tText, getLocale } from '@/i18n'
import { speak } from '@/composables/useSpeech'
import type { SocialAppId } from '@/types'

const { t } = useI18n()
const router = useRouter()
const social = useSocialStore()

const STORAGE_KEY = 'qh_inquiry_enabled'

interface ChatMessage {
  from: 'customer' | 'ai'
  text: string
}
interface InquirySession {
  id: number
  country: string
  customer: string
  appId: SocialAppId
  productZh: string
  type: 'inquiry' | 'order'
  amount: number
  messages: ChatMessage[]
  aiReplying: boolean
}

const enabled = ref(localStorage.getItem(STORAGE_KEY) !== '0')
const active = ref<InquirySession | null>(null)
let timer: number | undefined
let seq = 1

// ===== 智能体工作台 =====
const panelOpen = ref(false)
const question = ref('')

// 「素衡素衡」语音唤醒开关（已从导航栏迁入工作台）
const { supported: wakeSupported, enabled: wakeEnabled, toggle: toggleWake } = useWakeWord()

function togglePanel() {
  panelOpen.value = !panelOpen.value
}

/** 智能体输入框提问：跳转对话页并自动发送 */
function askAgent() {
  const q = question.value.trim()
  if (!q) return
  question.value = ''
  panelOpen.value = false
  router.push({ path: '/chat', query: { q } }).catch(() => {})
}

function persistEnabled() {
  localStorage.setItem(STORAGE_KEY, enabled.value ? '1' : '0')
}

function toggleEnabled() {
  enabled.value = !enabled.value
  persistEnabled()
  if (!enabled.value) {
    active.value = null
    window.clearTimeout(timer)
  } else {
    scheduleNext(8000)
  }
}

const COUNTRIES = ['VN', 'TH', 'ID', 'MY', 'SA', 'AE', 'EG', 'TR', 'US', 'GB', 'FR', 'JP', 'BR', 'MX', 'RU', 'DE']

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

/** 生成一次咨询会话：国家 → 该国主流社交软件 → 客户/商品/类型 */
function createSession(): InquirySession {
  const country = pick(COUNTRIES)
  const info = countryInfo(country)
  const appId = pick((info?.apps || ['whatsapp']) as SocialAppId[])
  const buyerNames = COUNTRY_BUYER_NAMES[country] || ['Customer']
  const product = pick(mockProducts)
  const type: 'inquiry' | 'order' = Math.random() > 0.45 ? 'inquiry' : 'order'
  const countryName = info ? tText(info.name) : country
  const productName = tText(product.name)
  const question =
    type === 'inquiry'
      ? t('inquiry.msgAsk', { product: productName })
      : t('inquiry.msgOrder', { product: productName, amount: product.price })
  return {
    id: seq++,
    country,
    customer: pick(buyerNames),
    appId,
    productZh: productName,
    type,
    amount: product.price,
    messages: [{ from: 'customer', text: question }],
    aiReplying: false,
  }
}

/** 语音播报：您有来自XX国家，客户XX，采购XX商品的询价/下单付款 */
function announce(s: InquirySession) {
  const info = countryInfo(s.country)
  const countryName = info ? tText(info.name) : s.country
  const action = s.type === 'inquiry' ? t('inquiry.actionInquiry') : t('inquiry.actionOrder')
  const template: Record<string, string> = {
    zh: `您有来自${countryName}国家，客户${s.customer}，采购${s.productZh}商品的${action}`,
    en: `You have ${action} from ${countryName}. Customer ${s.customer}, product ${s.productZh}`,
    ja: `${countryName}から${s.customer}様、${s.productZh}の${action}が届きました`,
    ko: `${countryName}에서 ${s.customer} 고객, ${s.productZh} ${action}이 도착했습니다`,
    es: `Tiene ${action} de ${countryName}. Cliente ${s.customer}, producto ${s.productZh}`,
    fr: `Vous avez ${action} de ${countryName}. Client ${s.customer}, produit ${s.productZh}`,
  }
  const loc = getLocale()
  const speakKey = loc === 'zh-TW' ? 'zh' : loc
  speak(template[speakKey] || template.en, { rate: 1 })
}

/** AI 大数据自动回复 */
function aiAutoReply(s: InquirySession) {
  s.aiReplying = true
  window.setTimeout(() => {
    s.messages.push({ from: 'ai', text: t('inquiry.msgAi1', { product: s.productZh }) })
    window.setTimeout(() => {
      s.messages.push({
        from: 'ai',
        text: s.type === 'inquiry' ? t('inquiry.msgAi2Quote', { amount: s.amount }) : t('inquiry.msgAi2Pay', { amount: s.amount }),
      })
      s.aiReplying = false
    }, 2200)
  }, 1800)
}

function incoming() {
  if (!enabled.value) return
  const s = createSession()
  active.value = s
  panelOpen.value = true // 新询盘到达，自动展开工作台
  announce(s)
  aiAutoReply(s)
  scheduleNext(60000 + Math.random() * 60000)
}

function scheduleNext(delay: number) {
  window.clearTimeout(timer)
  timer = window.setTimeout(incoming, delay)
}

function closePanel() {
  panelOpen.value = false
}

const activeApp = computed(() => (active.value ? SOCIAL_APP_MAP[active.value.appId] : null))
const activeCountry = computed(() => (active.value ? countryInfo(active.value.country) : null))

onMounted(() => {
  if (enabled.value) scheduleNext(15000)
})
onUnmounted(() => window.clearTimeout(timer))
</script>

<template>
  <!-- 智能体工作台浮球（右下角标准位置） -->
  <button
    :class="['agent-fab', { off: !enabled }]"
    :title="t('inquiry.dockTitle')"
    @click="togglePanel"
  >
    <span class="fab-icon">🤖</span>
    <span v-if="enabled" class="fab-pulse"></span>
    <span v-if="panelOpen" class="fab-close-hint">✕</span>
  </button>

  <!-- 智能体工作台面板 -->
  <transition name="inq-pop">
    <div v-if="panelOpen" class="agent-dock">
      <div class="dock-header">
        <div class="dock-title">
          <strong>🤖 {{ t('inquiry.dockTitle') }}</strong>
          <span>{{ t('inquiry.dockSub') }}</span>
        </div>
        <button class="chat-close" @click="closePanel">✕</button>
      </div>

      <!-- 智能体输入框：唤醒开关内嵌输入框左侧，回车直达对话页 -->
      <div class="dock-ask">
        <div :class="['ask-box', { listening: wakeEnabled }]">
          <button
            v-if="wakeSupported"
            :class="['wake-mic', { on: wakeEnabled }]"
            :title="wakeEnabled ? t('wake.onTitle') : t('wake.offTitle')"
            @click="toggleWake()"
          >
            <el-icon :size="16"><Microphone v-if="wakeEnabled" /><Mute v-else /></el-icon>
            <span v-if="wakeEnabled" class="mic-dot"></span>
          </button>
          <input
            v-model="question"
            class="ask-input"
            type="text"
            :placeholder="t('inquiry.inputPlaceholder')"
            @keyup.enter="askAgent"
          />
        </div>
        <button class="ask-btn" :disabled="!question.trim()" @click="askAgent">
          <el-icon :size="16"><Promotion /></el-icon>
        </button>
      </div>
      <!-- 语音唤醒监听提示 -->
      <div v-if="wakeSupported && wakeEnabled" class="wake-hint">
        <span class="hint-dot"></span>{{ t('wake.listeningHint') }}
      </div>

      <!-- 工具行：总唤醒铃铛 / 询盘监听 -->
      <div class="dock-tools">
        <button
          class="tool-btn bell"
          :title="t('wake.manualTitle')"
          @click="dispatchFullWake()"
        >
          <el-icon :size="18"><Bell /></el-icon>
        </button>
        <button
          :class="['tool-btn', { on: enabled }]"
          :title="enabled ? t('inquiry.listeningOn') : t('inquiry.listeningOff')"
          @click="toggleEnabled"
        >
          <el-icon :size="18"><ChatDotRound /></el-icon>
        </button>
      </div>

      <!-- 询盘会话区 -->
      <template v-if="active && activeApp && activeCountry">
        <div class="session-header" :style="{ '--app-c': activeApp.color }">
          <span class="chat-app-dot"></span>
          <div class="chat-title">
            <strong>{{ tText(activeApp.name) }} · {{ activeCountry.flag }} {{ tText(activeCountry.name) }}</strong>
            <span>{{ active.customer }} · {{ active.type === 'inquiry' ? t('inquiry.actionInquiry') : t('inquiry.actionOrder') }}</span>
          </div>
        </div>
        <div class="chat-body">
          <div
            v-for="(m, i) in active.messages"
            :key="i"
            :class="['msg', m.from === 'customer' ? 'from-customer' : 'from-ai']"
          >
            <span class="msg-sender">{{ m.from === 'customer' ? active.customer : t('inquiry.aiAgent') }}</span>
            <div class="msg-bubble">{{ m.text }}</div>
          </div>
          <div v-if="active.aiReplying" class="typing">{{ t('inquiry.aiTyping') }}</div>
        </div>
        <div class="chat-footer">
          <span class="ai-badge">🤖 {{ t('inquiry.aiAutoReply') }}</span>
        </div>
      </template>
      <div v-else class="dock-empty">{{ t('inquiry.noInquiry') }}</div>
    </div>
  </transition>
</template>

<style scoped>
.agent-fab {
  position: fixed;
  right: 24px;
  bottom: 24px;
  width: 54px;
  height: 54px;
  border-radius: 50%;
  border: none;
  background: var(--color-primary);
  color: #fff;
  font-size: 24px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 6px 20px rgba(26, 107, 92, 0.35);
  z-index: 300;
  transition: background 0.2s, transform 0.2s;
}
.agent-fab.off {
  background: var(--color-text-secondary);
}
.agent-fab:hover { transform: translateY(-2px); }
.fab-pulse {
  position: absolute;
  inset: -4px;
  border-radius: 50%;
  border: 2px solid var(--color-success);
  animation: fab-ring 1.8s ease-out infinite;
}
.fab-close-hint {
  position: absolute;
  top: -4px;
  right: -4px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.45);
  color: #fff;
  font-size: 11px;
  line-height: 18px;
  text-align: center;
}
@keyframes fab-ring {
  0% { transform: scale(0.9); opacity: 1; }
  100% { transform: scale(1.35); opacity: 0; }
}

/* 智能体工作台面板：浮球正上方 */
.agent-dock {
  position: fixed;
  right: 24px;
  bottom: 90px;
  width: 340px;
  max-height: calc(100vh - 140px);
  overflow-y: auto;
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: 14px;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.18);
  z-index: 301;
  display: flex;
  flex-direction: column;
}
.dock-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  background: linear-gradient(135deg, rgba(26, 107, 92, 0.10), rgba(212, 168, 83, 0.10));
  border-bottom: 1px solid var(--color-border);
}
.dock-title { flex: 1; display: flex; flex-direction: column; gap: 2px; }
.dock-title strong { font-size: 14px; }
.dock-title span { font-size: 12px; color: var(--color-text-secondary); }
.chat-close {
  border: none; background: none; cursor: pointer;
  color: var(--color-text-secondary); font-size: 14px; padding: 4px;
}

/* 智能体输入框（唤醒麦克风内嵌） */
.dock-ask {
  display: flex;
  gap: 8px;
  padding: 12px 14px 8px;
}
.ask-box {
  flex: 1;
  position: relative;
  display: flex;
  align-items: center;
  border: 1px solid var(--color-border);
  border-radius: 10px;
  background: var(--color-bg-soft);
  transition: border-color 0.2s, box-shadow 0.2s;
}
.ask-box:focus-within { border-color: var(--color-primary); }
.ask-box.listening {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(26, 107, 92, 0.10);
}
.wake-mic {
  position: relative;
  width: 32px;
  height: 32px;
  margin: 2px 0 2px 4px;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: var(--color-text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.2s;
}
.wake-mic:hover { color: var(--color-primary); background: rgba(26, 107, 92, 0.08); }
.wake-mic.on {
  color: #fff;
  background: var(--color-primary);
}
.mic-dot {
  position: absolute;
  top: -2px;
  right: -2px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--color-success);
  animation: mic-pulse 1.4s ease-in-out infinite;
}
@keyframes mic-pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.4; transform: scale(0.7); }
}
.ask-input {
  flex: 1;
  height: 36px;
  padding: 0 12px 0 8px;
  border: none;
  background: transparent;
  color: var(--color-text-primary);
  font-size: 13px;
  outline: none;
}
/* 语音唤醒监听提示 */
.wake-hint {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 0 16px 10px;
  font-size: 11px;
  color: var(--color-primary);
}
.hint-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--color-success);
  animation: mic-pulse 1.4s ease-in-out infinite;
  flex-shrink: 0;
}
.ask-btn {
  width: 36px;
  height: 36px;
  align-self: center;
  border: none;
  border-radius: 10px;
  background: var(--color-primary);
  color: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}
.ask-btn:disabled {
  background: var(--color-text-placeholder);
  cursor: not-allowed;
}
.ask-btn:not(:disabled):hover { background: var(--color-primary-light); }

/* 工具行：总唤醒铃铛 / 询盘监听 */
.dock-tools {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 14px 10px;
  border-bottom: 1px solid var(--color-border);
}
.tool-btn {
  position: relative;
  width: 34px;
  height: 34px;
  border: 1px solid var(--color-border);
  border-radius: 10px;
  background: var(--color-bg-card);
  color: var(--color-text-regular);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}
.tool-btn:hover { color: var(--color-primary); border-color: var(--color-primary); }
.tool-btn.on {
  color: var(--color-primary);
  border-color: var(--color-primary);
  background: rgba(26, 107, 92, 0.08);
}
.tool-btn.on::after {
  content: '';
  position: absolute;
  top: 3px;
  right: 3px;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--color-success);
}
.tool-btn.bell { color: var(--color-accent, #d4a853); }
.tool-btn.bell:hover { border-color: var(--color-accent, #d4a853); background: rgba(212, 168, 83, 0.12); }

/* 询盘会话 */
.session-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  background: color-mix(in srgb, var(--app-c) 12%, var(--color-bg-card));
  border-bottom: 1px solid var(--color-border);
}
.chat-app-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--app-c);
  flex-shrink: 0;
}
.chat-title { flex: 1; display: flex; flex-direction: column; gap: 2px; }
.chat-title strong { font-size: 14px; }
.chat-title span { font-size: 12px; color: var(--color-text-secondary); }
.chat-body {
  max-height: 240px;
  overflow-y: auto;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.msg { display: flex; flex-direction: column; gap: 3px; max-width: 85%; }
.msg.from-customer { align-self: flex-start; }
.msg.from-ai { align-self: flex-end; }
.msg-sender { font-size: 11px; color: var(--color-text-secondary); }
.msg-bubble {
  padding: 8px 12px;
  border-radius: 10px;
  font-size: 13px;
  line-height: 1.5;
}
.from-customer .msg-bubble { background: var(--color-bg-soft); }
.from-ai .msg-bubble { background: var(--color-primary); color: #fff; }
.typing { font-size: 12px; color: var(--color-text-secondary); align-self: flex-end; }
.chat-footer {
  padding: 8px 14px;
  border-top: 1px solid var(--color-border);
}
.ai-badge { font-size: 12px; color: var(--color-primary); }
.dock-empty {
  padding: 18px 14px;
  font-size: 12px;
  color: var(--color-text-secondary);
  text-align: center;
  line-height: 1.6;
}

.inq-pop-enter-active, .inq-pop-leave-active { transition: all 0.3s ease; }
.inq-pop-enter-from, .inq-pop-leave-to { opacity: 0; transform: translateY(16px) scale(0.96); }

@media (max-width: 768px) {
  .agent-fab { right: 16px; bottom: 16px; }
  .agent-dock { right: 16px; left: 16px; width: auto; bottom: 82px; }
}
</style>
