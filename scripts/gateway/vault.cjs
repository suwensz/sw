/**
 * 素衡OS · 密钥保险箱（suheng-gateway 模块）
 *
 * 所有 AI 服务密钥以 AES-256-GCM 加密落盘 scripts/.vault.json：
 *   - LLM 密钥（DeepSeek/豆包/扣子）：兼容旧单槽 apiKey 字段
 *   - Embedding 密钥（SiliconFlow BGE-M3 / 智谱）：keys.embedding 槽位
 *   - 1688 开放平台（预留）：keys.ali1688 槽位
 *   - 素问Tokens分发器（阶段4）：keys.suwensz 统一槽位（LLM 转发 + 电商数据代理）
 *   - 电商大数据（阶段4预留）：keys.ecomData 槽位
 *   - 图片优化 / 视频生成（阶段4）：keys.imageOpt / keys.videoGen 槽位（默认可灵AI）
 *
 * 三端权限：开发端可写、管理端未锁定可写、运营端只读（校验 X-Portal 头）
 * 读取接口返回脱敏 Key（仅末 4 位），明文 Key 永不出网关。
 */
const crypto = require('crypto')
const fs = require('fs')
const path = require('path')

/** 保险箱文件位置（与 scripts/ 目录并列） */
const VAULT_FILE = path.join(__dirname, '..', '.vault.json')
/** 主密钥：优先环境变量，未设置时用开发默认值（仅演示，生产必须指定 SUHENG_VAULT_KEY） */
const VAULT_KEY =
  process.env.SUHENG_VAULT_KEY || 'suheng-os-dev-vault-key-please-change-in-production'

/** Embedding 服务商预设 */
const EMBEDDING_PRESETS = {
  siliconflow: {
    name: 'SiliconFlow',
    endpoint: 'https://api.siliconflow.cn/v1/embeddings',
    model: 'BAAI/bge-m3',
    docUrl: 'https://cloud.siliconflow.cn',
  },
  zhipu: {
    name: '智谱 BigModel',
    endpoint: 'https://open.bigmodel.cn/api/paas/v4/embeddings',
    model: 'embedding-3',
    docUrl: 'https://open.bigmodel.cn',
  },
}

/** 默认配置（首次启动或文件丢失时） */
const DEFAULT_VAULT = {
  provider: 'deepseek',
  apiKey: '',
  endpoint: 'https://api.deepseek.com/v1/chat/completions',
  model: 'deepseek-chat',
  botId: 'suheng-os-agent',
  keys: {
    /** LLM 主密钥（与旧单槽 apiKey 双写兼容，读取时优先本槽位） */
    llm: { apiKey: '' },
    /** 向量化服务（知识库语义检索） */
    embedding: { provider: 'siliconflow', apiKey: '', endpoint: EMBEDDING_PRESETS.siliconflow.endpoint, model: EMBEDDING_PRESETS.siliconflow.model },
    /** 1688 开放平台（阶段3预留） */
    ali1688: { appKey: '', appSecret: '', accessToken: '', expireAt: null },
    /** 素问Tokens分发器（阶段4：统一代理 1688/淘宝/京东/亚马逊 + LLM 转发，OpenAI 兼容） */
    suwensz: { apiKey: '', endpoint: 'https://api.suwensz.com' },
    /** 电商大数据（采购/供应数据库，数据威/魔镜等，P2 预留） */
    ecomData: { provider: '', apiKey: '', endpoint: '' },
    /** 图片优化服务（商品主图/白底图/多语言文案图，默认可灵AI） */
    imageOpt: { provider: 'kling', apiKey: '', endpoint: '' },
    /** 视频生成服务（商品短视频，默认可灵AI 视频生成） */
    videoGen: { provider: 'kling', apiKey: '', endpoint: '' },
  },
  locked: false,
  updatedBy: null,
  updatedAt: null,
}

/* ============== 加密原语（AES-256-GCM） ============== */

function deriveKey(pass) {
  return crypto.createHash('sha256').update(String(pass)).digest()
}

