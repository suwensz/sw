#!/usr/bin/env node
/**
 * 素衡OS · 知识库导入管道
 *
 * 用法：
 *   node scripts/kb/import.cjs                        # 导入内置中医种子数据
 *   node scripts/kb/import.cjs path/a.json path/b.json # 导入指定 JSON 文件
 *
 * JSON 格式（与 /kb/ingest 端点一致）：
 *   { source, license, docs: [ { domain, doc_type, title, meta, text } ] }
 *   或单文档：{ domain, doc_type, title, source, text }
 *
 * 导入幂等：同 source + 同 title 的旧文档先删除再插入。
 * 若已配置 Embedding Key（vault keys.embedding），导入后自动补算向量。
 */
const path = require('path')
const fs = require('fs')

const kb = require('../gateway/kb.cjs')
const vault = require('../gateway/vault.cjs')

async function main() {
  const args = process.argv.slice(2)
  const files = args.length
    ? args.map((a) => path.resolve(a))
    : [path.join(__dirname, 'seed-tcm.json')]

  for (const file of files) {
    if (!fs.existsSync(file)) {
      console.error(`[import] 文件不存在: ${file}`)
      process.exitCode = 1
      continue
    }
    let json
    try {
      json = JSON.parse(fs.readFileSync(file, 'utf8'))
    } catch (err) {
      console.error(`[import] JSON 解析失败 ${file}: ${err.message}`)
      process.exitCode = 1
      continue
    }
    // 展开 source/license 到每个文档（方便单文件多来源）
    const docs = Array.isArray(json.docs)
      ? json.docs.map((d) => ({ ...d, source: d.source || json.source || path.basename(file) }))
      : [json]
    const r = kb.ingest({ docs })
    console.log(
      `[import] ${path.basename(file)}: ${r.docs} 文档 / ${r.chunks} 切片 已导入 (source: ${r.sources.join(', ')})`,
    )
  }

  const s = kb.stats()
  console.log(
    `[import] 知识库现状: ${s.docs} 文档 / ${s.chunks} 切片 / ${s.embedded} 向量 · ${
      s.vectorReady ? `向量检索就绪 (${s.vectorModel})` : 'BM25 关键词检索（未配置 Embedding Key）'
    }`,
  )
  if (!s.embeddingConfigured) {
    console.log(
      '[import] 提示：在开发端「密钥/服务配置」填入向量化服务（SiliconFlow BGE-M3）API Key 后，可启用语义检索。',
    )
  }
  // 已导入但缺向量的 chunk 补算（异步后台进行，不阻塞进程退出判断）
  if (s.embeddingConfigured) {
    const r = await kb.embedPending()
    console.log(`[import] 向量补算: ${r.embedded} 条${r.error ? '（' + r.error + '）' : ''}`)
  }
  process.exit(0)
}

main().catch((err) => {
  console.error('[import] 失败:', err)
  process.exit(1)
})
