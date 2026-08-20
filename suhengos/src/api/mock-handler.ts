/**
 * Mock 数据路由处理器
 * 将 /api/v1/* 请求映射到 Mock 数据
 * 所有 Mock 逻辑集中于此，切换到真实后端时只需关闭 Mock 适配器
 */

import type { AxiosRequestConfig } from 'axios'
import { mockProducts } from '@/mock/products'
import {
  constitutionTypes,
  allConstitutionQuestions,
} from '@/mock/constitution'
import {
  mockConversations,
  mockMessages,
  getAiReply,
  suggestedQuestions,
} from '@/mock/conversation'
import { currencies, shippingMethods } from '@/mock/shop'
import {
  createWatch,
  createMetric,
} from '@/mock/watch'
import {
  DIET_RECIPES,
  calculateWuYunLiuQi,
  generateForecast,
  calculateConstitutionFromBirth,
} from '@/mock/wuyun'
import {
  MARKETPLACES,
  generateCompetitors,
  generateSupplyChain,
  generateMarketDemands,
} from '@/mock/operations'
import type {
  UserInfo,
  LoginPayload,
  RegisterPayload,
  Product,
  HealthProfile,
} from '@/types'
import { getLocale } from '@/i18n'

// ============ 类型 ============

export interface MockResponse {
  status: number
  data: unknown
}

type RouteHandler = (config: AxiosRequestConfig) => MockResponse | Promise<MockResponse>

// ============ Mock 数据状态（内存） ============

// 重新导出 createWatch / createMetric 供外部使用
export { createWatch, createMetric }

// ============ 工具函数 ============

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}

function ok(data: unknown): MockResponse {
  return { status: 200, data }
}

function created(data: unknown): MockResponse {
  return { status: 201, data }
}

function notFound(msg = 'Not Found'): MockResponse {
  return { status: 404, data: { message: msg } }
}

function badRequest(msg: string): MockResponse {
  return { status: 400, data: { message: msg } }
}

function unauthorized(msg = 'Unauthorized'): MockResponse {
  return { status: 401, data: { message: msg } }
}

/** 从 config 中解析 JSON body */
function parseBody<T = unknown>(config: AxiosRequestConfig): T {
  if (typeof config.data === 'string') {
    try {
      return JSON.parse(config.data) as T
    } catch {
      return {} as T
    }
  }
  return (config.data ?? {}) as T
}

// ============ 开发测试账号 ============

const DEV_TEST_ACCOUNTS: Array<{ email: string; password: string; user: UserInfo }> = [
  {
    email: 'dev_user@coze.dev',
    password: 'dev123456',
    user: {
      id: 'dev-001',
      email: 'dev_user@coze.dev',
      name: '岐黄体验官',
      nickname: '岐黄体验官',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=qihuang',
      role: 'user',
      locale: 'zh',
      healthProfile: { gender: 'female', age: 32, height: 165, weight: 55, constitution: 'qiDeficiency' },
      createdAt: '2024-01-01T00:00:00Z',
    },
  },
  {
    email: 'dev_admin@coze.dev',
    password: 'dev123456',
    user: {
      id: 'dev-admin-001',
      email: 'dev_admin@coze.dev',
      name: '系统管理员',
      nickname: '系统管理员',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=suheng-admin',
      role: 'admin',
      locale: 'zh',
      createdAt: '2024-01-01T00:00:00Z',
    },
  },
  {
    email: 'dev_ops@coze.dev',
    password: 'dev123456',
    user: {
      id: 'dev-ops-001',
      email: 'dev_ops@coze.dev',
      name: '跨境运营员',
      nickname: '跨境运营员',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=suheng-ops',
      role: 'ops',
      locale: 'zh',
      createdAt: '2024-01-01T00:00:00Z',
    },
  },
  {
    email: 'dev_dev@coze.dev',
    password: 'dev123456',
    user: {
      id: 'dev-dev-001',
      email: 'dev_dev@coze.dev',
      name: '研发工程师',
      nickname: '研发工程师',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=suheng-dev',
      role: 'dev',
      locale: 'zh',
      createdAt: '2024-01-01T00:00:00Z',
    },
  },
]

// ============ RBAC 权限矩阵（Mock） ============

export interface RbacPermission {
  resource: string
  resourceLabel: string
  actions: string[]
  roles: Record<string, boolean[]>
}

