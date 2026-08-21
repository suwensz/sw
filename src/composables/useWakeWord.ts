// 「素衡素衡」语音唤醒 —— 基于 Web Speech API 的唤醒词监听 + 语音指令
// 开启后持续后台监听，识别到「素衡素衡」即：
//   1. 优雅女声问候（wake.greeting：主人您好，您的素衡一直陪伴着您…）
//   2. 广播全局唤醒事件 suheng:wake（AgentWakeOverlay 弹层接管全系统展示）
//   3. 进入「指令聆听」模式：捕获随后的语音指令，回调 onCommand 处理
//      （由 VoiceAssistant 全局组件把指令交给 AI 回答并用语音播报）
// 模块级单例：任何组件 useWakeWord() 都共享同一份状态
import { ref, reactive, type Ref } from 'vue'
import { i18n } from '@/i18n'
import { ElMessage } from 'element-plus'
import { speakBroadcast } from '@/composables/useSpeech'

const STORAGE_KEY = 'qh_wake_enabled'
export const WAKE_EVENT = 'suheng:wake'
/** 指令聆听最长等待（毫秒） */
const COMMAND_WINDOW = 15000
/** 指令提交防抖（等待语音停顿，毫秒） */
const COMMAND_DEBOUNCE = 1800

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

/**
 * 同音字容错：浏览器语音识别引擎对「素衡」这类非常规词，
 * 极易输出同音/近音字（肃恒、苏恒、宿恒…）。
 * 用字符类别做拼音级模糊匹配（sù-héng sù-héng）。
 */
const SU = '素肃宿酥苏塑愫速溯'
const HENG = '衡恒横珩姮桁'
const WAKE_FUZZY = new RegExp(`[${SU}].{0,2}[${HENG}].{0,3}[${SU}].{0,2}[${HENG}]`)

/** 归一化文本后匹配唤醒词「素衡素衡」（容错空格、标点与同音字） */
export function matchWakeWord(text: string): boolean {
  const normalized = text.replace(/[\s,，.。!！?？、;；:：'"']/g, '')
  return normalized.includes('素衡素衡') || WAKE_FUZZY.test(normalized)
}

/** 从识别文本中提取指令：去除「素衡素衡」（含同音字变体）及标点填充 */
export function extractCommand(text: string): string {
  // 先去除空白再做唤醒词剔除，兼容识别器输出「素 衡 素 衡」这类带空格的容错文本
  let s = text.replace(/\s+/g, '')
  s = s.replace(new RegExp(WAKE_FUZZY.source, 'g'), '')
  s = s.replace(/素衡素衡/g, '').replace(/素衡/g, '')
  // 清理残留的单个同音字组合（如「肃恒」）
  s = s.replace(new RegExp(`[${SU}][${HENG}]`, 'g'), '')
  s = s.replace(/[,，.。!！?？、;；:：'"'“”‘’·—\-]/g, '')
  return s.trim()
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
// TTS 播报期间暂停识别，避免麦克风把系统自己的播报（问候语/AI 回答）
// 误听为唤醒词或指令（自听回环）
let _paused = false
let _resumeTimer: number | null = null
// 连续错误计数：用于重启退避（识别服务不可达时避免 1 秒疯狂重连）
let _errStreak = 0
let _lastErrNotifyAt = 0

// 指令聆听状态
let _mode: 'idle' | 'command' = 'idle'
let _commandBuf = ''
let _commandHandler: ((cmd: string) => void) | null = null
let _commandTimer: number | null = null
let _debounceTimer: number | null = null
/** 指令聆听状态（响应式，供 UI 展示「聆听中」指示） */
export const commandState = ref<'idle' | 'listening'>('idle')

/** 唤醒诊断信息（响应式，供诊断面板实时展示） */
export const wakeDebug = reactive({
  /** 识别引擎是否可用（webkitSpeechRecognition） */
  engineOk: false,
  /** 是否正在监听 */
  listening: false,
  /** 是否处于 TTS 播报暂停期 */
  paused: false,
  /** 最近一次识别到的原始文本 */
  lastTranscript: '',
  /** 最近一次识别到唤醒词的时间戳（0 = 本次会话尚未唤醒过） */
  lastWakeAt: 0,
  /** 最近一次错误代码（network / not-allowed / audio-capture…） */
  lastError: '',
  /** 连续错误次数 */
  errCount: 0,
})

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
  if (!_enabled?.value || !_supported || _paused) return
  try {
    _recog?.start()
    if (_listening) _listening.value = true
    wakeDebug.listening = true
  } catch {
    // already started - ignore
  }
}

/**
 * 暂停识别（TTS 播报期间防自听回环）。
 * onEnd 兜底：语音合成偶发不触发 onend 时，按文本时长上限自动恢复。
 */
export function pauseRecognition(maxMs = 12000): void {
  _paused = true
  wakeDebug.paused = true
  if (_resumeTimer) window.clearTimeout(_resumeTimer)
  _resumeTimer = window.setTimeout(resumeRecognition, maxMs)
  try {
    _recog?.stop()
  } catch {
    // ignore
  }
  if (_listening) _listening.value = false
  wakeDebug.listening = false
}

