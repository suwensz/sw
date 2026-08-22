// 素衡OS · AI 服务配置
// 支持接入 DeepSeek 免费版 / 豆包免费版 / 扣子免费版（Coze）
// 配置双层存储：
//   1) 服务端密钥保险箱（suheng-gateway，AES-256-GCM 加密落盘）—— 权威来源
//      明文 API Key 永不离开网关；LLM 调用时网关用真实 Key 转发
//   2) 浏览器 localStorage：qh_llm_config（同源三端门户共享）—— 降级与 UI 状态
//      仅存脱敏 Key（***末4位）+ 元数据；网关不可达时仍可显示配置
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
  /** 保险箱是否已存有明文 Key（脱敏视图同步而来；前端不持有明文） */
  hasKey?: boolean
  endpoint: string
  model: string
  /** 扣子 Coze 机器人 ID（仅在 provider=coze 时使用） */
  botId?: string
  /** 配置锁定：锁定后管理端不可修改，仅开发端（最高控制权）可解锁 */
  locked?: boolean
  /** 最近一次修改来源门户 */
  updatedBy?: PortalId | string | null
  /** 最近一次修改时间 */
  updatedAt?: string | null
}

const STORAGE_KEY = 'qh_llm_config'
const DEFAULT_BOT_ID = 'suheng-os-agent'
/** 密钥保险箱接口（经 static-server 转发到 suheng-gateway） */
const VAULT_URL = (import.meta.env.VITE_LLM_PROXY as string) === 'off'
  ? ''
  : '/api/vault'

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
  return { provider: 'deepseek', apiKey: '', hasKey: false, endpoint: preset.endpoint, model: preset.model, botId: DEFAULT_BOT_ID, locked: false }
}

export const useLlmConfigStore = defineStore('llmConfig', () => {
  const data = ref<LlmConfigData>(loadConfig())
  /** 当前门户（模块加载时识别一次） */
  const portal = detectPortal()

  const providerMeta = computed<LlmProviderMeta>(
    () => LLM_PROVIDERS.find((p) => p.id === data.value.provider) ?? LLM_PROVIDERS[0],
  )
  /** 是否已配置有效密钥：本地明文 Key 或保险箱脱敏标记任一为真即视为已配置 */
  const configured = computed(
    () => !!(data.value.apiKey && !data.value.apiKey.startsWith('***')) || !!data.value.hasKey,
  )

  /** 编辑权限：开发端始终可编辑（最高控制权）；管理端未锁定时可编辑；运营端只读 */
  const canEdit = computed(() =>
    portal === 'dev' ? true : portal === 'admin' ? !data.value.locked : false,
  )
  /** 锁定开关权限：仅开发端 */
  const canLock = computed(() => portal === 'dev')

  /** 写 localStorage（脱敏 Key 也写入，便于三端共享 UI 状态；明文 Key 仅在内存 transient） */
  function writeLocal() {
    try {
      const persistable = {
        ...data.value,
        // localStorage 不持久化明文 Key：hasKey 标记已足够 UI 判断
        apiKey: data.value.apiKey && data.value.apiKey.startsWith('***') ? data.value.apiKey : '',
        hasKey: data.value.hasKey,
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(persistable))
      // 内存里若已被清空明文 Key，下次读取时由 hasKey + 脱敏维持显示
      if (!data.value.apiKey || data.value.apiKey.startsWith('***')) {
        data.value.apiKey = persistable.apiKey
      }
    } catch {
      /* ignore */
    }
  }

  /** 把配置推送到服务端密钥保险箱（开发/管理端可调用，运营端被网关拒绝） */
  async function pushToVault(patch: Record<string, unknown>) {
    if (!VAULT_URL) return
    try {
      await fetch(VAULT_URL, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'X-Portal': portal },
        body: JSON.stringify(patch),
      })
    } catch {
      /* 网关不可达：降级为仅 localStorage，调用层自动回退本地知识库 */
    }
  }

  /** 从服务端保险箱同步脱敏视图（启动时与门户切换时调用） */
  async function syncFromVault() {
    if (!VAULT_URL) return
    try {
      const res = await fetch(VAULT_URL)
      if (!res.ok) return
      const json = (await res.json()) as { ok: boolean; config?: Partial<LlmConfigData> }
      if (json.ok && json.config) {
        const c = json.config
        data.value.provider = (c.provider as LlmProvider) || data.value.provider
        data.value.apiKey = c.apiKey || data.value.apiKey
        data.value.hasKey = c.hasKey
        data.value.endpoint = c.endpoint || data.value.endpoint
        data.value.model = c.model || data.value.model
        data.value.botId = c.botId || data.value.botId
        data.value.locked = c.locked
        data.value.updatedBy = c.updatedBy
        data.value.updatedAt = c.updatedAt
        writeLocal()
      }
    } catch {
      /* ignore */
    }
  }

  /** 持久化：写 localStorage + 推送保险箱（记录变更来源与时间） */
  function persist() {
    data.value.updatedBy = portal
    data.value.updatedAt = new Date().toISOString()
    writeLocal()
    void pushToVault({
      provider: data.value.provider,
      apiKey: data.value.apiKey && !data.value.apiKey.startsWith('***') ? data.value.apiKey : undefined,
      endpoint: data.value.endpoint,
      model: data.value.model,
      botId: data.value.botId,
      locked: data.value.locked,
    })
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
    data.value.hasKey = !!data.value.apiKey && !data.value.apiKey.startsWith('***')
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
    data.value = {
      provider: 'deepseek',
      apiKey: '',
      hasKey: false,
      endpoint: preset.endpoint,
      model: preset.model,
      botId: DEFAULT_BOT_ID,
      locked: data.value.locked,
    }
    persist()
  }

  // 启动时异步从保险箱同步（拉取脱敏视图与锁定态）
  void syncFromVault()

  return {
    data,
    providerMeta,
    configured,
    portal,
    canEdit,
    canLock,
    syncFromVault,
    setLocked,
    setProvider,
    setApiKey,
    setEndpoint,
    setModel,
    setBotId,
    reset,
  }
})