function saveVault(obj) {
  const plain = JSON.stringify(obj)
  const key = deriveKey(VAULT_KEY)
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv)
  const enc = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  fs.writeFileSync(VAULT_FILE, Buffer.concat([iv, tag, enc]))
}

/** 读盘并解密（含旧结构迁移：keys 槽位补齐、旧 apiKey → keys.llm）；失败返回默认副本 */
function loadVault() {
  let parsed = null
  try {
    if (fs.existsSync(VAULT_FILE)) {
      const blob = fs.readFileSync(VAULT_FILE)
      if (blob.length >= 28) {
        const iv = blob.subarray(0, 12)
        const tag = blob.subarray(12, 28)
        const enc = blob.subarray(28)
        const decipher = crypto.createDecipheriv('aes-256-gcm', deriveKey(VAULT_KEY), iv)
        decipher.setAuthTag(tag)
        const dec = Buffer.concat([decipher.update(enc), decipher.final()]).toString('utf8')
        parsed = JSON.parse(dec)
      }
    }
  } catch (err) {
    console.warn('[vault] 保险箱解密失败，回退默认配置:', err.message)
  }
  const v = { ...DEFAULT_VAULT, ...(parsed || {}) }
  // keys 槽位补齐 + 深合并
  v.keys = {
    llm: { ...DEFAULT_VAULT.keys.llm, ...((parsed && parsed.keys && parsed.keys.llm) || {}) },
    embedding: { ...DEFAULT_VAULT.keys.embedding, ...((parsed && parsed.keys && parsed.keys.embedding) || {}) },
    ali1688: { ...DEFAULT_VAULT.keys.ali1688, ...((parsed && parsed.keys && parsed.keys.ali1688) || {}) },
    suwensz: { ...DEFAULT_VAULT.keys.suwensz, ...((parsed && parsed.keys && parsed.keys.suwensz) || {}) },
    ecomData: { ...DEFAULT_VAULT.keys.ecomData, ...((parsed && parsed.keys && parsed.keys.ecomData) || {}) },
    imageOpt: { ...DEFAULT_VAULT.keys.imageOpt, ...((parsed && parsed.keys && parsed.keys.imageOpt) || {}) },
    videoGen: { ...DEFAULT_VAULT.keys.videoGen, ...((parsed && parsed.keys && parsed.keys.videoGen) || {}) },
  }
  // 旧结构迁移：无 keys.llm.apiKey 时把旧单槽 apiKey 迁入（保留原字段兼容读取）
  if (!v.keys.llm.apiKey && v.apiKey) v.keys.llm.apiKey = v.apiKey
  v.locked = !!v.locked
  return v
}

/* ============== 脱敏与权限 ============== */

function maskKey(k) {
  if (!k) return ''
  const s = String(k)
  if (s.length <= 4) return '***'
  return '***' + s.slice(-4)
}

/** LLM 明文 Key：优先 keys.llm 槽位，回退旧单槽字段 */
function llmApiKey() {
  const v = loadVault()
  return v.keys.llm.apiKey || v.apiKey || ''
}

/** Embedding 明文配置（未配置 Key 时返回 null） */
function embeddingConfig() {
  const v = loadVault()
  const e = v.keys.embedding
  if (!e.apiKey || !e.endpoint) return null
  return { provider: e.provider, apiKey: e.apiKey, endpoint: e.endpoint, model: e.model }
}

