<script setup lang="ts">
// 素衡OS · AI 服务配置（管理端 / 开发端共用）
// 权限：开发端最高控制权（可编辑 + 可锁定/解锁）；管理端未锁定时可编辑。
// 运营端不使用本组件（其对话框内配置面板为只读继承）。
// 密钥：明文 Key 保存到服务端密钥保险箱（AES-256-GCM 加密落盘），
// 前端仅显示脱敏视图（***末4位）；测试连接由网关用真实 Key 探测。
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import { LLM_PROVIDERS, type LlmProbeCode } from '@/services/llm'
import { listTools, invokeTool, type ToolMeta } from '@/services/tools'
import { useLlmConfigStore } from '@/stores/llmConfig'

const props = withDefaults(defineProps<{ /** 是否显示锁定开关（仅开发端传入 true） */ lockable?: boolean }>(), {
  lockable: false,
})

const { t } = useI18n()
const llmStore = useLlmConfigStore()

/* ---------------- 一键测试连接（经网关用真实 Key 探测） ---------------- */
const testing = ref(false)
const testResult = ref<{ code: LlmProbeCode; detail?: string } | null>(null)

function probeLabel(code: LlmProbeCode): string {
  const key = `portal.agentsCenter.llmTest${code === 'OK' ? 'Ok' : code === 'NO_KEY' ? 'NoKey' : code === 'NO_ENDPOINT' ? 'NoEndpoint' : code === 'PROXY_DOWN' ? 'ProxyDown' : code === 'KEY_INVALID' ? 'KeyInvalid' : code === 'MODEL_ERROR' ? 'ModelError' : 'Fail'}`
  return t(key)
}

/** 网关探测 code → 前端文案 code 映射 */
const CODE_MAP: Record<string, LlmProbeCode> = {
  OK: 'OK',
  NO_KEY: 'NO_KEY',
  KEY_INVALID: 'KEY_INVALID',
  UPSTREAM_ERROR: 'MODEL_ERROR',
  PROXY_ERROR: 'PROXY_DOWN',
}

async function testConnection() {
  if (testing.value) return
  testing.value = true
  testResult.value = null
  try {
    const res = await fetch('/api/vault/probe', { method: 'POST' })
    const json = (await res.json()) as { ok: boolean; code?: string; detail?: string }
    testResult.value = { code: CODE_MAP[json.code || ''] || 'PROXY_DOWN', detail: json.detail }
  } catch {
    testResult.value = { code: 'PROXY_DOWN' }
  } finally {
    testing.value = false
  }
}

function onSave() {
  // 显式触发一次保险箱同步，确保最新配置已推送到网关
  void llmStore.syncFromVault()
  ElMessage.success(t('portal.agentsCenter.llmSaved'))
}

function onToggleLock(v: string | number | boolean) {
  llmStore.setLocked(!!v)
  ElMessage.success(!!v ? t('portal.agentsCenter.llmLocked') : t('portal.agentsCenter.llmUnlock'))
}

const portalLabel = computed(() => {
  const by = llmStore.data.updatedBy
  if (!by) return ''
  const key = by === 'dev' ? 'llmPortalDev' : by === 'admin' ? 'llmPortalAdmin' : 'llmPortalOps'
  return t(`portal.agentsCenter.${key}`)
})

const updatedText = computed(() => {
  if (!portalLabel.value) return ''
  const time = llmStore.data.updatedAt ? new Date(llmStore.data.updatedAt as string).toLocaleString() : ''
  return `${t('portal.agentsCenter.llmLastUpdate')}：${portalLabel.value}${time ? ' · ' + time : ''}`
})

/** API Key 输入框占位：已配置时提示保留，未配置时提示输入 */
const keyPlaceholder = computed(() =>
  llmStore.data.hasKey ? t('portal.agentsCenter.llmApiKeyKeep') : t('portal.agentsCenter.llmApiKeyPlaceholder'),
)

/* ---------------- 向量化服务（知识库语义检索） ---------------- */

const EMBED_PROVIDERS = [
  { id: 'siliconflow' as const, name: 'SiliconFlow（BGE-M3）', docUrl: 'https://cloud.siliconflow.cn' },
  { id: 'zhipu' as const, name: '智谱 BigModel', docUrl: 'https://open.bigmodel.cn' },
]

const embedProviderMeta = computed(
  () => EMBED_PROVIDERS.find((p) => p.id === llmStore.data.embedding?.provider) ?? EMBED_PROVIDERS[0],
)

const embedKeyPlaceholder = computed(() =>
  llmStore.data.embedding?.hasKey ? t('portal.agentsCenter.llmApiKeyKeep') : t('portal.agentsCenter.llmEmbedKeyPlaceholder'),
)

/* ---------------- 知识库统计 ---------------- */

