// 素衡OS · AI 服务配置
// 支持接入 DeepSeek 免费版 / 豆包免费版 / 扣子免费版（Coze）
// 配置持久化到 localStorage：qh_llm_config
import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

export type LlmProvider = 'deepseek' | 'doubao' | 'coze'

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
}

const STORAGE_KEY = 'qh_llm_config'

function loadConfig(): LlmConfigData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as LlmConfigData
      if (parsed && typeof parsed === 'object') return parsed
    }
  } catch {
    /* ignore */
  }
  const preset = LLM_PROVIDERS[0]
  return { provider: 'deepseek', apiKey: '', endpoint: preset.endpoint, model: preset.model }
}

export const useLlmConfigStore = defineStore('llmConfig', () => {
  const data = ref<LlmConfigData>(loadConfig())

  const providerMeta = computed<LlmProviderMeta>(
    () => LLM_PROVIDERS.find((p) => p.id === data.value.provider) ?? LLM_PROVIDERS[0],
  )
  /** 是否已配置有效密钥 */
  const configured = computed(() => !!data.value.apiKey.trim())

  function persist() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data.value))
    } catch {
      /* ignore */
    }
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

  function reset() {
    const preset = LLM_PROVIDERS[0]
    data.value = { provider: 'deepseek', apiKey: '', endpoint: preset.endpoint, model: preset.model }
    persist()
  }

  return {
    data,
    providerMeta,
    configured,
    setProvider,
    setApiKey,
    setEndpoint,
    setModel,
    reset,
  }
})
