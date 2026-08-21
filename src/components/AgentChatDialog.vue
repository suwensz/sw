<script setup lang="ts">
// 素衡OS · 智能体中心内容对话框
// 三种模式：tcm 中医健康 / ecom 跨境电商 / domestic 国内电商
// 回答引擎：services/llm.askAI —— 已配置 AI 服务（DeepSeek/豆包/扣子免费版）走云端，
//          未配置时回退本系统内置知识库（中医大数据 / 采购信息数据库 / 淘宝拼多多京东数据库）。
import { computed, ref, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import { askAI, LLM_PROVIDERS } from '@/services/llm'
import { useLlmConfigStore } from '@/stores/llmConfig'
import type { Domain } from '@/services/knowledge'

interface ChatMsg {
  role: 'user' | 'assistant'
  content: string
  source?: 'llm' | 'local'
}

const props = defineProps<{ modelValue: boolean; domain: Domain }>()
const emit = defineEmits<{ (e: 'update:modelValue', v: boolean): void }>()

const { t } = useI18n()
const llmStore = useLlmConfigStore()

const messages = ref<ChatMsg[]>([])
const input = ref('')
const loading = ref(false)
const showConfig = ref(false)
const listening = ref(false)
const bodyRef = ref<HTMLElement | null>(null)

const visible = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
})

type DialogDomain = Exclude<Domain, 'general'>
const DOMAIN_META: Record<DialogDomain, { titleKey: string; descKey: string; icon: string; color: string; quickKeys: string[] }> = {
  tcm: {
    titleKey: 'portal.agentsCenter.dialogTcm',
    descKey: 'portal.agentsCenter.dialogTcmDesc',
    icon: 'FirstAidKit',
    color: '#1a6b5c',
    quickKeys: ['chatTcmQ1', 'chatTcmQ2', 'chatTcmQ3'],
  },
  ecom: {
    titleKey: 'portal.agentsCenter.dialogEcom',
    descKey: 'portal.agentsCenter.dialogEcomDesc',
    icon: 'ShoppingCart',
    color: '#b8860b',
    quickKeys: ['chatEcomQ1', 'chatEcomQ2', 'chatEcomQ3'],
  },
  domestic: {
    titleKey: 'portal.agentsCenter.dialogDomestic',
    descKey: 'portal.agentsCenter.dialogDomesticDesc',
    icon: 'Shop',
    color: '#c05f3a',
    quickKeys: ['chatDomesticQ1', 'chatDomesticQ2', 'chatDomesticQ3'],
  },
}

const domainMeta = computed(() => DOMAIN_META[props.domain as DialogDomain] ?? DOMAIN_META.tcm)
const quickQuestions = computed(() => domainMeta.value.quickKeys.map((k) => t(`portal.agentsCenter.${k}`)))

function scrollBottom() {
  nextTick(() => {
    if (bodyRef.value) bodyRef.value.scrollTop = bodyRef.value.scrollHeight
  })
}

function onOpen() {
  if (!messages.value.length) {
    messages.value.push({ role: 'assistant', content: t('portal.agentsCenter.chatWelcome'), source: 'local' })
  }
  showConfig.value = false
  scrollBottom()
}

function onSaveConfig() {
  ElMessage.success(t('portal.agentsCenter.llmSaved'))
  showConfig.value = false
}

async function send(text?: string) {
  const q = (text ?? input.value).trim()
  if (!q || loading.value) return
  messages.value.push({ role: 'user', content: q })
  input.value = ''
  scrollBottom()
  loading.value = true
  try {
    const history = messages.value
      .slice(0, -1)
      .map((m) => ({ role: m.role, content: m.content }))
    const res = await askAI(props.domain, q, history)
    messages.value.push({ role: 'assistant', content: res.answer, source: res.source })
  } finally {
    loading.value = false
    scrollBottom()
  }
}

/* ---------------- 语音提问 ---------------- */
let recognition: {
  start: () => void
  stop: () => void
  lang: string
  interimResults: boolean
  onresult: ((e: any) => void) | null
  onend: (() => void) | null
  onerror: ((e: any) => void) | null
} | null = null

function startVoice() {
  const w = window as any
  const SR = w.SpeechRecognition || w.webkitSpeechRecognition
  if (!SR) {
    ElMessage.warning(t('wake.unsupported'))
    return
  }
  listening.value = true
  const r = new SR()
  r.lang = 'zh-CN'
  r.interimResults = true
  r.onresult = (e: any) => {
    let text = ''
    for (let i = e.resultIndex; i < e.results.length; i++) {
      text += e.results[i]?.[0]?.transcript || ''
    }
    input.value = text
  }
  r.onend = () => {
    listening.value = false
  }
  r.onerror = () => {
    listening.value = false
  }
  try {
    r.start()
  } catch {
    listening.value = false
  }
  recognition = r
}

