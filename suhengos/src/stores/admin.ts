import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

/** 管理端用户（Mock） */
export interface AdminUser {
  id: string
  email: string
  nickname: string
  role: 'user' | 'admin'
  status: 'active' | 'disabled'
  locale: string
  orders: number
  spent: number
  createdAt: string
}

/** 管理端订单（Mock） */
export interface AdminOrder {
  id: string
  userEmail: string
  productName: string
  amount: number
  currency: string
  status: 'pending' | 'paid' | 'shipped' | 'completed' | 'refunded'
  createdAt: string
}

/** 多语言内容审核条目（Mock） */
export interface ContentReviewItem {
  id: string
  module: 'shop' | 'health' | 'ops' | 'ui'
  key: string
  locale: string
  sourceText: string
  translatedText: string
  status: 'pending' | 'approved' | 'rejected'
  submittedAt: string
}

const LOCALES = ['zh', 'en', 'ja', 'ko', 'es', 'fr', 'ar', 'id', 'ms', 'vi', 'th', 'fil']

function seedUsers(): AdminUser[] {
  const names = [
    '岐黄体验官', '林小满', 'Amina Yusuf', 'Nguyen Thi Lan', 'Somchai P.', 'Maria Santos',
    'Rina Wati', 'Ahmad Bin Ali', 'Grace Tan', '李知行', 'Fatima Al-Said', 'Chen Wei',
  ]
  return names.map((name, i) => ({
    id: 'u-' + String(i + 1).padStart(3, '0'),
    email: `user${i + 1}@example.com`,
    nickname: name,
    role: i === 0 ? 'admin' : 'user',
    status: i === 9 ? 'disabled' : 'active',
    locale: LOCALES[i % LOCALES.length],
    orders: [3, 8, 12, 1, 0, 5, 2, 6, 4, 9, 7, 11][i],
    spent: [460, 1280, 2350, 199, 0, 870, 320, 990, 640, 1560, 1120, 2040][i],
    createdAt: `2026-0${(i % 8) + 1}-1${i % 9}T10:00:00Z`,
  }))
}

function seedOrders(): AdminOrder[] {
  const products = ['枸杞原浆 30袋装', '艾灸贴·肩颈舒缓', '酸枣仁膏 250g', '五红汤料包', '桂枝茯苓胶囊', '足浴包·祛湿方']
  const statuses: AdminOrder['status'][] = ['pending', 'paid', 'shipped', 'completed', 'refunded']
  return Array.from({ length: 18 }, (_, i) => ({
    id: 'SO-2026' + String(1000 + i),
    userEmail: `user${(i % 12) + 1}@example.com`,
    productName: products[i % products.length],
    amount: [59, 128, 88, 39, 168, 45][i % 6] + i,
    currency: i % 3 === 0 ? 'USD' : 'CNY',
    status: statuses[i % statuses.length],
    createdAt: `2026-08-${String((i % 18) + 1).padStart(2, '0')}T09:${String((i * 7) % 60).padStart(2, '0')}:00Z`,
  }))
}

function seedContent(): ContentReviewItem[] {
  const items: Array<Pick<ContentReviewItem, 'module' | 'key' | 'sourceText' | 'translatedText' | 'locale'>> = [
    { module: 'shop', key: 'productName.gojiPaste', sourceText: '枸杞原浆·30袋装', locale: 'ar', translatedText: 'عصارة الغوجي - 30 كيس' },
    { module: 'shop', key: 'productDesc.gojiPaste', sourceText: '宁夏枸杞低温冷榨，保留天然营养', locale: 'th', translatedText: 'สกัดเย็นจากฝรั่งเวียดนาม' },
    { module: 'health', key: 'alerts.constitution.qiDeficiency', sourceText: '气虚质建议：避免过度劳累', locale: 'vi', translatedText: 'Thể chất khí hư: tránh làm việc quá sức' },
    { module: 'ops', key: 'listing.title.goji', sourceText: '枸杞原浆 Listing 标题（东南亚站）', locale: 'id', translatedText: 'Sari Goji Asli - 30 sachet' },
    { module: 'ui', key: 'cart.emptyHint', sourceText: '购物车还是空的', locale: 'fil', translatedText: 'Wala pang laman ang cart mo' },
    { module: 'shop', key: 'productName.jujubePaste', sourceText: '酸枣仁膏·250g', locale: 'ms', translatedText: 'Pes Jujube - 250g' },
  ]
  return items.map((it, i) => ({
    ...it,
    id: 'cr-' + String(i + 1).padStart(3, '0'),
    status: 'pending' as const,
    submittedAt: `2026-08-1${i}T14:00:00Z`,
  }))
}

export const useAdminStore = defineStore('admin', () => {
  const users = ref<AdminUser[]>(seedUsers())
  const orders = ref<AdminOrder[]>(seedOrders())
  const contentReviews = ref<ContentReviewItem[]>(seedContent())

  const stats = computed(() => ({
    totalUsers: users.value.length,
    activeUsers: users.value.filter((u) => u.status === 'active').length,
    totalOrders: orders.value.length,
    pendingOrders: orders.value.filter((o) => o.status === 'pending').length,
    pendingReviews: contentReviews.value.filter((c) => c.status === 'pending').length,
    totalRevenue: orders.value
      .filter((o) => o.status === 'paid' || o.status === 'shipped' || o.status === 'completed')
      .reduce((sum, o) => sum + o.amount, 0),
  }))

  function toggleUserStatus(id: string) {
    const u = users.value.find((x) => x.id === id)
    if (u) u.status = u.status === 'active' ? 'disabled' : 'active'
  }

  function updateUserRole(id: string, role: AdminUser['role']) {
    const u = users.value.find((x) => x.id === id)
    if (u) u.role = role
  }

  function reviewContent(id: string, decision: 'approved' | 'rejected') {
    const c = contentReviews.value.find((x) => x.id === id)
    if (c) c.status = decision
  }

  return {
    users,
    orders,
    contentReviews,
    stats,
    toggleUserStatus,
    updateUserRole,
    reviewContent,
  }
})
