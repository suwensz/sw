<script setup lang="ts">
// 素衡OS · 智能体中心内容对话框
// 三种模式：tcm 中医健康 / ecom 跨境电商 / domestic 国内电商
// 回答引擎：services/llm.askAI —— 已配置 AI 服务（DeepSeek/豆包/扣子免费版）走云端，
//          未配置时回退本系统内置知识库（中医大数据 / 采购信息数据库 / 淘宝拼多多京东数据库）。
import { computed, nextTick, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import { askAI, enhanceQuestion, LLM_PROVIDERS, testLLMConnection, type LlmProbeCode } from '@/services/llm'
import { useLlmConfigStore } from '@/stores/llmConfig'
import type { Domain } from '@/services/knowledge'
import type { KbHit } from '@/services/kb'
import type { ToolTraceItem } from '@/services/tools'

interface ChatMsg {
  role: 'user' | 'assistant'
  content: string
  source?: 'llm' | 'local'
  /** 知识库检索引用（RAG 命中时展示来源标注） */
  citations?: KbHit[]
  /** 工具调用轨迹（Function Calling 命中时展示可折叠轨迹） */
  toolTrace?: ToolTraceItem[]
}

const props = defineProps<{ modelValue: boolean; domain: Domain }>()
const emit = defineEmits<{ (e: 'update:modelValue', v: boolean): void }>()

const { t } = useI18n()
const llmStore = useLlmConfigStore()

const input = ref('')
const loading = ref(false)
const showConfig = ref(false)
const listening = ref(false)
const bodyRef = ref<HTMLElement | null>(null)

const visible = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
})

/** 统一对话框新增：三域 Tab 切换 */
const isUnified = computed(() => props.domain === 'general')

type DialogDomain = Exclude<Domain, 'general'>
const ALL_DOMAINS: DialogDomain[] = ['tcm', 'ecom', 'domestic']
const currentDomain = ref<DialogDomain>(isUnified.value ? 'tcm' : (props.domain as DialogDomain))

watch(
  () => props.domain,
  (d) => {
    if (d === 'general') {
      if (!ALL_DOMAINS.includes(currentDomain.value)) currentDomain.value = 'tcm'
    } else {
      currentDomain.value = d as DialogDomain
    }
  },
)

watch(currentDomain, () => {
  showConfig.value = false
  ensureWelcome()
  scrollBottom()
})

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

const domainTabs = computed(() =>
  ALL_DOMAINS.map((d) => ({
    domain: d,
    labelKey: DOMAIN_META[d].titleKey,
    icon: DOMAIN_META[d].icon,
    color: DOMAIN_META[d].color,
  })),
)

const domainMeta = computed(() => DOMAIN_META[currentDomain.value])
const quickQuestions = computed(() => domainMeta.value.quickKeys.map((k) => t(`portal.agentsCenter.${k}`)))

/** 各域独立聊天记录 */
const messagesMap = ref<Record<DialogDomain, ChatMsg[]>>({ tcm: [], ecom: [], domestic: [] })
const messages = computed(() => messagesMap.value[currentDomain.value])

function scrollBottom() {
  nextTick(() => {
    if (bodyRef.value) bodyRef.value.scrollTop = bodyRef.value.scrollHeight
  })
}

function ensureWelcome() {
  if (!messages.value.length) {
    messages.value.push({
      role: 'assistant',
      content: t('portal.agentsCenter.chatWelcome'),
      source: 'local',
    })
  }
}

function onOpen() {
  ensureWelcome()
  showConfig.value = false
  scrollBottom()
}

function onSaveConfig() {
  ElMessage.success(t('portal.agentsCenter.llmSaved'))
  showConfig.value = false
}

/* ---------------- 一键测试连接 ---------------- */
const testing = ref(false)
const testResult = ref<{ code: LlmProbeCode; detail?: string } | null>(null)

function probeLabel(code: LlmProbeCode): string {
  const key = `portal.agentsCenter.llmTest${code === 'OK' ? 'Ok' : code === 'NO_KEY' ? 'NoKey' : code === 'NO_ENDPOINT' ? 'NoEndpoint' : code === 'PROXY_DOWN' ? 'ProxyDown' : code === 'KEY_INVALID' ? 'KeyInvalid' : code === 'MODEL_ERROR' ? 'ModelError' : 'Fail'}`
  return t(key)
}

