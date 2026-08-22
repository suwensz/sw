// 素衡OS · 工具服务（阶段3 Function Calling）
// 调用 suheng-gateway：
//   - askAgent()          智能体循环：POST /api/llm/agent（网关注入域工具并执行 ≤3 轮 tool_calls）
//   - listTools()         工具清单（调试面板）：GET /api/tools/list
//   - invokeTool()        单工具直接调用（调试面板，dev 权限）：POST /api/tools/invoke
import type { Domain } from '@/services/knowledge'

const BASE = (import.meta.env.VITE_LLM_PROXY as string) === 'off' ? '' : '/api'
const AGENT_URL = BASE ? `${BASE}/llm/agent` : ''
const TOOLS_URL = BASE ? `${BASE}/tools` : ''

/** 工具调用轨迹项（网关返回） */
export interface ToolTraceItem {
  name: string
  args: Record<string, unknown>
  /** 数据来源：local-fallback（本地演示数据）/ 1688-open / suheng-kb / error */
  provider: string
  latency_ms: number
  ok: boolean
}

/** 工具清单条目 */
export interface ToolMeta {
  name: string
  description: string
  parameters: Record<string, unknown>
  domains: string[]
}

export interface AgentResult {
  answer: string
  tool_trace: ToolTraceItem[]
}

/**
 * 智能体循环：网关侧注入域工具 + Function Calling + 工具本地执行。
 * 失败返回 null（上层退化为普通 askLLM 链路）。
 */
export async function askAgent(
  domain: Domain,
  question: string,
  history: Array<{ role: 'user' | 'assistant'; content: string }> = [],
  system = '',
): Promise<AgentResult | null> {
  if (!AGENT_URL || !question.trim()) return null
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 60000)
    const res = await fetch(AGENT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ domain, question, history, system }),
      signal: controller.signal,
    })
    clearTimeout(timer)
    if (!res.ok) return null
    const json = (await res.json()) as { ok: boolean; answer?: string; tool_trace?: ToolTraceItem[] }
    if (!json.ok || !json.answer) return null
    return { answer: json.answer, tool_trace: Array.isArray(json.tool_trace) ? json.tool_trace : [] }
  } catch {
    return null
  }
}

/** 工具清单（静默失败返回 null） */
export async function listTools(): Promise<{ tools: ToolMeta[]; ali1688Configured: boolean } | null> {
  if (!TOOLS_URL) return null
  try {
    const res = await fetch(`${TOOLS_URL}/list`)
    if (!res.ok) return null
    const json = (await res.json()) as { ok: boolean; tools: ToolMeta[]; ali1688Configured: boolean }
    if (!json.ok) return null
    return { tools: json.tools, ali1688Configured: !!json.ali1688Configured }
  } catch {
    return null
  }
}

/** 单工具直接调用（调试面板，仅开发端；静默失败返回 null） */
export async function invokeTool(
  name: string,
  args: Record<string, unknown>,
): Promise<{ ok: boolean; data?: unknown; error?: string; trace?: { provider: string; latency_ms: number } } | null> {
  if (!TOOLS_URL) return null
  try {
    const res = await fetch(`${TOOLS_URL}/invoke`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Portal': 'dev' },
      body: JSON.stringify({ name, args }),
    })
    return await res.json()
  } catch {
    return null
  }
}
