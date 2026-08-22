// 素衡OS · 知识库检索服务（阶段2 RAG）
// 调用 suheng-gateway 的 /api/kb/search：
//   - 配置了 Embedding Key → 向量语义检索（vector）
//   - 未配置或失败 → BM25 关键词检索（bm25），始终可用
// 检索结果由 services/llm.askAI 注入 system prompt，实现「回答有出处」。
import type { Domain } from '@/services/knowledge'

const KB_URL = (import.meta.env.VITE_LLM_PROXY as string) === 'off' ? '' : '/api/kb/search'

export interface KbHit {
  chunk_id: number
  score: number
  doc_title: string
  doc_type: string
  text: string
  source: string
  meta?: Record<string, unknown>
}

export interface KbSearchResult {
  hits: KbHit[]
  mode: 'vector' | 'bm25'
}

/**
 * 检索知识库：静默失败（返回 null）——RAG 不可用时对话自动退化为纯 LLM 回答。
 */
export async function searchKb(
  domain: Domain,
  query: string,
  topK = 5,
): Promise<KbSearchResult | null> {
  if (!KB_URL || !query.trim()) return null
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 5000)
    const res = await fetch(KB_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, domain, topK }),
      signal: controller.signal,
    })
    clearTimeout(timer)
    if (!res.ok) return null
    const json = (await res.json()) as { ok: boolean } & KbSearchResult
    if (!json.ok || !Array.isArray(json.hits)) return null
    return { hits: json.hits, mode: json.mode }
  } catch {
    return null
  }
}
