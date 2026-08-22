/**
 * 素衡OS · 知识库模块（suheng-gateway）
 *
 * 阶段2 RAG 落地：
 *   - 存储：scripts/suheng.db（Node 22 内置 node:sqlite，零依赖）
 *     表：documents（文档）/ chunks（切分块）/ embeddings（向量 BLOB）
 *   - 检索：向量余弦 TopK（配置了 Embedding Key 时）→ BM25 关键词检索（降级，始终可用）
 *   - 中文分词：汉字 uni+bigram + ASCII 词
 *
 * 端点（由 llm-proxy.cjs 路由）：
 *   POST /kb/search        检索 {query, domain, topK, filters}
 *   GET  /kb/stats         统计 {docs, chunks, embedded, mode}
 *   POST /kb/ingest        导入文档（X-Portal: dev）
 *   POST /kb/embed/pending 为缺失向量的 chunk 批量补算（X-Portal: dev）
 */
const { DatabaseSync } = require('node:sqlite')
const path = require('path')
const vault = require('./vault.cjs')
const embedder = require('./embedder.cjs')

const DB_FILE = path.join(__dirname, '..', 'suheng.db')

/* ============== 数据库初始化 ============== */

const db = new DatabaseSync(DB_FILE)
db.exec(`
  PRAGMA journal_mode = WAL;
  CREATE TABLE IF NOT EXISTS documents (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    domain      TEXT NOT NULL CHECK (domain IN ('tcm','ecom','domestic','general')),
    doc_type    TEXT NOT NULL,
    title       TEXT NOT NULL,
    source      TEXT NOT NULL,
    license     TEXT,
    uri         TEXT,
    meta_json   TEXT,
    created_at  TEXT DEFAULT (datetime('now'))
  );
  CREATE INDEX IF NOT EXISTS idx_doc_domain ON documents(domain, doc_type);
  CREATE TABLE IF NOT EXISTS chunks (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    doc_id      INTEGER NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    seq         INTEGER NOT NULL,
    content     TEXT NOT NULL,
    created_at  TEXT DEFAULT (datetime('now'))
  );
  CREATE INDEX IF NOT EXISTS idx_chunk_doc ON chunks(doc_id);
  CREATE TABLE IF NOT EXISTS embeddings (
    chunk_id    INTEGER PRIMARY KEY REFERENCES chunks(id) ON DELETE CASCADE,
    model       TEXT NOT NULL,
    dim         INTEGER NOT NULL,
    vec         BLOB NOT NULL,
    created_at  TEXT DEFAULT (datetime('now'))
  );
`)

/* ============== 内存索引（BM25 + 向量） ============== */

/** 全量 chunk 内存视图：{id, docId, domain, docType, title, source, meta, content, tokens, tf, len} */
let chunkIndex = []
/** 词 → 出现 chunk 数（df） */
let dfMap = new Map()
/** 向量索引：{ids: number[], vecs: Float32Array[]}（未配置 embedding 时为空） */
let vecIndex = { ids: [], vecs: [] }
/** 向量模型名（与库内 embedding.model 对齐才参与向量检索） */
let vecModel = ''

/** 中文 bigram + ASCII 词分词 */
function tokenize(text) {
  const tokens = []
  const s = String(text || '').toLowerCase()
  const ascii = s.match(/[a-z0-9]+/g) || []
  for (const w of ascii) tokens.push(w)
  const han = s.match(/[\u4e00-\u9fff]+/g) || []
  for (const seg of han) {
    for (let i = 0; i < seg.length; i++) {
      tokens.push(seg[i])
      if (i + 1 < seg.length) tokens.push(seg[i] + seg[i + 1])
    }
  }
  return tokens
}