const kbStats = ref<{ docs: number; chunks: number; embedded: number; vectorReady: boolean } | null>(null)

async function loadKbStats() {
  try {
    const res = await fetch('/api/kb/stats')
    if (!res.ok) return
    const json = await res.json()
    if (json.ok) {
      kbStats.value = { docs: json.docs, chunks: json.chunks, embedded: json.embedded, vectorReady: !!json.vectorReady }
    }
  } catch {
    /* 网关不可达时忽略 */
  }
}
loadKbStats()

/* ---------------- 智能体工具（阶段3 Function Calling） ---------------- */

const toolsList = ref<ToolMeta[] | null>(null)
const ali1688Configured = ref(false)
/** 各工具的试运行参数（JSON 文本） */
const toolArgs = ref<Record<string, string>>({})
const toolRunning = ref('')
const toolResult = ref<{ name: string; ok: boolean; text: string } | null>(null)

/** 各工具的默认试运行参数模板 */
const TOOL_ARG_TEMPLATES: Record<string, string> = {
  search_supply_products: '{\n  "keywords": "艾灸条",\n  "moq_max": 500\n}',
  get_supplier_info: '{\n  "company_name": "艾灸条"\n}',
  get_price_trend: '{\n  "keywords": "枸杞",\n  "range_days": 30\n}',
  search_tcm_kb: '{\n  "query": "桂枝汤的组成"\n}',
}

async function loadTools() {
  const r = await listTools()
  if (!r) return
  toolsList.value = r.tools
  ali1688Configured.value = r.ali1688Configured
  for (const t of r.tools) {
    toolArgs.value[t.name] = TOOL_ARG_TEMPLATES[t.name] || '{}'
  }
}
loadTools()

async function runTool(name: string) {
  if (toolRunning.value) return
  let args: Record<string, unknown>
  try {
    args = toolArgs.value[name] ? JSON.parse(toolArgs.value[name]) : {}
  } catch {
    ElMessage.error(t('portal.agentsCenter.toolArgsInvalid'))
    return
  }
  toolRunning.value = name
  toolResult.value = null
  try {
    const r = await invokeTool(name, args)
    toolResult.value = {
      name,
      ok: !!r?.ok,
      text: r ? (r.ok ? JSON.stringify(r.data, null, 2) : String(r.error || 'failed')) : t('portal.agentsCenter.toolGatewayDown'),
    }
  } finally {
    toolRunning.value = ''
  }
}</script>

