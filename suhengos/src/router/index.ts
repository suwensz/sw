import { createRouter, createWebHistory, createWebHashHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/login',
      name: 'Login',
      component: () => import('@/views/auth/LoginPage.vue'),
      meta: { public: true },
    },
    {
      path: '/register',
      name: 'Register',
      component: () => import('@/views/auth/RegisterPage.vue'),
      meta: { public: true },
    },
    {
      path: '/forgot-password',
      name: 'ForgotPassword',
      component: () => import('@/views/auth/ForgotPasswordPage.vue'),
      meta: { public: true },
    },
    {
      path: '/',
      component: () => import('@/layouts/MainLayout.vue'),
      children: [
        { path: '', name: 'Home', component: () => import('@/views/HomePage.vue'), meta: { group: 'health' } },

        // 中医健康组
        { path: 'chat', name: 'Chat', component: () => import('@/views/ChatPage.vue'), meta: { group: 'health' } },
        { path: 'chat/:id', name: 'ChatWithId', component: () => import('@/views/ChatPage.vue'), meta: { group: 'health' } },
        { path: 'health/alerts', name: 'HealthAlerts', component: () => import('@/views/health/AlertsPage.vue'), meta: { group: 'health' } },
        { path: 'health/family', name: 'Family', component: () => import('@/views/health/FamilyPage.vue'), meta: { group: 'health' } },
        { path: 'health/watch', name: 'Watch', component: () => import('@/views/health/WatchPage.vue'), meta: { group: 'health' } },

        // 跨境电商组
        { path: 'shop', name: 'Shop', component: () => import('@/views/shop/ProductListPage.vue'), meta: { group: 'commerce' } },
        { path: 'shop/:slug', name: 'ProductDetail', component: () => import('@/views/shop/ProductDetailPage.vue'), meta: { group: 'commerce' } },
        { path: 'cart', name: 'Cart', component: () => import('@/views/shop/CartPage.vue'), meta: { group: 'commerce' } },
        { path: 'checkout', name: 'Checkout', component: () => import('@/views/shop/CheckoutPage.vue'), meta: { group: 'commerce' } },
        // 运营工具已迁移至独立运营端（:5200，src/ops-app）

        // 账户
        { path: 'profile', name: 'Profile', component: () => import('@/views/account/AccountPage.vue') },
      ],
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/',
    },
  ],
  scrollBehavior() {
    return { top: 0 }
  },
})

router.beforeEach((to) => {
  const auth = useAuthStore()
  if (!to.meta.public && !auth.isAuthenticated) {
    return { name: 'Login', query: { redirect: to.fullPath } }
  }
  if (to.meta.public && auth.isAuthenticated && (to.name === 'Login' || to.name === 'Register')) {
    return { name: 'Home' }
  }
})

export default router
