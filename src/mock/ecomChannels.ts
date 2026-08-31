// 电商开放平台对接：淘宝 TOP / 京东 JOS（宙斯）/ 拼多多开放平台
// 覆盖网关地址、鉴权字段、签名规范与可订阅的告警场景，供「告警管理」页做渠道接入与联调。

import { md5 } from '@/utils/md5'

export type EcomPlatformKey = 'taobao' | 'jd' | 'pdd'
export type EcomEnv = 'prod' | 'sandbox'
export type EcomChannelStatus = 'idle' | 'connected' | 'error'

export interface EcomPlatform {
  key: EcomPlatformKey
  name: string
  abbr: string
  color: string
  /** 生产网关 */
  gateway: string
  /** 沙箱网关，平台未提供独立沙箱域名时为 null */
  sandboxGateway: string | null
  sandboxNote: string
  oauthUrl: string
  tokenUrl: string
  /** 应用标识字段名 */
  keyField: string
  /** 应用密钥字段名 */
  secretField: string
  /** 会话 / 令牌字段名 */
  sessionField: string
  /** 业务参数封装字段；null 表示业务参数与系统参数平铺 */
  bizField: string | null
  /** 接口方法字段名 */
  methodField: string
  /** 版本号字段名 */
  versionField: string
  /** 版本号取值 */
  version: string
  /** 签名算法字段名，无该字段时为 null */
  signMethodField: string | null
  signMethod: string
  /** 数据格式字段名，无该字段时为 null */
  formatField: string | null
  /** 数据格式取值 */
  formatValue: string
  /** 时间戳单位：秒级时间戳 / 格式化时间 */
  timestampUnit: 'epoch' | 'datetime'
  rateLimit: string
  docs: string
}

export const ECOM_PLATFORMS: EcomPlatform[] = [
  {
    key: 'taobao',
    name: '淘宝开放平台',
    abbr: 'TOP',
    color: '#ff5000',
    gateway: 'https://eco.taobao.com/router/rest',
    sandboxGateway: 'https://gw.api.tbsandbox.com/router/rest',
    sandboxNote: 'TOP 提供独立沙箱网关，需使用沙箱应用的 AppKey / AppSecret 与沙箱 session',
    oauthUrl: 'https://oauth.taobao.com/authorize',
    tokenUrl: 'https://oauth.taobao.com/token',
    keyField: 'app_key',
    secretField: 'app_secret',
    sessionField: 'session',
    bizField: null,
    methodField: 'method',
    versionField: 'v',
    version: '2.0',
    signMethodField: 'sign_method',
    signMethod: 'md5',
    formatField: 'format',
    formatValue: 'json',
    timestampUnit: 'datetime',
    rateLimit: '默认 5000 次/日，随应用等级上浮',
    docs: 'https://open.taobao.com',
  },
  {
    key: 'jd',
    name: '京东宙斯开放平台',
    abbr: 'JOS',
    color: '#e1251b',
    gateway: 'https://api.jd.com/routerjson',
    sandboxGateway: null,
    sandboxNote: 'JOS 无独立沙箱域名，需在开放平台创建沙箱应用后使用同一网关联调',
    oauthUrl: 'https://oauth.jd.com/oauth/authorize',
    tokenUrl: 'https://oauth.jd.com/oauth/token',
    keyField: 'app_key',
    secretField: 'app_secret',
    sessionField: 'access_token',
    bizField: '360buy_param_json',
    methodField: 'method',
    versionField: 'v',
    version: '2.0',
    signMethodField: 'sign_method',
    signMethod: 'md5',
    formatField: null,
    formatValue: '',
    timestampUnit: 'datetime',
    rateLimit: '按接口分级限流，常见 1000 次/分钟',
    docs: 'https://jos.jd.com',
  },
  {
    key: 'pdd',
    name: '拼多多开放平台',
    abbr: 'PDD',
    color: '#e02e24',
    gateway: 'https://open-api.pinduoduo.com/api/router',
    sandboxGateway: null,
    sandboxNote: '拼多多无独立沙箱域名，使用测试店铺授权后走同一网关联调',
    oauthUrl: 'https://open.pinduoduo.com',
    tokenUrl: 'https://open-api.pinduoduo.com/api/router（pdd.pop.auth.token.create）',
    keyField: 'client_id',
    secretField: 'client_secret',
    sessionField: 'access_token',
    bizField: null,
    methodField: 'type',
    versionField: 'version',
    version: 'V1',
    signMethodField: null,
    signMethod: 'md5',
    formatField: 'data_type',
    formatValue: 'JSON',
    timestampUnit: 'epoch',
    rateLimit: '按应用分级，常见 3000 次/分钟',
    docs: 'https://open.pinduoduo.com',
  },
]

