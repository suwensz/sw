// 开发端 mock 数据：应用 / 密钥 / Webhook / 配额 / 告警 / SDK / 调用审计
export interface DevApp {
  id: string
  name: string
  domain: string
  desc: string
  status: 'active' | 'disabled'
  createdAt: string
}

export interface DevKey {
  id: string
  appId: string
  appKey: string
  appSecret: string
  scope: string
  status: 'active' | 'revoked'
  createdAt: string
}

export interface WebhookRecord {
  id: string
  endpoint: string
  events: string[]
  status: 'active' | 'disabled'
  lastDelivery: string
}

export interface ApiCallAudit {
  id: string
  method: string
  path: string
  statusCode: number
  latency: number
  time: string
}

export interface AlertRule {
  id: string
  metric: string
  threshold: string
  channel: string
  status: 'active' | 'disabled'
  lastTrigger: string
}

export interface SdkItem {
  lang: string
  icon: string
  version: string
  size: string
  notes: string
}

export const SEED_DEV_APPS: DevApp[] = [
  { id: 'app1', name: '素衡健康 App', domain: 'health', desc: '中医健康管理客户端', status: 'active', createdAt: '2026-03-01' },
  { id: 'app2', name: '跨境商城小程序', domain: 'ecom', desc: '跨境电商购物小程序', status: 'active', createdAt: '2026-04-12' },
  { id: 'app3', name: '运营工作台', domain: 'ops', desc: '内部运营管理后台', status: 'active', createdAt: '2026-05-20' },
  { id: 'app4', name: '智能手表伴侣', domain: 'health', desc: '手表数据同步服务', status: 'disabled', createdAt: '2026-06-08' },
]

export const SEED_DEV_KEYS: DevKey[] = [
  { id: 'k1', appId: 'app1', appKey: 'ak_7f3c9d1e2a4b', appSecret: 'sk_****e2a4b', scope: 'health.*', status: 'active', createdAt: '2026-03-01' },
  { id: 'k2', appId: 'app2', appKey: 'ak_5b8d2f4c6e7a', appSecret: 'sk_****6e7a', scope: 'order.read, product.read', status: 'active', createdAt: '2026-04-12' },
  { id: 'k3', appId: 'app3', appKey: 'ak_9e1a3c5d7f2b', appSecret: 'sk_****7f2b', scope: 'ops.*', status: 'active', createdAt: '2026-05-20' },
  { id: 'k4', appId: 'app4', appKey: 'ak_2b6e8f1a3c5d', appSecret: 'sk_****3c5d', scope: 'watch.*', status: 'revoked', createdAt: '2026-06-08' },
]

export const SEED_WEBHOOKS: WebhookRecord[] = [
  { id: 'w1', endpoint: 'https://app1.example.com/webhook/order', events: ['order.created', 'order.paid'], status: 'active', lastDelivery: '2026-08-21 09:30' },
  { id: 'w2', endpoint: 'https://app2.example.com/webhook/product', events: ['product.updated'], status: 'active', lastDelivery: '2026-08-21 08:12' },
  { id: 'w3', endpoint: 'https://app3.example.com/webhook/alert', events: ['health.alert'], status: 'disabled', lastDelivery: '2026-08-19 22:00' },
]

export const SEED_API_AUDIT: ApiCallAudit[] = [
  { id: 'c1', method: 'GET', path: '/v1/products', statusCode: 200, latency: 42, time: '2026-08-21 09:31' },
  { id: 'c2', method: 'POST', path: '/v1/orders', statusCode: 201, latency: 88, time: '2026-08-21 09:30' },
  { id: 'c3', method: 'GET', path: '/v1/health/record', statusCode: 200, latency: 35, time: '2026-08-21 09:28' },
  { id: 'c4', method: 'PUT', path: '/v1/products/123', statusCode: 400, latency: 15, time: '2026-08-21 09:25' },
  { id: 'c5', method: 'GET', path: '/v1/orders', statusCode: 200, latency: 51, time: '2026-08-21 09:20' },
  { id: 'c6', method: 'POST', path: '/v1/auth/token', statusCode: 401, latency: 12, time: '2026-08-21 09:15' },
]

export const SEED_ALERT_RULES: AlertRule[] = [
  { id: 'al1', metric: 'API 错误率', threshold: '> 5%', channel: '邮件', status: 'active', lastTrigger: '—' },
  { id: 'al2', metric: '接口延迟', threshold: '> 500ms', channel: '短信', status: 'active', lastTrigger: '2026-08-19 14:20' },
  { id: 'al3', metric: '配额余量', threshold: '< 10%', channel: '站内信', status: 'active', lastTrigger: '2026-08-18 09:00' },
  { id: 'al4', metric: 'Webhook 投递失败', threshold: '> 3 次', channel: '邮件', status: 'disabled', lastTrigger: '—' },
]

export const SEED_SDK: SdkItem[] = [
  { lang: 'JavaScript / TypeScript', icon: '🟨', version: 'v1.4.2', size: '2.1 MB', notes: '支持浏览器与 Node.js 环境' },
  { lang: 'Python', icon: '🐍', version: 'v1.3.8', size: '1.6 MB', notes: '支持 3.8+ 版本' },
  { lang: 'Java', icon: '☕', version: 'v1.2.5', size: '3.4 MB', notes: '支持 JDK 11+' },
  { lang: 'Go', icon: '🐹', version: 'v1.1.0', size: '1.2 MB', notes: '支持 Go 1.19+' },
  { lang: 'PHP', icon: '🐘', version: 'v1.0.7', size: '1.4 MB', notes: '支持 PHP 8.0+' },
]

