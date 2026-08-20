import { createRouter, createWebHashHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

/**
 * 运营端路由（:5200）
 * 面向电商运营团队，复用 views/ops 下的五个运营页面。
 * 仅 role === 'ops' 或 'admin' 的账号可进入。
 */
const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/login',
      name: 'OpsLogin',
      component: () => import('./views/LoginPage.vue'),
      meta: { public: true },
    },
    {
      path: '/',
      component: () => import('./layouts/OpsLayout.vue'),
      children: [
        { path: '', redirect: '/competitor' },
        { path: 'competitor', name: 'Competitor', component: () => import('@/views/ops/CompetitorPage.vue'), meta: { title: '竞品情报' } },
        { path: 'supply', name: 'Supply', component: () => import('@/views/ops/SupplyPage.vue'), meta: { title: '供应链分析' } },
        { path: 'demand', name: 'Demand', component: () => import('@/views/ops/DemandPage.vue'), meta: { title: '需求分析' } },
        { path: 'creative', name: 'Creative', component: () => import('@/views/ops/CreativePage.vue'), meta: { title: '创意素材' } },
        { path: 'listing', name: 'Listing', component: () => import('@/views/ops/ListingPage.vue'), meta: { title: 'Listing 工作台' } },
        { path: 'qingflow', name: 'QingFlow', component: () => import('./views/QingFlowPage.vue'), meta: { title: '轻流数据' } },
      ],
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/competitor',
    },
  ],
  scrollBehavior() {
    return { top: 0 }
  },
})

router.beforeEach((to) => {
  const auth = useAuthStore()
  if (to.meta.public) {
    if (auth.isAuthenticated && (auth.user?.role === 'ops' || auth.user?.role === 'admin')) {
      return { path: '/competitor' }
    }
    return true
  }
  if (!auth.isAuthenticated) {
    return { name: 'OpsLogin', query: { redirect: to.fullPath } }
  }
  if (auth.user?.role !== 'ops' && auth.user?.role !== 'admin') {
    return { name: 'OpsLogin', query: { error: 'forbidden' } }
  }
  return true
})

export default router
