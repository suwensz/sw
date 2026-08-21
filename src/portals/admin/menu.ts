import type { PortalMenuGroup } from '@/portals/common/PortalLayout.vue'

export const adminMenuGroups: PortalMenuGroup[] = [
  {
    label: '总览',
    labelKey: 'admin.menu.groupOverview',
    items: [{ label: '系统概览', labelKey: 'admin.menu.dashboard', to: '/dashboard', icon: 'DataBoard' }],
  },
  {
    label: '用户与权限',
    labelKey: 'admin.menu.groupUsers',
    items: [
      { label: '用户管理', labelKey: 'admin.menu.users', to: '/users', icon: 'User' },
      { label: '角色权限', labelKey: 'admin.menu.roles', to: '/roles', icon: 'UserFilled' },
    ],
  },
  {
    label: '数据',
    labelKey: 'admin.menu.groupData',
    items: [
      { label: '数据统计', labelKey: 'admin.menu.stats', to: '/stats', icon: 'PieChart' },
      { label: '系统监控', labelKey: 'admin.menu.monitor', to: '/monitor', icon: 'Monitor' },
    ],
  },
  {
    label: '系统',
    labelKey: 'admin.menu.groupSystem',
    items: [
      { label: '系统设置', labelKey: 'admin.menu.settings', to: '/settings', icon: 'Setting' },
      { label: '审计日志', labelKey: 'admin.menu.audit', to: '/audit', icon: 'Tickets' },
    ],
  },
  {
    label: '运营治理',
    labelKey: 'admin.menu.groupOps',
    items: [
      { label: '通知公告', labelKey: 'admin.menu.notices', to: '/notices', icon: 'Bell' },
      { label: '数据备份', labelKey: 'admin.menu.backup', to: '/backup', icon: 'FolderOpened' },
      { label: '存储资源', labelKey: 'admin.menu.storage', to: '/storage', icon: 'Coin' },
      { label: '平台集成', labelKey: 'admin.menu.integrations', to: '/integrations', icon: 'Connection' },
      { label: '智能体配置', labelKey: 'admin.menu.agentConfig', to: '/agent-config', icon: 'MagicStick' },
    ],
  },
]
