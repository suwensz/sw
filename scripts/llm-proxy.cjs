/**
 * 素衡OS · AI 服务统一网关（suheng-gateway）
 *
 * 由原 llm-proxy 升级而来，在「转发 LLM 请求」之外新增「密钥保险箱」能力：
 *   - 所有 AI 服务密钥（DeepSeek/豆包/扣子/Embedding）以 AES-256-GCM 加密落盘
 *   - 三端权限：开发端可写、管理端未锁定可写、运营端只读（校验 X-Portal 头）
 *   - 列表接口返回脱敏 Key（仅末 4 位），明文 Key 永不出网关
 *
 * 端点：
 *   GET  /health         健康检查
 *   POST /llm            LLM 请求转发（保持原协议：{endpoint, apiKey, payload}）
 *   GET  /vault          读取保险箱配置（脱敏）
 *   PUT  /vault          保存配置（需 X-Portal 头，按权限校验）
 *   POST /vault/probe    用保险箱真实 Key 测试服务商连通性
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
const crypto = require('crypto')
const fs = require('fs')
const path = require('path')

const HOST = process.env.HOST || '127.0.0.1'
const PORT = Number(process.env.PORT) || 8898

/** 保险箱文件位置（与脚本同目录的 .vault.json，加密存储） */
const VAULT_FILE = path.join(__dirname, '.vault.json')
/** 主密钥：优先环境变量，未设置时用开发默认值（仅演示，生产必须指定 SUHENG_VAULT_KEY） */
const VAULT_KEY =
  process.env.SUHENG_VAULT_KEY || 'suheng-os-dev-vault-key-please-change-in-production'

/** 默认配置（首次启动或文件丢失时） */
const DEFAULT_VAULT = {
  provider: 'deepseek',
  apiKey: '',
  endpoint: 'https://api.deepseek.com/v1/chat/completions',
  model: 'deepseek-chat',
  botId: 'suheng-os-agent',
  locked: false,
  updatedBy: null,
  updatedAt: null,
}

/* ============== 加密原语（AES-256-GCM） ============== */

/** 从任意长度 passphrase 派生 32 字节密钥（SHA-256） */
function deriveKey(pass) {
  return crypto.createHash('sha256').update(String(pass)).digest()
}

/** 加密并写盘 */
function saveVault(obj) {
  const plain = JSON.stringify(obj)
  const key = deriveKey(VAULT_KEY)
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv)
  const enc = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  const blob = Buffer.concat([iv, tag, enc])
  fs.writeFileSync(VAULT_FILE, blob)
}

/** 读盘并解密；失败/不存在返回 DEFAULT_VAULT 副本 */
function loadVault() {
  try {
    if (!fs.existsSync(VAULT_FILE)) return { ...DEFAULT_VAULT }
    const blob = fs.readFileSync(VAULT_FILE)
    if (blob.length < 28) return { ...DEFAULT_VAULT }
    const iv = blob.subarray(0, 12)
    const tag = blob.subarray(12, 28)
    const enc = blob.subarray(28)
    const key = deriveKey(VAULT_KEY)
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv)
    decipher.setAuthTag(tag)
    const dec = Buffer.concat([decipher.update(enc), decipher.final()]).toString('utf8')
    const parsed = JSON.parse(dec)
    return { ...DEFAULT_VAULT, ...parsed, locked: !!parsed.locked }
  } catch (err) {
    console.warn('[gateway] 保险箱解密失败，回退默认配置:', err.message)
    return { ...DEFAULT_VAULT }
  }
}

/* ============== 脱敏与权限 ============== */

/** 脱敏 API Key：保留末 4 位，前缀以长度提示 */
function maskKey(k) {
  if (!k) return ''
  const s = String(k)
  if (s.length <= 4) return '***'
  return '***' + s.slice(-4)
}

