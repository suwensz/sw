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