<template>
  <div class="llm-admin">
    <div class="llm-admin-head">
      <div>
        <div class="llm-admin-title">
          {{ t('portal.agentsCenter.llmGlobalTitle') }}
          <el-tag v-if="props.lockable" size="small" type="warning" effect="plain" class="llm-admin-badge">
            {{ t('portal.agentsCenter.llmDevHighest') }}
          </el-tag>
          <el-tag v-if="llmStore.data.locked" size="small" type="danger" effect="plain">
            {{ t('portal.agentsCenter.llmLocked') }}
          </el-tag>
        </div>
        <div class="llm-admin-desc">{{ t('portal.agentsCenter.llmGlobalDesc') }}</div>
      </div>
      <!-- 锁定开关：仅开发端 -->
      <div v-if="props.lockable" class="llm-lock">
        <span class="llm-lock-label">{{ llmStore.data.locked ? t('portal.agentsCenter.llmUnlock') : t('portal.agentsCenter.llmLock') }}</span>
        <el-switch :model-value="!!llmStore.data.locked" @change="onToggleLock" />
      </div>
    </div>
    <div v-if="props.lockable" class="llm-lock-tip">{{ t('portal.agentsCenter.llmLockTip') }}</div>

    <el-form label-position="top" size="small" :disabled="!llmStore.canEdit">
      <div class="llm-form-grid">
        <el-form-item :label="t('portal.agentsCenter.llmProvider')">
          <el-select
            :model-value="llmStore.data.provider"
            style="width: 100%"
            @change="(v: string) => llmStore.setProvider(v as 'deepseek' | 'doubao' | 'coze')"
          >
            <el-option v-for="p in LLM_PROVIDERS" :key="p.id" :label="p.name" :value="p.id" />
          </el-select>
        </el-form-item>
        <el-form-item :label="llmStore.data.provider !== 'coze' ? t('portal.agentsCenter.llmModel') : t('portal.agentsCenter.llmBotId')">
          <el-input
            v-if="llmStore.data.provider !== 'coze'"
            :model-value="llmStore.data.model"
            @update:model-value="(v: string) => llmStore.setModel(v)"
          />
          <el-input
            v-else
            :model-value="llmStore.data.botId || ''"
            placeholder="738xxxxxxxx"
            @update:model-value="(v: string) => llmStore.setBotId(v)"
          />
        </el-form-item>
      </div>
      <el-form-item :label="t('portal.agentsCenter.llmApiKey')">
        <div class="llm-key-row">
          <el-input
            :model-value="llmStore.data.apiKey"
            type="password"
            show-password
            :placeholder="keyPlaceholder"
            @update:model-value="(v: string) => llmStore.setApiKey(v)"
          />
          <el-link
            class="llm-key-apply"
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

      <!-- 向量化服务（知识库语义检索，可选） -->
      <el-divider content-position="left">{{ t('portal.agentsCenter.llmEmbedTitle') }}</el-divider>
      <div class="llm-embed-desc">
        {{ t('portal.agentsCenter.llmEmbedDesc') }}
        <el-tag v-if="kbStats" size="small" :type="kbStats.vectorReady ? 'success' : 'info'" effect="plain">
          {{ t('portal.agentsCenter.kbStatsLabel') }}：{{ kbStats.docs }} · {{ kbStats.vectorReady ? t('portal.agentsCenter.kbModeVector') : t('portal.agentsCenter.kbModeBm25') }}
        </el-tag>
      </div>
      <div class="llm-form-grid">
        <el-form-item :label="t('portal.agentsCenter.llmEmbedProvider')">
          <el-select
            :model-value="llmStore.data.embedding?.provider || 'siliconflow'"
            style="width: 100%"
            @change="(v: string) => llmStore.setEmbeddingProvider(v as 'siliconflow' | 'zhipu')"
          >
            <el-option v-for="p in EMBED_PROVIDERS" :key="p.id" :label="p.name" :value="p.id" />
          </el-select>
        </el-form-item>
        <el-form-item :label="t('portal.agentsCenter.llmEmbedModel')">
          <el-input
            :model-value="llmStore.data.embedding?.model || 'BAAI/bge-m3'"
            @update:model-value="(v: string) => llmStore.setEmbeddingModel(v)"
          />
        </el-form-item>
      </div>
      <el-form-item :label="t('portal.agentsCenter.llmEmbedApiKey')">
        <div class="llm-key-row">
          <el-input
            :model-value="llmStore.data.embedding?.apiKey || ''"
            type="password"
            show-password
            :placeholder="embedKeyPlaceholder"
            @update:model-value="(v: string) => llmStore.setEmbeddingApiKey(v)"
          />
          <el-link class="llm-key-apply" type="primary" :href="embedProviderMeta.docUrl" target="_blank">
            {{ t('portal.agentsCenter.llmApplyKey') }}
          </el-link>
        </div>
      </el-form-item>

      <!-- 智能体工具（阶段3 Function Calling） -->
      <el-divider content-position="left">{{ t('portal.agentsCenter.llmToolsTitle') }}</el-divider>
      <div class="llm-embed-desc">
        {{ t('portal.agentsCenter.llmToolsDesc') }}
        <el-tag size="small" :type="ali1688Configured ? 'success' : 'info'" effect="plain">
          {{ ali1688Configured ? t('portal.agentsCenter.toolProvider1688') : t('portal.agentsCenter.toolProviderLocal') }}
        </el-tag>
      </div>
      <el-form-item :label="t('portal.agentsCenter.llmToolsToggle')">
        <el-switch
          :model-value="llmStore.data.toolsEnabled !== false"
          :disabled="!llmStore.canEdit || llmStore.data.provider === 'coze'"
          @change="(v: string | number | boolean) => llmStore.setToolsEnabled(!!v)"
        />
        <span class="llm-tools-hint">
          {{ llmStore.data.provider === 'coze' ? t('portal.agentsCenter.toolCozeUnsupported') : t('portal.agentsCenter.llmToolsToggleHint') }}
        </span>
      </el-form-item>
      <!-- 工具调试（仅开发端） -->
      <div v-if="llmStore.portal === 'dev' && toolsList?.length" class="llm-tools-debug">
        <div v-for="tl in toolsList" :key="tl.name" class="llm-tool-item">
          <div class="llm-tool-head">
            <span class="llm-tool-name">{{ tl.name }}</span>
            <span class="llm-tool-domains">{{ tl.domains.join(' / ') }}</span>
            <el-button size="small" text type="primary" :loading="toolRunning === tl.name" @click="runTool(tl.name)">
              {{ t('portal.agentsCenter.toolRun') }}
            </el-button>
          </div>
          <div class="llm-tool-desc">{{ tl.description }}</div>
          <el-input
            v-model="toolArgs[tl.name]"
            type="textarea"
            :rows="3"
            class="llm-tool-args"
          />
          <div v-if="toolResult?.name === tl.name" class="llm-tool-result" :class="toolResult.ok ? 'ok' : 'fail'">
            <pre>{{ toolResult.text.slice(0, 2000) }}</pre>
          </div>
        </div>
      </div>

      <div class="llm-admin-actions">
        <el-button v-if="llmStore.canEdit" type="primary" @click="onSave">
          {{ t('portal.agentsCenter.llmSave') }}
        </el-button>
        <el-button v-if="llmStore.canEdit" plain @click="llmStore.reset">
          {{ t('portal.agentsCenter.llmReset') }}
        </el-button>
        <el-button
          :loading="testing"
          :type="testResult ? (testResult.code === 'OK' ? 'success' : 'warning') : 'default'"
          plain
          @click="testConnection"
        >
          {{ testing ? t('portal.agentsCenter.llmTesting') : t('portal.agentsCenter.llmTest') }}
        </el-button>
        <span class="llm-updated">{{ updatedText }}</span>
      </div>
      <div v-if="testResult" class="llm-probe" :class="testResult.code === 'OK' ? 'ok' : 'fail'">
        <span class="llm-probe-label">{{ probeLabel(testResult.code) }}</span>
        <span v-if="testResult.detail" class="llm-probe-detail">{{ testResult.detail }}</span>
      </div>
    </el-form>
  </div>
