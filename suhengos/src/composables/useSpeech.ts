// 语音播报工具：基于 Web Speech API
// 支持多语言发音，用于健康预警播报
import { ref } from 'vue'
import { getLocale } from '@/i18n'
import type { LocaleText } from '@/types'

export const isSpeaking = ref(false)
let currentUtterance: SpeechSynthesisUtterance | null = null

const langMap: Record<string, string> = {
  zh: 'zh-CN',
  en: 'en-US',
  ja: 'ja-JP',
  ko: 'ko-KR',
  es: 'es-ES',
  fr: 'fr-FR',
}

export function speak(text: string, opts?: { rate?: number; pitch?: number; onEnd?: () => void }): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    opts?.onEnd?.()
    return
  }
  window.speechSynthesis.cancel()
  const utter = new SpeechSynthesisUtterance(text)
  utter.lang = langMap[getLocale()] || 'en-US'
  utter.rate = opts?.rate ?? 1
  utter.pitch = opts?.pitch ?? 1
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
  speak(text[locale] || text.en, opts)
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