/** 恢复识别（幂等） */
export function resumeRecognition(): void {
  wakeDebug.paused = false
  if (!_paused) return
  _paused = false
  if (_resumeTimer) {
    window.clearTimeout(_resumeTimer)
    _resumeTimer = null
  }
  if (_enabled?.value) safeStart()
}

function clearCommandTimers() {
  if (_commandTimer) {
    window.clearTimeout(_commandTimer)
    _commandTimer = null
  }
  if (_debounceTimer) {
    window.clearTimeout(_debounceTimer)
    _debounceTimer = null
  }
}

function exitCommand() {
  clearCommandTimers()
  _mode = 'idle'
  _commandBuf = ''
  commandState.value = 'idle'
}

/** 指令提交：交给注册的处理器（VoiceAssistant） */
function submitCommand() {
  clearCommandTimers()
  _mode = 'idle'
  commandState.value = 'idle'
  const handler = _commandHandler
  const cmd = _commandBuf
  _commandBuf = ''
  if (handler && cmd) handler(cmd)
}

function triggerWake() {
  const now = Date.now()
  if (now - _lastWakeAt < 6000) return // 6 秒冷却，避免连续触发
  _lastWakeAt = now
  wakeDebug.lastWakeAt = now
  // 暂停识别，避免麦克风把问候语自己听成指令（自听回环）
  pauseRecognition(Math.max(8000, tr('wake.greeting').length * 400))
  // 优雅女声应答：主人您好，您的素衡一直陪伴着您，有什么需要？请告诉我
  speakBroadcast(tr('wake.greeting'), { onEnd: resumeRecognition })
  // 广播全局唤醒事件：AgentWakeOverlay 弹层接管全系统唤醒展示
  window.dispatchEvent(new CustomEvent(WAKE_EVENT))
  // 进入指令聆听模式（若有处理器）
  if (_commandHandler) {
    _mode = 'command'
    _commandBuf = ''
    commandState.value = 'listening'
    clearCommandTimers()
    _commandTimer = window.setTimeout(exitCommand, COMMAND_WINDOW)
  }
}

/** 指令内容更新：防抖提交 */
function onCommandCandidate(cmd: string, isFinal: boolean) {
  if (!cmd) return
  _commandBuf = cmd
  if (isFinal) {
    submitCommand()
    return
  }
  if (_debounceTimer) window.clearTimeout(_debounceTimer)
  _debounceTimer = window.setTimeout(submitCommand, COMMAND_DEBOUNCE)
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
    _errStreak = 0 // 收到识别结果说明链路健康
    wakeDebug.errCount = 0
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const seg = e.results[i]
      const text: string = seg?.[0]?.transcript || ''
      if (text) wakeDebug.lastTranscript = text
      if (_mode === 'idle') {
        if (matchWakeWord(text)) triggerWake()
      } else {
        // 指令聆听：提取去唤醒词后的文本
        const cmd = extractCommand(text)
        if (cmd && cmd.length >= 1) onCommandCandidate(cmd, !!seg?.isFinal)
      }
    }
  }
  r.onerror = (e: any) => {
    const err = e?.error
    wakeDebug.lastError = String(err || 'unknown')
    wakeDebug.errCount = ++_errStreak
    if (err === 'not-allowed' || err === 'service-not-allowed') {
      if (_enabled) _enabled.value = false
      localStorage.setItem(STORAGE_KEY, '0')
      ElMessage.error(tr('wake.micDenied'))
      return
    }
    // network / audio-capture 等环境错误：给出明确反馈（60 秒内只提示一次，避免刷屏）
    _errStreak++
    const now = Date.now()
    if (now - _lastErrNotifyAt > 60000) {
      _lastErrNotifyAt = now
      if (err === 'network') {
        ElMessage.warning(tr('wake.networkError'))
      } else if (err === 'audio-capture') {
        ElMessage.warning(tr('wake.audioError'))
      }
    }
  }
  r.onend = () => {
    if (_listening) _listening.value = false
    wakeDebug.listening = false
    // 暂停期间（TTS 播报中）不重启，由 resumeRecognition 恢复
    if (_paused) return
    // 仍处于开启状态则自动恢复监听；连续失败时退避（1s → 5s）
    if (_enabled?.value) {
      if (_restartTimer) window.clearTimeout(_restartTimer)
      const delay = _errStreak >= 5 ? 5000 : 1000
      _restartTimer = window.setTimeout(safeStart, delay)
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
  exitCommand()
  try {
    _recog?.stop()
  } catch {
    // ignore
  }
  if (_listening) _listening.value = false
  wakeDebug.listening = false
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

/**
 * 注册语音指令处理器：
 * 唤醒后用户接着说的话（去除唤醒词）会作为指令回调。
 * 传 null 则关闭指令聆听（保持仅唤醒展示）。
 */
export function setCommandHandler(handler: ((cmd: string) => void) | null) {
  _commandHandler = handler
  if (!handler) exitCommand()
}

/** 当前是否正处于「指令聆听」状态（供 UI 展示聆听指示） */
export function isListeningCommand(): boolean {
  return _mode === 'command'
}

export function useWakeWord() {
  // 首次调用时初始化模块级单例
  if (_enabled === null) {
    _supported = !!getSpeechRecognition()
    wakeDebug.engineOk = !!_supported
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
