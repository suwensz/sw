// 素衡OS · AI 服务配置
// 支持接入 DeepSeek 免费版 / 豆包免费版 / 扣子免费版（Coze）
// 配置持久化到 localStorage：qh_llm_config（同源三端门户共享）
//
// 权限体系（开发端最高控制权）：
//   dev   开发端 —— 最高控制权：始终可编辑，且可锁定/解锁配置
//   admin 管理端 —— 未锁定时可编辑
//   ops   运营端 —— 只读（对话框直接继承生效，不可修改）
import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

export type LlmProvider = 'deepseek' | 'doubao' | 'coze'

/** 门户标识 */
export type PortalId = 'dev' | 'admin' | 'ops'

/** 依据入口文件名识别当前门户（dev-portal / admin-portal / ops-portal，主站视为运营侧只读） */
export function detectPortal(): PortalId {
  try {
    const p = window.location.pathname.toLowerCase()
    if (p.includes('dev-portal')) return 'dev'
    if (p.includes('admin-portal')) return 'admin'
  } catch {
    /* SSR/异常环境按运营端处理 */
  }
  return 'ops'
}

export interface LlmProviderMeta {
  id: LlmProvider
  /** 展示名 */
  name: string
  /** 默认接口地址（免费版端口） */
  endpoint: string
  /** 默认模型 */
  model: string
  /** 申请地址提示 */
  docUrl: string
}

/** 免费版服务商预设（官方免费额度/开放端口） */
export const LLM_PROVIDERS: LlmProviderMeta[] = [
  {
    id: 'deepseek',
    name: 'DeepSeek 免费版',
    endpoint: 'https://api.deepseek.com/v1/chat/completions',
    model: 'deepseek-chat',
    docUrl: 'https://platform.deepseek.com',
  },
  {
    id: 'doubao',
    name: '豆包免费版',
    endpoint: 'https://ark.cn-beijing.volces.com/api/v3/chat/completions',
    model: 'doubao-pro-32k',
    docUrl: 'https://console.volcengine.com/ark',
  },
  {
    id: 'coze',
    name: '扣子免费版',
    endpoint: 'https://api.coze.cn/v3/chat',
    model: '',
    docUrl: 'https://www.coze.cn',
  },
]

interface LlmConfigData {
  provider: LlmProvider
  apiKey: string
  endpoint: string
  model: string
  /** 扣子 Coze 机器人 ID（仅在 provider=coze 时使用） */
  botId?: string
  /** 配置锁定：锁定后管理端不可修改，仅开发端（最高控制权）可解锁 */
  locked?: boolean
  /** 最近一次修改来源门户 */
  updatedBy?: PortalId
  /** 最近一次修改时间 */
  updatedAt?: string
}

const STORAGE_KEY = 'qh_llm_config'
const DEFAULT_BOT_ID = 'suheng-os-agent'

function loadConfig(): LlmConfigData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as LlmConfigData
      if (parsed && typeof parsed === 'object') {
        return { ...parsed, botId: parsed.botId || DEFAULT_BOT_ID, locked: !!parsed.locked }
      }
    }
  } catch {
    /* ignore */
  }
  const preset = LLM_PROVIDERS[0]
  return { provider: 'deepseek', apiKey: '', endpoint: preset.endpoint, model: preset.model, botId: DEFAULT_BOT_ID, locked: false }
}

export const useLlmConfigStore = defineStore('llmConfig', () => {
  const data = ref<LlmConfigData>(loadConfig())
  /** 当前门户（模块加载时识别一次） */
  const portal = detectPortal()

  const providerMeta = computed<LlmProviderMeta>(
    () => LLM_PROVIDERS.find((p) => p.id === data.value.provider) ?? LLM_PROVIDERS[0],
  )
  /** 是否已配置有效密钥 */
  const configured = computed(() => !!data.value.apiKey.trim())

  /** 编辑权限：开发端始终可编辑（最高控制权）；管理端未锁定时可编辑；运营端只读 */
  const canEdit = computed(() =>
    portal === 'dev' ? true : portal === 'admin' ? !data.value.locked : false,
  )
  /** 锁定开关权限：仅开发端 */
  const canLock = computed(() => portal === 'dev')

  function persist() {
    try {
      data.value.updatedBy = portal
      data.value.updatedAt = new Date().toISOString()
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data.value))
    } catch {
      /* ignore */
    }
  }

  /** 锁定/解锁配置（仅开发端生效） */
  function setLocked(v: boolean) {
    if (portal !== 'dev') return
    data.value.locked = v
    persist()
  }

  function setProvider(p: LlmProvider) {
    const meta = LLM_PROVIDERS.find((m) => m.id === p)
    data.value.provider = p
    if (meta) {
      data.value.endpoint = meta.endpoint
      data.value.model = meta.model
    }
    persist()
  }

  function setApiKey(key: string) {
    data.value.apiKey = key.trim()
    persist()
  }

  function setEndpoint(url: string) {
    data.value.endpoint = url.trim()
    persist()
  }

  function setModel(model: string) {
    data.value.model = model.trim()
    persist()
  }

  function setBotId(botId: string) {
    data.value.botId = botId.trim() || DEFAULT_BOT_ID
    persist()
  }

  function reset() {
    const preset = LLM_PROVIDERS[0]
    data.value = { provider: 'deepseek', apiKey: '', endpoint: preset.endpoint, model: preset.model, botId: DEFAULT_BOT_ID, locked: data.value.locked }
    persist()
  }

  return {
    data,
    providerMeta,
    configured,
    portal,
    canEdit,
    canLock,
    setLocked,
    setProvider,
    setApiKey,
    setEndpoint,
    setModel,
    setBotId,
    reset,
  }
})
