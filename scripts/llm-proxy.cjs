/**
 * 素衡OS · AI 服务统一网关（suheng-gateway）
 *
 * 由原 llm-proxy 升级而来，在「转发 LLM 请求」之外提供：
 *   - 密钥保险箱（gateway/vault.cjs）：AES-256-GCM 加密落盘，三端权限校验
 *   - 知识库（gateway/kb.cjs）：SQLite + BM25/向量检索（阶段2 RAG）
 *
 * 端点：
 *   GET  /health           健康检查（含知识库统计）
 *   POST /llm              LLM 请求转发（保持原协议：{endpoint, apiKey, payload}）
 *   GET  /vault            读取保险箱配置（脱敏）
 *   PUT  /vault            保存配置（需 X-Portal 头，按权限校验）
 *   POST /vault/probe      用保险箱真实 Key 测试服务商连通性
 *   POST /kb/search        知识库检索 {query, domain, topK, filters}
 *   GET  /kb/stats         知识库统计
 *   POST /kb/ingest        导入文档（X-Portal: dev）
 *   POST /kb/embed/pending 补算缺失向量（X-Portal: dev）
 *   POST /llm/agent        Function Calling 智能体循环（阶段3：tools + ≤3轮工具调用）
 *   GET  /tools/list       已注册工具清单（调试面板）
 *   POST /tools/invoke     单工具直接调用（X-Portal: dev）
 *
 * 用法：
 *   node scripts/llm-proxy.cjs                       # 默认端口 8898
 *   PORT=8898 node scripts/llm-proxy.cjs
 *   SUHENG_VAULT_KEY=<32+字符> node scripts/llm-proxy.cjs   # 生产建议显式指定
 *
 * 安全提示：本地回环服务（默认只监听 127.0.0.1），仅用于开发/演示/内网。
 * 生产部署请把 SUHENG_VAULT_KEY 通过环境变量注入，勿用默认开发密钥。
 */
const http = require('http')
const https = require('https')
const fs = require('fs')

const vault = require('./gateway/vault.cjs')
const kb = require('./gateway/kb.cjs')
const tools = require('./gateway/tools/index.cjs')

const HOST = process.env.HOST || '127.0.0.1'
const PORT = Number(process.env.PORT) || 8898

/* ============== LLM 转发（原 llm-proxy 逻辑） ============== */

/** 读取请求体 */
function readBody(req) {
  return new Promise((resolve, reject) => {
    let raw = ''
    req.on('data', (chunk) => {
      raw += chunk
      if (raw.length > 2 * 1024 * 1024) {
        reject(new Error('request body too large'))
        req.destroy()
      }
    })
    req.on('end', () => resolve(raw))
    req.on('error', reject)
  })
}

/** 转发一次请求到目标服务商 */
function forward({ endpoint, apiKey, payload }) {
  return new Promise((resolve, reject) => {
    let url
    try {
      url = new URL(endpoint)
    } catch {
      reject(new Error('invalid endpoint'))
      return
    }
    if (url.protocol !== 'https:' && url.protocol !== 'http:') {
      reject(new Error('endpoint protocol must be http(s)'))
      return
    }
    const lib = url.protocol === 'https:' ? https : http
    const body = typeof payload === 'string' ? payload : JSON.stringify(payload)

    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
      ...(payload && typeof payload === 'object' && payload.stream
        ? { Accept: 'text/event-stream' }
        : {}),
    }

    const req = lib.request(
      url,
      {
        method: 'POST',
        headers,
        timeout: 60000,
      },
      (res) => {
        const chunks = []
        res.on('data', (c) => chunks.push(c))
        res.on('end', () => {
          const buf = Buffer.concat(chunks)
          resolve({
            status: res.statusCode || 500,
            body: buf.toString('utf8'),
            headers: res.headers,
          })
        })
        res.on('error', reject)
      },
    )
    req.on('timeout', () => {
      req.destroy(new Error('upstream timeout'))
    })
    req.on('error', reject)
    req.write(body)
    req.end()
  })
}

/** 写 JSON 响应 */
function sendJson(res, status, obj, extraHeaders) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    ...extraHeaders,
  })
  res.end(JSON.stringify(obj))
}

/* ============== Function Calling 智能体循环（阶段3） ============== */

const TOOL_MAX_ROUNDS = 3