/** 返回脱敏后的保险箱视图（明文 Key 永不外泄） */
function vaultView() {
  const v = loadVault()
  const llmKey = v.keys.llm.apiKey || v.apiKey
  return {
    provider: v.provider,
    apiKey: maskKey(llmKey),
    hasKey: !!llmKey,
    endpoint: v.endpoint,
    model: v.model,
    botId: v.botId,
    embedding: {
      provider: v.keys.embedding.provider,
      apiKey: maskKey(v.keys.embedding.apiKey),
      hasKey: !!v.keys.embedding.apiKey,
      endpoint: v.keys.embedding.endpoint,
      model: v.keys.embedding.model,
    },
    ali1688: {
      appKey: v.keys.ali1688.appKey,
      appSecret: maskKey(v.keys.ali1688.appSecret),
      hasCredential: !!(v.keys.ali1688.appKey && v.keys.ali1688.appSecret),
      accessToken: maskKey(v.keys.ali1688.accessToken),
      expireAt: v.keys.ali1688.expireAt,
    },
    suwensz: {
      apiKey: maskKey(v.keys.suwensz.apiKey),
      hasKey: !!v.keys.suwensz.apiKey,
      endpoint: v.keys.suwensz.endpoint,
    },
    ecomData: {
      provider: v.keys.ecomData.provider,
      apiKey: maskKey(v.keys.ecomData.apiKey),
      hasKey: !!v.keys.ecomData.apiKey,
      endpoint: v.keys.ecomData.endpoint,
    },
    imageOpt: {
      provider: v.keys.imageOpt.provider,
      apiKey: maskKey(v.keys.imageOpt.apiKey),
      hasKey: !!v.keys.imageOpt.apiKey,
      endpoint: v.keys.imageOpt.endpoint,
    },
    videoGen: {
      provider: v.keys.videoGen.provider,
      apiKey: maskKey(v.keys.videoGen.apiKey),
      hasKey: !!v.keys.videoGen.apiKey,
      endpoint: v.keys.videoGen.endpoint,
    },
    locked: v.locked,
    updatedBy: v.updatedBy,
    updatedAt: v.updatedAt,
  }
}

/**
 * 保存配置（按门户权限校验）
 * patch 支持顶层字段与 keys.embedding / keys.ali1688 槽位合并；
 * 脱敏占位（*** 开头）的 apiKey 视为「未修改」不覆盖。
 */
function setVaultConfig(patch, portal) {
  if (portal !== 'dev' && portal !== 'admin') {
    return { ok: false, error: '运营端只读，无写入权限' }
  }
  const cur = loadVault()
  if (cur.locked && portal !== 'dev') {
    return { ok: false, error: '配置已锁定，仅开发端可修改' }
  }

  const next = { ...cur, updatedBy: portal, updatedAt: new Date().toISOString() }

  // 顶层字段（LLM 主配置）
  for (const k of ['provider', 'endpoint', 'model', 'botId', 'locked']) {
    if (patch[k] !== undefined) next[k] = patch[k]
  }
  if (typeof patch.apiKey === 'string' && patch.apiKey && !patch.apiKey.startsWith('***')) {
    next.apiKey = patch.apiKey
    next.keys.llm.apiKey = patch.apiKey
  }

  // keys 槽位合并（embedding / ali1688 / suwensz / ecomData / imageOpt / videoGen）
  if (patch.keys && typeof patch.keys === 'object') {
    for (const slot of ['embedding', 'ali1688', 'llm', 'suwensz', 'ecomData', 'imageOpt', 'videoGen']) {
      const p = patch.keys[slot]
      if (p && typeof p === 'object') {
        for (const [k, val] of Object.entries(p)) {
          if (k === 'apiKey' && (val === '' || (typeof val === 'string' && val.startsWith('***')))) continue
          next.keys[slot][k] = val
        }
      }
    }
  }
  // 兼容直接传 embedding 子对象
  if (patch.embedding && typeof patch.embedding === 'object') {
    const p = patch.embedding
    for (const [k, val] of Object.entries(p)) {
      if (k === 'apiKey' && (val === '' || (typeof val === 'string' && val.startsWith('***')))) continue
      next.keys.embedding[k] = val
    }
  }

  saveVault(next)
  return { ok: true }
}

module.exports = {
  VAULT_FILE,
  EMBEDDING_PRESETS,
  loadVault,
  saveVault,
  llmApiKey,
  embeddingConfig,
  vaultView,
  setVaultConfig,
  maskKey,
}
