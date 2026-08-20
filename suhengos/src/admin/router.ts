import { createRouter, createWebHashHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

/**
 * 管理端路由（:5100）
 * 仅 role === 'admin' 的账号可进入，普通用户登录后会被拦截在登录页。
 */
const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/login',
      name: 'AdminLogin',
      component: () => import('./views/LoginPage.vue'),
      meta: { public: true },
    },
    {
      path: '/',
      component: () => import('./layouts/AdminLayout.vue'),
      children: [
        { path: '', redirect: '/dashboard' },
        { path: 'dashboard', name: 'AdminDashboard', component: () => import('./views/DashboardPage.vue'), meta: { title: '数据看板' } },
        { path: 'users', name: 'AdminUsers', component: () => import('./views/UsersPage.vue'), meta: { title: '用户管理' } },
        { path: 'products', name: 'AdminProducts', component: () => import('./views/ProductsPage.vue'), meta: { title: '商品管理' } },
        { path: 'orders', name: 'AdminOrders', component: () => import('./views/OrdersPage.vue'), meta: { title: '订单管理' } },
        { path: 'content', name: 'AdminContent', component: () => import('./views/ContentPage.vue'), meta: { title: '多语言内容审核' } },
        { path: 'settings', name: 'AdminSettings', component: () => import('./views/SettingsPage.vue'), meta: { title: '系统设置' } },
      ],
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/dashboard',
    },
  ],
  scrollBehavior() {
    return { top: 0 }
  },
})

router.beforeEach((to) => {
  const auth = useAuthStore()
  if (to.meta.public) {
    // 已登录管理员访问登录页 → 直接进看板
    if (auth.isAuthenticated && auth.user?.role === 'admin') {
      return { name: 'AdminDashboard' }
    }
    return true
  }
  if (!auth.isAuthenticated) {
    return { name: 'AdminLogin', query: { redirect: to.fullPath } }
  }
  if (auth.user?.role !== 'admin') {
    return { name: 'AdminLogin', query: { error: 'forbidden' } }
  }
  return true
})

export default router
