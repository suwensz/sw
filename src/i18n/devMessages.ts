// 开发端多语言文案：中文 / 英文 完整，其余语言回退英文
import type { LocaleCode } from '@/types'

export type DevMessages = {
  menu: {
    groupWorkspace: string
    groupDocs: string
    groupApp: string
    groupApi: string
    groupOps: string
    dashboard: string
    apiDocs: string
    guide: string
    apps: string
    keys: string
    apiStats: string
    webhooks: string
    sandbox: string
    sdk: string
    audit: string
    quota: string
    alerts: string
  }
  common: {
    all: string
    search: string
    status: string
    actions: string
    enabled: string
    disabled: string
    save: string
    cancel: string
    add: string
    edit: string
    delete: string
    copy: string
    copied: string
    name: string
    desc: string
    time: string
    reset: string
    confirm: string
    noData: string
    loadMore: string
  }
  dashboard: {
    totalApps: string
    apiCalls: string
    totalKeys: string
    sandboxHealth: string
    quotaUsed: string
    quickEntry: string
    recentCalls: string
    callTrend: string
    appStatus: string
  }
  apps: {
    addApp: string
    appName: string
    domain: string
    appDesc: string
    created: string
    enableToggle: string
    deleteConfirm: string
  }
  keys: {
    generateKey: string
    appKey: string
    appSecret: string
    appId: string
    scope: string
    expired: string
    revokeConfirm: string
  }
  apiStats: {
    totalCalls: string
    successRate: string
    avgLatency: string
    quotaRemain: string
    callTrend: string
    topApis: string
    range7d: string
    range30d: string
  }
  webhooks: {
    addWebhook: string
    endpoint: string
    events: string
    deliveryLog: string
    test: string
    lastDelivery: string
    deleteConfirm: string
  }
  sandbox: {
    baseUrl: string
    envToken: string
    testMode: string
    resetSandbox: string
    resetConfirm: string
  }
  sdk: {
    lang: string
    version: string
    size: string
    download: string
    releaseNotes: string
  }
  audit: {
    method: string
    path: string
    statusCode: string
    latency: string
    detail: string
  }
  quota: {
    currentPlan: string
    callsUsed: string
    callsLimit: string
    upgrade: string
    planFree: string
    planPro: string
    planEnterprise: string
  }
  alerts: {
    addAlert: string
    metric: string
    threshold: string
    channel: string
    lastTrigger: string
    deleteConfirm: string
  }
}

const zh: DevMessages = {
  menu: {
    groupWorkspace: '工作台',
    groupDocs: '文档',
    groupApp: '应用与密钥',
    groupApi: 'API 服务',
    groupOps: '运维观测',
    dashboard: '开发者总览',
    apiDocs: 'API 文档',
    guide: '接入指南',
    apps: '应用管理',
    keys: '密钥管理',
    apiStats: '调用统计',
    webhooks: 'Webhook 管理',
    sandbox: '沙箱环境',
    sdk: 'SDK 下载',
    audit: '调用审计',
    quota: '配额套餐',
    alerts: '告警管理',
  },
  common: {
    all: '全部',
    search: '搜索',
    status: '状态',
    actions: '操作',
    enabled: '已启用',
    disabled: '已停用',
    save: '保存',
    cancel: '取消',
    add: '新增',
    edit: '编辑',
    delete: '删除',
    copy: '复制',
    copied: '已复制',
    name: '名称',
    desc: '描述',
    time: '时间',
    reset: '重置',
    confirm: '确定',
    noData: '暂无数据',
    loadMore: '加载更多',
  },
  dashboard: {
    totalApps: '接入应用',
    apiCalls: 'API 调用',
    totalKeys: '密钥数量',
    sandboxHealth: '沙箱健康度',
    quotaUsed: '配额使用',
    quickEntry: '快捷入口',
    recentCalls: '最近调用',
    callTrend: '调用趋势',
    appStatus: '应用运行状态',
  },
  apps: {
    addApp: '新增应用',
    appName: '应用名称',
    domain: '业务域',
    appDesc: '应用描述',
    created: '创建时间',
    enableToggle: '启用/停用',
    deleteConfirm: '确定删除该应用吗？',
  },
  keys: {
    generateKey: '生成密钥',
    appKey: 'AppKey',
    appSecret: 'AppSecret',
    appId: '所属应用',
    scope: '权限范围',
    expired: '已撤销',
    revokeConfirm: '确定撤销该密钥吗？',
  },
  apiStats: {
    totalCalls: '总调用量',
    successRate: '成功率',
    avgLatency: '平均延迟',
    quotaRemain: '剩余配额',
    callTrend: '调用趋势',
    topApis: '热门接口',
    range7d: '近 7 天',
    range30d: '近 30 天',
  },
  webhooks: {
    addWebhook: '新增 Webhook',
    endpoint: '回调地址',
    events: '订阅事件',
    deliveryLog: '投递日志',
    test: '测试',
    lastDelivery: '最近投递',
    deleteConfirm: '确定删除该 Webhook 吗？',
  },
  sandbox: {
    baseUrl: '沙箱地址',
    envToken: '沙箱 Token',
    testMode: '测试模式',
    resetSandbox: '重置沙箱',
    resetConfirm: '确定重置沙箱环境吗？测试数据将被清空',
  },
  sdk: {
    lang: '语言',
    version: '版本',
    size: '大小',
    download: '下载',
    releaseNotes: '更新说明',
  },
  audit: {
    method: '方法',
    path: '路径',
    statusCode: '状态码',
    latency: '延迟',
    detail: '详情',
  },
  quota: {
    currentPlan: '当前套餐',
    callsUsed: '已用调用量',
    callsLimit: '调用上限',
    upgrade: '升级套餐',
    planFree: '免费版',
    planPro: '专业版',
    planEnterprise: '企业版',
  },
  alerts: {
    addAlert: '新增告警',
    metric: '监控指标',
    threshold: '阈值',
    channel: '通知渠道',
    lastTrigger: '最近触发',
    deleteConfirm: '确定删除该告警规则吗？',
  },
}

