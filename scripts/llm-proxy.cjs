/**
 * 素衡OS · AI 服务本地转发代理（零依赖）
 *
 * 作用：解决浏览器直连第三方 AI API 的 CORS 限制。
 * DeepSeek 官方支持浏览器直连，但豆包（火山方舟 Ark）与扣子（Coze v3）
 * 均不允许跨域直连 —— 本代理把浏览器请求转发到目标服务商，绕开 CORS。
 *
 * 用法：
 *   node scripts/llm-proxy.cjs            # 默认端口 8898
 *   PORT=8898 node scripts/llm-proxy.cjs  # 自定义端口
 *
 * 协议：
 *   POST /llm
 *   { endpoint: "<服务商接口>", apiKey: "<用户密钥>", payload: { ...请求体... } }
 *   → 代理以 `Authorization: Bearer <apiKey>` 转发到 endpoint，原样透传响应。
 *
 * 安全提示：这是本地回环服务（默认只监听 127.0.0.1），仅用于开发/演示/内网。
 */
const http = require('http')
const https = require('https')

const HOST = process.env.HOST || '127.0.0.1'
const PORT = Number(process.env.PORT) || 8898

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
      ...(payload && typeof payload === 'object' && payload.stream ? { Accept: 'text/event-stream' } : {}),
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

const server = http.createServer(async (req, res) => {
  // CORS：允许任意来源（本地回环工具）
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  // 健康检查
  if (req.method === 'GET' && req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' })
    res.end(JSON.stringify({ ok: true, service: 'suheng-llm-proxy', uptime: process.uptime() }))
    return
  }
  // 预检
  if (req.method === 'OPTIONS') {
    res.writeHead(204)
    res.end()
    return
  }
  // 转发入口
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
      if (!endpoint || !apiKey || payload == null) {
        sendJson(res, 400, { error: 'missing endpoint / apiKey / payload' })
        return
      }
      const upstream = await forward({ endpoint, apiKey, payload })
      // 原样透传上游状态码与响应体
      res.writeHead(upstream.status, {
        'Content-Type': upstream.headers['content-type'] || 'application/json; charset=utf-8',
      })
      res.end(upstream.body)
    } catch (err) {
      sendJson(res, 502, { error: String((err && err.message) || err) })
    }
    return
  }
  sendJson(res, 404, { error: 'not found; use POST /llm' })
})

server.listen(PORT, HOST, () => {
  console.log(`[llm-proxy] 素衡OS AI 转发代理已启动  http://${HOST}:${PORT}`)
  console.log(`[llm-proxy] 转发入口 POST /llm   健康检查 GET /health`)
})
server.on('error', (err) => {
  console.error('[llm-proxy] 启动失败:', err.message)
  process.exit(1)
})

// 独立运行时不退出
if (require.main === module) {
  // 已 listen
} else {
  // 被 electron main.cjs require 时，导出供 stop()
  module.exports = {
    stop() {
      server.close()
      console.log('[llm-proxy] 代理已停止')
    },
  }
}
