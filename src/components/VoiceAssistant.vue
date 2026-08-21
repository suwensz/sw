<script setup lang="ts">
// 素衡OS · 全局语音助手
// 全系统（主站 + 运营端/开发端/管理端）挂载。
// 流程：说「素衡素衡」→ 女声问候「主人您好，您的素衡一直陪伴着您…」
//      → 聆听后续语音指令 → AI 依据本系统数据库回答 → 语音播报回答。
// 唤醒与问候由 useWakeWord 处理；本组件负责指令收集 + AI 回答 + 播报。
import { onMounted, onUnmounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useWakeWord, setCommandHandler, commandState, pauseRecognition, resumeRecognition } from '@/composables/useWakeWord'
import { askAI } from '@/services/llm'
import { speakBroadcast } from '@/composables/useSpeech'

const { t } = useI18n()
const { enabled } = useWakeWord()

/** UI 阶段：idle = 待唤醒，listening = 聆听指令，thinking = AI 回答中 */
const phase = ref<'idle' | 'listening' | 'thinking'>('idle')
const busy = ref(false)

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
  <!-- 语音聆听/思考指示浮层（右下角，简洁不遮挡） -->
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
  </Teleport>
</template>

<style scoped>
.va-indicator {
  position: fixed;
  right: 22px;
  bottom: 108px;
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
.va-fade-enter-active,
.va-fade-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}
.va-fade-enter-from,
.va-fade-leave-to {
  opacity: 0;
  transform: translateY(8px);
}
</style>
