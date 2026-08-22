/**
 * 素衡OS · 1688 开放平台客户端（L1，阶段3b）
 *
 * vault keys.ali1688 配置 AppKey/AppSecret/AccessToken 后启用；
 * 未配置或调用失败时工具层自动降级 L0 本地数据（trace.provider = 'local-fallback'）。
 *
 * 签名协议（1688 open.1688.com，类淘宝 TOP 网关）：
 *   1. 收集协议参数（含 api 的私有参数，不含 sign 与字节型参数）
 *   2. 排序后拼为 k1v1k2v2...
 *   3. 头尾拼 appSecret → HMAC-SHA1 → hex 大写
 */
const crypto = require('crypto')
const https = require('https')
const vault = require('../vault.cjs')

const GW_URL = 'https://gw.open.1688.com/openapi/'

/** 读取 1688 凭据（未配置返回 null） */
function aliConfig() {
  const v = vault.loadVault()
  const a = v.keys.ali1688
  if (!a || !a.appKey || !a.appSecret) return null
  return { appKey: a.appKey, appSecret: a.appSecret, accessToken: a.accessToken || '' }
}

/** TOP 风格签名（HMAC-SHA1） */
function sign(params, appSecret) {
  const keys = Object.keys(params)
    .filter((k) => k !== 'sign' && typeof params[k] !== 'object' && typeof params[k] !== 'undefined')
    .sort()
  const plain = keys.map((k) => k + String(params[k])).join('')
  return crypto.createHmac('sha1', appSecret).update(appSecret + plain + appSecret, 'utf8').digest('hex').toUpperCase()
}

/**
 * 调用 1688 开放平台 API（Promise，失败 reject）
 * @param {string} api 形如 'alibaba.icbu.product.search' 或 '1.0/alibaba.icbu.product.search'
 * @param {object} apiParams 业务参数
 */
function callApi(api, apiParams = {}) {
  return new Promise((resolve, reject) => {
    const cfg = aliConfig()
    if (!cfg) {
      reject(new Error('ali1688 not configured'))
      return
    }
    const allParams = {
      ...apiParams,
      access_token: cfg.accessToken,
      app_key: cfg.appKey,
      format: 'json',
      sign_method: 'sha1',
      timestamp: String(Math.round(Date.now() / 1000)),
      v: '2.0',
    }
    allParams.sign = sign(allParams, cfg.appSecret)

    const qs = new URLSearchParams(allParams).toString()
    const url = new URL(GW_URL + (api.startsWith('1.') || api.startsWith('2.') ? api : 'param2/2.0/' + api))
    url.search = qs
    const req = https.request(
      url,
      { method: 'GET', timeout: 15000 },
      (res) => {
        const chunks = []
        res.on('data', (c) => chunks.push(c))
        res.on('end', () => {
          try {
            resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')))
          } catch (e) {
            reject(e)
          }
        })
        res.on('error', reject)
      },
    )
    req.on('timeout', () => req.destroy(new Error('ali1688 api timeout')))
    req.on('error', reject)
    req.end()
  })
}

/** token 是否临近过期（7 天内） */
function tokenExpiringSoon() {
  const v = vault.loadVault()
  const exp = v.keys.ali1688 && v.keys.ali1688.expireAt
  if (!exp) return false
  return new Date(exp).getTime() - Date.now() < 7 * 24 * 3600 * 1000
}

module.exports = { aliConfig, sign, callApi, tokenExpiringSoon }