function stopVoice() {
  try {
    recognition?.stop()
  } catch {
    /* ignore */
  }
  listening.value = false
}

function onVoiceClick() {
  if (listening.value) stopVoice()
  else startVoice()
}
</script>

<template>
  <el-dialog
    v-model="visible"
    :width="'min(760px, 92vw)'"
    top="4vh"
    class="agent-chat-dialog"
    @open="onOpen"
  >
    <template #header>
      <div class="ac-head">
        <div class="ac-title">
          <span class="ac-ico" :style="{ background: domainMeta.color }">
            <el-icon :size="18" color="#faf8f3"><component :is="domainMeta.icon" /></el-icon>
          </span>
          <span>{{ t(domainMeta.titleKey) }}</span>
          <span class="ac-source-badge">{{ t('portal.agentsCenter.dialogSource') }}</span>
        </div>
        <div class="ac-sub">{{ t(domainMeta.descKey) }}</div>
      </div>
    </template>

    <!-- AI 服务配置（DeepSeek / 豆包 / 扣子免费版） -->
    <div v-if="showConfig" class="ac-config">
      <div class="ac-config-title">{{ t('portal.agentsCenter.llmConfig') }}</div>
      <el-form label-position="top" size="small">
        <el-form-item :label="t('portal.agentsCenter.llmProvider')">
          <el-select
            :model-value="llmStore.data.provider"
            style="width: 100%"
            @change="(v: string) => llmStore.setProvider(v as 'deepseek' | 'doubao' | 'coze')"
          >
            <el-option v-for="p in LLM_PROVIDERS" :key="p.id" :label="p.name" :value="p.id" />
          </el-select>
        </el-form-item>
        <el-form-item :label="t('portal.agentsCenter.llmApiKey')">
          <el-input
            :model-value="llmStore.data.apiKey"
            type="password"
            show-password
            :placeholder="t('portal.agentsCenter.llmApiKeyPlaceholder')"
            @update:model-value="(v: string) => llmStore.setApiKey(v)"
          />
        </el-form-item>
        <el-form-item :label="t('portal.agentsCenter.llmEndpoint')">
          <el-input
            :model-value="llmStore.data.endpoint"
            @update:model-value="(v: string) => llmStore.setEndpoint(v)"
          />
        </el-form-item>
        <el-form-item v-if="llmStore.data.provider !== 'coze'" :label="t('portal.agentsCenter.llmModel')">
          <el-input
            :model-value="llmStore.data.model"
            @update:model-value="(v: string) => llmStore.setModel(v)"
          />
        </el-form-item>
        <div class="ac-config-actions">
          <el-button type="primary" @click="onSaveConfig">{{ t('portal.agentsCenter.llmSave') }}</el-button>
          <el-button plain @click="llmStore.reset">{{ t('portal.agentsCenter.llmReset') }}</el-button>
          <span class="ac-config-hint">{{ t('portal.agentsCenter.llmUseLocal') }}</span>
        </div>
      </el-form>
    </div>

    <!-- 消息区 -->
    <div ref="bodyRef" class="ac-body">
      <template v-for="(m, i) in messages" :key="i">
        <div class="ac-msg" :class="m.role">
          <div class="ac-avatar" :class="m.role">
            <el-icon :size="15" color="#faf8f3">
              <component :is="m.role === 'assistant' ? domainMeta.icon : 'User'" />
            </el-icon>
          </div>
          <div class="ac-bubble">
            <span v-if="m.source" class="ac-tag" :class="m.source">
              {{ m.source === 'llm' ? t('portal.agentsCenter.chatLLMTag') : t('portal.agentsCenter.chatLocalTag') }}
            </span>
            <div class="ac-content">{{ m.content }}</div>
          </div>
        </div>
      </template>
      <div v-if="loading" class="ac-msg assistant">
        <div class="ac-avatar assistant">
          <el-icon :size="15" color="#faf8f3"><component :is="domainMeta.icon" /></el-icon>
        </div>
        <div class="ac-bubble">
          <span class="ac-tag local">{{ t('portal.agentsCenter.chatLocalTag') }}</span>
          <div class="ac-content ac-thinking">{{ t('portal.agentsCenter.chatThinking') }}</div>
        </div>
      </div>
      <!-- 快速提问 -->
      <div v-if="messages.length <= 1" class="ac-quick">
        <div class="ac-quick-title">{{ t('portal.agentsCenter.quick') }}</div>
        <button
          v-for="(q, qi) in quickQuestions"
          :key="qi"
          class="ac-quick-chip"
          @click="send(q)"
        >
          {{ q }}
        </button>
      </div>
    </div>

    <template #footer>
      <div class="ac-input">
        <el-button
          class="ac-mic"
          :type="listening ? 'danger' : 'default'"
          :class="{ 'is-listening': listening }"
          circle
          @click="onVoiceClick"
        >
          <el-icon :size="16"><Microphone /></el-icon>
        </el-button>
        <el-input
          v-model="input"
          :placeholder="listening ? t('portal.agentsCenter.chatVoiceListening') : t('portal.agentsCenter.chatPlaceholder')"
          clearable
          @keyup.enter="send()"
        />
        <el-button type="primary" :loading="loading" @click="send()">
          {{ t('portal.agentsCenter.chatSend') }}
        </el-button>
        <el-button text @click="showConfig = !showConfig">
          <el-icon :size="15"><Setting /></el-icon>
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<style scoped>
.ac-head {
  padding-right: 8px;
}
.ac-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 16px;
  font-weight: 700;
  color: var(--color-text-primary, #303133);
}
.ac-ico {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 9px;
}
.ac-source-badge {
  margin-left: auto;
  font-size: 11px;
  font-weight: 500;
  color: #1a6b5c;
  background: #eef7f2;
  border: 1px solid #d5e9e0;
  border-radius: 999px;
  padding: 2px 10px;
}
.ac-sub {
  margin-top: 6px;
  font-size: 12.5px;
  color: var(--color-text-secondary, #909399);
}

/* 配置面板 */
.ac-config {
  background: #f7faf8;
  border: 1px solid #e4ebe7;
  border-radius: 12px;
  padding: 14px 16px 10px;
  margin-bottom: 12px;
}
.ac-config-title {
  font-size: 13px;
  font-weight: 700;
  color: #1a6b5c;
  margin-bottom: 10px;
}
.ac-config-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}
.ac-config-hint {
  font-size: 11.5px;
  color: var(--color-text-secondary, #909399);
}

/* 消息区 */
.ac-body {
  height: min(52vh, 440px);
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 4px 4px 8px;
  background: #f7faf8;
  border: 1px solid #e4ebe7;
  border-radius: 12px;
  padding: 14px;
}
.ac-msg {
  display: flex;
  gap: 9px;
  align-items: flex-start;
}
.ac-msg.user {
  flex-direction: row-reverse;
}
.ac-avatar {
  flex: none;
  width: 28px;
  height: 28px;
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #e4ebe7;
}
.ac-avatar.assistant {
  background: linear-gradient(135deg, #1a6b5c, #124d42);
}
.ac-avatar.user {
  background: #d4a853;
}
.ac-bubble {
  max-width: 76%;
  background: #ffffff;
  border: 1px solid #e4ebe7;
  border-radius: 12px;
  padding: 9px 12px;
  box-shadow: 0 2px 8px rgba(15, 43, 36, 0.05);
}
.ac-msg.user .ac-bubble {
  background: linear-gradient(135deg, #1a6b5c, #16604f);
  color: #faf8f3;
  border: none;
}
.ac-tag {
  display: inline-block;
  font-size: 10.5px;
  font-weight: 600;
  margin-bottom: 4px;
  padding: 1px 7px;
  border-radius: 999px;
}
.ac-tag.llm {
  color: #8a5fbf;
  background: #f4effa;
}
.ac-tag.local {
  color: #1a6b5c;
  background: #eef7f2;
}
.ac-content {
  font-size: 13px;
  line-height: 1.65;
  white-space: pre-wrap;
  word-break: break-word;
}
.ac-thinking {
  color: var(--color-text-secondary, #909399);
}

/* 快速提问 */
.ac-quick {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 6px;
}
.ac-quick-title {
  font-size: 12px;
  color: var(--color-text-secondary, #909399);
}
.ac-quick-chip {
  align-self: flex-start;
  cursor: pointer;
  border: 1px solid #d5e9e0;
  background: #ffffff;
  color: #1a6b5c;
  font-size: 12.5px;
  border-radius: 999px;
  padding: 6px 14px;
  transition: all 0.18s ease;
}
.ac-quick-chip:hover {
  background: #1a6b5c;
  color: #faf8f3;
}

/* 输入区 */
.ac-input {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
}
.ac-mic.is-listening {
  animation: ac-pulse 1.1s ease-in-out infinite;
}
@keyframes ac-pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(224, 82, 63, 0.45); }
  50% { box-shadow: 0 0 0 9px rgba(224, 82, 63, 0); }
}
</style>
