import { createRouter, createWebHashHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    // App.vue（根组件）已提供唯一的 PortalLayout，页面路由直接平铺，不再嵌套 layout
    { path: '/', redirect: '/dashboard' },
    {
      path: '/login',
      name: 'AdminLogin',
      component: () => import('@/portals/common/LoginPage.vue'),
      meta: { title: '登录 / 注册', titleKey: 'portal.auth.loginTab', public: true },
    },
    {
      path: '/dashboard',
      name: 'AdminDashboard',
      component: () => import('./pages/DashboardPage.vue'),
      meta: { title: '系统概览', titleKey: 'admin.menu.dashboard' },
    },
    {
      path: '/users',
      name: 'AdminUsers',
      component: () => import('./pages/UsersPage.vue'),
      meta: { title: '用户管理', titleKey: 'admin.menu.users' },
    },
    {
      path: '/roles',
      name: 'AdminRoles',
      component: () => import('./pages/RolesPage.vue'),
      meta: { title: '角色权限', titleKey: 'admin.menu.roles' },
    },
    {
      path: '/stats',
      name: 'AdminStats',
      component: () => import('./pages/StatsPage.vue'),
      meta: { title: '数据统计', titleKey: 'admin.menu.stats' },
    },
    {
      path: '/monitor',
      name: 'AdminMonitor',
      component: () => import('./pages/MonitorPage.vue'),
      meta: { title: '系统监控', titleKey: 'admin.menu.monitor' },
    },
    {
      path: '/settings',
      name: 'AdminSettings',
      component: () => import('./pages/SettingsPage.vue'),
      meta: { title: '系统设置', titleKey: 'admin.menu.settings' },
    },
    {
      path: '/audit',
      name: 'AdminAudit',
      component: () => import('./pages/AuditPage.vue'),
      meta: { title: '审计日志', titleKey: 'admin.menu.audit' },
    },
    {
      path: '/notices',
      name: 'AdminNotices',
      component: () => import('./pages/NoticesPage.vue'),
      meta: { title: '通知公告', titleKey: 'admin.menu.notices' },
    },
    {
      path: '/backup',
      name: 'AdminBackup',
      component: () => import('./pages/BackupPage.vue'),
      meta: { title: '数据备份', titleKey: 'admin.menu.backup' },
    },
    {
      path: '/storage',
      name: 'AdminStorage',
      component: () => import('./pages/StoragePage.vue'),
      meta: { title: '存储资源', titleKey: 'admin.menu.storage' },
    },
    {
      path: '/integrations',
      name: 'AdminIntegrations',
      component: () => import('./pages/IntegrationsPage.vue'),
      meta: { title: '平台集成', titleKey: 'admin.menu.integrations' },
    },
    {
      path: '/agent-config',
      name: 'AdminAgentConfig',
      component: () => import('./pages/AgentConfigPage.vue'),
      meta: { title: '智能体配置', titleKey: 'admin.menu.agentConfig' },
    },
    { path: '/:pathMatch(.*)*', redirect: '/dashboard' },
  ],
})

// 登录守卫：未登录一律跳转登录页；已登录访问 /login 回到系统概览
router.beforeEach((to) => {
  const auth = useAuthStore()
  if (!to.meta.public && !auth.isLoggedIn) {
    return { path: '/login', query: to.fullPath !== '/' ? { redirect: to.fullPath } : {} }
  }
  if (to.path === '/login' && auth.isLoggedIn) {
    return { path: '/dashboard' }
  }
  return true
})

export default router