/** 重建内存索引（启动时与每次 ingest 后调用） */
function rebuildIndex() {
  chunkIndex = []
  dfMap = new Map()
  vecIndex = { ids: [], vecs: [] }
  vecModel = ''

  const rows = db
    .prepare(
      `SELECT c.id AS cid, c.content, d.id AS did, d.domain, d.doc_type, d.title, d.source, d.meta_json
       FROM chunks c JOIN documents d ON d.id = c.doc_id`,
    )
    .all()

  for (const r of rows) {
    const tokens = tokenize(`${r.title} ${r.content}`)
    const tf = new Map()
    for (const t of tokens) tf.set(t, (tf.get(t) || 0) + 1)
    chunkIndex.push({
      id: r.cid,
      docId: r.did,
      domain: r.domain,
      docType: r.doc_type,
      title: r.title,
      source: r.source,
      meta: r.meta_json ? safeJson(r.meta_json) : null,
      content: r.content,
      tokens,
      tf,
      len: tokens.length,
    })
    for (const t of tf.keys()) dfMap.set(t, (dfMap.get(t) || 0) + 1)
  }

  // 向量索引：与当前配置的 embedding 模型一致才加载
  const cfg = vault.embeddingConfig()
  if (cfg && cfg.model) {
    const vrows = db.prepare(`SELECT e.chunk_id, e.vec FROM embeddings e WHERE e.model = ?`).all(cfg.model)
    const byId = new Map(chunkIndex.map((c) => [c.id, c]))
    for (const vr of vrows) {
      if (!byId.has(vr.chunk_id)) continue
      const f32 = new Float32Array(vr.vec.buffer, vr.vec.byteOffset, vr.vec.byteLength / 4)
      vecIndex.ids.push(vr.chunk_id)
      vecIndex.vecs.push(f32)
    }
    vecModel = cfg.model
  }
}

function safeJson(s) {
  try {
    return JSON.parse(s)
  } catch {
    return null
  }
}

/* ============== BM25 检索 ============== */

const BM25_K1 = 1.5
const BM25_B = 0.75

function bm25Search(query, domain, topK, docTypes) {
  const qTokens = tokenize(query)
  if (!qTokens.length) return []
  const N = chunkIndex.length || 1
  const avgLen = chunkIndex.reduce((s, c) => s + c.len, 0) / N || 1

  const scored = []
  for (const c of chunkIndex) {
    if (domain && c.domain !== domain && c.domain !== 'general') continue
    if (docTypes && docTypes.length && !docTypes.includes(c.docType)) continue
    let score = 0
    for (const t of qTokens) {
      const f = c.tf.get(t)
      if (!f) continue
      const df = dfMap.get(t) || 1
      const idf = Math.log(1 + (N - df + 0.5) / (df + 0.5))
      score += idf * ((f * (BM25_K1 + 1)) / (f + BM25_K1 * (1 - BM25_B + BM25_B * (c.len / avgLen))))
    }
    if (score > 0) scored.push({ chunk: c, score })
  }
  scored.sort((a, b) => b.score - a.score)
  return scored.slice(0, topK)
}

/* ============== 向量检索 ============== */

async function vectorSearch(query, domain, topK, docTypes) {
  if (!vecIndex.ids.length) return null
  const [qvec] = (await embedder.embedTexts([query])) || []
  if (!qvec) return null
  const byId = new Map(chunkIndex.map((c) => [c.id, c]))
  const scored = []
  for (let i = 0; i < vecIndex.ids.length; i++) {
    const c = byId.get(vecIndex.ids[i])
    if (!c) continue
    if (domain && c.domain !== domain && c.domain !== 'general') continue
    if (docTypes && docTypes.length && !docTypes.includes(c.docType)) continue
    scored.push({ chunk: c, score: embedder.cosine(qvec, vecIndex.vecs[i]) })
  }
  scored.sort((a, b) => b.score - a.score)
  return scored.slice(0, topK)
}

/* ============== 对外 API ============== */

function hitOf(item) {
  const c = item.chunk
  return {
    chunk_id: c.id,
    score: Math.round(item.score * 1000) / 1000,
    doc_title: c.title,
    doc_type: c.docType,
    text: c.content,
    source: c.source,
    meta: c.meta || undefined,
  }
}

/** 检索：向量优先，无 Key/失败自动降级 BM25 */
async function search({ query, domain, topK, filters }) {
  const k = Math.min(Math.max(Number(topK) || 5, 1), 20)
  const docTypes = filters && Array.isArray(filters.doc_type) && filters.doc_type.length
    ? filters.doc_type
    : null
  if (!query || !String(query).trim()) return { hits: [], mode: 'bm25' }

  let hits = null
  let mode = 'bm25'
  if (vecIndex.ids.length) {
    try {
      const v = await vectorSearch(String(query), domain, k, docTypes)
      if (v && v.length) {
        hits = v
        mode = 'vector'
      }
    } catch {
      /* 降级 BM25 */
    }
  }
  if (!hits) {
    hits = bm25Search(String(query), domain, k, docTypes)
    mode = 'bm25'
  }
  return { hits: hits.map(hitOf), mode }
}

