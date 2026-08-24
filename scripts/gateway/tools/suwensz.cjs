/**
 * 素衡OS · 素问数字 Tokens 分发器统一客户端（L2，阶段4a）
 *
 * vault keys.suwensz 配置 apiKey 后启用；未配置或调用失败时工具层自动降级（L1/L0）。
 * 分发器 https://api.suwensz.com/ 为 OpenAI 兼容网关，一个 key 承载两类流量：
 *   - LLM 转发：/v1/chat/completions、/v1/models（可作为素衡OS的 LLM provider）
 *   - 电商数据代理：/v1/ecom/products/search（platform 参数区分 1688/taobao/jd/amazon）
 *
 * 鉴权：Authorization: Bearer <apiKey>
 * 401/403 视为 key 失效（code='KEY_INVALID'），上层不静默降级，
 * 需提示用户登录 https://api.suwensz.com 重新生成 Tokens 并更新保险箱。
 *
 * 风格对齐 ali1688.cjs：Promise + https.request，零第三方依赖。
 */
const https = require('https')
const http = require('http')
const vault = require('../vault.cjs')

/** 分发器默认地址（vault keys.suwensz.endpoint 未配置时的回退值） */
const DEFAULT_ENDPOINT = 'https://api.suwensz.com'
/** 电商商品搜索端点（若与分发器文档不符，仅需改此常量） */
const ECOM_SEARCH_PATH = '/v1/ecom/products/search'
/** 支持的平台枚举（与 tools/index.cjs 的 search_platform_products schema 保持一致） */
const PLATFORMS = ['1688', 'taobao', 'jd', 'amazon']

/** 读取分发器凭据（未配置返回 null） */
function suwenszConfig() {
  const v = vault.loadVault()
  const s = v.keys.suwensz
  if (!s || !s.apiKey) return null
  return { apiKey: s.apiKey, endpoint: String(s.endpoint || DEFAULT_ENDPOINT).replace(/\/+$/, '') }
}

/** 构造「key 失效」错误（上层据此提示用户去 api.suwensz.com 换 key，不降级） */
function keyInvalidError(detail) {
  const err = new Error(
    `suwensz API Key 失效或无权限${detail ? '（' + detail + '）' : ''}：请登录 https://api.suwensz.com 重新生成 Tokens，` +
      '并在 开发端→密钥保险箱→suwensz 槽位 更新 apiKey',
  )
  err.code = 'KEY_INVALID'
  return err
}

/**
 * 通用 HTTP 请求（Promise，失败 reject）
 * @param {string} urlStr   完整 URL
 * @param {object} opts     { method, headers, body(object|string), timeout }
 */
function request(urlStr, { method = 'GET', headers = {}, body = null, timeout = 20000 } = {}) {
  return new Promise((resolve, reject) => {
    let url
    try {
      url = new URL(urlStr)
    } catch {
      reject(new Error('invalid suwensz endpoint url: ' + urlStr))
      return
    }
    if (url.protocol !== 'https:' && url.protocol !== 'http:') {
      reject(new Error('suwensz endpoint protocol must be http(s)'))
      return
    }
    const lib = url.protocol === 'https:' ? https : http
    const payload = body == null ? null : typeof body === 'string' ? body : JSON.stringify(body)

    const req = lib.request(
      url,
      {
        method,
        headers: {
          ...(payload ? { 'Content-Type': 'application/json' } : {}),
          ...headers,
          ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {}),
        },
        timeout,
      },
      (res) => {
        const chunks = []
        res.on('data', (c) => chunks.push(c))
        res.on('end', () => {
          const text = Buffer.concat(chunks).toString('utf8')
          // 401/403 → key 失效专用错误（上层不静默降级）
          if (res.statusCode === 401 || res.statusCode === 403) {
            reject(keyInvalidError('HTTP ' + res.statusCode + ' ' + text.slice(0, 120)))
            return
          }
          if (res.statusCode < 200 || res.statusCode >= 300) {
            reject(new Error('suwensz api HTTP ' + res.statusCode + ': ' + text.slice(0, 200)))
            return
          }
          try {
            resolve(JSON.parse(text))
          } catch {
            reject(new Error('suwensz api response parse error: ' + text.slice(0, 120)))
          }
        })
        res.on('error', reject)
      },
    )
    req.on('timeout', () => req.destroy(new Error('suwensz api timeout')))
    req.on('error', reject)
    if (payload) req.write(payload)
    req.end()
  })
}

/**
 * 调用分发器任意端点（Bearer 认证）
 * @param {string} path   形如 '/v1/models'（endpoint 已含协议与域名）
 * @param {object} params query 参数（method=GET）或 JSON body（method=POST）
 * @param {object} opts   { method='GET', timeout }
 */
async function callApi(path, params = {}, opts = {}) {
  const cfg = suwenszConfig()
  if (!cfg) {
    const err = new Error('suwensz not configured')
    err.code = 'NOT_CONFIGURED'
    throw err
  }
  const method = (opts.method || 'GET').toUpperCase()
  const headers = { Authorization: `Bearer ${cfg.apiKey}` }
  const base = cfg.endpoint + (path.startsWith('/') ? path : '/' + path)

  if (method === 'GET') {
    const url = new URL(base)
    if (params && typeof params === 'object') {
      for (const [k, v] of Object.entries(params)) {
        if (v !== undefined && v !== null) url.searchParams.set(k, String(v))
      }
    }
    return request(url.toString(), { method, headers, timeout: opts.timeout })
  }
  return request(base, { method, headers, body: params, timeout: opts.timeout })
}

/** 列出分发器可用模型（GET /v1/models，也可用于探测 key 有效性） */
function listModels() {
  return callApi('/v1/models')
}

/**
 * LLM 转发（OpenAI 兼容 /v1/chat/completions）
 * @param {Array}  messages [{role, content}]
 * @param {string} model    分发器上的模型名
 * @param {object} opts     { temperature, max_tokens, tools, stream=false }
 */
function callLLM(messages, model, opts = {}) {
  return callApi(
    '/v1/chat/completions',
    {
      model,
      messages,
      temperature: opts.temperature != null ? opts.temperature : 0.7,
      max_tokens: opts.max_tokens != null ? opts.max_tokens : 1024,
      ...(opts.tools ? { tools: opts.tools, tool_choice: opts.tool_choice || 'auto' } : {}),
      stream: !!opts.stream,
    },
    { method: 'POST', timeout: opts.timeout || 60000 },
  )
}

/**
 * 电商商品搜索（分发器统一代理，platform 区分平台）
 * @param {string} platform '1688' | 'taobao' | 'jd' | 'amazon'
 * @param {string} keywords 搜索关键词
 * @param {object} opts     { price_min, price_max, page, page_size, sort }
 */
function searchProducts(platform, keywords, opts = {}) {
  if (!PLATFORMS.includes(platform)) {
    throw new Error(`unsupported platform: ${platform}（支持 ${PLATFORMS.join('/')}）`)
  }
  return callApi(ECOM_SEARCH_PATH, { platform, keywords, ...opts }, { method: 'POST' })
}

module.exports = {
  DEFAULT_ENDPOINT,
  ECOM_SEARCH_PATH,
  PLATFORMS,
  suwenszConfig,
  callApi,
  listModels,
  callLLM,
  searchProducts,
}
