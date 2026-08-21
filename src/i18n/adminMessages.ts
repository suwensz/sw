// 管理端多语言文案：中文 / 英文 完整，其余语言回退英文
import type { LocaleCode } from '@/types'

export type AdminMessages = {
  menu: {
    groupOverview: string
    groupUsers: string
    groupData: string
    groupSystem: string
    groupOps: string
    dashboard: string
    users: string
    roles: string
    stats: string
    settings: string
    audit: string
    agentConfig: string
    notices: string
    backup: string
    storage: string
    integrations: string
    monitor: string
  }
  common: {
    all: string
    search: string
    status: string
    role: string
    actions: string
    enabled: string
    disabled: string
    save: string
    cancel: string
    add: string
    edit: string
    delete: string
    export: string
    view: string
    name: string
    desc: string
    time: string
    operator: string
    reset: string
    confirm: string
    noData: string
    loadMore: string
  }
  dashboard: {
    totalUsers: string
    activeUsers: string
    totalAgents: string
    apiCalls: string
    storageUsed: string
    onlineUsers: string
    quickEntry: string
    recentUsers: string
    userGrowth: string
    agentStatus: string
  }
  users: {
    addUser: string
    email: string
    lastActive: string
    registered: string
    batchDisable: string
    enableAll: string
    searchPh: string
    rolePh: string
    statusPh: string
    deleteConfirm: string
  }
  roles: {
    addRole: string
    memberCount: string
    permissions: string
    roleName: string
    roleDesc: string
    permissionHint: string
  }
  stats: {
    userTrend: string
    apiTrend: string
    storageDist: string
    range7d: string
    range30d: string
    range90d: string
  }
  settings: {
    secBase: string
    secSecurity: string
    secNotify: string
    secIntegration: string
    platformName: string
    siteDomain: string
    maintenance: string
    allowRegister: string
    requireEmailVerify: string
    healthAlertEnabled: string
    orderAutoCancelHours: string
    saveOk: string
  }
  audit: {
    action: string
    ip: string
    result: string
    detail: string
    module: string
    success: string
    fail: string
  }
  agentConfig: {
    title: string
    subtitle: string
    activateAll: string
    deactivateAll: string
    automationRate: string
    activeCount: string
  }
  notices: {
    addNotice: string
    title: string
    content: string
    publish: string
    published: string
    draft: string
    deleteConfirm: string
  }
  backup: {
    createBackup: string
    backupName: string
    size: string
    restore: string
    restoreConfirm: string
    lastBackup: string
  }
  storage: {
    used: string
    total: string
    mediaType: string
    files: string
    cleanTip: string
  }
  integrations: {
    connected: string
    disconnected: string
    connect: string
    disconnect: string
    platform: string
  }
  monitor: {
    cpu: string
    memory: string
    disk: string
    network: string
    uptime: string
    healthy: string
    warning: string
    critical: string
    refresh: string
  }
}

