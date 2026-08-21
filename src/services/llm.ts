// 素衡OS · AI 服务层
// 统一入口 askAI(domain, question, history)：
//   1. 已配置密钥 → 调用所选服务商（DeepSeek 免费版 / 豆包免费版 / 扣子免费版）
//   2. 未配置或调用失败 → 回退本地知识库回答引擎（services/knowledge）
// 请求链路（解决浏览器 CORS 限制）：
//   代理优先 → 直连兜底 → 本地知识库
//   - 代理：POST /api/llm（由 scripts/llm-proxy.cjs 提供，Vite dev 代理自动转发到 127.0.0.1:8899，
//     Electron 桌面端启动时自动拉起；生产 Web 部署请自行把 /api/llm 反代到 llm-proxy 或服务端代理）
//   - 直连：DeepSeek 官方支持浏览器跨域；豆包/扣子通常被浏览器拦截，此时依赖代理
//   - 密钥仅保存在浏览器 localStorage，供演示/内网部署使用。
import { useLlmConfigStore, LLM_PROVIDERS } from '@/stores/llmConfig'
import { localAnswer, type Domain } from '@/services/knowledge'

/** 本地代理地址：同源 /api/llm（推荐），可用 VITE_LLM_PROXY 覆盖 */
const PROXY_URL = (import.meta.env.VITE_LLM_PROXY as string) || '/api/llm'

/** 代理是否开启（构建时置 VITE_LLM_PROXY=off 可关闭） */
const PROXY_ENABLED = PROXY_URL !== 'off'

/** 经本地代理转发；失败返回 null（由上层走直连或本地兜底） */
async function callProxy(
  endpoint: string,
  apiKey: string,
  payload: Record<string, unknown>,
): Promise<{ ok: boolean; status: number; text: string } | null> {
  if (!PROXY_ENABLED) return null
  try {
    const res = await withTimeout(
      fetch(PROXY_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint, apiKey, payload }),
      }),
    )
    const text = await res.text()
    return { ok: res.ok, status: res.status, text }
  } catch {
    return null
  }
}

/** 解析 OpenAI 兼容响应文本 */
function parseOpenAiText(text: string): string | null {
  try {
    const data = JSON.parse(text)
    return data?.choices?.[0]?.message?.content ?? null
  } catch {
    return null
  }
}

/** 解析 Coze v3 响应文本 */
function parseCozeText(text: string): string | null {
  try {
    const data = JSON.parse(text)
    const answer = data?.data?.[0]?.content
    return answer ? String(answer) : null
  } catch {
    return null
  }
}

export interface LlmMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface AiResult {
  answer: string
  /** 回答来源：llm = 云端 AI，local = 本地知识库 */
  source: 'llm' | 'local'
}

/** 各域系统提示词：要求 AI 依据素衡本系统内置数据库回答 */
function buildSystemPrompt(domain: Domain): string {
  const common =
    '你是素衡OS的AI智能体。请依据本系统内置数据库回答主人问题，内容专业、条理清晰、语气温和。如数据不足请说明。'
  switch (domain) {
    case 'tcm':
      return `${common} 你是中医健康专家，请结合中医健康大数据、五运六气数据库、九种体质数据库、药食同源食谱库回答。`
    case 'ecom':
      return `${common} 你是跨境电商专家，请结合采购信息数据库（询价单/报价/MOQ/交期）、跨境电商平台数据库、供应链数据回答。`
    case 'domestic':
      return `${common} 你是国内电商专家，请结合淘宝、拼多多、京东数据库（平台/商品/订单）回答。`
    case 'general':
      return `${common} 你可综合回答中医健康、跨境电商、国内电商相关问题。唤醒时先向主人问好，再回答问题。`
  }
}

/** 超时控制：15 秒 */
function withTimeout(promise: Promise<Response>, ms = 15000): Promise<Response> {
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => reject(new Error('timeout')), ms)
    promise.then(
      (res) => {
        window.clearTimeout(timer)
        resolve(res)
      },
      (err) => {
        window.clearTimeout(timer)
        reject(err)
      },
    )
  })
}

