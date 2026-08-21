// 素衡OS · AI 服务层
// 统一入口 askAI(domain, question, history)：
//   1. 已配置密钥 → 调用所选服务商（DeepSeek 免费版 / 豆包免费版 / 扣子免费版）
//   2. 未配置或调用失败 → 回退本地知识库回答引擎（services/knowledge）
// 纯前端直连：密钥仅保存在浏览器 localStorage，供演示/内网部署使用。
import { useLlmConfigStore, LLM_PROVIDERS } from '@/stores/llmConfig'
import { localAnswer, type Domain } from '@/services/knowledge'

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

/** OpenAI 兼容格式调用（DeepSeek / 豆包） */
async function callOpenAICompatible(
  endpoint: string,
  apiKey: string,
  model: string,
  messages: LlmMessage[],
): Promise<string | null> {
  const res = await withTimeout(
    fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: model || 'deepseek-chat',
        messages,
        temperature: 0.7,
        max_tokens: 1024,
        stream: false,
      }),
    }),
  )
  if (!res.ok) return null
  const data = await res.json()
  return data?.choices?.[0]?.message?.content ?? null
}

/** 扣子 Coze v3 chat 调用 */
async function callCoze(
  endpoint: string,
  apiKey: string,
  question: string,
): Promise<string | null> {
  const res = await withTimeout(
    fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        bot_id: 'suheng-os-agent',
        user_id: 'suheng-os-user',
        stream: false,
        auto_save_history: true,
        additional_messages: [{ role: 'user', content: question }],
      }),
    }),
  )
  if (!res.ok) return null
  const data = await res.json()
  const answer = data?.data?.[0]?.content
  return answer ? String(answer) : null
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
      return await callCoze(cfg.data.endpoint, cfg.data.apiKey, content)
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