</template>

<style scoped>
.llm-admin {
  border: 1px solid var(--color-border, #e4ebe7);
  border-radius: 12px;
  padding: 16px 18px 12px;
  background: var(--color-bg-card, #fff);
  margin-top: 16px;
}
.llm-admin-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
}
.llm-admin-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 700;
  color: var(--color-text-primary, #303133);
}
.llm-admin-badge {
  font-weight: 600;
}
.llm-admin-desc {
  margin-top: 4px;
  font-size: 12.5px;
  color: var(--color-text-secondary, #909399);
}
.llm-lock {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: none;
}
.llm-lock-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-primary, #303133);
}
.llm-lock-tip {
  margin-top: 6px;
  font-size: 12px;
  color: #a8702f;
  background: #fdf6ec;
  border: 1px solid #f5e6c8;
  border-radius: 8px;
  padding: 6px 10px;
}
.llm-form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0 16px;
}
.llm-key-row {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
}
.llm-key-apply {
  flex: none;
  font-size: 12px;
}
.llm-embed-desc {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 12px;
  font-size: 12.5px;
  color: var(--color-text-secondary, #909399);
}
/* 智能体工具调试 */
.llm-tools-hint {
  margin-left: 10px;
  font-size: 11.5px;
  color: var(--color-text-secondary, #909399);
}
.llm-tools-debug {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 14px;
}
.llm-tool-item {
  border: 1px solid var(--color-border, #e4ebe7);
  border-radius: 8px;
  padding: 10px 12px;
}
.llm-tool-head {
  display: flex;
  align-items: center;
  gap: 10px;
}
.llm-tool-name {
  font-family: monospace;
  font-size: 12.5px;
  font-weight: 700;
  color: #8a5fbf;
}
.llm-tool-domains {
  flex: 1;
  font-size: 11px;
  color: var(--color-text-secondary, #909399);
}
.llm-tool-desc {
  margin: 4px 0 8px;
  font-size: 12px;
  color: var(--color-text-secondary, #909399);
}
.llm-tool-args :deep(textarea) {
  font-family: monospace;
  font-size: 12px;
}
.llm-tool-result {
  margin-top: 8px;
  border-radius: 6px;
  padding: 8px 10px;
  max-height: 220px;
  overflow-y: auto;
}
.llm-tool-result pre {
  margin: 0;
  font-size: 11.5px;
  font-family: monospace;
  white-space: pre-wrap;
  word-break: break-all;
}
.llm-tool-result.ok {
  background: #eef7f2;
  border: 1px solid #d5e9e0;
}
.llm-tool-result.fail {
  background: #fdf2ee;
  border: 1px solid #f3ddd2;
}
.llm-admin-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}
.llm-updated {
  font-size: 11.5px;
  color: var(--color-text-secondary, #909399);
}
.llm-probe {
  display: flex;
  flex-direction: column;
  gap: 3px;
  margin-top: 10px;
  font-size: 12px;
  line-height: 1.5;
  border-radius: 8px;
  padding: 8px 12px;
}
.llm-probe.ok {
  color: #1a6b5c;
  background: #eef7f2;
  border: 1px solid #d5e9e0;
}
.llm-probe.fail {
  color: #a8502f;
  background: #fdf2ee;
  border: 1px solid #f3ddd2;
}
.llm-probe-label {
  font-weight: 700;
}
.llm-probe-detail {
  font-size: 11px;
  opacity: 0.85;
  word-break: break-all;
  max-height: 60px;
  overflow-y: auto;
}
@media (max-width: 720px) {
  .llm-form-grid {
    grid-template-columns: 1fr;
  }
}
</style>