const en: DevMessages = {
  menu: {
    groupWorkspace: 'Workspace',
    groupDocs: 'Docs',
    groupApp: 'Apps & Keys',
    groupApi: 'API Service',
    groupOps: 'Observability',
    dashboard: 'Developer Overview',
    apiDocs: 'API Docs',
    guide: 'Integration Guide',
    apps: 'App Management',
    keys: 'Key Management',
    apiStats: 'API Analytics',
    webhooks: 'Webhooks',
    sandbox: 'Sandbox',
    sdk: 'SDK Downloads',
    audit: 'Call Audit',
    quota: 'Quota & Plans',
    alerts: 'Alerts',
  },
  common: {
    all: 'All',
    search: 'Search',
    status: 'Status',
    actions: 'Actions',
    enabled: 'Enabled',
    disabled: 'Disabled',
    save: 'Save',
    cancel: 'Cancel',
    add: 'Add',
    edit: 'Edit',
    delete: 'Delete',
    copy: 'Copy',
    copied: 'Copied',
    name: 'Name',
    desc: 'Description',
    time: 'Time',
    reset: 'Reset',
    confirm: 'Confirm',
    noData: 'No data',
    loadMore: 'Load more',
  },
  dashboard: {
    totalApps: 'Connected Apps',
    apiCalls: 'API Calls',
    totalKeys: 'Keys',
    sandboxHealth: 'Sandbox Health',
    quotaUsed: 'Quota Used',
    quickEntry: 'Quick Entry',
    recentCalls: 'Recent Calls',
    callTrend: 'Call Trend',
    appStatus: 'App Running Status',
  },
  apps: {
    addApp: 'Add App',
    appName: 'App Name',
    domain: 'Domain',
    appDesc: 'Description',
    created: 'Created',
    enableToggle: 'Enable/Disable',
    deleteConfirm: 'Delete this app?',
  },
  keys: {
    generateKey: 'Generate Key',
    appKey: 'AppKey',
    appSecret: 'AppSecret',
    appId: 'App',
    scope: 'Scope',
    expired: 'Revoked',
    revokeConfirm: 'Revoke this key?',
  },
  apiStats: {
    totalCalls: 'Total Calls',
    successRate: 'Success Rate',
    avgLatency: 'Avg Latency',
    quotaRemain: 'Quota Remaining',
    callTrend: 'Call Trend',
    topApis: 'Top APIs',
    range7d: 'Last 7 days',
    range30d: 'Last 30 days',
  },
  webhooks: {
    addWebhook: 'Add Webhook',
    endpoint: 'Endpoint',
    events: 'Subscribed Events',
    deliveryLog: 'Delivery Log',
    test: 'Test',
    lastDelivery: 'Last Delivery',
    deleteConfirm: 'Delete this webhook?',
  },
  sandbox: {
    baseUrl: 'Sandbox URL',
    envToken: 'Sandbox Token',
    testMode: 'Test Mode',
    resetSandbox: 'Reset Sandbox',
    resetConfirm: 'Reset sandbox? Test data will be wiped.',
  },
  sdk: {
    lang: 'Language',
    version: 'Version',
    size: 'Size',
    download: 'Download',
    releaseNotes: 'Release Notes',
  },
  audit: {
    method: 'Method',
    path: 'Path',
    statusCode: 'Status Code',
    latency: 'Latency',
    detail: 'Detail',
  },
  quota: {
    currentPlan: 'Current Plan',
    callsUsed: 'Calls Used',
    callsLimit: 'Call Limit',
    upgrade: 'Upgrade Plan',
    planFree: 'Free',
    planPro: 'Pro',
    planEnterprise: 'Enterprise',
  },
  alerts: {
    addAlert: 'Add Alert Rule',
    metric: 'Metric',
    threshold: 'Threshold',
    channel: 'Notify Channel',
    lastTrigger: 'Last Trigger',
    deleteConfirm: 'Delete this alert rule?',
  },
}

export const devExtMap: Partial<Record<LocaleCode, DevMessages>> = { zh, en }

export function getDevMessages(locale: LocaleCode): DevMessages {
  return devExtMap[locale] || devExtMap.en!
}