// ===== 沙箱调试台：接口模板 / 响应场景 / 调用日志 =====

export type SandboxMethod = 'GET' | 'POST' | 'PUT' | 'DELETE'
export type SandboxScenarioKey = 'success' | 'badRequest' | 'unauthorized' | 'rateLimit' | 'serverError'

export interface SandboxEndpoint {
  id: string
  method: SandboxMethod
  path: string
  desc: string
  /** 默认请求体（GET / DELETE 为空） */
  body: string
  /** 成功响应示例 */
  sample: unknown
}

export interface SandboxLogItem {
  id: string
  method: SandboxMethod
  path: string
  status: number
  ms: number
  time: string
  ok: boolean
}

export const SANDBOX_BASE_URL = 'https://sandbox-api.suheng-os.com'
export const SANDBOX_PROD_URL = 'https://api.suheng-os.com'
export const SANDBOX_MOCK_RECORDS = 12480

export const SANDBOX_ENDPOINTS: SandboxEndpoint[] = [
  {
    id: 'products-list',
    method: 'GET',
    path: '/v1/products?page=1&pageSize=10',
    desc: '分页查询商品列表',
    body: '',
    sample: {
      code: 0,
      message: 'ok',
      data: {
        total: 128,
        page: 1,
        pageSize: 10,
        list: [
          { id: 'p001', name: '黄芪精口服液', price: 128, stock: 640 },
          { id: 'p002', name: '枸杞原浆', price: 89, stock: 1250 },
          { id: 'p003', name: '艾灸养生礼盒', price: 268, stock: 86 },
        ],
      },
    },
  },
  {
    id: 'orders-create',
    method: 'POST',
    path: '/v1/orders',
    desc: '创建跨境订单',
    body: '{\n  "items": [\n    { "productId": "p001", "qty": 2 }\n  ],\n  "currency": "USD"\n}',
    sample: {
      code: 0,
      message: 'ok',
      data: { orderId: 'SO20260831001', amount: 256, currency: 'USD', status: 'created' },
    },
  },
  {
    id: 'orders-list',
    method: 'GET',
    path: '/v1/orders?status=paid&page=1',
    desc: '查询订单列表',
    body: '',
    sample: {
      code: 0,
      message: 'ok',
      data: {
        total: 42,
        list: [
          { orderId: 'SO20260830017', amount: 512, status: 'paid' },
          { orderId: 'SO20260830018', amount: 89, status: 'paid' },
        ],
      },
    },
  },
  {
    id: 'health-record',
    method: 'GET',
    path: '/v1/health/record?userId=u-1',
    desc: '查询健康档案',
    body: '',
    sample: {
      code: 0,
      message: 'ok',
      data: { userId: 'u-1', constitution: 'qi_deficiency', bmi: 22.4, updatedAt: '2026-08-30 21:10' },
    },
  },
  {
    id: 'auth-token',
    method: 'POST',
    path: '/v1/auth/token',
    desc: '换取访问令牌',
    body: '{\n  "appKey": "ak_7f3c9d1e2a4b",\n  "scope": "health.*"\n}',
    sample: {
      code: 0,
      message: 'ok',
      data: { accessToken: 'at_sbx_9c1e4a7b2d', expiresIn: 7200 },
    },
  },
  {
    id: 'products-update',
    method: 'PUT',
    path: '/v1/products/p001',
    desc: '更新商品库存',
    body: '{\n  "stock": 600,\n  "price": 128\n}',
    sample: {
      code: 0,
      message: 'ok',
      data: { id: 'p001', stock: 600, price: 128, updatedAt: '2026-08-31 11:20' },
    },
  },
  {
    id: 'family-delete',
    method: 'DELETE',
    path: '/v1/family/f001',
    desc: '删除家人档案',
    body: '',
    sample: { code: 0, message: 'ok', data: { id: 'f001', deleted: true } },
  },
]

/** 成功场景状态码留空，由请求方法推导（POST → 201，其余 → 200） */
export const SANDBOX_SCENARIOS: Record<SandboxScenarioKey, { status: number | null; body: unknown }> = {
  success: { status: null, body: null },
  badRequest: {
    status: 400,
    body: { code: 40001, message: '参数校验失败：pageSize 超出允许范围（1-100）', data: null },
  },
  unauthorized: {
    status: 401,
    body: { code: 40100, message: 'Token 无效或已过期，请重新生成沙箱 Token', data: null },
  },
  rateLimit: {
    status: 429,
    body: { code: 42900, message: '请求过于频繁，已触发沙箱限流（100 次/分钟）', data: null },
  },
  serverError: {
    status: 500,
    body: { code: 50000, message: '服务内部错误（沙箱模拟），请稍后重试', data: null },
  },
}

export function generateCallTrend(days: number): Array<{ date: string; value: number }> {
  const now = new Date()
  const list: Array<{ date: string; value: number }> = []
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 86400000)
    list.push({ date: `${d.getMonth() + 1}/${d.getDate()}`, value: 1500 + Math.floor(Math.random() * 2800) })
  }
  return list
}

export const TOP_APIS = [
  { path: 'GET /v1/products', calls: 8420 },
  { path: 'GET /v1/orders', calls: 6310 },
  { path: 'POST /v1/orders', calls: 5120 },
  { path: 'GET /v1/health/record', calls: 4980 },
  { path: 'POST /v1/auth/token', calls: 4210 },
]
