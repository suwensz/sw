<script setup lang="ts">
// 素衡OS · 全局语音助手 + 唤醒诊断面板
// 全系统（主站 + 运营端/开发端/管理端）挂载。
// 流程：说「素衡素衡」→ 女声问候「主人您好，您的素衡一直陪伴着您…」
//      → 聆听后续语音指令 → AI 依据本系统数据库回答 → 语音播报回答。
// 唤醒与问候由 useWakeWord 处理；本组件负责指令收集 + AI 回答 + 播报。
// 右下角常驻麦克风状态球：实时展示监听状态，点开查看诊断面板
// （引擎支持/麦克风权限/实时识别文本/最近错误/手动唤醒/文本测试匹配）。
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  useWakeWord,
  setCommandHandler,
  commandState,
  wakeDebug,
  pauseRecognition,
  resumeRecognition,
  matchWakeWord,
  dispatchFullWake,
} from '@/composables/useWakeWord'
import { askAI } from '@/services/llm'
import { speakBroadcast } from '@/composables/useSpeech'

const { t } = useI18n()
const { enabled, supported, toggle } = useWakeWord()

/** UI 阶段：idle = 待唤醒，listening = 聆听指令，thinking = AI 回答中 */
const phase = ref<'idle' | 'listening' | 'thinking'>('idle')
const busy = ref(false)

/* ---------------- 诊断面板 ---------------- */
const panelVisible = ref(false)
/** 麦克风权限状态（通过 Permissions API 查询） */
const micPerm = ref<'unknown' | 'granted' | 'denied' | 'prompt'>('unknown')
/** 文本测试 */
const testText = ref('')
const testResult = ref<boolean | null>(null)

async function refreshMicPerm() {
  try {
    const perm = await (navigator as any).permissions?.query?.({ name: 'microphone' })
    if (perm?.state) micPerm.value = perm.state
  } catch {
    micPerm.value = 'unknown'
  }
}

watch(panelVisible, (v) => {
  if (v) {
    refreshMicPerm()
    testResult.value = null
  }
})

function runTest() {
  testResult.value = testText.value.trim() ? matchWakeWord(testText.value) : null
}

/** 状态球展示状态 */
const chipState = computed<'listening' | 'paused' | 'off' | 'error' | 'noEngine'>(() => {
  if (!supported) return 'noEngine'
  if (!enabled.value) return 'off'
  if (wakeDebug.paused) return 'paused'
  if (wakeDebug.lastError && wakeDebug.errCount >= 3 && !wakeDebug.listening) return 'error'
  return 'listening'
})

const chipTitle = computed(() => {
  const map = {
    listening: `${t('wakeDebug.statusListening')} · ${t('wakeDebug.chipTitle')}`,
    paused: `${t('wakeDebug.statusPaused')} · ${t('wakeDebug.chipTitle')}`,
    off: `${t('wakeDebug.statusOff')} · ${t('wakeDebug.chipTitle')}`,
    error: `${t('wakeDebug.statusError')} · ${t('wakeDebug.chipTitle')}`,
    noEngine: `${t('wakeDebug.statusNoEngine')} · ${t('wakeDebug.chipTitle')}`,
  } as const
  return map[chipState.value]
})

watch(commandState, (v) => {
  if (v === 'listening') phase.value = 'listening'
  else if (phase.value === 'listening') phase.value = 'idle'
})

async function handleCommand(cmd: string) {
  if (busy.value) return
  busy.value = true
  phase.value = 'thinking'
  try {
    // AI 智能根据本系统内容回答：综合中医数据库、五运六气、中医健康、
    // 国内电商、跨境电商数据库（services/llm 云端优先，知识库兜底）
    const res = await askAI('general', cmd)
    // 播报回答期间暂停识别，避免麦克风把 AI 自己的声音听成新指令/唤醒词
    pauseRecognition(Math.max(8000, res.answer.length * 400))
    speakBroadcast(res.answer, { rate: 0.95, onEnd: resumeRecognition })
  } catch {
    /* ignore */
  } finally {
    busy.value = false
    if (commandState.value !== 'listening') phase.value = 'idle'
  }
}