/**
 * 智能体循环（网关侧执行，密钥不出网关）：
 *   body: { domain, question, history: [{role,content}], system?（前端已拼好 RAG 上下文） }
 *   返回: { ok, answer, tool_trace: [{name, args, provider, latency_ms, ok}] }
 */
async function agentLoop(body) {
  const v = vault.loadVault()
  const endpoint = v.endpoint
  const apiKey = vault.llmApiKey()
  const model = v.model || 'deepseek-chat'
  if (!endpoint || !apiKey) {
    return { ok: false, error: 'no apiKey available (vault empty or not configured)' }
  }
  if (v.provider === 'coze') {
    return { ok: false, error: 'coze provider does not support function calling' }
  }

  const domain = ['tcm', 'ecom', 'domestic', 'general'].includes(body.domain) ? body.domain : 'general'
  const question = String(body.question || '').trim()
  if (!question) return { ok: false, error: 'missing question' }

  const system =
    typeof body.system === 'string' && body.system.trim()
      ? body.system
      : '你是素衡OS的AI智能体。请依据本系统内置数据库回答问题，内容专业、条理清晰、语温和。如数据不足请说明。需要实时数据时可调用工具查询。'

  const messages = [
    { role: 'system', content: system },
    ...(Array.isArray(body.history) ? body.history : []),
    { role: 'user', content: question },
  ]
  const llmTools = tools.toolsForDomain(domain)

  const toolTrace = []
  for (let round = 0; round < TOOL_MAX_ROUNDS; round++) {
    const payload = {
      model,
      messages,
      tools: llmTools,
      tool_choice: 'auto',
      temperature: 0.7,
      max_tokens: 1024,
      stream: false,
    }
    const upstream = await forward({ endpoint, apiKey, payload })
    if (upstream.status !== 200) {
      return { ok: false, error: `upstream ${upstream.status}: ${upstream.body.slice(0, 300)}`, tool_trace: toolTrace }
    }
    let data
    try {
      data = JSON.parse(upstream.body)
    } catch {
      return { ok: false, error: 'upstream response parse error', tool_trace: toolTrace }
    }
    const msg = data && data.choices && data.choices[0] && data.choices[0].message
    if (!msg) {
      return { ok: false, error: 'upstream response missing message', tool_trace: toolTrace }
    }
    const calls = Array.isArray(msg.tool_calls) ? msg.tool_calls : []
    if (!calls.length) {
      const answer = typeof msg.content === 'string' ? msg.content.trim() : ''
      return { ok: true, answer, tool_trace: toolTrace }
    }
    // 记录 assistant 的 tool_calls 消息后逐个执行
    messages.push({ role: 'assistant', content: msg.content || '', tool_calls: calls })
    for (const tc of calls) {
      const fname = tc && tc.function && tc.function.name
      let args = {}
      try {
        args = JSON.parse((tc.function && tc.function.arguments) || '{}')
      } catch {
        args = {}
      }
      const r = await tools.invokeTool(fname, args)
      toolTrace.push({
        name: fname,
        args,
        provider: r.trace.provider,
        latency_ms: r.trace.latency_ms,
        ok: r.ok,
      })
      messages.push({
        role: 'tool',
        tool_call_id: tc.id,
        content: JSON.stringify(r.ok ? r.data : { error: r.error }).slice(0, 8000),
      })
    }
  }
  // 轮次用尽：最后不带 tools 再要一次总结性回答
  const summary = await forward({
    endpoint,
    apiKey,
    payload: {
      model,
      messages,
      temperature: 0.7,
      max_tokens: 1024,
      stream: false,
    },
  })
  let finalAnswer = ''
  try {
    finalAnswer = (JSON.parse(summary.body).choices?.[0]?.message?.content || '').trim()
  } catch {
    finalAnswer = ''
  }
  return {
    ok: !!finalAnswer,
    answer: finalAnswer || '（工具调用轮次已达上限，未能生成最终答案）',
    tool_trace: toolTrace,
  }
}

/* ============== HTTP 路由 ============== */