export const RBAC_MATRIX: RbacPermission[] = [
  {
    resource: 'dashboard',
    resourceLabel: '数据看板',
    actions: ['view'],
    roles: { user: [true], admin: [true], ops: [true], dev: [true] },
  },
  {
    resource: 'users',
    resourceLabel: '用户管理',
    actions: ['view', 'create', 'update', 'delete'],
    roles: { user: [false, false, false, false], admin: [true, true, true, true], ops: [true, false, false, false], dev: [true, false, false, false] },
  },
  {
    resource: 'products',
    resourceLabel: '商品管理',
    actions: ['view', 'create', 'update', 'delete'],
    roles: { user: [false, false, false, false], admin: [true, true, true, true], ops: [true, true, true, false], dev: [true, false, false, false] },
  },
  {
    resource: 'orders',
    resourceLabel: '订单管理',
    actions: ['view', 'update', 'refund'],
    roles: { user: [false, false, false], admin: [true, true, true], ops: [true, true, false], dev: [true, false, false] },
  },
  {
    resource: 'content',
    resourceLabel: '内容审核',
    actions: ['view', 'approve', 'reject'],
    roles: { user: [false, false, false], admin: [true, true, true], ops: [true, false, false], dev: [true, false, false] },
  },
  {
    resource: 'competitor',
    resourceLabel: '竞品情报',
    actions: ['view', 'refresh', 'export'],
    roles: { user: [false, false, false], admin: [true, true, true], ops: [true, true, true], dev: [true, true, false] },
  },
  {
    resource: 'supply',
    resourceLabel: '供应链',
    actions: ['view', 'update', 'export'],
    roles: { user: [false, false, false], admin: [true, true, true], ops: [true, true, true], dev: [true, false, false] },
  },
  {
    resource: 'audit_log',
    resourceLabel: '审计日志',
    actions: ['view', 'export'],
    roles: { user: [false, false], admin: [true, true], ops: [false, false], dev: [true, false] },
  },
  {
    resource: 'settings',
    resourceLabel: '系统设置',
    actions: ['view', 'update'],
    roles: { user: [false, false], admin: [true, true], ops: [false, false], dev: [true, false] },
  },
]

// ============ 审计日志（Mock） ============

export interface AuditLogEntry {
  id: string
  timestamp: string
  actor: string
  actorRole: string
  action: string
  resource: string
  resourceId?: string
  detail: string
  ip: string
  status: 'success' | 'failed'
}

function seedAuditLogs(): AuditLogEntry[] {
  const logs: Array<Omit<AuditLogEntry, 'id'>> = [
    { timestamp: '2026-08-20T09:15:00Z', actor: 'dev_admin@coze.dev', actorRole: 'admin', action: 'login', resource: 'auth', detail: '管理员登录成功', ip: '192.168.1.100', status: 'success' },
    { timestamp: '2026-08-20T09:16:00Z', actor: 'dev_admin@coze.dev', actorRole: 'admin', action: 'update', resource: 'users', resourceId: 'u-003', detail: '修改用户角色 user → admin', ip: '192.168.1.100', status: 'success' },
    { timestamp: '2026-08-20T09:20:00Z', actor: 'dev_admin@coze.dev', actorRole: 'admin', action: 'approve', resource: 'content', resourceId: 'cr-001', detail: '审核通过阿拉伯语商品翻译', ip: '192.168.1.100', status: 'success' },
    { timestamp: '2026-08-20T09:25:00Z', actor: 'dev_ops@coze.dev', actorRole: 'ops', action: 'login', resource: 'auth', detail: '运营员登录', ip: '10.0.0.52', status: 'success' },
    { timestamp: '2026-08-20T09:30:00Z', actor: 'dev_ops@coze.dev', actorRole: 'ops', action: 'create', resource: 'listing', resourceId: 'task_1724150400000', detail: '创建 Shopee 上架任务', ip: '10.0.0.52', status: 'success' },
    { timestamp: '2026-08-20T09:35:00Z', actor: 'dev_admin@coze.dev', actorRole: 'admin', action: 'update', resource: 'products', resourceId: 'p002', detail: '修改枸杞子价格 $19.99 → $18.99', ip: '192.168.1.100', status: 'success' },
    { timestamp: '2026-08-20T09:40:00Z', actor: 'unknown@coze.dev', actorRole: 'user', action: 'login', resource: 'auth', detail: '密码错误 3 次后账户锁定', ip: '203.0.113.45', status: 'failed' },
    { timestamp: '2026-08-20T09:45:00Z', actor: 'dev_dev@coze.dev', actorRole: 'dev', action: 'update', resource: 'settings', detail: '切换 API 环境 dev → staging', ip: '172.16.0.8', status: 'success' },
    { timestamp: '2026-08-20T10:00:00Z', actor: 'dev_admin@coze.dev', actorRole: 'admin', action: 'delete', resource: 'users', resourceId: 'u-010', detail: '禁用用户账户（违规操作）', ip: '192.168.1.100', status: 'success' },
    { timestamp: '2026-08-20T10:05:00Z', actor: 'dev_ops@coze.dev', actorRole: 'ops', action: 'export', resource: 'competitor', detail: '导出竞品情报 CSV（42 条）', ip: '10.0.0.52', status: 'success' },
    { timestamp: '2026-08-20T10:10:00Z', actor: 'dev_admin@coze.dev', actorRole: 'admin', action: 'update', resource: 'rbac', detail: '调整 ops 角色供应链权限：新增 update', ip: '192.168.1.100', status: 'success' },
    { timestamp: '2026-08-20T10:15:00Z', actor: 'dev_dev@coze.dev', actorRole: 'dev', action: 'update', resource: 'flags', detail: '关闭 mock.api.delay 开关', ip: '172.16.0.8', status: 'success' },
  ]
  return logs.map((l, i) => ({ ...l, id: 'audit-' + String(i + 1).padStart(3, '0') }))
}

