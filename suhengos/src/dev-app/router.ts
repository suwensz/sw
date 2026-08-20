import { createRouter, createWebHashHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

/**
 * 开发端路由（:5300）
 * 仅 role === 'dev' 或 'admin' 的账号可进入。
 */
const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/login',
      name: 'DevLogin',
      component: () => import('./views/LoginPage.vue'),
      meta: { public: true },
    },
    {
      path: '/',
      component: () => import('./layouts/DevLayout.vue'),
      children: [
        { path: '', redirect: '/mock' },
        { path: 'mock', name: 'DevMock', component: () => import('./views/MockDataPage.vue'), meta: { title: 'Mock 数据管理' } },
        { path: 'i18n', name: 'DevI18n', component: () => import('./views/I18nCoveragePage.vue'), meta: { title: 'i18n 覆盖检查' } },
        { path: 'env', name: 'DevEnv', component: () => import('./views/EnvPage.vue'), meta: { title: '环境与日志' } },
        { path: 'flags', name: 'DevFlags', component: () => import('./views/FlagsPage.vue'), meta: { title: 'Feature Flags' } },
      ],
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/mock',
    },
  ],
  scrollBehavior() {
    return { top: 0 }
  },
})

router.beforeEach((to) => {
  const auth = useAuthStore()
  if (to.meta.public) {
    if (auth.isAuthenticated && (auth.user?.role === 'dev' || auth.user?.role === 'admin')) {
      return { path: '/mock' }
    }
    return true
  }
  if (!auth.isAuthenticated) {
    return { name: 'DevLogin', query: { redirect: to.fullPath } }
  }
  if (auth.user?.role !== 'dev' && auth.user?.role !== 'admin') {
    return { name: 'DevLogin', query: { error: 'forbidden' } }
  }
  return true
})

export default router