/** OpenAI 兼容格式调用（DeepSeek / 豆包）—— 代理优先，直连兜底 */
async function callOpenAICompatible(
  endpoint: string,
  apiKey: string,
  model: string,
  messages: LlmMessage[],
): Promise<string | null> {
  const payload = {
    model: model || 'deepseek-chat',
    messages,
    temperature: 0.7,
    max_tokens: 1024,
    stream: false,
  }
  // 1) 本地代理（规避 CORS）
  const viaProxy = await callProxy(endpoint, apiKey, payload)
  if (viaProxy) {
    if (viaProxy.ok) {
      const text = parseOpenAiText(viaProxy.text)
      if (text) return text
    } else if (viaProxy.status < 500) {
      // 上游正常响应但报错（4xx：key 无效 / 模型未开通等），直连必同样失败
      return null
    }
    // 5xx（代理未启动/网关错误）→ 落到下方直连兜底
  }
  // 2) 直连兜底（DeepSeek 支持浏览器跨域）
  try {
    const res = await withTimeout(
      fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(payload),
      }),
    )
    if (!res.ok) return null
    const data = await res.json()
    return data?.choices?.[0]?.message?.content ?? null
  } catch {
    return null
  }
}

/** 扣子 Coze v3 chat 调用 —— 代理优先，直连兜底 */
async function callCoze(
  endpoint: string,
  apiKey: string,
  botId: string,
  question: string,
): Promise<string | null> {
  const payload = {
    bot_id: botId || 'suheng-os-agent',
    user_id: 'suheng-os-user',
    stream: false,
    auto_save_history: true,
    additional_messages: [{ role: 'user', content: question }],
  }
  // 1) 本地代理（规避 CORS）
  const viaProxy = await callProxy(endpoint, apiKey, payload)
  if (viaProxy) {
    if (viaProxy.ok) {
      const text = parseCozeText(viaProxy.text)
      if (text) return text
    } else if (viaProxy.status < 500) {
      return null
    }
    // 5xx → 走直连兜底
  }
  // 2) 直连兜底
  try {
    const res = await withTimeout(
      fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(payload),
      }),
    )
    if (!res.ok) return null
    const data = await res.json()
    const answer = data?.data?.[0]?.content
    return answer ? String(answer) : null
  } catch {
    return null
  }
}

/** 调用已配置的云端 LLM；失败返回 null（由上层回退本地知识库） */
export async function askLLM(
  domain: Domain,
  question: string,
  history: Array<{ role: 'user' | 'assistant'; content: string }> = [],
): Promise<string | null> {
  const cfg = useLlmConfigStore()
  if (!cfg.configured || !cfg.data.endpoint) return null

  const system = buildSystemPrompt(domain)
  const userMsg = question

  try {
    if (cfg.data.provider === 'coze') {
      // Coze 简化为单轮 + 最近一条上下文
      const last = history[history.length - 1]
      const content = last ? `（对话上文）${last.content}\n（当前提问）${userMsg}` : userMsg
      return await callCoze(cfg.data.endpoint, cfg.data.apiKey, cfg.data.botId || '', content)
    }
    const messages: LlmMessage[] = [
      { role: 'system', content: system },
      ...history.map((h) => ({ role: h.role, content: h.content })),
      { role: 'user', content: userMsg },
    ]
    return await callOpenAICompatible(cfg.data.endpoint, cfg.data.apiKey, cfg.data.model, messages)
  } catch {
    return null
  }
}

/* ---------------- 一键测试连接（配置面板用） ---------------- */

export type LlmProbeCode = 'OK' | 'NO_KEY' | 'NO_ENDPOINT' | 'PROXY_DOWN' | 'KEY_INVALID' | 'MODEL_ERROR' | 'PARSE_ERROR'

export interface LlmProbeResult {
  ok: boolean
  code: LlmProbeCode
  /** 服务商原始错误信息（含服务商原生文案，便于定位） */
  detail?: string
}

