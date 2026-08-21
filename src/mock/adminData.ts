// 管理端 mock 数据：审计日志 / 通知公告 / 备份 / 存储 / 集成 / 监控 / 智能体配置
export interface AuditLogRecord {
  id: string
  operator: string
  module: string
  action: string
  ip: string
  result: 'success' | 'fail'
  time: string
}

export interface NoticeRecord {
  id: string
  title: string
  content: string
  status: 'published' | 'draft'
  publishedAt: string
}

export interface BackupRecord {
  id: string
  name: string
  size: string
  createdAt: string
}

export interface StorageResource {
  type: string
  used: number // GB
  files: number
}

export interface IntegrationRecord {
  id: string
  name: string
  icon: string
  connected: boolean
  desc: string
}

export interface MonitorMetric {
  key: string
  label: string
  value: number // 0-100 百分比
  unit: string
  healthy: boolean
}

/** 权限点清单（角色分配用） */
export const ADMIN_PERMISSIONS: Array<{ id: string; label: string; group: string }> = [
  { id: 'user.manage', label: '用户管理', group: 'user' },
  { id: 'role.manage', label: '角色权限', group: 'user' },
  { id: 'stats.view', label: '数据统计', group: 'data' },
  { id: 'settings.edit', label: '系统设置', group: 'system' },
  { id: 'audit.view', label: '审计日志', group: 'system' },
  { id: 'agent.config', label: '智能体配置', group: 'system' },
  { id: 'notice.manage', label: '通知公告', group: 'ops' },
  { id: 'backup.manage', label: '数据备份', group: 'system' },
  { id: 'storage.manage', label: '存储资源', group: 'system' },
  { id: 'integration.manage', label: '平台集成', group: 'system' },
  { id: 'monitor.view', label: '系统监控', group: 'system' },
  { id: 'ops.competitor', label: '竞品分析', group: 'ops' },
  { id: 'ops.supply', label: '供应链', group: 'ops' },
  { id: 'ops.listing', label: '自动上架', group: 'ops' },
  { id: 'ops.procurement', label: '采购管理', group: 'ops' },
  { id: 'dev.apps', label: '应用管理', group: 'dev' },
  { id: 'dev.keys', label: '密钥管理', group: 'dev' },
  { id: 'dev.docs', label: 'API 文档', group: 'dev' },
  { id: 'shop.view', label: '主站浏览', group: 'shop' },
  { id: 'shop.order', label: '下单购买', group: 'shop' },
  { id: 'health.view', label: '健康档案', group: 'health' },
]

export const SEED_AUDIT_LOGS: AuditLogRecord[] = [
  { id: 'a1', operator: '系统管理员', module: '用户管理', action: '新增用户', ip: '192.168.1.10', result: 'success', time: '2026-08-21 09:32' },
  { id: 'a2', operator: '运营专员', module: '角色权限', action: '修改角色权限', ip: '192.168.1.22', result: 'success', time: '2026-08-21 09:05' },
  { id: 'a3', operator: '开发者小明', module: '密钥管理', action: '撤销密钥', ip: '10.0.0.8', result: 'success', time: '2026-08-20 23:41' },
  { id: 'a4', operator: '系统管理员', module: '系统设置', action: '开启维护模式', ip: '192.168.1.10', result: 'success', time: '2026-08-20 18:20' },
  { id: 'a5', operator: '未知用户', module: '登录', action: '登录失败', ip: '203.0.113.5', result: 'fail', time: '2026-08-20 15:12' },
  { id: 'a6', operator: '运营专员', module: '通知公告', action: '发布公告', ip: '192.168.1.22', result: 'success', time: '2026-08-20 11:03' },
  { id: 'a7', operator: '系统管理员', module: '数据备份', action: '创建备份', ip: '192.168.1.10', result: 'success', time: '2026-08-19 22:00' },
  { id: 'a8', operator: '未知用户', module: '登录', action: '登录失败', ip: '198.51.100.7', result: 'fail', time: '2026-08-19 03:18' },
]