// ============ 轻流数据（Mock） ============

export interface QingFlowApp {
  id: string
  name: string
  category: 'A' | 'B' | 'C'
  status: 'active' | 'paused' | 'error'
  lastSync: string
  recordCount: number
  fields: { key: string; label: string; type: string }[]
}

export const QINGFLOW_APPS: QingFlowApp[] = [
  {
    id: 'qf-A001',
    name: '跨境订单管理',
    category: 'A',
    status: 'active',
    lastSync: '2026-08-20T10:00:00Z',
    recordCount: 156,
    fields: [
      { key: 'orderNo', label: '订单号', type: 'text' },
      { key: 'customer', label: '客户', type: 'text' },
      { key: 'amount', label: '金额', type: 'number' },
      { key: 'platform', label: '平台', type: 'select' },
      { key: 'status', label: '状态', type: 'select' },
    ],
  },
  {
    id: 'qf-B001',
    name: '供应链采购单',
    category: 'B',
    status: 'active',
    lastSync: '2026-08-20T09:58:00Z',
    recordCount: 89,
    fields: [
      { key: 'poNo', label: '采购单号', type: 'text' },
      { key: 'supplier', label: '供应商', type: 'text' },
      { key: 'product', label: '商品', type: 'text' },
      { key: 'quantity', label: '数量', type: 'number' },
      { key: 'cost', label: '成本', type: 'number' },
      { key: 'eta', label: '预计到货', type: 'date' },
    ],
  },
  {
    id: 'qf-C001',
    name: '仓储物流跟踪',
    category: 'C',
    status: 'active',
    lastSync: '2026-08-20T10:05:00Z',
    recordCount: 234,
    fields: [
      { key: 'trackingNo', label: '运单号', type: 'text' },
      { key: 'carrier', label: '承运商', type: 'text' },
      { key: 'origin', label: '始发地', type: 'text' },
      { key: 'dest', label: '目的地', type: 'text' },
      { key: 'weight', label: '重量(kg)', type: 'number' },
      { key: 'status', label: '物流状态', type: 'select' },
    ],
  },
]

export interface QingFlowRecord {
  id: string
  appId: string
  data: Record<string, string | number>
  createdAt: string
  updatedAt: string
}

function seedQingFlowRecords(): QingFlowRecord[] {
  const records: QingFlowRecord[] = []
  const orders = [
    { orderNo: 'SO-20261001', customer: 'Amina Yusuf', amount: 128, platform: 'Shopee', status: 'shipped' },
    { orderNo: 'SO-20261002', customer: 'Nguyen Thi Lan', amount: 59, platform: 'Lazada', status: 'paid' },
    { orderNo: 'SO-20261003', customer: 'Somchai P.', amount: 235, platform: 'TikTok Shop', status: 'completed' },
    { orderNo: 'SO-20261004', customer: 'Maria Santos', amount: 88, platform: 'Tokopedia', status: 'pending' },
    { orderNo: 'SO-20261005', customer: 'Rina Wati', amount: 168, platform: 'Shopee', status: 'shipped' },
    { orderNo: 'SO-20261006', customer: 'Ahmad Bin Ali', amount: 199, platform: 'Noon', status: 'paid' },
  ]
  orders.forEach((o, i) => {
    records.push({
      id: 'qf-rec-' + (i + 1),
      appId: 'qf-A001',
      data: o,
      createdAt: '2026-08-20T0' + (9 + (i % 2)) + ':' + String((i * 11) % 60).padStart(2, '0') + ':00Z',
      updatedAt: '2026-08-20T10:' + String(i * 8).padStart(2, '0') + ':00Z',
    })
  })
  const pos = [
    { poNo: 'PO-2026001', supplier: '宁夏杞鑫堂', product: '枸杞原浆', quantity: 500, cost: 12.5, eta: '2026-08-25' },
    { poNo: 'PO-2026002', supplier: '桐乡菊源', product: '胎菊花茶', quantity: 300, cost: 8.0, eta: '2026-08-22' },
    { poNo: 'PO-2026003', supplier: '山东东阿', product: '阿胶糕', quantity: 200, cost: 28.0, eta: '2026-08-28' },
  ]
  pos.forEach((p, i) => {
    records.push({
      id: 'qf-rec-po-' + (i + 1),
      appId: 'qf-B001',
      data: p,
      createdAt: '2026-08-20T09:3' + i + ':00Z',
      updatedAt: '2026-08-20T09:4' + i + ':00Z',
    })
  })
  const shipments = [
    { trackingNo: 'SF1234567890', carrier: '顺丰国际', origin: '深圳', dest: '雅加达', weight: 2.5, status: 'in_transit' },
    { trackingNo: 'DHL9876543210', carrier: 'DHL', origin: '上海', dest: '迪拜', weight: 1.8, status: 'delivered' },
    { trackingNo: 'J&T555444333', carrier: 'J&T Express', origin: '广州', dest: '曼谷', weight: 3.2, status: 'customs' },
  ]
  shipments.forEach((s, i) => {
    records.push({
      id: 'qf-rec-ship-' + (i + 1),
      appId: 'qf-C001',
      data: s,
      createdAt: '2026-08-20T10:0' + i + ':00Z',
      updatedAt: '2026-08-20T10:1' + i + ':00Z',
    })
  })
  return records
}