async function testConnection() {
  if (testing.value) return
  testing.value = true
  testResult.value = null
  try {
    const r = await testLLMConnection()
    testResult.value = { code: r.code, detail: r.detail }
  } catch {
    testResult.value = { code: 'PROXY_DOWN' }
  } finally {
    testing.value = false
  }
}

/* ---------------- AI 智能对话（输入框「AI智能」按钮，DeepSeek 免费版） ---------------- */
const enhancing = ref(false)

/** 本地轻量优化兜底：为口语化提问补充领域限定词 */
function localEnhance(q: string): string {
  const hints: Record<DialogDomain, string> = {
    tcm: '（请结合中医健康大数据，从专业角度分析）',
    ecom: '（请结合跨境采购与供应链数据，给出专业建议）',
    domestic: '（请结合淘宝/拼多多/京东平台数据，给出专业建议）',
  }
  return `${q}${hints[currentDomain.value]}`
}

/** 打开 AI 服务接入面板：运营端只读（由管理端/开发端统一配置），其余门户可编辑 */
function openDeepseekSetup() {
  if (llmStore.canEdit && llmStore.data.provider !== 'deepseek') llmStore.setProvider('deepseek')
  showConfig.value = true
}

async function onAiSmartClick() {
  // 正在优化/发送中不响应
  if (enhancing.value || loading.value) return
  const q = input.value.trim()
  // 未输入内容：一键打开 AI 服务接入面板
  if (!q) {
    openDeepseekSetup()
    ElMessage.info(t(llmStore.canEdit ? 'portal.agentsCenter.aiSmartNeedKey' : 'portal.agentsCenter.llmReadOnlyHint'))
    return
  }
  // 未配置云端 AI：引导接入（运营端只读，提示由管理端/开发端配置）
  if (!llmStore.configured) {
    openDeepseekSetup()
    ElMessage.warning(t(llmStore.canEdit ? 'portal.agentsCenter.aiSmartNeedKey' : 'portal.agentsCenter.llmReadOnlyHint'))
    return
  }
  enhancing.value = true
  try {
    const r = await enhanceQuestion(currentDomain.value, q)
    if (r?.text) {
      input.value = r.text
      ElMessage.success(t('portal.agentsCenter.aiEnhanceDone'))
    } else {
      input.value = localEnhance(q)
      ElMessage.success(t('portal.agentsCenter.aiEnhanceLocal'))
    }
  } finally {
    enhancing.value = false
  }
}

/* ---------------- 工具调用轨迹（Function Calling） ---------------- */

const TOOL_LABEL_KEYS: Record<string, string> = {
  search_supply_products: 'portal.agentsCenter.toolNameSupplySearch',
  get_supplier_info: 'portal.agentsCenter.toolNameSupplierInfo',
  get_price_trend: 'portal.agentsCenter.toolNamePriceTrend',
  search_tcm_kb: 'portal.agentsCenter.toolNameTcmKb',
}

function toolLabel(name: string): string {
  const key = TOOL_LABEL_KEYS[name]
  return key ? t(key) : name
}

/** 轨迹中含本地演示数据（local-fallback）时提示可接入 1688 连接器获取实时数据 */
function isLocalData(trace?: ToolTraceItem[]): boolean {
  return !!trace?.some((x) => x.provider === 'local-fallback')
}

