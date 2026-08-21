// 「素衡素衡」语音唤醒 —— 基于 Web Speech API 的唤醒词监听
// 开启后持续后台监听，识别到「素衡素衡」即广播全局唤醒事件
// （由 AgentWakeOverlay 弹层接管展示：全系统智能体逐个点亮）
// 模块级单例：ChatPage / InquiryAssistant / 任何组件 useWakeWord() 都共享同一份状态
import { ref, type Ref } from 'vue'
import { i18n } from '@/i18n'
import { ElMessage } from 'element-plus'
import { speakBroadcast } from '@/composables/useSpeech'

const STORAGE_KEY = 'qh_wake_enabled'
export const WAKE_EVENT = 'suheng:wake'

type AnySpeechRecognition = {
  continuous: boolean
  interimResults: boolean
  lang: string
  start: () => void
  stop: () => void
  onresult: ((e: any) => void) | null
  onerror: ((e: any) => void) | null
  onend: (() => void) | null
}

function getSpeechRecognition(): (new () => AnySpeechRecognition) | null {
  const w = window as any
  return w.SpeechRecognition || w.webkitSpeechRecognition || null
}

/** 归一化文本后匹配唤醒词「素衡素衡」（容错空格与标点） */
export function matchWakeWord(text: string): boolean {
  const normalized = text.replace(/[\s,，.。!！?？、;；:：'"']/g, '')
  return normalized.includes('素衡素衡') || /素.{0,2}衡.{0,3}素.{0,2}衡/.test(normalized)
}

/** 手动触发全系统唤醒（导航栏按钮等场景），受冷却限制 */
export function dispatchFullWake() {
  window.dispatchEvent(new CustomEvent(WAKE_EVENT))
}

// ===== 模块级单例：让所有 useWakeWord() 调用共享同一实例 =====
let _supported: boolean | null = null
let _enabled: Ref<boolean> | null = null
let _listening: Ref<boolean> | null = null
let _recog: AnySpeechRecognition | null = null
let _lastWakeAt = 0
let _restartTimer: number | null = null
let _autoStartDone = false

/** 取翻译（从 i18n 实例的全局 t，避免 useI18n() 必须 setup 调用） */
function tr(key: string): string {
  try {
    const t = (i18n.global as any).t as (k: string) => string
    return t(key) || key
  } catch {
    return key
  }
}

function safeStart() {
  if (!_enabled?.value || !_supported) return
  try {
    _recog?.start()
    if (_listening) _listening.value = true
  } catch {
    // already started - ignore
  }
}

function triggerWake() {
  const now = Date.now()
  if (now - _lastWakeAt < 6000) return // 6 秒冷却，避免连续触发
  _lastWakeAt = now
  // 优雅女声应答：主人，我在（受语音播报开关控制）
  speakBroadcast(tr('wake.reply'))
  // 广播全局唤醒事件：AgentWakeOverlay 弹层接管全系统唤醒展示
  window.dispatchEvent(new CustomEvent(WAKE_EVENT))
}

function ensureRecognition() {
  if (_recog) return _recog
  const SR = getSpeechRecognition()
  if (!SR) return null
  const r = new SR()
  r.continuous = true
  r.interimResults = true
  r.lang = 'zh-CN'
  r.onresult = (e: any) => {
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const text: string = e.results[i]?.[0]?.transcript || ''
      if (matchWakeWord(text)) triggerWake()
    }
  }
  r.onerror = (e: any) => {
    if (e?.error === 'not-allowed' || e?.error === 'service-not-allowed') {
      if (_enabled) _enabled.value = false
      localStorage.setItem(STORAGE_KEY, '0')
      ElMessage.error(tr('wake.micDenied'))
    }
  }
  r.onend = () => {
    if (_listening) _listening.value = false
    // 仍处于开启状态则自动恢复监听
    if (_enabled?.value) {
      if (_restartTimer) window.clearTimeout(_restartTimer)
      _restartTimer = window.setTimeout(safeStart, 1000)
    }
  }
  _recog = r
  return r
}

function start() {
  if (!_supported) {
    if (_enabled) _enabled.value = false
    ElMessage.warning(tr('wake.unsupported'))
    return
  }
  ensureRecognition()
  safeStart()
}

function stop() {
  if (_restartTimer) {
    window.clearTimeout(_restartTimer)
    _restartTimer = null
  }
  try {
    _recog?.stop()
  } catch {
    // ignore
  }
  if (_listening) _listening.value = false
}

function toggle() {
  if (!_enabled) return
  _enabled.value = !_enabled.value
  localStorage.setItem(STORAGE_KEY, _enabled.value ? '1' : '0')
  if (_enabled.value) {
    start()
    ElMessage.success(tr('wake.enabled'))
  } else {
    stop()
    ElMessage.info(tr('wake.disabled'))
  }
}

export function useWakeWord() {
  // 首次调用时初始化模块级单例
  if (_enabled === null) {
    _supported = !!getSpeechRecognition()
    // 整个系统默认采用「素衡素衡」语音唤醒（用户显式关闭后记忆关闭状态）
    _enabled = ref(localStorage.getItem(STORAGE_KEY) !== '0')
    _listening = ref(false)

    // 应用启动时恢复上次的开启状态：延迟到首帧后启动，避免阻塞首屏
    if (_enabled.value && _supported && !_autoStartDone) {
      _autoStartDone = true
      window.setTimeout(() => start(), 1500)
    }
  }
  return {
    supported: _supported as boolean,
    enabled: _enabled,
    listening: _listening,
    toggle,
  }
}