const auditLogs = seedAuditLogs()
const qingFlowRecords = seedQingFlowRecords()

// ============ 管理端种子数据 ============

const ADMIN_USERS = [
  { id: 'u-001', email: 'user1@example.com', nickname: '岐黄体验官', role: 'admin', status: 'active', locale: 'zh', orders: 3, spent: 460, createdAt: '2026-01-10T10:00:00Z' },
  { id: 'u-002', email: 'user2@example.com', nickname: '林小满', role: 'user', status: 'active', locale: 'en', orders: 8, spent: 1280, createdAt: '2026-02-11T10:00:00Z' },
  { id: 'u-003', email: 'user3@example.com', nickname: 'Amina Yusuf', role: 'user', status: 'active', locale: 'ar', orders: 12, spent: 2350, createdAt: '2026-03-12T10:00:00Z' },
  { id: 'u-004', email: 'user4@example.com', nickname: 'Nguyen Thi Lan', role: 'user', status: 'active', locale: 'vi', orders: 1, spent: 199, createdAt: '2026-04-13T10:00:00Z' },
  { id: 'u-005', email: 'user5@example.com', nickname: 'Somchai P.', role: 'user', status: 'active', locale: 'th', orders: 0, spent: 0, createdAt: '2026-05-14T10:00:00Z' },
  { id: 'u-006', email: 'user6@example.com', nickname: 'Maria Santos', role: 'user', status: 'active', locale: 'es', orders: 5, spent: 870, createdAt: '2026-06-15T10:00:00Z' },
  { id: 'u-007', email: 'user7@example.com', nickname: 'Rina Wati', role: 'user', status: 'active', locale: 'id', orders: 2, spent: 320, createdAt: '2026-07-16T10:00:00Z' },
  { id: 'u-008', email: 'user8@example.com', nickname: 'Ahmad Bin Ali', role: 'user', status: 'active', locale: 'ar', orders: 6, spent: 990, createdAt: '2026-07-18T10:00:00Z' },
  { id: 'u-009', email: 'user9@example.com', nickname: 'Grace Tan', role: 'user', status: 'active', locale: 'en', orders: 4, spent: 640, createdAt: '2026-07-20T10:00:00Z' },
  { id: 'u-010', email: 'user10@example.com', nickname: '李知行', role: 'user', status: 'disabled', locale: 'zh', orders: 9, spent: 1560, createdAt: '2026-07-22T10:00:00Z' },
  { id: 'u-011', email: 'user11@example.com', nickname: 'Fatima Al-Said', role: 'user', status: 'active', locale: 'ar', orders: 7, spent: 1120, createdAt: '2026-07-25T10:00:00Z' },
  { id: 'u-012', email: 'user12@example.com', nickname: 'Chen Wei', role: 'user', status: 'active', locale: 'zh', orders: 11, spent: 2040, createdAt: '2026-07-28T10:00:00Z' },
]

