import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type {
  DomesticProduct,
  DomesticOrder,
  DomesticOrderStatus,
  DomesticPlatform,
  DomesticCategory,
  DomesticDashboardStats,
} from '@/types'
import {
  MOCK_DOMESTIC_PRODUCTS,
  MOCK_DOMESTIC_ORDERS,
  generateRandomOrder,
  DOMESTIC_PLATFORMS,
  DOMESTIC_CATEGORIES,
} from '@/mock/domesticData'

const STORAGE_KEY = 'qh_domestic_products'
const ORDERS_KEY = 'qh_domestic_orders'

function loadProducts(): DomesticProduct[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* noop */ }
  return [...MOCK_DOMESTIC_PRODUCTS]
}

function loadOrders(): DomesticOrder[] {
  try {
    const raw = localStorage.getItem(ORDERS_KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* noop */ }
  return [...MOCK_DOMESTIC_ORDERS]
}

function saveProducts(list: DomesticProduct[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
}

function saveOrders(list: DomesticOrder[]) {
  localStorage.setItem(ORDERS_KEY, JSON.stringify(list))
}

export interface DomesticProductForm {
  title: string
  category: DomesticCategory
  platforms: DomesticPlatform[]
  price: number
  originalPrice?: number
  stock: number
  image: string
  description: string
  author?: string
  episodes?: number
  format?: 'physical' | 'digital'
}

export const useDomesticStore = defineStore('domestic', () => {
  const products = ref<DomesticProduct[]>(loadProducts())
  const orders = ref<DomesticOrder[]>(loadOrders())
  const lastNewOrderAt = ref<number>(Date.now())

  // ---- 计算属性 ----

  const totalProducts = computed(() => products.value.length)

  const totalOrders = computed(() => orders.value.length)

  const pendingOrders = computed(() =>
    orders.value.filter((o) => o.status === 'pending').length,
  )

  const confirmedOrders = computed(() =>
    orders.value.filter((o) => o.status === 'confirmed').length,
  )

  const shippedOrders = computed(() =>
    orders.value.filter((o) => o.status === 'shipped').length,
  )

  const completedOrders = computed(() =>
    orders.value.filter((o) => o.status === 'completed').length,
  )

  const totalRevenue = computed(() =>
    orders.value
      .filter((o) => o.status === 'completed' || o.status === 'shipped')
      .reduce((sum, o) => sum + o.amount, 0),
  )

  const totalSales = computed(() =>
    products.value.reduce((sum, p) => sum + p.sales, 0),
  )

  const platformStats = computed(() => {
    return DOMESTIC_PLATFORMS.map((pl) => {
      const ps = products.value.filter((p) => p.platforms.includes(pl.id))
      const os = orders.value.filter((o) => o.platform === pl.id)
      return {
        platform: pl.id,
        name: pl.name,
        color: pl.color,
        icon: pl.icon,
        productCount: ps.length,
        orderCount: os.length,
        revenue: os
          .filter((o) => o.status === 'completed' || o.status === 'shipped')
          .reduce((s, o) => s + o.amount, 0),
        pendingCount: os.filter((o) => o.status === 'pending').length,
      }
    })
  })

  const categoryStats = computed(() => {
    return DOMESTIC_CATEGORIES.map((cat) => {
      const ps = products.value.filter((p) => p.category === cat.id)
      const os = orders.value.filter((o) => o.category === cat.id)
      return {
        category: cat.id,
        name: cat.name,
        icon: cat.icon,
        productCount: ps.length,
        orderCount: os.length,
        revenue: os
          .filter((o) => o.status === 'completed' || o.status === 'shipped')
          .reduce((s, o) => s + o.amount, 0),
      }
    })
  })

  const dashboardStats = computed<DomesticDashboardStats>(() => ({
    totalProducts: totalProducts.value,
    totalOrders: totalOrders.value,
    pendingOrders: pendingOrders.value,
    totalRevenue: totalRevenue.value,
    totalSales: totalSales.value,
    platformStats: platformStats.value.map((s) => ({
      platform: s.platform,
      productCount: s.productCount,
      orderCount: s.orderCount,
      revenue: s.revenue,
      pendingCount: s.pendingCount,
    })),
    categoryStats: categoryStats.value.map((s) => ({
      category: s.category,
      productCount: s.productCount,
      orderCount: s.orderCount,
      revenue: s.revenue,
    })),
  }))

  const recentOrders = computed(() =>
    [...orders.value].sort((a, b) => b.createdAt - a.createdAt).slice(0, 10),
  )

  // ---- 商品 Actions ----

  function addProduct(form: DomesticProductForm): DomesticProduct {
    const now = Date.now()
    const product: DomesticProduct = {
      id: `dp${Date.now()}`,
      title: form.title,
      category: form.category,
      platforms: form.platforms,
      price: form.price,
      originalPrice: form.originalPrice,
      stock: form.stock,
      sales: 0,
      image: form.image || 'https://images.unsplash.com/photo-1556909114-f6e7ad7c0d6c?w=400',
      description: form.description,
      status: 'listed',
      author: form.author,
      episodes: form.episodes,
      format: form.format || 'physical',
      createdAt: now,
      updatedAt: now,
    }
    products.value.unshift(product)
    saveProducts(products.value)
    return product
  }

  function updateProduct(id: string, form: DomesticProductForm) {
    const idx = products.value.findIndex((p) => p.id === id)
    if (idx === -1) return
    products.value[idx] = {
      ...products.value[idx],
      title: form.title,
      category: form.category,
      platforms: form.platforms,
      price: form.price,
      originalPrice: form.originalPrice,
      stock: form.stock,
      image: form.image,
      description: form.description,
      author: form.author,
      episodes: form.episodes,
      format: form.format,
      updatedAt: Date.now(),
    }
    saveProducts(products.value)
  }

  function removeProduct(id: string) {
    products.value = products.value.filter((p) => p.id !== id)
    saveProducts(products.value)
  }

  function togglePlatform(id: string, platform: DomesticPlatform) {
    const p = products.value.find((p) => p.id === id)
    if (!p) return
    if (p.platforms.includes(platform)) {
      p.platforms = p.platforms.filter((x) => x !== platform)
    } else {
      p.platforms.push(platform)
    }
    p.updatedAt = Date.now()
    saveProducts(products.value)
  }

  // ---- 订单 Actions ----

  function updateOrderStatus(orderId: string, status: DomesticOrderStatus) {
    const order = orders.value.find((o) => o.id === orderId)
    if (!order) return
    const now = Date.now()
    order.status = status
    if (status === 'confirmed') order.confirmedAt = now
    if (status === 'shipped') {
      order.shippedAt = now
      order.trackingNo = `SF${Math.floor(Math.random() * 9e14 + 1e15)}`
      order.carrier = '顺丰速运'
    }
    if (status === 'completed') order.completedAt = now
    saveOrders(orders.value)
    // 同步商品销量
    if (status === 'completed') {
      const product = products.value.find((p) => p.id === order.productId)
      if (product) {
        product.sales += order.qty
        product.stock = Math.max(0, product.stock - order.qty)
        saveProducts(products.value)
      }
    }
  }

  function receiveNewOrder(): DomesticOrder {
    const order = generateRandomOrder()
    orders.value.unshift(order)
    saveOrders(orders.value)
    lastNewOrderAt.value = Date.now()
    return order
  }

  function getOrdersByStatus(status?: DomesticOrderStatus) {
    if (!status) return orders.value
    return orders.value.filter((o) => o.status === status)
  }

  function getOrdersByPlatform(platform: DomesticPlatform) {
    return orders.value.filter((o) => o.platform === platform)
  }

  return {
    products,
    orders,
    lastNewOrderAt,
    totalProducts,
    totalOrders,
    pendingOrders,
    confirmedOrders,
    shippedOrders,
    completedOrders,
    totalRevenue,
    totalSales,
    platformStats,
    categoryStats,
    dashboardStats,
    recentOrders,
    addProduct,
    updateProduct,
    removeProduct,
    togglePlatform,
    updateOrderStatus,
    receiveNewOrder,
    getOrdersByStatus,
    getOrdersByPlatform,
  }
})
