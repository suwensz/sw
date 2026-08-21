import type { PortalMenuGroup } from '@/portals/common/PortalLayout.vue'

export const devMenuGroups: PortalMenuGroup[] = [
  {
    label: '工作台',
    labelKey: 'dev.menu.groupWorkspace',
    items: [
      { label: '开发者总览', labelKey: 'dev.menu.dashboard', to: '/dashboard', icon: 'Odometer' },
    ],
  },
  {
    label: '文档',
    labelKey: 'dev.menu.groupDocs',
    items: [
      { label: 'API 文档', labelKey: 'dev.menu.apiDocs', to: '/api-docs', icon: 'Document' },
      { label: '接入指南', labelKey: 'dev.menu.guide', to: '/guide', icon: 'Compass' },
    ],
  },
  {
    label: '应用与密钥',
    labelKey: 'dev.menu.groupApp',
    items: [
      { label: '应用管理', labelKey: 'dev.menu.apps', to: '/apps', icon: 'Grid' },
      { label: '密钥管理', labelKey: 'dev.menu.keys', to: '/keys', icon: 'Key' },
    ],
  },
  {
    label: 'API 服务',
    labelKey: 'dev.menu.groupApi',
    items: [
      { label: '调用统计', labelKey: 'dev.menu.apiStats', to: '/api-stats', icon: 'DataLine' },
      { label: '沙箱环境', labelKey: 'dev.menu.sandbox', to: '/sandbox', icon: 'Monitor' },
      { label: 'SDK 下载', labelKey: 'dev.menu.sdk', to: '/sdk', icon: 'Download' },
      { label: '配额套餐', labelKey: 'dev.menu.quota', to: '/quota', icon: 'CreditCard' },
    ],
  },
  {
    label: '运维观测',
    labelKey: 'dev.menu.groupOps',
    items: [
      { label: 'Webhook 管理', labelKey: 'dev.menu.webhooks', to: '/webhooks', icon: 'Connection' },
      { label: '调用审计', labelKey: 'dev.menu.audit', to: '/audit', icon: 'Tickets' },
      { label: '告警管理', labelKey: 'dev.menu.alerts', to: '/alerts', icon: 'Bell' },
    ],
  },
]