const ADMIN_ORDERS = [
  { id: 'SO-20261000', userEmail: 'user1@example.com', productName: '枸杞原浆 30袋装', amount: 59, currency: 'CNY', status: 'pending', createdAt: '2026-08-01T09:00:00Z' },
  { id: 'SO-20261001', userEmail: 'user2@example.com', productName: '艾灸贴·肩颈舒缓', amount: 128, currency: 'USD', status: 'paid', createdAt: '2026-08-02T09:07:00Z' },
  { id: 'SO-20261002', userEmail: 'user3@example.com', productName: '酸枣仁膏 250g', amount: 88, currency: 'CNY', status: 'shipped', createdAt: '2026-08-03T09:14:00Z' },
  { id: 'SO-20261003', userEmail: 'user4@example.com', productName: '五红汤料包', amount: 39, currency: 'CNY', status: 'completed', createdAt: '2026-08-04T09:21:00Z' },
  { id: 'SO-20261004', userEmail: 'user5@example.com', productName: '桂枝茯苓胶囊', amount: 168, currency: 'CNY', status: 'refunded', createdAt: '2026-08-05T09:28:00Z' },
  { id: 'SO-20261005', userEmail: 'user6@example.com', productName: '足浴包·祛湿方', amount: 45, currency: 'CNY', status: 'pending', createdAt: '2026-08-06T09:35:00Z' },
  { id: 'SO-20261006', userEmail: 'user7@example.com', productName: '枸杞原浆 30袋装', amount: 60, currency: 'USD', status: 'paid', createdAt: '2026-08-07T09:42:00Z' },
  { id: 'SO-20261007', userEmail: 'user8@example.com', productName: '艾灸贴·肩颈舒缓', amount: 129, currency: 'CNY', status: 'shipped', createdAt: '2026-08-08T09:49:00Z' },
  { id: 'SO-20261008', userEmail: 'user9@example.com', productName: '酸枣仁膏 250g', amount: 89, currency: 'CNY', status: 'completed', createdAt: '2026-08-09T09:56:00Z' },
  { id: 'SO-20261009', userEmail: 'user10@example.com', productName: '五红汤料包', amount: 40, currency: 'CNY', status: 'pending', createdAt: '2026-08-10T10:03:00Z' },
  { id: 'SO-20261010', userEmail: 'user11@example.com', productName: '桂枝茯苓胶囊', amount: 169, currency: 'CNY', status: 'paid', createdAt: '2026-08-11T10:10:00Z' },
  { id: 'SO-20261011', userEmail: 'user12@example.com', productName: '足浴包·祛湿方', amount: 46, currency: 'CNY', status: 'shipped', createdAt: '2026-08-12T10:17:00Z' },
  { id: 'SO-20261012', userEmail: 'user1@example.com', productName: '枸杞原浆 30袋装', amount: 59, currency: 'CNY', status: 'completed', createdAt: '2026-08-13T10:24:00Z' },
  { id: 'SO-20261013', userEmail: 'user2@example.com', productName: '艾灸贴·肩颈舒缓', amount: 128, currency: 'USD', status: 'refunded', createdAt: '2026-08-14T10:31:00Z' },
  { id: 'SO-20261014', userEmail: 'user3@example.com', productName: '酸枣仁膏 250g', amount: 88, currency: 'CNY', status: 'pending', createdAt: '2026-08-15T10:38:00Z' },
  { id: 'SO-20261015', userEmail: 'user4@example.com', productName: '五红汤料包', amount: 39, currency: 'CNY', status: 'paid', createdAt: '2026-08-16T10:45:00Z' },
  { id: 'SO-20261016', userEmail: 'user5@example.com', productName: '桂枝茯苓胶囊', amount: 168, currency: 'CNY', status: 'shipped', createdAt: '2026-08-17T10:52:00Z' },
  { id: 'SO-20261017', userEmail: 'user6@example.com', productName: '足浴包·祛湿方', amount: 45, currency: 'CNY', status: 'completed', createdAt: '2026-08-18T10:59:00Z' },
]

// ============ 路由表 ============

