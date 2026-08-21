// 语音播报工具：基于 Web Speech API
// 支持多语言发音，用于健康预警播报 / 订单播报 / 智能体唤醒应答
// 声音策略：优先挑选各语言的「优雅女声」，语调轻缓（rate 0.95 / pitch 1.06）
import { ref } from 'vue'
import { getLocale } from '@/i18n'
import type { LocaleText } from '@/types'

export const isSpeaking = ref(false)
let currentUtterance: SpeechSynthesisUtterance | null = null

/* ---------------- 全局语音播报开关（接单智能体面板按键控制） ---------------- */
const BROADCAST_KEY = 'qh_voice_broadcast'
/** 语音播报总开关：控制订单播报 / 智能体激活播报等长文本播报（提示音独立于此开关） */
export const broadcastEnabled = ref(
  typeof localStorage !== 'undefined' && localStorage.getItem(BROADCAST_KEY) !== 'off',
)

export function setBroadcastEnabled(on: boolean) {
  broadcastEnabled.value = on
  try {
    localStorage.setItem(BROADCAST_KEY, on ? 'on' : 'off')
  } catch {
    /* ignore */
  }
  if (!on) stopSpeak()
}

/** 长文本播报入口：仅在开关开启时播报（onEnd 在播报结束后触发，用于循环提醒计时） */
export function speakBroadcast(
  text: string,
  opts?: { rate?: number; pitch?: number; onEnd?: () => void },
): void {
  if (!broadcastEnabled.value) {
    opts?.onEnd?.()
    return
  }
  speak(text, opts)
}

const langMap: Record<string, string> = {
  zh: 'zh-CN',
  en: 'en-US',
  ja: 'ja-JP',
  ko: 'ko-KR',
  es: 'es-ES',
  fr: 'fr-FR',
  ar: 'ar-SA',
  vi: 'vi-VN',
  th: 'th-TH',
  id: 'id-ID',
  ms: 'ms-MY',
  fil: 'fil-PH',
}

/* ---------------- 女声挑选 ---------------- */
/** 常见女声关键词（各平台 voice 名称） */
const FEMALE_HINTS = [
  'Xiaoxiao', 'Xiaoyi', 'Yunxi', 'Yunyang', 'Tingting', 'Ting-Ting', 'Huihui', 'Yaoyao', 'Mei-Jia', 'Sinji',
  'Samantha', 'Zira', 'Aria', 'Jenny', 'Michelle', 'Ana', 'Ava', 'Susan', 'Serena', 'Allison', 'Joanna',
  'Google 汉语', 'Google 粤语', 'Google US English', 'Google UK English Female', 'Google 以后', 'Google 日本語',
  'Sumire', 'Kyoko', 'O-Ren', 'Yuna', 'Sara', 'Carmit', 'Damayanti', 'Amelie', 'Anna', 'Alice', 'Monica',
  'female', 'femme', 'weiblich', '여성', '女性', '婉儿', '晓晓', '湘琴',
]

let cachedVoices: SpeechSynthesisVoice[] = []

function loadVoices(): SpeechSynthesisVoice[] {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return []
  if (cachedVoices.length) return cachedVoices
  cachedVoices = window.speechSynthesis.getVoices()
  return cachedVoices
}

if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  // Chrome 的 getVoices 首次调用为空，需监听 voiceschanged
  window.speechSynthesis.addEventListener?.('voiceschanged', () => {
    cachedVoices = window.speechSynthesis.getVoices()
  })
}

/** 挑选优雅女声：语言匹配优先，其次女声关键词，找不到时回退该语言任意声音 */
function pickFemaleVoice(langBcp: string): SpeechSynthesisVoice | null {
  const voices = loadVoices()
  if (!voices.length) return null
  const prefix = langBcp.split('-')[0]
  const langMatch = voices.filter((v) => v.lang?.replace('_', '-') === langBcp)
  const prefixMatch = voices.filter((v) => v.lang?.startsWith(prefix))
  const pool = langMatch.length ? langMatch : prefixMatch
  if (!pool.length) return null
  for (const hint of FEMALE_HINTS) {
    const hit = pool.find((v) => v.name?.toLowerCase().includes(hint.toLowerCase()))
    if (hit) return hit
  }
  return pool[0]
}

export function speak(text: string, opts?: { rate?: number; pitch?: number; onEnd?: () => void }): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    opts?.onEnd?.()
    return
  }
  window.speechSynthesis.cancel()
  const bcp = langMap[getLocale()] || 'en-US'
  const utter = new SpeechSynthesisUtterance(text)
  utter.lang = bcp
  // 优雅女声：轻缓语速 + 稍高音调
  utter.rate = opts?.rate ?? 0.95
  utter.pitch = opts?.pitch ?? 1.06
  const voice = pickFemaleVoice(bcp)
  if (voice) utter.voice = voice
  utter.onend = () => {
    isSpeaking.value = false
    currentUtterance = null
    opts?.onEnd?.()
  }
  utter.onerror = () => {
    isSpeaking.value = false
    currentUtterance = null
  }
  currentUtterance = utter
  isSpeaking.value = true
  window.speechSynthesis.speak(utter)
}

export function speakLocaleText(text: LocaleText, opts?: { rate?: number }): void {
  const locale = getLocale()
  speak((text as unknown as Record<string, string>)[locale] || text.en, opts)
}

export function stopSpeak(): void {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel()
  }
  isSpeaking.value = false
  currentUtterance = null
}

export function speakAlertsSequence(
  alerts: Array<{ voiceText?: LocaleText; title: LocaleText; severity: string }>,
  onComplete?: () => void,
): void {
  const criticalFirst = [...alerts].sort((a, b) => {
    const order = { critical: 0, warning: 1, info: 2, success: 3 }
    return (order[a.severity as keyof typeof order] ?? 9) - (order[b.severity as keyof typeof order] ?? 9)
  })
  const locale = getLocale()
  let idx = 0

  const next = () => {
    if (idx >= criticalFirst.length) {
      onComplete?.()
      return
    }
    const a = criticalFirst[idx++]
    const text = a.voiceText?.[locale] || a.voiceText?.en || a.title[locale] || a.title.en
    speak(text, { rate: 0.95, onEnd: next })
  }
  next()
}