function stats() {
  const docs = db.prepare('SELECT COUNT(*) AS n FROM documents').get().n
  const chunks = db.prepare('SELECT COUNT(*) AS n FROM chunks').get().n
  const embedded = db.prepare('SELECT COUNT(*) AS n FROM embeddings').get().n
  const last = db.prepare(`SELECT created_at FROM documents ORDER BY id DESC LIMIT 1`).get()
  const domains = db
    .prepare('SELECT domain, COUNT(*) AS n FROM documents GROUP BY domain ORDER BY n DESC')
    .all()
  return {
    docs,
    chunks,
    embedded,
    embeddingConfigured: !!vault.embeddingConfig(),
    vectorReady: vecIndex.ids.length > 0,
    vectorModel: vecModel || null,
    domains,
    lastUpdate: last ? last.created_at : null,
  }
}

/**
 * 导入文档（仅开发端）。
 * 输入格式（单文档或多文档）：
 *   { domain, doc_type, title, source, license, uri, meta, text | chunks: string[] }
 *   { docs: [ ...上面的单文档 ] }
 * 同 source 的旧文档先删除再插入（幂等）。
 */
function ingest(body) {
  const docs = Array.isArray(body && body.docs) ? body.docs : [body]
  let docCount = 0
  let chunkCount = 0
  const sources = new Set()

  for (const d of docs) {
    if (!d || !d.title || !d.domain) continue
    const domain = ['tcm', 'ecom', 'domestic', 'general'].includes(d.domain) ? d.domain : 'general'
    const text = typeof d.text === 'string' ? d.text : ''
    const chunks = Array.isArray(d.chunks) && d.chunks.length ? d.chunks.map(String) : chunkText(text)
    if (!chunks.length) continue
    const source = d.source || 'manual'
    sources.add(source)
    // 幂等：删除同 source + 同 title 的旧文档
    db.prepare('DELETE FROM documents WHERE source = ? AND title = ?').run(source, d.title)
    const info = db
      .prepare(
        `INSERT INTO documents (domain, doc_type, title, source, license, uri, meta_json)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(domain, d.doc_type || 'text', d.title, source, d.license || null, d.uri || null, d.meta ? JSON.stringify(d.meta) : null)
    const docId = Number(info.lastInsertRowid)
    const ins = db.prepare('INSERT INTO chunks (doc_id, seq, content) VALUES (?, ?, ?)')
    chunks.forEach((c, i) => {
      const t = String(c || '').trim()
      if (!t) return
      ins.run(docId, i, t)
      chunkCount++
    })
    docCount++
  }

  rebuildIndex()
  // 导入后尝试补算向量（异步，不阻塞响应）
  void embedPending()
  return { ok: true, docs: docCount, chunks: chunkCount, sources: [...sources] }
}

/** 通用文本切分：优先按空行/换行切段，段超 500 字再定长切 */
function chunkText(text) {
  const t = String(text || '').trim()
  if (!t) return []
  const paras = t.split(/\n\s*\n|\r\n\s*\r\n/).map((p) => p.trim()).filter(Boolean)
  const out = []
  for (const p of paras.length ? paras : [t]) {
    if (p.length <= 500) {
      out.push(p)
      continue
    }
    for (let i = 0; i < p.length; i += 480) out.push(p.slice(i, i + 480))
  }
  return out
}

/** 为缺失向量的 chunk 批量补算 embedding（每批 32 条） */
async function embedPending() {
  const cfg = vault.embeddingConfig()
  if (!cfg) return { ok: false, error: 'embedding key not configured' }
  const rows = db
    .prepare(
      `SELECT c.id, c.content FROM chunks c
       LEFT JOIN embeddings e ON e.chunk_id = c.id AND e.model = ?
       WHERE e.chunk_id IS NULL LIMIT 512`,
    )
    .all(cfg.model)
  if (!rows.length) return { ok: true, embedded: 0 }
  const ins = db.prepare('INSERT OR REPLACE INTO embeddings (chunk_id, model, dim, vec) VALUES (?, ?, ?, ?)')
  let done = 0
  for (let i = 0; i < rows.length; i += 32) {
    const batch = rows.slice(i, i + 32)
    const vecs = await embedder.embedTexts(batch.map((r) => r.content))
    if (!vecs) {
      return { ok: done > 0, embedded: done, error: 'embedding api failed (batch ' + (i / 32 + 1) + ')' }
    }
    batch.forEach((r, j) => {
      const v = vecs[j]
      if (!v) return
      ins.run(r.id, cfg.model, v.length, Buffer.from(v.buffer, v.byteOffset, v.byteLength))
      done++
    })
  }
  rebuildIndex()
  return { ok: true, embedded: done }
}

// 启动时构建内存索引
rebuildIndex()

module.exports = { search, stats, ingest, embedPending, tokenize }