/** 从服务商错误响应文本推断错误类型 */
function classifyError(text: string): Extract<LlmProbeCode, 'KEY_INVALID' | 'MODEL_ERROR'> {
  const t = text.toLowerCase()
  const authHit = /auth|token|key|401|403|unauthorized|permission/i.test(t)
  const modelHit = /model|not found|404|bot|project_id|access to the model/i.test(t)
  if (authHit) return 'KEY_INVALID'
  if (modelHit) return 'MODEL_ERROR'
  return 'MODEL_ERROR'
}

/**
 * 一键测试连接：对当前服务商发起最小请求，返回结构化诊断。
 * 链路与 askLLM 一致（代理优先 → 直连），失败原因可区分：
 *   代理未启动 / Key 无效 / 模型或 Bot 错误 / 成功
 */
export async function testLLMConnection(): Promise<LlmProbeResult> {
  const cfg = useLlmConfigStore()
  if (!cfg.data.apiKey.trim()) return { ok: false, code: 'NO_KEY' }
  if (!cfg.data.endpoint.trim()) return { ok: false, code: 'NO_ENDPOINT' }

  const probe = '你好，请用一句话简单回复'
  const probeMsgs: LlmMessage[] = [{ role: 'user', content: probe }]

  // 构建最小请求体
  const isCoze = cfg.data.provider === 'coze'
  const payload: Record<string, unknown> = isCoze
    ? {
        bot_id: cfg.data.botId || 'suheng-os-agent',
        user_id: 'suheng-os-user',
        stream: false,
        auto_save_history: false,
        additional_messages: probeMsgs,
      }
    : {
        model: cfg.data.model || 'deepseek-chat',
        messages: probeMsgs,
        temperature: 0.3,
        max_tokens: 64,
        stream: false,
      }

  // 1) 代理优先
  const viaProxy = await callProxy(cfg.data.endpoint, cfg.data.apiKey, payload)
  if (viaProxy) {
    if (viaProxy.ok) {
      const text = isCoze ? parseCozeText(viaProxy.text) : parseOpenAiText(viaProxy.text)
      if (text) return { ok: true, code: 'OK', detail: text.slice(0, 80) }
      return { ok: false, code: 'PARSE_ERROR', detail: viaProxy.text.slice(0, 200) }
    }
    if (viaProxy.status < 500) {
      const code = classifyError(viaProxy.text)
      return { ok: false, code, detail: viaProxy.text.slice(0, 200) }
    }
    // 5xx → 代理已连上但上游网关错误，或代理异常
    return { ok: false, code: 'PROXY_DOWN', detail: `代理返回 HTTP ${viaProxy.status}` }
  }

  // 2) 直连兜底
  try {
    const res = await withTimeout(
      fetch(cfg.data.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${cfg.data.apiKey}` },
        body: JSON.stringify(payload),
      }),
    )
    const text = await res.text()
    if (res.ok) {
      const answer = isCoze ? parseCozeText(text) : parseOpenAiText(text)
      if (answer) return { ok: true, code: 'OK', detail: answer.slice(0, 80) }
      return { ok: false, code: 'PARSE_ERROR', detail: text.slice(0, 200) }
    }
    return { ok: false, code: classifyError(text), detail: text.slice(0, 200) }
  } catch {
    return { ok: false, code: 'PROXY_DOWN' }
  }
}

/** 统一 AI 问答入口：云端优先，本地知识库兜底 */
export async function askAI(
  domain: Domain,
  question: string,
  history: Array<{ role: 'user' | 'assistant'; content: string }> = [],
): Promise<AiResult> {
  const local = localAnswer(domain, question)
  const llm = await askLLM(domain, question, history)
  if (llm && llm.trim()) {
    return { answer: llm.trim(), source: 'llm' }
  }
  return { answer: local.answer, source: 'local' }
}

/** 服务商预设导出（供设置面板使用） */
export { LLM_PROVIDERS }
