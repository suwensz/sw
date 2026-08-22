/**
 * 素衡OS · 向量化客户端（suheng-gateway 模块）
 *
 * 调用 OpenAI 兼容的 /embeddings 接口（SiliconFlow BGE-M3 / 智谱 embedding-3），
 * 密钥从 vault 的 keys.embedding 槽位读取（明文不出网关）。
 * 未配置 Key 或调用失败时返回 null，上层降级 BM25 关键词检索。
 */
const https = require('https')
const http = require('http')
const vault = require('./vault.cjs')

/** 批量向量化：输入文本数组，返回 Float32Array 数组；失败返回 null */
function embedTexts(texts) {
  return new Promise((resolve) => {
    const cfg = vault.embeddingConfig()
    if (!cfg || !texts || !texts.length) {
      resolve(null)
      return
    }
    let url
    try {
      url = new URL(cfg.endpoint)
    } catch {
      resolve(null)
      return
    }
    const lib = url.protocol === 'https:' ? https : http
    const body = JSON.stringify({ model: cfg.model, input: texts, encoding_format: 'float' })
    const req = lib.request(
      url,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${cfg.apiKey}`,
        },
        timeout: 30000,
      },
      (res) => {
        const chunks = []
        res.on('data', (c) => chunks.push(c))
        res.on('end', () => {
          try {
            if (res.statusCode < 200 || res.statusCode >= 300) {
              resolve(null)
              return
            }
            const data = JSON.parse(Buffer.concat(chunks).toString('utf8'))
            const list = (data && data.data) || []
            if (!list.length) {
              resolve(null)
              return
            }
            // 按 index 排序后转 Float32Array
            list.sort((a, b) => a.index - b.index)
            resolve(list.map((d) => Float32Array.from(d.embedding)))
          } catch {
            resolve(null)
          }
        })
        res.on('error', () => resolve(null))
      },
    )
    req.on('timeout', () => req.destroy(new Error('embedding timeout')))
    req.on('error', () => resolve(null))
    req.write(body)
    req.end()
  })
}

/** 余弦相似度（向量已归一化时可退化为点积，这里做完整余弦） */
function cosine(a, b) {
  let dot = 0
  let na = 0
  let nb = 0
  const n = Math.min(a.length, b.length)
  for (let i = 0; i < n; i++) {
    dot += a[i] * b[i]
    na += a[i] * a[i]
    nb += b[i] * b[i]
  }
  if (!na || !nb) return 0
  return dot / (Math.sqrt(na) * Math.sqrt(nb))
}

module.exports = { embedTexts, cosine }