async function send(text?: string) {  const q = (text ?? input.value).trim()
  if (!q || loading.value) return
  messages.value.push({ role: 'user', content: q })
  input.value = ''
  scrollBottom()
  loading.value = true
  try {
    const history = messages.value
      .slice(0, -1)
      .map((m) => ({ role: m.role, content: m.content }))
    const res = await askAI(currentDomain.value, q, history)
    messages.value.push({
      role: 'assistant',
      content: res.answer,
      source: res.source,
      citations: res.citations,
      toolTrace: res.toolTrace,
    })
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

    <!-- 三域合一：Tab 切换 -->
    <div v-if="isUnified" class="ac-tabs">
      <button
        v-for="tab in domainTabs"
        :key="tab.domain"
        class="ac-tab"
        :class="{ 'is-active': currentDomain === tab.domain }"
        :style="{
          '--tab-color': tab.color,
          color: currentDomain === tab.domain ? '#faf8f3' : tab.color,
          background: currentDomain === tab.domain ? tab.color : tab.color + '18',
        }"
        @click="currentDomain = tab.domain"
      >
        <el-icon :size="14"><component :is="tab.icon" /></el-icon>
        {{ t(tab.labelKey) }}
      </button>
    </div>

    <!-- AI 服务配置（运营端只读继承；由管理端/开发端统一配置） -->
    <div v-if="showConfig" class="ac-config">
      <div class="ac-config-title">
        {{ t('portal.agentsCenter.llmConfig') }}
        <el-tag v-if="!llmStore.canEdit" size="small" type="info" effect="plain" class="ac-config-ro">
          {{ t('portal.agentsCenter.llmReadOnlyHint') }}
        </el-tag>
        <el-tag v-else-if="llmStore.data.locked" size="small" type="danger" effect="plain" class="ac-config-ro">
          {{ t('portal.agentsCenter.llmLocked') }}
        </el-tag>
      </div>
      <el-form label-position="top" size="small" :disabled="!llmStore.canEdit">
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
          <div class="ac-key-row">
            <el-input
              :model-value="llmStore.data.apiKey"
              type="password"
              show-password
              :placeholder="t('portal.agentsCenter.llmApiKeyPlaceholder')"
              @update:model-value="(v: string) => llmStore.setApiKey(v)"
            />
            <el-link
              v-if="llmStore.canEdit"
              class="ac-key-apply"
              type="primary"
              :href="llmStore.providerMeta.docUrl"
              target="_blank"
            >
              {{ t('portal.agentsCenter.llmApplyKey') }}
            </el-link>
          </div>
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
        <el-form-item v-else :label="t('portal.agentsCenter.llmBotId')">
          <el-input
            :model-value="llmStore.data.botId || ''"
            placeholder="738xxxxxxxx"
            @update:model-value="(v: string) => llmStore.setBotId(v)"
          />
        </el-form-item>
        <div class="ac-config-actions">
          <el-button v-if="llmStore.canEdit" type="primary" @click="onSaveConfig">{{ t('portal.agentsCenter.llmSave') }}</el-button>
          <el-button v-if="llmStore.canEdit" plain @click="llmStore.reset">{{ t('portal.agentsCenter.llmReset') }}</el-button>
          <el-button
            :loading="testing"
            :type="testResult ? (testResult.code === 'OK' ? 'success' : 'warning') : 'default'"
            plain
            @click="testConnection"
          >
            {{ testing ? t('portal.agentsCenter.llmTesting') : t('portal.agentsCenter.llmTest') }}
          </el-button>
          <span class="ac-config-hint">
            {{ llmStore.canEdit ? t('portal.agentsCenter.llmUseLocal') : t('portal.agentsCenter.llmReadOnlyHint') }}
          </span>
        </div>
        <div v-if="testResult" class="ac-probe" :class="testResult.code === 'OK' ? 'ok' : 'fail'">
          <span class="ac-probe-label">{{ probeLabel(testResult.code) }}</span>
          <span v-if="testResult.detail" class="ac-probe-detail">{{ testResult.detail }}</span>
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
            <!-- 知识库来源标注（RAG 引用，悬停查看原文） -->
            <div v-if="m.citations?.length" class="ac-citations">
              <span class="ac-citations-label">{{ t('portal.agentsCenter.kbSources') }}</span>
              <el-tooltip
                v-for="(c, i) in m.citations"
                :key="c.chunk_id"
                placement="top"
                :show-after="200"
              >
                <template #content>
                  <div class="ac-cit-tip">
                    {{ c.text.length > 220 ? c.text.slice(0, 220) + '…' : c.text }}
                  </div>
                </template>
                <span class="ac-cit-chip">[{{ i + 1 }}] {{ c.doc_title }}</span>
              </el-tooltip>
            </div>
            <!-- 工具调用轨迹（Function Calling 命中时展示） -->
            <div v-if="m.toolTrace?.length" class="ac-tools">
              <div class="ac-tools-head">
                <span class="ac-tools-label">{{ t('portal.agentsCenter.toolTrace') }}</span>
                <span
                  v-for="(x, ti) in m.toolTrace"
                  :key="ti"
                  class="ac-tool-chip"
                  :class="{ fail: !x.ok }"
                >
                  {{ toolLabel(x.name) }} · {{ x.latency_ms }}ms
                </span>
              </div>
              <!-- 本地演示数据提示（阶段3b：1688 连接器引导） -->
              <div v-if="isLocalData(m.toolTrace)" class="ac-tools-hint">
                {{ t('portal.agentsCenter.toolLocalHint') }}
              </div>
            </div>
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
        <!-- AI 智能对话：优化提问 / 一键接入 DeepSeek 免费版 -->
        <el-tooltip :content="t('portal.agentsCenter.aiSmartTip')" placement="top">
          <el-button class="ac-ai-btn" :loading="enhancing" @click="onAiSmartClick">
            <el-icon v-if="!enhancing" :size="15"><MagicStick /></el-icon>
            {{ t('portal.agentsCenter.aiSmart') }}
          </el-button>
        </el-tooltip>
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
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 700;
  color: #1a6b5c;
  margin-bottom: 10px;
}
.ac-config-ro {
  font-weight: 500;
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
.ac-probe {
  display: flex;
  flex-direction: column;
  gap: 3px;
  margin-top: 10px;
  font-size: 12px;
  line-height: 1.5;
  border-radius: 8px;
  padding: 8px 12px;
}
.ac-probe.ok {
  color: #1a6b5c;
  background: #eef7f2;
  border: 1px solid #d5e9e0;
}
.ac-probe.fail {
  color: #a8502f;
  background: #fdf2ee;
  border: 1px solid #f3ddd2;
}
.ac-probe-label {
  font-weight: 700;
}
.ac-probe-detail {
  font-size: 11px;
  opacity: 0.85;
  word-break: break-all;
  max-height: 60px;
  overflow-y: auto;
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

/* 知识库来源标注（RAG 引用） */
.ac-citations {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px;
  margin-top: 8px;
  padding-top: 6px;
  border-top: 1px dashed rgba(0, 0, 0, 0.08);
}
.ac-citations-label {
  font-size: 10.5px;
  color: var(--color-text-secondary, #909399);
}
.ac-cit-chip {
  font-size: 10.5px;
  color: #1a6b5c;
  background: #eef7f2;
  border: 1px solid rgba(26, 107, 92, 0.18);
  border-radius: 999px;
  padding: 1px 8px;
  cursor: default;
  transition: background 0.15s;
}
.ac-cit-chip:hover {
  background: #e2f0ea;
}
.ac-cit-tip {
  max-width: 340px;
  line-height: 1.6;
  font-size: 12px;
}

/* 工具调用轨迹（Function Calling） */
.ac-tools {
  margin-top: 6px;
}
.ac-tools-head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px;
}
.ac-tools-label {
  font-size: 10.5px;
  color: var(--color-text-secondary, #909399);
}
.ac-tool-chip {
  font-size: 10.5px;
  color: #8a5fbf;
  background: #f4effa;
  border: 1px solid rgba(138, 95, 191, 0.18);
  border-radius: 999px;
  padding: 1px 8px;
  cursor: default;
}
.ac-tool-chip.fail {
  color: #c05f3a;
  background: #faf0ea;
  border-color: rgba(192, 95, 58, 0.2);
}
.ac-tools-hint {
  margin-top: 4px;
  font-size: 10.5px;
  line-height: 1.5;
  color: #b8860b;
  background: #fdf8e9;
  border: 1px dashed rgba(184, 134, 11, 0.25);
  border-radius: 6px;
  padding: 4px 8px;
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
/* AI 智能按钮：发送前的紫金渐变主视觉 */
.ac-ai-btn {
  flex: none;
  background: linear-gradient(135deg, #6f5bd8, #8a5fbf);
  border: none;
  color: #ffffff;
  font-weight: 600;
}
.ac-ai-btn:hover,
.ac-ai-btn:focus {
  background: linear-gradient(135deg, #7d6ae2, #9670cf);
  color: #ffffff;
  filter: brightness(1.06);
}
/* API Key 行：输入框 + 申请链接 */
.ac-key-row {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
}
.ac-key-apply {
  flex: none;
  font-size: 12px;
}
@keyframes ac-pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(224, 82, 63, 0.45); }
  50% { box-shadow: 0 0 0 9px rgba(224, 82, 63, 0); }
}

/* 三域合一 Tab */
.ac-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
}
.ac-tab {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  border: none;
  border-radius: 999px;
  padding: 6px 13px;
  font-size: 12.5px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.18s ease;
}
.ac-tab:hover {
  filter: brightness(1.08);
}
</style>