const zh: AdminMessages = {
  menu: {
    groupOverview: '总览',
    groupUsers: '用户与权限',
    groupData: '数据',
    groupSystem: '系统',
    groupOps: '运营治理',
    dashboard: '系统概览',
    users: '用户管理',
    roles: '角色权限',
    stats: '数据统计',
    settings: '系统设置',
    audit: '审计日志',
    agentConfig: '智能体配置',
    notices: '通知公告',
    backup: '数据备份',
    storage: '存储资源',
    integrations: '平台集成',
    monitor: '系统监控',
  },
  common: {
    all: '全部',
    search: '搜索',
    status: '状态',
    role: '角色',
    actions: '操作',
    enabled: '已启用',
    disabled: '已停用',
    save: '保存',
    cancel: '取消',
    add: '新增',
    edit: '编辑',
    delete: '删除',
    export: '导出',
    view: '查看',
    name: '名称',
    desc: '描述',
    time: '时间',
    operator: '操作人',
    reset: '恢复默认',
    confirm: '确定',
    noData: '暂无数据',
    loadMore: '加载更多',
  },
  dashboard: {
    totalUsers: '用户总数',
    activeUsers: '活跃用户',
    totalAgents: '智能体总数',
    apiCalls: 'API 调用',
    storageUsed: '存储用量',
    onlineUsers: '在线用户',
    quickEntry: '快捷入口',
    recentUsers: '最近注册用户',
    userGrowth: '用户增长趋势',
    agentStatus: '智能体运行状态',
  },
  users: {
    addUser: '新增用户',
    email: '邮箱',
    lastActive: '最近活跃',
    registered: '注册时间',
    batchDisable: '批量停用',
    enableAll: '全部启用',
    searchPh: '搜索用户名 / 邮箱',
    rolePh: '角色筛选',
    statusPh: '状态筛选',
    deleteConfirm: '确定删除该用户吗？',
  },
  roles: {
    addRole: '新增角色',
    memberCount: '成员数',
    permissions: '权限点',
    roleName: '角色名称',
    roleDesc: '角色描述',
    permissionHint: '勾选该角色可拥有的权限点',
  },
  stats: {
    userTrend: '用户增长趋势',
    apiTrend: 'API 调用趋势',
    storageDist: '存储分布',
    range7d: '近 7 天',
    range30d: '近 30 天',
    range90d: '近 90 天',
  },
  settings: {
    secBase: '基础信息',
    secSecurity: '安全策略',
    secNotify: '通知设置',
    secIntegration: '集成配置',
    platformName: '平台名称',
    siteDomain: '站点域名',
    maintenance: '维护模式',
    allowRegister: '允许注册',
    requireEmailVerify: '邮箱验证',
    healthAlertEnabled: '健康预警',
    orderAutoCancelHours: '订单自动取消(小时)',
    saveOk: '设置已保存',
  },
  audit: {
    action: '操作',
    ip: 'IP 地址',
    result: '结果',
    detail: '详情',
    module: '模块',
    success: '成功',
    fail: '失败',
  },
  agentConfig: {
    title: '智能体配置',
    subtitle: '配置各智能体的运行参数与激活状态',
    activateAll: '一键全部激活',
    deactivateAll: '全部停用',
    automationRate: '自动化覆盖率',
    activeCount: '已激活',
  },
  notices: {
    addNotice: '新增公告',
    title: '公告标题',
    content: '公告内容',
    publish: '发布',
    published: '已发布',
    draft: '草稿',
    deleteConfirm: '确定删除该公告吗？',
  },
  backup: {
    createBackup: '创建备份',
    backupName: '备份名称',
    size: '大小',
    restore: '恢复',
    restoreConfirm: '确定恢复到该备份吗？此操作不可撤销',
    lastBackup: '最近备份',
  },
  storage: {
    used: '已用',
    total: '总量',
    mediaType: '资源类型',
    files: '文件数',
    cleanTip: '清理建议',
  },
  integrations: {
    connected: '已连接',
    disconnected: '未连接',
    connect: '连接',
    disconnect: '断开',
    platform: '平台',
  },
  monitor: {
    cpu: 'CPU 使用率',
    memory: '内存使用率',
    disk: '磁盘使用率',
    network: '网络吞吐',
    uptime: '运行时长',
    healthy: '健康',
    warning: '警告',
    critical: '严重',
    refresh: '刷新',
  },
}

