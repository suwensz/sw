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
    prodUrl: string
    envToken: string
    testMode: string
    resetSandbox: string
    resetConfirm: string
    isolateTip: string
    envStatus: string
    todayCalls: string
    avgLatency: string
    mockRecords: string
    healthy: string
    unhealthy: string
    show: string
    hide: string
    regenerate: string
    regenerateConfirm: string
    regenerated: string
    consoleTitle: string
    consoleDesc: string
    method: string
    path: string
    scenario: string
    mockDelay: string
    scenarioSuccess: string
    scenarioBadRequest: string
    scenarioUnauthorized: string
    scenarioRateLimit: string
    scenarioServerError: string
    send: string
    sending: string
    requestBody: string
    bodyPlaceholder: string
    bodyInvalid: string
    pathRequired: string
    response: string
    noResponse: string
    historyTitle: string
    historyTime: string
    historyResult: string
    clearHistory: string
    historyEmpty: string
    snippetTitle: string
    snippetTip: string
    copySnippet: string
    mockModeTip: string
    liveModeTip: string
    liveModeLock: string
    resetDone: string
    copyFailed: string
    unitMs: string
    unitRecords: string
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
  ecom: {
    title: string
    subtitle: string
    platform: string
    status: string
    env: string
    prod: string
    sandbox: string
    sandboxUnsupported: string
    appKey: string
    appSecret: string
    session: string
    callback: string
    pollInterval: string
    gateway: string
    docs: string
    oauth: string
    configure: string
    test: string
    testing: string
    statusIdle: string
    statusConnected: string
    statusError: string
    lastCheck: string
    scenarioCount: string
    unconfigured: string
    requiredTip: string
    credentialTip: string
    methodTip: string
    rateLimit: string
    signTitle: string
    signDesc: string
    method: string
    bizParams: string
    timestamp: string
    generateSign: string
    signSource: string
    signValue: string
    copyUrl: string
    copyCurl: string
    simulatePush: string
    pushResult: string
    pushHit: string
    pushMiss: string
    scenarioTitle: string
    scenarioDesc: string
    scenarioName: string
    scenarioMetric: string
    subscribe: string
    generateRules: string
    generateRulesDone: string
    generateRulesEmpty: string
    testSuccess: string
    testFail: string
    unitMinute: string
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
    prodUrl: '生产地址',
    envToken: '沙箱 Token',
    testMode: '测试模式',
    resetSandbox: '重置沙箱',
    resetConfirm: '确定重置沙箱环境吗？令牌将重新生成，调用日志与调试记录会被清空。',
    isolateTip: '沙箱与生产环境数据完全隔离，请求不会产生真实业务单据，可放心压测与联调。',
    envStatus: '环境状态',
    todayCalls: '今日调用',
    avgLatency: '平均延迟',
    mockRecords: 'Mock 数据',
    healthy: '正常',
    unhealthy: '拥塞',
    show: '显示',
    hide: '隐藏',
    regenerate: '重新生成',
    regenerateConfirm: '重新生成后旧 Token 立即失效，确定继续吗？',
    regenerated: 'Token 已重新生成，请更新本地配置',
    consoleTitle: '接口调试台',
    consoleDesc: '选择接口模板后可直接发起请求，支持模拟异常状态码与网络延迟。',
    method: '请求方法',
    path: '接口路径',
    scenario: '响应场景',
    mockDelay: '模拟延迟',
    scenarioSuccess: '成功',
    scenarioBadRequest: '参数错误',
    scenarioUnauthorized: '鉴权失败',
    scenarioRateLimit: '限流',
    scenarioServerError: '服务异常',
    send: '发送请求',
    sending: '请求中',
    requestBody: '请求体',
    bodyPlaceholder: '请输入 JSON 格式的请求体，GET / DELETE 请求可留空',
    bodyInvalid: '请求体不是合法的 JSON，请检查后重试',
    pathRequired: '请先填写接口路径',
    response: '响应结果',
    noResponse: '尚未发起请求，点击「发送请求」后在此查看响应。',
    historyTitle: '调用日志',
    historyTime: '时间',
    historyResult: '结果',
    clearHistory: '清空日志',
    historyEmpty: '暂无调用记录',
    snippetTitle: '接入代码片段',
    snippetTip: '以下片段已填入当前沙箱地址与 Token，可直接复制使用。',
    copySnippet: '复制代码',
    mockModeTip: '沙箱模式：返回 Mock 数据，可模拟各类异常场景。',
    liveModeTip: '联调模式：请求直连联调服务，异常模拟已关闭。',
    liveModeLock: '联调模式下不可模拟异常与延迟',
    resetDone: '沙箱已重置',
    copyFailed: '复制失败，请手动选择内容复制',
    unitMs: 'ms',
    unitRecords: '条',
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
  ecom: {
    title: '电商渠道接入',
    subtitle: '将淘宝 / 京东 / 拼多多开放平台的店铺事件接入统一告警中心，支持凭证配置、签名联调与场景订阅。',
    platform: '平台',
    status: '对接状态',
    env: '环境',
    prod: '生产',
    sandbox: '沙箱',
    sandboxUnsupported: '该平台未提供独立沙箱域名，将使用生产网关联调',
    appKey: '应用标识',
    appSecret: '应用密钥',
    session: '会话令牌',
    callback: '回调地址',
    pollInterval: '轮询间隔',
    gateway: '网关地址',
    docs: '开放平台文档',
    oauth: '授权地址',
    configure: '配置',
    test: '联调测试',
    testing: '测试中',
    statusIdle: '未联调',
    statusConnected: '已连通',
    statusError: '异常',
    lastCheck: '上次联调',
    scenarioCount: '已订阅',
    unconfigured: '未配置凭证',
    requiredTip: '请先配置应用标识与应用密钥',
    credentialTip: '密钥仅保存在本地浏览器，用于生成签名；请勿提交到代码仓库。',
    methodTip: '接口名为常用预置值，实际请以开放平台控制台已申请/已授权的接口为准，可自行修改。',
    rateLimit: '调用限流',
    signTitle: '签名联调台',
    signDesc: '按各平台规范拼接待签名原文并生成 MD5 大写签名，可直接用于联调与自测。',
    method: '接口方法',
    bizParams: '业务参数',
    timestamp: '时间戳',
    generateSign: '生成签名',
    signSource: '待签名原文',
    signValue: '签名值',
    copyUrl: '复制请求 URL',
    copyCurl: '复制 cURL',
    simulatePush: '模拟推送校验',
    pushResult: '推送校验结果',
    pushHit: '命中告警规则，已产生一条告警',
    pushMiss: '未命中，当前场景未订阅或不满足阈值',
    scenarioTitle: '告警场景订阅',
    scenarioDesc: '勾选场景后批量生成告警规则，规则会出现在下方的告警规则列表中。',
    scenarioName: '场景',
    scenarioMetric: '监控指标',
    subscribe: '订阅',
    generateRules: '生成告警规则',
    generateRulesDone: '已生成 {n} 条告警规则',
    generateRulesEmpty: '请先勾选需要订阅的场景',
    testSuccess: '联调通过，签名校验一致',
    testFail: '联调失败：{reason}',
    unitMinute: '分钟',
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
    prodUrl: 'Production URL',
    envToken: 'Sandbox Token',
    testMode: 'Test Mode',
    resetSandbox: 'Reset Sandbox',
    resetConfirm: 'Reset sandbox? The token will be regenerated and the call log cleared.',
    isolateTip: 'Sandbox data is fully isolated from production. No real business records are created.',
    envStatus: 'Environment',
    todayCalls: 'Calls Today',
    avgLatency: 'Avg Latency',
    mockRecords: 'Mock Records',
    healthy: 'Healthy',
    unhealthy: 'Congested',
    show: 'Show',
    hide: 'Hide',
    regenerate: 'Regenerate',
    regenerateConfirm: 'The current token becomes invalid immediately. Continue?',
    regenerated: 'Token regenerated, please update your local config',
    consoleTitle: 'API Console',
    consoleDesc: 'Pick a template and send requests. Error status codes and latency can be simulated.',
    method: 'Method',
    path: 'Path',
    scenario: 'Scenario',
    mockDelay: 'Simulated Delay',
    scenarioSuccess: 'Success',
    scenarioBadRequest: 'Bad Request',
    scenarioUnauthorized: 'Unauthorized',
    scenarioRateLimit: 'Rate Limited',
    scenarioServerError: 'Server Error',
    send: 'Send Request',
    sending: 'Sending',
    requestBody: 'Request Body',
    bodyPlaceholder: 'JSON request body. Leave empty for GET / DELETE',
    bodyInvalid: 'Request body is not valid JSON',
    pathRequired: 'Please enter a request path first',
    response: 'Response',
    noResponse: 'No request sent yet. Click "Send Request" to see the response here.',
    historyTitle: 'Call Log',
    historyTime: 'Time',
    historyResult: 'Result',
    clearHistory: 'Clear Log',
    historyEmpty: 'No call records',
    snippetTitle: 'Integration Snippets',
    snippetTip: 'Snippets are prefilled with the current sandbox URL and token.',
    copySnippet: 'Copy Code',
    mockModeTip: 'Sandbox mode: returns mock data and allows error simulation.',
    liveModeTip: 'Live mode: requests hit the staging service, error simulation is disabled.',
    liveModeLock: 'Error and delay simulation is disabled in live mode',
    resetDone: 'Sandbox reset',
    copyFailed: 'Copy failed, please select and copy manually',
    unitMs: 'ms',
    unitRecords: 'records',
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
  ecom: {
    title: 'E-commerce Channels',
    subtitle: 'Connect Taobao / JD / Pinduoduo open platform events to the unified alert center with credential setup, signature testing and scenario subscription.',
    platform: 'Platform',
    status: 'Status',
    env: 'Environment',
    prod: 'Production',
    sandbox: 'Sandbox',
    sandboxUnsupported: 'No dedicated sandbox host is provided; the production gateway will be used',
    appKey: 'App Key',
    appSecret: 'App Secret',
    session: 'Session Token',
    callback: 'Callback URL',
    pollInterval: 'Poll Interval',
    gateway: 'Gateway',
    docs: 'Open Platform Docs',
    oauth: 'Authorization URL',
    configure: 'Configure',
    test: 'Connection Test',
    testing: 'Testing',
    statusIdle: 'Not Tested',
    statusConnected: 'Connected',
    statusError: 'Error',
    lastCheck: 'Last Check',
    scenarioCount: 'Subscribed',
    unconfigured: 'Credentials missing',
    requiredTip: 'Please configure the app key and app secret first',
    credentialTip: 'Secrets are stored in the local browser only and used to build signatures. Never commit them.',
    methodTip: 'Method names are common defaults. Use the API names actually granted in the open platform console.',
    rateLimit: 'Rate Limit',
    signTitle: 'Signature Console',
    signDesc: 'Builds the sign source per platform spec and generates the uppercase MD5 signature for integration testing.',
    method: 'API Method',
    bizParams: 'Business Params',
    timestamp: 'Timestamp',
    generateSign: 'Generate Signature',
    signSource: 'Sign Source',
    signValue: 'Signature',
    copyUrl: 'Copy Request URL',
    copyCurl: 'Copy cURL',
    simulatePush: 'Simulate Push',
    pushResult: 'Push Verification Result',
    pushHit: 'Matched an alert rule, one alert was raised',
    pushMiss: 'No match: scenario not subscribed or threshold not met',
    scenarioTitle: 'Alert Scenario Subscription',
    scenarioDesc: 'Select scenarios to batch-create alert rules. New rules appear in the alert rule list below.',
    scenarioName: 'Scenario',
    scenarioMetric: 'Metric',
    subscribe: 'Subscribe',
    generateRules: 'Create Alert Rules',
    generateRulesDone: '{n} alert rule(s) created',
    generateRulesEmpty: 'Please select at least one scenario',
    testSuccess: 'Connection OK, signature verified',
    testFail: 'Connection failed: {reason}',
    unitMinute: 'min',
  },
}

export const devExtMap: Partial<Record<LocaleCode, DevMessages>> = { zh, en }

export function getDevMessages(locale: LocaleCode): DevMessages {
  return devExtMap[locale] || devExtMap.en!
}