onMounted(() => {
  // 注册语音指令处理器：唤醒后说的话将进入 AI 回答
  setCommandHandler(handleCommand)
})
onUnmounted(() => {
  setCommandHandler(null)
})
</script>

<template>
  <!-- 指令聆听/思考指示浮层（右下角，简洁不遮挡） -->
  <Teleport to="body">
    <Transition name="va-fade">
      <div v-if="enabled && (phase === 'listening' || phase === 'thinking')" class="va-indicator" :class="phase">
        <span class="va-ico">
          <el-icon v-if="phase === 'listening'" :size="20" color="#faf8f3"><Microphone /></el-icon>
          <el-icon v-else :size="20" color="#faf8f3"><MagicStick /></el-icon>
        </span>
        <span class="va-text">
          {{ phase === 'listening' ? t('wake.listening') : t('wake.thinking') }}
        </span>
      </div>
    </Transition>

    <!-- 常驻语音状态球 + 诊断面板 -->
    <el-popover v-model:visible="panelVisible" placement="top-end" :width="340" trigger="click">
      <template #reference>
        <div class="va-chip" :class="chipState" :title="chipTitle" data-testid="wake-chip">
          <el-icon :size="18"><Microphone /></el-icon>
        </div>
      </template>

      <div class="va-panel">
        <div class="va-panel-title">{{ t('wakeDebug.title') }}</div>

        <div class="va-row">
          <span class="va-k">{{ t('wakeDebug.engine') }}</span>
          <span :class="supported ? 'ok' : 'bad'">
            {{ supported ? t('wakeDebug.engineOk') : t('wakeDebug.engineNo') }}
          </span>
        </div>
        <div class="va-row">
          <span class="va-k">{{ t('wakeDebug.listening') }}</span>
          <span :class="enabled ? 'ok' : 'bad'">
            {{ !enabled ? t('wakeDebug.statusOff')
              : wakeDebug.paused ? t('wakeDebug.paused')
              : wakeDebug.listening ? t('wakeDebug.listeningOn') : t('wakeDebug.listeningOff') }}
          </span>
        </div>
        <div class="va-row">
          <span class="va-k">{{ t('wakeDebug.micPermission') }}</span>
          <span :class="micPerm === 'granted' ? 'ok' : micPerm === 'denied' ? 'bad' : ''">
            {{ micPerm === 'granted' ? t('wakeDebug.permGranted')
              : micPerm === 'denied' ? t('wakeDebug.permDenied')
              : micPerm === 'prompt' ? t('wakeDebug.permPrompt')
              : t('wakeDebug.permUnknown') }}
          </span>
        </div>
        <div class="va-row">
          <span class="va-k">{{ t('wakeDebug.wakeCount') }}</span>
          <span>{{ wakeDebug.lastWakeAt ? new Date(wakeDebug.lastWakeAt).toLocaleTimeString() : '0' }}</span>
        </div>

        <div class="va-block">
          <div class="va-k">{{ t('wakeDebug.lastTranscript') }}</div>
          <div class="va-transcript">
            {{ wakeDebug.lastTranscript || t('wakeDebug.transcriptNone') }}
          </div>
        </div>

        <div class="va-block">
          <div class="va-k">{{ t('wakeDebug.lastError') }}</div>
          <div class="va-transcript" :class="{ bad: !!wakeDebug.lastError }">
            {{ wakeDebug.lastError ? `${wakeDebug.lastError} ×${wakeDebug.errCount}` : t('wakeDebug.errorNone') }}
          </div>
        </div>

        <div class="va-actions">
          <el-button size="small" :type="enabled ? 'default' : 'primary'" @click="toggle()">
            {{ enabled ? t('wakeDebug.disable') : t('wakeDebug.enable') }}
          </el-button>
          <el-button size="small" type="primary" plain @click="dispatchFullWake()">
            {{ t('wakeDebug.manualWake') }}
          </el-button>
        </div>

        <el-divider style="margin: 10px 0" />
        <div class="va-k" style="margin-bottom: 6px">{{ t('wakeDebug.testLabel') }}</div>
        <div class="va-test">
          <el-input
            v-model="testText"
            size="small"
            :placeholder="t('wakeDebug.testPlaceholder')"
            clearable
            @keyup.enter="runTest"
          />
          <el-button size="small" @click="runTest">{{ t('wakeDebug.testBtn') }}</el-button>
        </div>
        <div v-if="testResult !== null" class="va-test-result" :class="testResult ? 'ok' : 'bad'">
          {{ testResult ? t('wakeDebug.testHit') : t('wakeDebug.testMiss') }}
        </div>
      </div>
    </el-popover>
  </Teleport>