export const ECOM_PLATFORM_MAP: Record<EcomPlatformKey, EcomPlatform> = ECOM_PLATFORMS.reduce(
  (acc, p) => {
    acc[p.key] = p
    return acc
  },
  {} as Record<EcomPlatformKey, EcomPlatform>,
)

export interface EcomScenario {
  id: string
  name: string
  desc: string
  /** 写入告警规则的监控指标 */
  metric: string
  /** 默认阈值 */
  threshold: string
  /** 默认通知渠道 */
  channel: string
  /** 建议轮询间隔（分钟） */
  pollInterval: number
  /** 各平台对应的开放接口名（预置常用值，可在配置中修改） */
  methods: Record<EcomPlatformKey, string>
}

export const ECOM_SCENARIOS: EcomScenario[] = [
  {
    id: 'order-timeout',
    name: '发货超时',
    desc: '已付款订单超过约定时效仍未发货',
    metric: '发货超时订单数',
    threshold: '> 0',
    channel: 'Webhook',
    pollInterval: 15,
    methods: {
      taobao: 'taobao.trades.sold.get',
      jd: 'jingdong.order.search',
      pdd: 'pdd.order.list.get',
    },
  },
  {
    id: 'stock-shortage',
    name: '库存告急',
    desc: '在售商品可用库存低于安全水位',
    metric: '库存告急 SKU 数',
    threshold: '< 10',
    channel: '邮件',
    pollInterval: 30,
    methods: {
      taobao: 'taobao.items.onsale.get',
      jd: 'jingdong.ware.read.findWareById',
      pdd: 'pdd.goods.list.get',
    },
  },
  {
    id: 'refund-spike',
    name: '退款率异常',
    desc: '近 24 小时退款订单占比突增',
    metric: '24h 退款率',
    threshold: '> 5%',
    channel: '短信',
    pollInterval: 60,
    methods: {
      taobao: 'taobao.refunds.receive.get',
      jd: 'jingdong.afterSale.search',
      pdd: 'pdd.refund.list.get',
    },
  },
  {
    id: 'item-off-shelf',
    name: '商品异常下架',
    desc: '短时间内在售商品被批量下架',
    metric: '1h 内下架商品数',
    threshold: '> 5',
    channel: '站内信',
    pollInterval: 30,
    methods: {
      taobao: 'taobao.items.onsale.get',
      jd: 'jingdong.ware.read.findWareById',
      pdd: 'pdd.goods.list.get',
    },
  },
  {
    id: 'logistics-stalled',
    name: '物流滞留',
    desc: '快递轨迹长时间无更新',
    metric: '物流滞留订单数',
    threshold: '> 48h',
    channel: 'Webhook',
    pollInterval: 60,
    methods: {
      taobao: 'taobao.logistics.trace.search',
      jd: 'jingdong.logistics.order.search',
      pdd: 'pdd.logistics.trace.get',
    },
  },
  {
    id: 'price-violation',
    name: '价格异常',
    desc: '售价偏离基准价，可能存在改价风险',
    metric: '价格偏离幅度',
    threshold: '> 20%',
    channel: '邮件',
    pollInterval: 120,
    methods: {
      taobao: 'taobao.item.sku.price.update',
      jd: 'jingdong.price.update',
      pdd: 'pdd.goods.sku.price.update',
    },
  },
]

