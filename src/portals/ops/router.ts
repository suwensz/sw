import { createRouter, createWebHashHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    // App.vue（根组件）已提供唯一的 PortalLayout，页面路由直接平铺，不再嵌套 layout
    { path: '/', redirect: '/dashboard' },
    {
      path: '/login',
      name: 'OpsLogin',
      component: () => import('@/portals/common/LoginPage.vue'),
      meta: { title: '登录 / 注册', public: true },
    },
    {
      path: '/dashboard',
      name: 'OpsDashboard',
      component: () => import('./pages/DashboardPage.vue'),
      meta: { title: '运营概览', titleKey: 'portal.opsMenu.dashboard' },
    },
    {
      path: '/agents',
      name: 'OpsAgents',
      component: () => import('./pages/AgentsPage.vue'),
      meta: { title: '智能体中心', titleKey: 'portal.agentsCenter.title' },
    },
    {
      path: '/tcm',
      name: 'OpsTcmOverview',
      component: () => import('./pages/TcmOverviewPage.vue'),
      meta: { title: '中医健康概览', titleKey: 'portal.opsMenu.tcmOverview' },
    },
    {
      path: '/tcm/alerts',
      name: 'OpsTcmAlerts',
      component: () => import('@/views/health/AlertsPage.vue'),
      meta: { title: '健康预警', titleKey: 'portal.opsMenu.healthAlerts' },
    },
    {
      path: '/tcm/family',
      name: 'OpsTcmFamily',
      component: () => import('@/views/health/FamilyPage.vue'),
      meta: { title: '家人健康', titleKey: 'portal.opsMenu.familyHealth' },
    },
    {
      path: '/tcm/watch',
      name: 'OpsTcmWatch',
      component: () => import('@/views/health/WatchPage.vue'),
      meta: { title: '智能手表', titleKey: 'portal.opsMenu.smartWatch' },
    },
    {
      path: '/showcase',
      name: 'OpsShowcase',
      component: () => import('./pages/EcomShowcasePage.vue'),
      meta: { title: '电商展示', titleKey: 'portal.opsMenu.ecomShowcase' },
    },
    {
      path: '/competitor',
      name: 'OpsCompetitor',
      component: () => import('@/views/ops/CompetitorPage.vue'),
      meta: { title: '竞品分析', titleKey: 'portal.opsMenu.competitor' },
    },
    {
      path: '/supply',
      name: 'OpsSupply',
      component: () => import('@/views/ops/SupplyPage.vue'),
      meta: { title: '供应链', titleKey: 'portal.opsMenu.supply' },
    },
    {
      path: '/demand',
      name: 'OpsDemand',
      component: () => import('@/views/ops/DemandPage.vue'),
      meta: { title: '市场需求', titleKey: 'portal.opsMenu.demand' },
    },
    {
      path: '/creative',
      name: 'OpsCreative',
      component: () => import('@/views/ops/CreativePage.vue'),
      meta: { title: '创意工坊', titleKey: 'portal.opsMenu.creative' },
    },
    {
      path: '/listing',
      name: 'OpsListing',
      component: () => import('@/views/ops/ListingPage.vue'),
      meta: { title: '自动上架', titleKey: 'portal.opsMenu.listing' },
    },
    {
      path: '/logistics',
      name: 'OpsLogistics',
      component: () => import('@/views/ops/LogisticsPage.vue'),
      meta: { title: '物流管理', titleKey: 'portal.opsMenu.logistics' },
    },
    {
      path: '/procurement',
      name: 'OpsProcurement',
      component: () => import('@/views/ops/ProcurementPage.vue'),
      meta: { title: '采购管理', titleKey: 'portal.opsMenu.procurement' },
    },
    {
      path: '/returns',
      name: 'OpsReturns',
      component: () => import('@/views/ops/ReturnsPage.vue'),
      meta: { title: '退换货', titleKey: 'portal.opsMenu.returns' },
    },
    {
      path: '/my-orders',
      name: 'OpsMyOrders',
      component: () => import('@/views/ops/MyOrdersPage.vue'),
      meta: { title: '我的订单', titleKey: 'portal.opsMenu.myOrders' },
    },
    {
      path: '/distribute',
      name: 'OpsDistribute',
      component: () => import('@/views/ops/DistributePage.vue'),
      meta: { title: '分销管理', titleKey: 'portal.opsMenu.distribute' },
    },
    {
      path: '/domestic/dashboard',
      name: 'OpsDomesticDashboard',
      component: () => import('@/views/domestic/SellerDashboardPage.vue'),
      meta: { title: '卖家看板', titleKey: 'portal.opsMenu.domesticDashboard' },
    },
    {
      path: '/domestic/products',
      name: 'OpsDomesticProducts',
      component: () => import('@/views/domestic/ProductManagePage.vue'),
      meta: { title: '商品管理', titleKey: 'portal.opsMenu.domesticProducts' },
    },
    {
      path: '/domestic/orders',
      name: 'OpsDomesticOrders',
      component: () => import('@/views/domestic/OrderManagePage.vue'),
      meta: { title: '订单管理', titleKey: 'portal.opsMenu.domesticOrders' },
    },
    { path: '/:pathMatch(.*)*', redirect: '/dashboard' },
  ],
})

// 登录守卫：未登录一律跳转登录页；已登录访问 /login 回到工作台
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
