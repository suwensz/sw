import type { PortalMenuGroup } from '@/portals/common/PortalLayout.vue'

/**
 * 运营端导航：总览 / 中医健康 / 电商（跨境电商 · 国内电商）
 * 全部菜单项均配置 labelKey，随多国语言选择栏同步切换。
 */
export const opsMenuGroups: PortalMenuGroup[] = [
  {
    label: '总览',
    labelKey: 'portal.opsMenu.groupOverview',
    items: [
      { label: '运营概览', labelKey: 'portal.opsMenu.dashboard', to: '/dashboard', icon: 'Odometer' },
      { label: '智能体中心', labelKey: 'portal.agentsCenter.title', to: '/agents', icon: 'Cpu' },
    ],
  },
  {
    label: '中医健康',
    labelKey: 'portal.opsMenu.groupTcm',
    items: [
      { label: '中医健康概览', labelKey: 'portal.opsMenu.tcmOverview', to: '/tcm', icon: 'FirstAidKit' },
      { label: '健康预警', labelKey: 'portal.opsMenu.healthAlerts', to: '/tcm/alerts', icon: 'Warning' },
      { label: '家人健康', labelKey: 'portal.opsMenu.familyHealth', to: '/tcm/family', icon: 'User' },
      { label: '智能手表', labelKey: 'portal.opsMenu.smartWatch', to: '/tcm/watch', icon: 'Watch' },
    ],
  },
  {
    label: '电商 · 跨境电商',
    labelKey: 'portal.opsMenu.groupEcomCross',
    items: [
      { label: '电商展示', labelKey: 'portal.opsMenu.ecomShowcase', to: '/showcase', icon: 'Goods' },
      { label: '竞品分析', labelKey: 'portal.opsMenu.competitor', to: '/competitor', icon: 'Histogram' },
      { label: '供应链', labelKey: 'portal.opsMenu.supply', to: '/supply', icon: 'Van' },
      { label: '市场需求', labelKey: 'portal.opsMenu.demand', to: '/demand', icon: 'TrendCharts' },
      { label: '创意工坊', labelKey: 'portal.opsMenu.creative', to: '/creative', icon: 'MagicStick' },
      { label: '自动上架', labelKey: 'portal.opsMenu.listing', to: '/listing', icon: 'Upload' },
      { label: '物流管理', labelKey: 'portal.opsMenu.logistics', to: '/logistics', icon: 'Ship' },
      { label: '采购管理', labelKey: 'portal.opsMenu.procurement', to: '/procurement', icon: 'ShoppingCart' },
      { label: '退换货', labelKey: 'portal.opsMenu.returns', to: '/returns', icon: 'RefreshLeft' },
      { label: '我的订单', labelKey: 'portal.opsMenu.myOrders', to: '/my-orders', icon: 'Tickets' },
      { label: '分销管理', labelKey: 'portal.opsMenu.distribute', to: '/distribute', icon: 'Share' },
    ],
  },
  {
    label: '电商 · 国内电商',
    labelKey: 'portal.opsMenu.groupEcomDomestic',
    items: [
      { label: '卖家看板', labelKey: 'portal.opsMenu.domesticDashboard', to: '/domestic/dashboard', icon: 'DataBoard' },
      { label: '商品管理', labelKey: 'portal.opsMenu.domesticProducts', to: '/domestic/products', icon: 'Goods' },
      { label: '订单管理', labelKey: 'portal.opsMenu.domesticOrders', to: '/domestic/orders', icon: 'List' },
    ],
  },
]