const server = http.createServer(async (req, res) => {
  // CORS：允许任意来源（本地回环工具）
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Portal')

  // 健康检查（含知识库统计）
  if (req.method === 'GET' && req.url === '/health') {
    let kbStats = null
    try {
      kbStats = kb.stats()
    } catch {
      /* kb 模块异常不影响健康检查 */
    }
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' })
    res.end(
      JSON.stringify({
        ok: true,
        service: 'suheng-gateway',
        version: 3,
        uptime: process.uptime(),
        vault: fs.existsSync(vault.VAULT_FILE),
        kb: kbStats,
      }),
    )
    return
  }
  // 预检
  if (req.method === 'OPTIONS') {
    res.writeHead(204)
    res.end()
    return
  }

  // 密钥保险箱：读取（脱敏）
  if (req.method === 'GET' && req.url === '/vault') {
    sendJson(res, 200, { ok: true, config: vault.vaultView() })
    return
  }

  // 密钥保险箱：保存（按门户权限校验）
  if (req.method === 'PUT' && req.url === '/vault') {
    try {
      const raw = await readBody(req)
      let patch
      try {
        patch = JSON.parse(raw)
      } catch {
        sendJson(res, 400, { ok: false, error: 'invalid json body' })
        return
      }
      const portal = (req.headers['x-portal'] || 'ops').toString()
      const result = vault.setVaultConfig(patch, portal)
      sendJson(res, result.ok ? 200 : 403, result)
    } catch (err) {
      sendJson(res, 500, { ok: false, error: String((err && err.message) || err) })
    }
    return
  }

  // 密钥保险箱：测试连接（用真实 Key，不返回 Key）
  if (req.method === 'POST' && req.url === '/vault/probe') {
    const result = await probeVault()
    sendJson(res, 200, result)
    return
  }

  // LLM 转发入口（支持 vault 补全：前端未传 endpoint/apiKey 或传入脱敏占位时，
  // 自动从保险箱取真实值，使明文密钥永不出网关）
  if (req.method === 'POST' && req.url === '/llm') {
    try {
      const raw = await readBody(req)
      let data
      try {
        data = JSON.parse(raw)
      } catch {
        sendJson(res, 400, { error: 'invalid json body' })
        return
      }
      const { endpoint, apiKey, payload } = data || {}
      if (payload == null) {
        sendJson(res, 400, { error: 'missing payload' })
        return
      }
      // 判断前端是否传了可用 Key：空值或脱敏占位（以 *** 开头）都视为「未提供」
      const keyUsable = apiKey && !String(apiKey).startsWith('***')
      const v = keyUsable ? null : vault.loadVault()
      const finalEndpoint = endpoint || (v && v.endpoint) || ''
      const finalApiKey = keyUsable ? apiKey : (v && vault.llmApiKey()) || ''
      if (!finalEndpoint || !finalApiKey) {
        sendJson(res, 400, { error: 'no apiKey available (vault empty or not configured)' })
        return
      }
      // 模型补全：payload.model 缺失时用 vault.model（DeepSeek/豆包需要 model 字段）
      let finalPayload = payload
      if (typeof payload === 'object' && !payload.model && v && v.model && v.provider !== 'coze') {
        finalPayload = { ...payload, model: v.model }
      }
      const upstream = await forward({ endpoint: finalEndpoint, apiKey: finalApiKey, payload: finalPayload })
      res.writeHead(upstream.status, {
        'Content-Type': upstream.headers['content-type'] || 'application/json; charset=utf-8',
      })
      res.end(upstream.body)
    } catch (err) {
      sendJson(res, 502, { error: String((err && err.message) || err) })
    }
    return
  }

  /* ============== 知识库（阶段2 RAG） ============== */

  // 知识库检索（只读，无门户限制）
  if (req.method === 'POST' && req.url === '/kb/search') {
    try {
      const raw = await readBody(req)
      let body
      try {
        body = JSON.parse(raw)
      } catch {
        sendJson(res, 400, { ok: false, error: 'invalid json body' })
        return
      }
      const result = await kb.search(body || {})
      sendJson(res, 200, { ok: true, ...result })
    } catch (err) {
      sendJson(res, 500, { ok: false, error: String((err && err.message) || err) })
    }
    return
  }

  // 知识库统计（只读）
  if (req.method === 'GET' && req.url === '/kb/stats') {
    try {
      sendJson(res, 200, { ok: true, ...kb.stats() })
    } catch (err) {
      sendJson(res, 500, { ok: false, error: String((err && err.message) || err) })
    }
    return
  }

  // 知识库导入（仅开发端）
  if (req.method === 'POST' && req.url === '/kb/ingest') {
    const portal = (req.headers['x-portal'] || 'ops').toString()
    if (portal !== 'dev') {
      sendJson(res, 403, { ok: false, error: '知识库导入仅开发端可用' })
      return
    }
    try {
      const raw = await readBody(req)
      let body
      try {
        body = JSON.parse(raw)
      } catch {
        sendJson(res, 400, { ok: false, error: 'invalid json body' })
        return
      }
      const result = kb.ingest(body || {})
      sendJson(res, 200, result)
    } catch (err) {
      sendJson(res, 500, { ok: false, error: String((err && err.message) || err) })
    }
    return
  }

  // 补算缺失向量（仅开发端）
  if (req.method === 'POST' && req.url === '/kb/embed/pending') {
    const portal = (req.headers['x-portal'] || 'ops').toString()
    if (portal !== 'dev') {
      sendJson(res, 403, { ok: false, error: '仅开发端可用' })
      return
    }
    try {
      const result = await kb.embedPending()
      sendJson(res, result.ok ? 200 : 400, result)
    } catch (err) {
      sendJson(res, 500, { ok: false, error: String((err && err.message) || err) })
    }
    return
  }

  /* ============== Function Calling 智能体（阶段3） ============== */

  // 智能体循环：注入域工具 → LLM → tool_calls 本地执行 → 结果回传 → 最终答案（≤3轮）
  if (req.method === 'POST' && req.url === '/llm/agent') {
    try {
      const raw = await readBody(req)
      let body
      try {
        body = JSON.parse(raw)
      } catch {
        sendJson(res, 400, { ok: false, error: 'invalid json body' })
        return
      }
      const result = await agentLoop(body || {})
      sendJson(res, result.ok ? 200 : 400, result)
    } catch (err) {
      sendJson(res, 500, { ok: false, error: String((err && err.message) || err) })
    }
    return
  }

  // 工具清单（调试面板用）
  if (req.method === 'GET' && req.url === '/tools/list') {
    sendJson(res, 200, tools.listTools())
    return
  }

  // 单工具直接调用（仅开发端，调试用）
  if (req.method === 'POST' && req.url === '/tools/invoke') {
    const portal = (req.headers['x-portal'] || 'ops').toString()
    if (portal !== 'dev') {
      sendJson(res, 403, { ok: false, error: '工具调试仅开发端可用' })
      return
    }
    try {
      const raw = await readBody(req)
      let body
      try {
        body = JSON.parse(raw)
      } catch {
        sendJson(res, 400, { ok: false, error: 'invalid json body' })
        return
      }
      const { name, args, arguments: toolArgs } = body || {}
      if (!name) {
        sendJson(res, 400, { ok: false, error: 'missing tool name' })
        return
      }
      const result = await tools.invokeTool(name, args || toolArgs || {})
      sendJson(res, result.ok ? 200 : 400, result)
    } catch (err) {
      sendJson(res, 500, { ok: false, error: String((err && err.message) || err) })
    }
    return
  }

  sendJson(res, 404, { error: 'not found; endpoints: GET /health, GET/PUT /vault, POST /vault/probe, POST /llm, POST /llm/agent, POST /kb/search, GET /kb/stats, POST /kb/ingest, POST /kb/embed/pending, GET /tools/list, POST /tools/invoke' })
})

