import { createRouter, createWebHashHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    // App.vue（根组件）已提供唯一的 PortalLayout，页面路由直接平铺，不再嵌套 layout
    { path: '/', redirect: '/dashboard' },
    {
      path: '/login',
      name: 'DevLogin',
      component: () => import('@/portals/common/LoginPage.vue'),
      meta: { title: '登录 / 注册', titleKey: 'portal.auth.loginTab', public: true },
    },
    {
      path: '/dashboard',
      name: 'DevDashboard',
      component: () => import('./pages/DashboardPage.vue'),
      meta: { title: '开发者总览', titleKey: 'dev.menu.dashboard' },
    },
    {
      path: '/api-docs',
      name: 'DevApiDocs',
      component: () => import('./pages/ApiDocsPage.vue'),
      meta: { title: 'API 文档', titleKey: 'dev.menu.apiDocs' },
    },
    {
      path: '/guide',
      name: 'DevGuide',
      component: () => import('./pages/GuidePage.vue'),
      meta: { title: '接入指南', titleKey: 'dev.menu.guide' },
    },
    {
      path: '/apps',
      name: 'DevApps',
      component: () => import('./pages/AppsPage.vue'),
      meta: { title: '应用管理', titleKey: 'dev.menu.apps' },
    },
    {
      path: '/keys',
      name: 'DevKeys',
      component: () => import('./pages/KeysPage.vue'),
      meta: { title: '密钥管理', titleKey: 'dev.menu.keys' },
    },
    {
      path: '/api-stats',
      name: 'DevApiStats',
      component: () => import('./pages/ApiStatsPage.vue'),
      meta: { title: '调用统计', titleKey: 'dev.menu.apiStats' },
    },
    {
      path: '/sandbox',
      name: 'DevSandbox',
      component: () => import('./pages/SandboxPage.vue'),
      meta: { title: '沙箱环境', titleKey: 'dev.menu.sandbox' },
    },
    {
      path: '/sdk',
      name: 'DevSdk',
      component: () => import('./pages/SdkPage.vue'),
      meta: { title: 'SDK 下载', titleKey: 'dev.menu.sdk' },
    },
    {
      path: '/quota',
      name: 'DevQuota',
      component: () => import('./pages/QuotaPage.vue'),
      meta: { title: '配额套餐', titleKey: 'dev.menu.quota' },
    },
    {
      path: '/webhooks',
      name: 'DevWebhooks',
      component: () => import('./pages/WebhooksPage.vue'),
      meta: { title: 'Webhook 管理', titleKey: 'dev.menu.webhooks' },
    },
    {
      path: '/audit',
      name: 'DevCallAudit',
      component: () => import('./pages/CallAuditPage.vue'),
      meta: { title: '调用审计', titleKey: 'dev.menu.audit' },
    },
    {
      path: '/alerts',
      name: 'DevAlerts',
      component: () => import('./pages/AlertsPage.vue'),
      meta: { title: '告警管理', titleKey: 'dev.menu.alerts' },
    },
    { path: '/:pathMatch(.*)*', redirect: '/dashboard' },
  ],
})

// 登录守卫：未登录一律跳转登录页；已登录访问 /login 回到开发者总览
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