const en: AdminMessages = {
  menu: {
    groupOverview: 'Overview',
    groupUsers: 'Users & Permissions',
    groupData: 'Data',
    groupSystem: 'System',
    groupOps: 'Ops Governance',
    dashboard: 'System Overview',
    users: 'User Management',
    roles: 'Roles & Permissions',
    stats: 'Analytics',
    settings: 'System Settings',
    audit: 'Audit Logs',
    agentConfig: 'Agent Config',
    notices: 'Announcements',
    backup: 'Data Backup',
    storage: 'Storage',
    integrations: 'Integrations',
    monitor: 'Monitoring',
  },
  common: {
    all: 'All',
    search: 'Search',
    status: 'Status',
    role: 'Role',
    actions: 'Actions',
    enabled: 'Enabled',
    disabled: 'Disabled',
    save: 'Save',
    cancel: 'Cancel',
    add: 'Add',
    edit: 'Edit',
    delete: 'Delete',
    export: 'Export',
    view: 'View',
    name: 'Name',
    desc: 'Description',
    time: 'Time',
    operator: 'Operator',
    reset: 'Reset',
    confirm: 'Confirm',
    noData: 'No data',
    loadMore: 'Load more',
  },
  dashboard: {
    totalUsers: 'Total Users',
    activeUsers: 'Active Users',
    totalAgents: 'Total Agents',
    apiCalls: 'API Calls',
    storageUsed: 'Storage Used',
    onlineUsers: 'Online Users',
    quickEntry: 'Quick Entry',
    recentUsers: 'Recent Registrations',
    userGrowth: 'User Growth Trend',
    agentStatus: 'Agent Running Status',
  },
  users: {
    addUser: 'Add User',
    email: 'Email',
    lastActive: 'Last Active',
    registered: 'Registered',
    batchDisable: 'Batch Disable',
    enableAll: 'Enable All',
    searchPh: 'Search name / email',
    rolePh: 'Filter by role',
    statusPh: 'Filter by status',
    deleteConfirm: 'Delete this user?',
  },
  roles: {
    addRole: 'Add Role',
    memberCount: 'Members',
    permissions: 'Permissions',
    roleName: 'Role Name',
    roleDesc: 'Role Description',
    permissionHint: 'Select permissions for this role',
  },
  stats: {
    userTrend: 'User Growth Trend',
    apiTrend: 'API Call Trend',
    storageDist: 'Storage Distribution',
    range7d: 'Last 7 days',
    range30d: 'Last 30 days',
    range90d: 'Last 90 days',
  },
  settings: {
    secBase: 'Basic Info',
    secSecurity: 'Security Policy',
    secNotify: 'Notification',
    secIntegration: 'Integration',
    platformName: 'Platform Name',
    siteDomain: 'Site Domain',
    maintenance: 'Maintenance Mode',
    allowRegister: 'Allow Register',
    requireEmailVerify: 'Email Verification',
    healthAlertEnabled: 'Health Alerts',
    orderAutoCancelHours: 'Order Auto-cancel (hours)',
    saveOk: 'Settings saved',
  },
  audit: {
    action: 'Action',
    ip: 'IP Address',
    result: 'Result',
    detail: 'Detail',
    module: 'Module',
    success: 'Success',
    fail: 'Failed',
  },
  agentConfig: {
    title: 'Agent Config',
    subtitle: 'Configure runtime params and activation for each agent',
    activateAll: 'Activate All',
    deactivateAll: 'Deactivate All',
    automationRate: 'Automation Coverage',
    activeCount: 'Active',
  },
  notices: {
    addNotice: 'New Announcement',
    title: 'Title',
    content: 'Content',
    publish: 'Publish',
    published: 'Published',
    draft: 'Draft',
    deleteConfirm: 'Delete this announcement?',
  },
  backup: {
    createBackup: 'Create Backup',
    backupName: 'Backup Name',
    size: 'Size',
    restore: 'Restore',
    restoreConfirm: 'Restore to this backup? This cannot be undone.',
    lastBackup: 'Last Backup',
  },
  storage: {
    used: 'Used',
    total: 'Total',
    mediaType: 'Media Type',
    files: 'Files',
    cleanTip: 'Cleanup Suggestion',
  },
  integrations: {
    connected: 'Connected',
    disconnected: 'Disconnected',
    connect: 'Connect',
    disconnect: 'Disconnect',
    platform: 'Platform',
  },
  monitor: {
    cpu: 'CPU Usage',
    memory: 'Memory Usage',
    disk: 'Disk Usage',
    network: 'Network I/O',
    uptime: 'Uptime',
    healthy: 'Healthy',
    warning: 'Warning',
    critical: 'Critical',
    refresh: 'Refresh',
  },
}

export const adminExtMap: Partial<Record<LocaleCode, AdminMessages>> = { zh, en }

export function getAdminMessages(locale: LocaleCode): AdminMessages {
  return adminExtMap[locale] || adminExtMap.en!
}
