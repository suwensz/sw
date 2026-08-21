/**
 * 素衡OS · 静态预览服务器（零依赖）
 * 托管项目根目录（含 dist/ 主站与 dist-portals/ 三端门户），规避 file:// 下 ES 模块 CORS 限制。
 * 用法：
 *   node scripts/static-server.cjs            # 默认端口 6210
 *   PORT=7000 node scripts/static-server.cjs  # 自定义端口
 * 访问：
 *   主站      http://localhost:6210/
 *   运营端    http://localhost:6210/dist-portals/ops/ops-portal.html
 *   开发端    http://localhost:6210/dist-portals/dev/dev-portal.html
 *   管理端    http://localhost:6210/dist-portals/admin/admin-portal.html
 */
const http = require('http')
const fs = require('fs')
const path = require('path')

const PORT = Number(process.env.PORT || 6210)
const LLM_PROXY_PORT = Number(process.env.LLM_PROXY_PORT || 8898)
const ROOT = path.join(__dirname, '..')

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.map': 'application/json',
  '.txt': 'text/plain; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
}

const server = http.createServer((req, res) => {
  let urlPath = decodeURIComponent((req.url || '/').split('?')[0])
  // AI 服务转发：/api/llm → llm-proxy.cjs(127.0.0.1:8898)/llm（与 vite dev 代理行为一致）
  if (urlPath === '/api/llm') {
    if (req.method !== 'POST') {
      res.writeHead(405).end('Method Not Allowed')
      return
    }
    forwardToLlmProxy(req, res)
    return
  }
  // 目录请求 → 构建产物主站
  if (urlPath.endsWith('/')) urlPath += 'index.html'
  let filePath = path.normalize(path.join(ROOT, urlPath))
  // 防目录穿越
  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403).end('Forbidden')
    return
  }
  // 根路径与无扩展名 SPA 路由 → 回退 dist/index.html（主站构建产物）
  const distIndex = path.join(ROOT, 'dist', 'index.html')
  const isRootOrRoute = urlPath === '/index.html' || !path.extname(urlPath)
  if (isRootOrRoute) {
    if (fs.existsSync(distIndex)) {
      serveFile(res, distIndex)
    } else {
      res.writeHead(503, { 'Content-Type': 'text/plain; charset=utf-8' })
      res.end('dist/index.html 不存在，请先执行构建: vite build')
    }
    return
  }
  if (!fs.existsSync(filePath)) {
    // 回退尝试 dist/ 下的同名文件（favicon.svg 等构建产物）
    const distPath = path.join(ROOT, 'dist', urlPath)
    if (fs.existsSync(distPath)) {
      serveFile(res, distPath)
      return
    }
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' })
    res.end('404 Not Found: ' + urlPath)
    return
  }
  serveFile(res, filePath)
})

function serveFile(res, filePath) {
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(500).end('Internal Server Error')
      return
    }
    res.writeHead(200, {
      'Content-Type': MIME[path.extname(filePath).toLowerCase()] || 'application/octet-stream',
      'Cache-Control': 'no-cache',
    })
    res.end(data)
  })
}

/** 转发 AI 请求到本地 llm-proxy（127.0.0.1:8898） */
function forwardToLlmProxy(req, res) {
  const chunks = []
  req.on('data', (c) => chunks.push(c))
  req.on('end', () => {
    const body = Buffer.concat(chunks)
    const upReq = http.request(
      {
        host: '127.0.0.1',
        port: LLM_PROXY_PORT,
        path: '/llm',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': body.length,
        },
      },
      (upRes) => {
        res.writeHead(upRes.statusCode || 502, upRes.headers)
        upRes.pipe(res)
      }
    )
    upReq.on('error', () => {
      // 代理未启动：返回 502，前端自动降级直连
      res.writeHead(502, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ ok: false, error: 'llm-proxy 未启动' }))
    })
    upReq.end(body)
  })
}

// 双栈监听：优先 IPv6 '::'（浏览器会将 localhost 优先解析为 ::1，仅绑 0.0.0.0 会导致 IPv6 打不开），
// IPv6 不可用时自动回退 IPv4。
function startLog() {
  console.log(`[static-server] 素衡OS 预览服务已启动: http://localhost:${PORT}`)
  console.log(`[static-server] 托管目录: ${ROOT}`)
}

server.on('error', (err) => {
  if (err.code === 'EADDRNOTAVAIL' || err.code === 'EAFNOSUPPORT') {
    console.log('[static-server] IPv6 不可用，回退 IPv4 0.0.0.0')
    server.listen(PORT, '0.0.0.0', startLog)
  } else {
    console.error('[static-server] 启动失败:', err.message)
    process.exit(1)
  }
})

server.listen(PORT, '::', startLog)

process.on('SIGINT', () => {
  server.close(() => process.exit(0))
})