</template>

<style scoped>
.va-indicator {
  position: fixed;
  right: 22px;
  bottom: 168px;
  z-index: 4000;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 16px 10px 12px;
  border-radius: 999px;
  background: linear-gradient(135deg, #1a6b5c, #124d42);
  color: #faf8f3;
  box-shadow: 0 8px 24px rgba(18, 77, 66, 0.35);
  font-size: 13px;
  pointer-events: none;
  user-select: none;
}
.va-ico {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.14);
}
.va-indicator.listening .va-ico {
  animation: va-pulse 1.2s ease-in-out infinite;
}
.va-indicator.thinking .va-ico {
  animation: va-spin 1.4s linear infinite;
}
@keyframes va-pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(212, 168, 83, 0.5); }
  50% { box-shadow: 0 0 0 8px rgba(212, 168, 83, 0); }
}
@keyframes va-spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
.va-text {
  white-space: nowrap;
  letter-spacing: 0.3px;
}

/* ---------------- 常驻状态球 ---------------- */
.va-chip {
  position: fixed;
  right: 22px;
  bottom: 108px;
  z-index: 4001;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  cursor: pointer;
  color: #faf8f3;
  background: linear-gradient(135deg, #1a6b5c, #124d42);
  box-shadow: 0 6px 18px rgba(18, 77, 66, 0.4);
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}
.va-chip:hover {
  transform: scale(1.08);
}
.va-chip.listening {
  animation: va-pulse 2.4s ease-in-out infinite;
}
.va-chip.paused {
  background: linear-gradient(135deg, #b8862f, #8a6420);
}
.va-chip.off {
  background: linear-gradient(135deg, #8a8a8a, #6b6b6b);
  opacity: 0.75;
}
.va-chip.error {
  background: linear-gradient(135deg, #b3541e, #8a3c12);
  animation: va-pulse 1.2s ease-in-out infinite;
}
.va-chip.noEngine {
  background: linear-gradient(135deg, #555, #333);
  opacity: 0.6;
}

/* ---------------- 诊断面板 ---------------- */
.va-panel {
  font-size: 13px;
  line-height: 1.5;
}
.va-panel-title {
  font-weight: 600;
  font-size: 14px;
  margin-bottom: 10px;
}
.va-row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 3px 0;
}
.va-k {
  color: #6b7280;
  flex-shrink: 0;
}
.va-block {
  margin-top: 8px;
}
.va-transcript {
  margin-top: 2px;
  padding: 6px 8px;
  border-radius: 6px;
  background: #f5f6f8;
  word-break: break-all;
  max-height: 72px;
  overflow-y: auto;
}
.va-transcript.bad {
  color: #c2410c;
}
.ok {
  color: #15803d;
}
.bad {
  color: #c2410c;
}
.va-actions {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}
.va-test {
  display: flex;
  gap: 8px;
}
.va-test-result {
  margin-top: 6px;
  font-weight: 600;
}
</style>