const routes: Record<string, RouteHandler> = {
  // ---- Auth ----
  'POST /api/v1/auth/login': (config) => {
    const body = parseBody<LoginPayload>(config)
    if (body.method === 'password') {
      const dev = DEV_TEST_ACCOUNTS.find((a) => a.email === body.account && a.password === body.password)
      if (dev) {
        return ok({ user: dev.user, token: 'dev-token-' + Date.now() })
      }
      // Check registered users
      const regRaw = localStorage.getItem('qh_registered_' + body.account)
      if (regRaw) {
        try {
          const reg = JSON.parse(regRaw) as RegisterPayload
          if (reg.password === body.password) {
            const user: UserInfo = {
              id: 'u-' + Date.now(),
              email: body.account.includes('@') ? body.account : '',
              phone: body.account.includes('@') ? undefined : body.account,
              name: reg.nickname,
              nickname: reg.nickname,
              avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(body.account)}`,
              role: 'user',
              locale: getLocale(),
              healthProfile: reg.healthProfile,
              createdAt: new Date().toISOString(),
            }
            return ok({ user, token: 'token-' + Date.now() })
          }
          return unauthorized('账号或密码错误')
        } catch {
          // ignore
        }
      }
      // Auto-create for dev convenience
      if (body.password && body.password.length >= 6) {
        const user: UserInfo = {
          id: 'u-' + Date.now(),
          email: body.account.includes('@') ? body.account : '',
          phone: body.account.includes('@') ? undefined : body.account,
          name: body.account.includes('@') ? body.account.split('@')[0] : body.account,
          nickname: body.account.includes('@') ? body.account.split('@')[0] : body.account,
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(body.account)}`,
          role: 'user',
          locale: getLocale(),
          createdAt: new Date().toISOString(),
        }
        return ok({ user, token: 'token-' + Date.now() })
      }
    }
    // Code login
    if (body.method === 'code' && body.code && body.code.length === 6) {
      const user: UserInfo = {
        id: 'u-' + Date.now(),
        email: body.account.includes('@') ? body.account : '',
        phone: body.account.includes('@') ? undefined : body.account,
        name: body.account.includes('@') ? body.account.split('@')[0] : body.account,
        nickname: body.account.includes('@') ? body.account.split('@')[0] : body.account,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(body.account)}`,
        role: 'user',
        locale: getLocale(),
        createdAt: new Date().toISOString(),
      }
      return ok({ user, token: 'token-' + Date.now() })
    }
    return badRequest('登录参数无效')
  },

  'POST /api/v1/auth/register': (config) => {
    const body = parseBody<RegisterPayload>(config)
    localStorage.setItem('qh_registered_' + body.account, JSON.stringify(body))
    const user: UserInfo = {
      id: 'u-' + Date.now(),
      email: body.account.includes('@') ? body.account : '',
      phone: body.account.includes('@') ? undefined : body.account,
      name: body.nickname,
      nickname: body.nickname,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(body.nickname)}`,
      role: 'user',
      locale: getLocale(),
      healthProfile: body.healthProfile,
      createdAt: new Date().toISOString(),
    }
    return created({ user, token: 'token-' + Date.now() })
  },

  'POST /api/v1/auth/send-code': () => ok({ success: true }),

  'POST /api/v1/auth/third-party': (config) => {
    const body = parseBody<{ provider: string }>(config)
    const provider = body.provider || 'unknown'
    const user: UserInfo = {
      id: provider + '-' + Date.now(),
      email: `user@${provider}.com`,
      name: `${provider.charAt(0).toUpperCase() + provider.slice(1)} User`,
      nickname: `${provider.charAt(0).toUpperCase() + provider.slice(1)} User`,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${provider}`,
      role: 'user',
      locale: getLocale(),
      createdAt: new Date().toISOString(),
    }
    return ok({ user, token: 'token-' + provider + '-' + Date.now() })
  },

  'GET /api/v1/auth/profile': (config) => {
    const authHeader = config.headers?.Authorization || config.headers?.authorization
    if (!authHeader) return unauthorized()
    const userJson = localStorage.getItem('qh_auth_user')
    if (userJson) {
      return ok(JSON.parse(userJson))
    }
    return notFound('用户未找到')
  },

  'PUT /api/v1/auth/profile': (config) => {
    const body = parseBody<Partial<UserInfo>>(config)
    const userJson = localStorage.getItem('qh_auth_user')
    if (userJson) {
      const user = { ...JSON.parse(userJson), ...body } as UserInfo
      localStorage.setItem('qh_auth_user', JSON.stringify(user))
      return ok(user)
    }
    return notFound('用户未找到')
  },

  'PUT /api/v1/auth/health-profile': (config) => {
    const body = parseBody<Partial<HealthProfile>>(config)
    const userJson = localStorage.getItem('qh_auth_user')
    if (userJson) {
      const user = JSON.parse(userJson) as UserInfo
      user.healthProfile = { ...user.healthProfile, ...body }
      localStorage.setItem('qh_auth_user', JSON.stringify(user))
      return ok(user)
    }
    return notFound('用户未找到')
  },

  // ---- Products ----
  'GET /api/v1/products': () => ok(mockProducts),
  'GET /api/v1/products/:id': (config) => {
    const id = (config.url || '').split('/').pop()
    const product = mockProducts.find((p) => p.id === id)
    return product ? ok(product) : notFound('商品不存在')
  },

  // ---- Shop ----
  'GET /api/v1/shop/currencies': () => ok(currencies),
  'GET /api/v1/shop/shipping': () => ok(shippingMethods),

  // ---- Constitution ----
  'GET /api/v1/constitution/types': () => ok(constitutionTypes),
  'GET /api/v1/constitution/questions': () => ok(allConstitutionQuestions),

  // ---- Conversation ----
  'GET /api/v1/conversations': () => ok(mockConversations),
  'GET /api/v1/conversations/:id/messages': (config) => {
    const id = (config.url || '').split('/').slice(-2, -1)[0]
    return ok(mockMessages[id] || [])
  },
  'POST /api/v1/conversations/:id/messages': (config) => {
    const body = parseBody<{ content: string }>(config)
    const reply = getAiReply(body.content || '')
    return ok({ role: 'assistant', content: reply.content, products: reply.products, id: 'msg-' + Date.now(), timestamp: new Date().toISOString() })
  },
  'GET /api/v1/conversations/suggested-questions': () => ok(suggestedQuestions),

  // ---- Health (watches/alerts/family) ----
  'GET /api/v1/health/watches': () => {
    const raw = localStorage.getItem('qh_watches')
    if (raw) {
      try {
        return ok(JSON.parse(raw))
      } catch {
        // ignore
      }
    }
    return ok([])
  },
  'GET /api/v1/health/alerts': () => {
    const raw = localStorage.getItem('qh_health_alerts')
    if (raw) {
      try {
        return ok(JSON.parse(raw))
      } catch {
        // ignore
      }
    }
    return ok([])
  },
  'GET /api/v1/health/family': () => {
    const raw = localStorage.getItem('qh_family_members')
    if (raw) {
      try {
        return ok(JSON.parse(raw))
      } catch {
        // ignore
      }
    }
    return ok([])
  },

  // ---- WuYun ----
  'GET /api/v1/wuyun/year/:year': (config) => {
    const year = Number((config.url || '').split('/').pop())
    return ok(calculateWuYunLiuQi(year))
  },
  'GET /api/v1/wuyun/forecast': (config) => {
    const params = config.params as { start?: string; days?: number }
    return ok(generateForecast(params?.start ? new Date(params.start) : new Date(), params?.days || 30))
  },
  'GET /api/v1/wuyun/diet-recipes': () => ok(DIET_RECIPES),
  'GET /api/v1/wuyun/constitution/:birthDate': (config) => {
    const birthDate = decodeURIComponent((config.url || '').split('/').pop() || '')
    return ok(calculateConstitutionFromBirth(birthDate))
  },

  // ---- Ops ----
  'GET /api/v1/ops/marketplaces': () => ok(MARKETPLACES),
  'GET /api/v1/ops/competitors': (config) => {
    const keyword = (config.params as { keyword?: string })?.keyword
    return ok(generateCompetitors(keyword))
  },
  'GET /api/v1/ops/supply-chain': () => ok(generateSupplyChain()),
  'GET /api/v1/ops/demands': () => ok(generateMarketDemands()),

  // ---- Admin ----
  'GET /api/v1/admin/users': () => ok(ADMIN_USERS),
  'GET /api/v1/admin/orders': () => ok(ADMIN_ORDERS),
  'GET /api/v1/admin/stats': () => {
    const activeUsers = ADMIN_USERS.filter((u) => u.status === 'active').length
    const pendingOrders = ADMIN_ORDERS.filter((o) => o.status === 'pending').length
    const totalRevenue = ADMIN_ORDERS
      .filter((o) => o.status === 'paid' || o.status === 'shipped' || o.status === 'completed')
      .reduce((sum, o) => sum + o.amount, 0)
    return ok({
      totalUsers: ADMIN_USERS.length,
      activeUsers,
      totalOrders: ADMIN_ORDERS.length,
      pendingOrders,
      pendingReviews: 6,
      totalRevenue,
    })
  },
  'GET /api/v1/admin/content-reviews': () => ok([
    { id: 'cr-001', module: 'shop', key: 'productName.gojiPaste', locale: 'ar', sourceText: '枸杞原浆·30袋装', translatedText: 'عصارة الغوجي - 30 كيس', status: 'pending', submittedAt: '2026-08-10T14:00:00Z' },
    { id: 'cr-002', module: 'shop', key: 'productDesc.gojiPaste', locale: 'th', sourceText: '宁夏枸杞低温冷榨，保留天然营养', translatedText: 'สกัดเย็นจากฝรั่งเวียดนาม', status: 'pending', submittedAt: '2026-08-11T14:00:00Z' },
    { id: 'cr-003', module: 'health', key: 'alerts.constitution.qiDeficiency', locale: 'vi', sourceText: '气虚质建议：避免过度劳累', translatedText: 'Thể chất khí hư: tránh làm việc quá sức', status: 'pending', submittedAt: '2026-08-12T14:00:00Z' },
    { id: 'cr-004', module: 'ops', key: 'listing.title.goji', locale: 'id', sourceText: '枸杞原浆 Listing 标题（东南亚站）', translatedText: 'Sari Goji Asli - 30 sachet', status: 'pending', submittedAt: '2026-08-13T14:00:00Z' },
    { id: 'cr-005', module: 'ui', key: 'cart.emptyHint', locale: 'fil', sourceText: '购物车还是空的', translatedText: 'Wala pang laman ang cart mo', status: 'pending', submittedAt: '2026-08-14T14:00:00Z' },
    { id: 'cr-006', module: 'shop', key: 'productName.jujubePaste', locale: 'ms', sourceText: '酸枣仁膏·250g', translatedText: 'Pes Jujube - 250g', status: 'pending', submittedAt: '2026-08-15T14:00:00Z' },
  ]),
  'PUT /api/v1/admin/users/:id/status': (config) => {
    const id = (config.url || '').split('/').slice(-2, -1)[0]
    const body = parseBody<{ status: string }>(config)
    const user = ADMIN_USERS.find((u) => u.id === id)
    if (user) {
      user.status = body.status as 'active' | 'disabled'
      return ok(user)
    }
    return notFound('用户不存在')
  },
  'PUT /api/v1/admin/users/:id/role': (config) => {
    const id = (config.url || '').split('/').slice(-2, -1)[0]
    const body = parseBody<{ role: string }>(config)
    const user = ADMIN_USERS.find((u) => u.id === id)
    if (user) {
      user.role = body.role as 'user' | 'admin'
      return ok(user)
    }
    return notFound('用户不存在')
  },
  'PUT /api/v1/admin/content-reviews/:id': (config) => {
    const id = (config.url || '').split('/').slice(-2, -1)[0]
    const body = parseBody<{ status: string }>(config)
    return ok({ id, status: body.status })
  },

  // ---- RBAC ----
  'GET /api/v1/admin/rbac/matrix': () => ok(RBAC_MATRIX),

  // ---- Audit Logs ----
  'GET /api/v1/admin/audit-logs': (config) => {
    const params = config.params as { action?: string; resource?: string; status?: string; page?: number; pageSize?: number }
    let list = [...auditLogs]
    if (params?.action) list = list.filter((l) => l.action === params.action)
    if (params?.resource) list = list.filter((l) => l.resource === params.resource)
    if (params?.status) list = list.filter((l) => l.status === params.status)
    const page = params?.page || 1
    const pageSize = params?.pageSize || 20
    const start = (page - 1) * pageSize
    return ok({
      total: list.length,
      page,
      pageSize,
      data: list.slice(start, start + pageSize),
    })
  },

  // ---- QingFlow (轻流) ----
  'GET /api/v1/qingflow/apps': () => ok(QINGFLOW_APPS),
  'GET /api/v1/qingflow/apps/:appId/records': (config) => {
    const appId = (config.url || '').split('/').slice(-2, -1)[0]
    const records = qingFlowRecords.filter((r) => r.appId === appId)
    return ok(records)
  },
  'POST /api/v1/qingflow/sync': (config) => {
    const body = parseBody<{ appId?: string }>(config)
    const app = QINGFLOW_APPS.find((a) => a.id === body.appId)
    if (app) {
      app.lastSync = new Date().toISOString()
      return ok({ success: true, syncedAt: app.lastSync, recordCount: app.recordCount })
    }
    return notFound('轻流应用不存在')
  },
}

// ============ 路由匹配 ============

/**
 * 匹配请求到 Mock 路由
 * 支持路径参数 :id
 */
export function matchRoute(method: string, url: string): { handler: RouteHandler; matchedPath: string } | null {
  // 去除 baseURL 前缀和 query string
  let path = url
  try {
    const u = new URL(url, 'http://localhost')
    path = u.pathname
  } catch {
    // 如果不是完整 URL，取 path 部分
    path = url.split('?')[0]
  }

  // 精确匹配
  const exactKey = `${method.toUpperCase()} ${path}`
  if (routes[exactKey]) {
    return { handler: routes[exactKey], matchedPath: exactKey }
  }

  // 模式匹配（:id 参数）
  for (const key of Object.keys(routes)) {
    const [m, p] = key.split(' ')
    if (m !== method.toUpperCase()) continue

    const patternParts = p.split('/')
    const pathParts = path.split('/')
    if (patternParts.length !== pathParts.length) continue

    let matched = true
    for (let i = 0; i < patternParts.length; i++) {
      if (patternParts[i].startsWith(':')) continue
      if (patternParts[i] !== pathParts[i]) {
        matched = false
        break
      }
    }

    if (matched) {
      return { handler: routes[key], matchedPath: key }
    }
  }

  return null
}