/** 返回脱敏后的保险箱视图（明文 Key 永不外泄） */
function vaultView() {
  const v = loadVault()
  return {
    provider: v.provider,
    apiKey: maskKey(v.apiKey),
    hasKey: !!v.apiKey,
    endpoint: v.endpoint,
    model: v.model,
    botId: v.botId,
    locked: v.locked,
    updatedBy: v.updatedBy,
    updatedAt: v.updatedAt,
  }
}

/**
 * 保存配置（按门户权限校验）
 * @param {object} patch 待合并字段
 * @param {string} portal 调用方门户（dev/admin/ops）
 * @returns {{ok:boolean, error?:string}}
 */
function setVaultConfig(patch, portal) {
  if (portal !== 'dev' && portal !== 'admin') {
    return { ok: false, error: '运营端只读，无写入权限' }
  }
  const cur = loadVault()
  // 锁定态：仅开发端可写（含解锁动作本身）
  if (cur.locked && portal !== 'dev') {
    return { ok: false, error: '配置已锁定，仅开发端可修改' }
  }
  const next = { ...cur, ...patch, updatedBy: portal, updatedAt: new Date().toISOString() }
  saveVault(next)
  return { ok: true }
}

/* ============== 测试连接（用真实 Key） ============== */

/** 用保险箱真实 Key 对服务商发起最小请求 */
function probeVault() {
  return new Promise((resolve) => {
    const v = loadVault()
    if (!v.apiKey || !v.endpoint) {
      resolve({ ok: false, code: 'NO_KEY', detail: '保险箱未配置 API Key 或接口地址' })
      return
    }
    const isCoze = v.provider === 'coze'
    const payload = isCoze
      ? {
          bot_id: v.botId || 'suheng-os-agent',
          user_id: 'suheng-os-user',
          stream: false,
          auto_save_history: false,
          additional_messages: [{ role: 'user', content: '你好，请用一句话简单回复' }],
        }
      : {
          model: v.model || 'deepseek-chat',
          messages: [{ role: 'user', content: '你好，请用一句话简单回复' }],
          temperature: 0.3,
          max_tokens: 64,
          stream: false,
        }
    forward({ endpoint: v.endpoint, apiKey: v.apiKey, payload })
      .then((up) => {
        if (up.status >= 200 && up.status < 300) {
          resolve({ ok: true, code: 'OK', detail: up.body.slice(0, 120) })
        } else {
          resolve({ ok: false, code: 'UPSTREAM_ERROR', detail: `HTTP ${up.status} ${up.body.slice(0, 180)}` })
        }
      })
      .catch((err) => {
        resolve({ ok: false, code: 'PROXY_ERROR', detail: String(err.message || err) })
      })
  })
}

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

/* ============== HTTP 路由 ============== */

const server = http.createServer(async (req, res) => {
  // CORS：允许任意来源（本地回环工具）
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Portal')

  // 健康检查
  if (req.method === 'GET' && req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' })
    res.end(
      JSON.stringify({
        ok: true,
        service: 'suheng-gateway',
        version: 2,
        uptime: process.uptime(),
        vault: fs.existsSync(VAULT_FILE),
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
    sendJson(res, 200, { ok: true, config: vaultView() })
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
      const result = setVaultConfig(patch, portal)
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
      const v = keyUsable ? null : loadVault()
      const finalEndpoint = endpoint || (v && v.endpoint) || ''
      const finalApiKey = keyUsable ? apiKey : (v && v.apiKey) || ''
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

  sendJson(res, 404, { error: 'not found; endpoints: GET /health, GET /vault, PUT /vault, POST /vault/probe, POST /llm' })
})

server.listen(PORT, HOST, () => {
  console.log(`[suheng-gateway] 素衡OS AI 网关已启动  http://${HOST}:${PORT}`)
  console.log(`[suheng-gateway] LLM 转发 POST /llm  |  密钥保险箱 GET/PUT /vault  |  测试连接 POST /vault/probe`)
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