server.listen(PORT, HOST, () => {
  console.log(`[suheng-gateway] 素衡OS AI 网关已启动  http://${HOST}:${PORT}`)
  console.log(`[suheng-gateway] LLM 转发 POST /llm  |  密钥保险箱 GET/PUT /vault  |  知识库 POST /kb/search`)
  console.log(`[suheng-gateway] 智能体循环 POST /llm/agent  |  工具 GET /tools/list POST /tools/invoke` + (tools.listTools().ali1688Configured ? '（1688 已配置）' : '（L0 本地数据）'))
  const s = kb.stats()
  console.log(`[suheng-gateway] 知识库: ${s.docs} 文档 / ${s.chunks} 切片 / ${s.embedded} 向量${s.vectorReady ? '（向量检索就绪）' : '（BM25 检索）'}`)
  if (!process.env.SUHENG_VAULT_KEY) {
    console.warn('[suheng-gateway] 警告：未设置 SUHENG_VAULT_KEY 环境变量，使用开发默认密钥（仅演示）')
  }
})
server.on('error', (err) => {
  console.error('[suheng-gateway] 启动失败:', err.message)
  process.exit(1)
})

// 独立运行时不退出；被 electron main.cjs require 时导出 stop()
if (require.main === module) {
  // 已 listen
} else {
  module.exports = {
    stop() {
      server.close()
      console.log('[suheng-gateway] 网关已停止')
    },
  }
}