export const SEED_NOTICES: NoticeRecord[] = [
  { id: 'n1', title: '素衡OS v1.0 正式发布', content: '欢迎使用素衡OS，融合中医健康管理与跨境电商的智能体桌面平台。', status: 'published', publishedAt: '2026-08-18' },
  { id: 'n2', title: '开放平台 API 升级通知', content: '开放平台 API 将于本周六凌晨升级，期间可能出现短暂不可用。', status: 'published', publishedAt: '2026-08-15' },
  { id: 'n3', title: '系统维护预告', content: '8 月 25 日凌晨 2:00-4:00 进行例行维护。', status: 'draft', publishedAt: '—' },
]

export const SEED_BACKUPS: BackupRecord[] = [
  { id: 'b1', name: '全量备份-20260820', size: '2.4 GB', createdAt: '2026-08-20 22:00' },
  { id: 'b2', name: '全量备份-20260813', size: '2.1 GB', createdAt: '2026-08-13 22:00' },
  { id: 'b3', name: '全量备份-20260806', size: '1.9 GB', createdAt: '2026-08-06 22:00' },
]

export const SEED_STORAGE: StorageResource[] = [
  { type: '商品图片', used: 6.8, files: 1240 },
  { type: '视频素材', used: 4.2, files: 96 },
  { type: '文档附件', used: 1.6, files: 480 },
  { type: '语音播报缓存', used: 0.4, files: 210 },
  { type: '备份数据', used: 6.4, files: 3 },
]

export const SEED_INTEGRATIONS: IntegrationRecord[] = [
  { id: 'i1', name: '微信支付', icon: '💚', connected: true, desc: '国内电商支付通道' },
  { id: 'i2', name: '支付宝', icon: '🅰️', connected: true, desc: '国内电商支付通道' },
  { id: 'i3', name: 'Google', icon: '🌐', connected: true, desc: '海外登录与推广' },
  { id: 'i4', name: 'Facebook', icon: '📘', connected: false, desc: '海外社交推广' },
  { id: 'i5', name: 'WhatsApp', icon: '📱', connected: true, desc: '海外客服渠道' },
  { id: 'i6', name: 'Telegram', icon: '✈️', connected: false, desc: '通知推送渠道' },
  { id: 'i7', name: '淘宝开放平台', icon: '🛒', connected: true, desc: '国内电商数据' },
  { id: 'i8', name: '抖音开放平台', icon: '🎵', connected: false, desc: '短视频营销' },
]

export function generateMonitorMetrics(): MonitorMetric[] {
  return [
    { key: 'cpu', label: 'CPU', value: 38 + Math.floor(Math.random() * 20), unit: '%', healthy: true },
    { key: 'memory', label: '内存', value: 52 + Math.floor(Math.random() * 15), unit: '%', healthy: true },
    { key: 'disk', label: '磁盘', value: 61 + Math.floor(Math.random() * 10), unit: '%', healthy: true },
    { key: 'network', label: '网络', value: 24 + Math.floor(Math.random() * 30), unit: 'Mbps', healthy: true },
  ]
}

export function generateUserGrowth(days: number): Array<{ date: string; value: number }> {
  const now = new Date()
  const list: Array<{ date: string; value: number }> = []
  let base = 120
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 86400000)
    base += Math.floor(Math.random() * 40) - 5
    list.push({ date: `${d.getMonth() + 1}/${d.getDate()}`, value: Math.max(base, 0) })
  }
  return list
}

export function generateApiTrend(days: number): Array<{ date: string; value: number }> {
  const now = new Date()
  const list: Array<{ date: string; value: number }> = []
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 86400000)
    list.push({ date: `${d.getMonth() + 1}/${d.getDate()}`, value: 2000 + Math.floor(Math.random() * 3500) })
  }
  return list
}