export interface EcomChannel {
  platform: EcomPlatformKey
  enabled: boolean
  env: EcomEnv
  appKey: string
  appSecret: string
  session: string
  callbackUrl: string
  /** 已订阅的告警场景 id */
  scenarios: string[]
  status: EcomChannelStatus
  lastCheck: string
  /** 轮询间隔（分钟） */
  pollInterval: number
}

export const SEED_ECOM_CHANNELS: EcomChannel[] = [
  {
    platform: 'taobao',
    enabled: false,
    env: 'sandbox',
    appKey: '',
    appSecret: '',
    session: '',
    callbackUrl: 'https://openapi.suheng-os.com/callback/taobao',
    scenarios: ['order-timeout', 'stock-shortage'],
    status: 'idle',
    lastCheck: '—',
    pollInterval: 15,
  },
  {
    platform: 'jd',
    enabled: false,
    env: 'prod',
    appKey: '',
    appSecret: '',
    session: '',
    callbackUrl: 'https://openapi.suheng-os.com/callback/jd',
    scenarios: ['order-timeout'],
    status: 'idle',
    lastCheck: '—',
    pollInterval: 15,
  },
  {
    platform: 'pdd',
    enabled: false,
    env: 'prod',
    appKey: '',
    appSecret: '',
    session: '',
    callbackUrl: 'https://openapi.suheng-os.com/callback/pdd',
    scenarios: [],
    status: 'idle',
    lastCheck: '—',
    pollInterval: 15,
  },
]

/** 按平台规范生成时间戳 */
export function ecomTimestamp(platform: EcomPlatform): string {
  const d = new Date()
  if (platform.timestampUnit === 'epoch') return String(Math.floor(d.getTime() / 1000))
  const p2 = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())} ${p2(d.getHours())}:${p2(d.getMinutes())}:${p2(d.getSeconds())}`
}

export interface EcomSignContext {
  platform: EcomPlatform
  appKey: string
  appSecret: string
  session: string
  method: string
  bizParams: Record<string, string>
  timestamp: string
}

/** 组装系统参数 + 业务参数（业务参数在京东下封装为 360buy_param_json） */
export function buildSystemParams(ctx: EcomSignContext): Record<string, string> {
  const p = ctx.platform
  const params: Record<string, string> = {}
  params[p.methodField] = ctx.method
  params[p.keyField] = ctx.appKey
  if (ctx.session) params[p.sessionField] = ctx.session
  params.timestamp = ctx.timestamp
  params[p.versionField] = p.version
  if (p.formatField) params[p.formatField] = p.formatValue
  if (p.signMethodField) params[p.signMethodField] = p.signMethod
  if (p.bizField) {
    params[p.bizField] = JSON.stringify(ctx.bizParams)
  } else {
    Object.assign(params, ctx.bizParams)
  }
  return params
}

/** 待签名原文：密钥 + 按参数名 ASCII 升序拼接的 k1v1k2v2 + 密钥 */
export function buildSignSource(ctx: EcomSignContext): string {
  const params = buildSystemParams(ctx)
  const body = Object.keys(params)
    .sort()
    .map((k) => `${k}${params[k]}`)
    .join('')
  return `${ctx.appSecret}${body}${ctx.appSecret}`
}

/** 签名值：MD5（32 位大写） */
export function buildSign(ctx: EcomSignContext): string {
  return md5(buildSignSource(ctx)).toUpperCase()
}

/** 完整请求参数（含 sign） */
export function buildRequestParams(ctx: EcomSignContext): Record<string, string> {
  const params = buildSystemParams(ctx)
  params.sign = buildSign(ctx)
  return params
}

/** 生成可用于联调的 GET 请求 URL */
export function buildRequestUrl(ctx: EcomSignContext, env: EcomEnv): string {
  const p = ctx.platform
  const base = env === 'sandbox' && p.sandboxGateway ? p.sandboxGateway : p.gateway
  const params = buildRequestParams(ctx)
  const query = Object.keys(params)
    .sort()
    .map((k) => `${encodeURIComponent(k)}=${encodeURIComponent(params[k]!)}`)
    .join('&')
  return `${base}?${query}`
}
