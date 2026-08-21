<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useDomesticStore } from '@/stores/domestic'
import { DOMESTIC_PLATFORMS, DOMESTIC_CATEGORIES } from '@/mock/domesticData'
import type { DomesticOrderStatus } from '@/types'

const router = useRouter()
const { t } = useI18n()
const store = useDomesticStore()

const stats = computed(() => store.dashboardStats)
const recentOrders = computed(() => store.recentOrders)

const statusLabels: Record<DomesticOrderStatus, { text: string; color: string }> = {
  pending: { text: t('domestic.stPending'), color: '#E6A23C' },
  confirmed: { text: t('domestic.stConfirmed'), color: '#409EFF' },
  shipped: { text: t('domestic.stShipped'), color: '#67C23A' },
  completed: { text: t('domestic.stCompleted'), color: '#909399' },
  refunded: { text: t('domestic.stRefunded'), color: '#F56C6C' },
  cancelled: { text: t('domestic.stCancelled'), color: '#909399' },
}

function platformInfo(id: string) {
  return DOMESTIC_PLATFORMS.find((p) => p.id === id)
}

function categoryInfo(id: string) {
  return DOMESTIC_CATEGORIES.find((c) => c.id === id)
}

function formatTime(ts: number): string {
  const diff = Date.now() - ts
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`
  return `${Math.floor(diff / 86400000)}天前`
}

function formatMoney(n: number): string {
  return '¥' + n.toLocaleString('zh-CN', { maximumFractionDigits: 0 })
}

// 模拟新订单推送
let timer: ReturnType<typeof setInterval> | null = null
const newOrderNotice = ref<string | null>(null)

onMounted(() => {
  timer = setInterval(() => {
    // 15% 概率收到新订单
    if (Math.random() < 0.15) {
      const order = store.receiveNewOrder()
      newOrderNotice.value = order.productTitle
      setTimeout(() => { newOrderNotice.value = null }, 5000)
    }
  }, 30000)
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})
</script>

<template>
  <div class="seller-dashboard">
    <!-- 新订单通知 -->
    <transition name="slide-in">
      <div v-if="newOrderNotice" class="new-order-notice">
        <span class="notice-icon">🔔</span>
        <span>{{ t('domestic.newOrderNotice') }}：{{ newOrderNotice }}</span>
        <button class="notice-action" @click="router.push('/domestic/orders')">{{ t('domestic.goProcess') }}</button>
      </div>
    </transition>

    <!-- 标题 -->
    <div class="page-header">
      <h1>{{ t('domestic.dashboardTitle') }}</h1>
      <p>{{ t('domestic.dashboardSubtitle') }}</p>
    </div>

    <!-- 核心数据卡片 -->
    <div class="stat-cards">
      <div class="stat-card revenue">
        <div class="stat-icon">💰</div>
        <div class="stat-body">
          <div class="stat-label">{{ t('domestic.totalRevenue') }}</div>
          <div class="stat-value">{{ formatMoney(stats.totalRevenue) }}</div>
        </div>
      </div>
      <div class="stat-card orders">
        <div class="stat-icon">📦</div>
        <div class="stat-body">
          <div class="stat-label">{{ t('domestic.totalOrders') }}</div>
          <div class="stat-value">{{ stats.totalOrders }}</div>
        </div>
      </div>
      <div class="stat-card pending">
        <div class="stat-icon">⏳</div>
        <div class="stat-body">
          <div class="stat-label">{{ t('domestic.pendingOrders') }}</div>
          <div class="stat-value" :class="{ 'text-warning': stats.pendingOrders > 0 }">{{ stats.pendingOrders }}</div>
        </div>
      </div>
      <div class="stat-card products">
        <div class="stat-icon">🏷️</div>
        <div class="stat-body">
          <div class="stat-label">{{ t('domestic.totalProducts') }}</div>
          <div class="stat-value">{{ stats.totalProducts }}</div>
        </div>
      </div>
    </div>

    <!-- 平台概览 -->
    <div class="section">
      <h2 class="section-title">{{ t('domestic.platformOverview') }}</h2>
      <div class="platform-cards">
        <div
          v-for="ps in store.platformStats"
          :key="ps.platform"
          class="platform-card"
          :style="{ '--platform-color': ps.color }"
        >
          <div class="platform-header">
            <span class="platform-icon">{{ ps.icon }}</span>
            <span class="platform-name">{{ ps.name }}</span>
            <span class="platform-pending" v-if="ps.pendingCount > 0">{{ ps.pendingCount }} {{ t('domestic.pending') }}</span>
          </div>
          <div class="platform-body">
            <div class="platform-stat">
              <span class="ps-label">{{ t('domestic.productsLabel') }}</span>
              <span class="ps-value">{{ ps.productCount }}</span>
            </div>
            <div class="platform-stat">
              <span class="ps-label">{{ t('domestic.ordersLabel') }}</span>
              <span class="ps-value">{{ ps.orderCount }}</span>
            </div>
            <div class="platform-stat">
              <span class="ps-label">{{ t('domestic.revenueLabel') }}</span>
              <span class="ps-value money">{{ formatMoney(ps.revenue) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 品类分布 -->
    <div class="section">
      <h2 class="section-title">{{ t('domestic.categoryDistribution') }}</h2>
      <div class="category-cards">
        <div
          v-for="cs in store.categoryStats"
          :key="cs.category"
          class="category-card"
        >
          <div class="cat-header">
            <span class="cat-icon">{{ cs.icon }}</span>
            <span class="cat-name">{{ cs.name }}</span>
          </div>
          <div class="cat-bar-wrap">
            <div class="cat-bar" :style="{ width: stats.totalProducts > 0 ? (cs.productCount / stats.totalProducts * 100) + '%' : '0%' }"></div>
          </div>
          <div class="cat-stats">
            <span>{{ cs.productCount }} {{ t('domestic.productsUnit') }}</span>
            <span>{{ cs.orderCount }} {{ t('domestic.ordersUnit') }}</span>
            <span class="money">{{ formatMoney(cs.revenue) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 最近订单 -->
    <div class="section">
      <div class="section-header">
        <h2 class="section-title">{{ t('domestic.recentOrders') }}</h2>
        <button class="view-all-btn" @click="router.push('/domestic/orders')">{{ t('domestic.viewAll') }} →</button>
      </div>
      <div class="orders-table">
        <div class="orders-table-head">
          <span class="col-platform">{{ t('domestic.platform') }}</span>
          <span class="col-order">{{ t('domestic.orderNo') }}</span>
          <span class="col-product">{{ t('domestic.product') }}</span>
          <span class="col-buyer">{{ t('domestic.buyer') }}</span>
          <span class="col-amount">{{ t('domestic.amount') }}</span>
          <span class="col-status">{{ t('domestic.status') }}</span>
          <span class="col-time">{{ t('domestic.time') }}</span>
        </div>
        <div v-for="o in recentOrders.slice(0, 8)" :key="o.id" class="orders-table-row">
          <span class="col-platform">
            <span class="platform-badge" :style="{ background: platformInfo(o.platform)?.color + '15', color: platformInfo(o.platform)?.color }">
              {{ platformInfo(o.platform)?.icon }} {{ platformInfo(o.platform)?.shortName }}
            </span>
          </span>
          <span class="col-order">{{ o.orderNo }}</span>
          <span class="col-product" :title="o.productTitle">{{ o.productTitle.length > 12 ? o.productTitle.slice(0, 12) + '…' : o.productTitle }}</span>
          <span class="col-buyer">{{ o.buyer }}</span>
          <span class="col-amount money">{{ formatMoney(o.amount) }}</span>
          <span class="col-status">
            <span class="status-tag" :style="{ background: statusLabels[o.status].color + '15', color: statusLabels[o.status].color }">
              {{ statusLabels[o.status].text }}
            </span>
          </span>
          <span class="col-time">{{ formatTime(o.createdAt) }}</span>
        </div>
        <div v-if="recentOrders.length === 0" class="empty-row">
          {{ t('domestic.noOrders') }}
        </div>
      </div>
    </div>

    <!-- 快捷操作 -->
    <div class="section">
      <h2 class="section-title">{{ t('domestic.quickActions') }}</h2>
      <div class="quick-actions">
        <button class="qa-btn" @click="router.push('/domestic/products')">
          <span class="qa-icon">📝</span>
          <span>{{ t('domestic.manageProducts') }}</span>
        </button>
        <button class="qa-btn" @click="router.push('/domestic/orders')">
          <span class="qa-icon">📋</span>
          <span>{{ t('domestic.manageOrders') }}</span>
        </button>
        <button class="qa-btn" @click="router.push('/domestic/products?action=new')">
          <span class="qa-icon">➕</span>
          <span>{{ t('domestic.listNewProduct') }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.seller-dashboard {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px;
}

.new-order-notice {
  position: fixed;
  top: 120px;
  right: 24px;
  z-index: 200;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 20px;
  background: #fff;
  border: 1px solid var(--color-primary);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  animation: pulse-glow 2s ease-in-out infinite;
}
.notice-icon { font-size: 18px; }
.notice-action {
  padding: 4px 12px;
  background: var(--color-primary);
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
  white-space: nowrap;
}
@keyframes pulse-glow {
  0%, 100% { box-shadow: 0 8px 32px rgba(26, 107, 92, 0.15); }
  50% { box-shadow: 0 8px 32px rgba(26, 107, 92, 0.35); }
}
.slide-in-enter-active, .slide-in-leave-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}
.slide-in-enter-from, .slide-in-leave-to {
  opacity: 0;
  transform: translateX(100px);
}

.page-header {
  margin-bottom: 24px;
}
.page-header h1 {
  font-size: 24px;
  font-weight: 700;
  color: var(--color-text-primary);
  margin: 0 0 6px;
}
.page-header p {
  font-size: 14px;
  color: var(--color-text-secondary);
  margin: 0;
}

.stat-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 32px;
}
.stat-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 20px;
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: 14px;
  transition: transform 0.2s, box-shadow 0.2s;
}
.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.06);
}
.stat-icon {
  font-size: 32px;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  background: var(--color-bg-soft);
  flex-shrink: 0;
}
.stat-label {
  font-size: 13px;
  color: var(--color-text-secondary);
  margin-bottom: 4px;
}
.stat-value {
  font-size: 26px;
  font-weight: 700;
  color: var(--color-text-primary);
}
.text-warning { color: #E6A23C; }

.section {
  margin-bottom: 32px;
}
.section-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0 0 16px;
}
.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}
.section-header .section-title { margin: 0; }
.view-all-btn {
  padding: 6px 16px;
  border: none;
  background: var(--color-bg-soft);
  color: var(--color-primary);
  font-size: 13px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s;
}
.view-all-btn:hover { background: rgba(26, 107, 92, 0.08); }

.platform-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}
.platform-card {
  padding: 20px;
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: 14px;
  border-top: 3px solid var(--platform-color);
}
.platform-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
}
.platform-icon { font-size: 20px; }
.platform-name { font-size: 16px; font-weight: 600; color: var(--color-text-primary); }
.platform-pending {
  margin-left: auto;
  padding: 2px 8px;
  background: #E6A23C20;
  color: #E6A23C;
  font-size: 12px;
  font-weight: 600;
  border-radius: 999px;
}
.platform-body {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}
.platform-stat {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.ps-label { font-size: 12px; color: var(--color-text-secondary); }
.ps-value { font-size: 18px; font-weight: 600; color: var(--color-text-primary); }
.ps-value.money { color: var(--color-primary); }

.category-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}
.category-card {
  padding: 16px;
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: 12px;
}
.cat-header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 12px;
}
.cat-icon { font-size: 18px; }
.cat-name { font-size: 14px; font-weight: 600; color: var(--color-text-primary); }
.cat-bar-wrap {
  height: 6px;
  background: var(--color-bg-soft);
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 8px;
}
.cat-bar {
  height: 100%;
  background: var(--color-primary);
  border-radius: 3px;
  transition: width 0.5s;
}
.cat-stats {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: var(--color-text-secondary);
}
.cat-stats .money { color: var(--color-primary); font-weight: 600; }

.orders-table {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  overflow: hidden;
}
.orders-table-head {
  display: grid;
  grid-template-columns: 100px 140px 1fr 80px 100px 80px 100px;
  gap: 8px;
  padding: 12px 16px;
  background: var(--color-bg-soft);
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text-secondary);
}
.orders-table-row {
  display: grid;
  grid-template-columns: 100px 140px 1fr 80px 100px 80px 100px;
  gap: 8px;
  padding: 12px 16px;
  font-size: 13px;
  border-top: 1px solid var(--color-border);
  align-items: center;
  transition: background 0.15s;
}
.orders-table-row:hover { background: var(--color-bg-soft); }
.platform-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
}
.status-tag {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
}
.money { color: var(--color-primary); font-weight: 600; }
.empty-row {
  padding: 40px 16px;
  text-align: center;
  color: var(--color-text-secondary);
  font-size: 14px;
}

.quick-actions {
  display: flex;
  gap: 16px;
}
.qa-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 20px 32px;
  border: 1px solid var(--color-border);
  background: var(--color-bg-card);
  border-radius: 14px;
  cursor: pointer;
  transition: all 0.2s;
  min-width: 160px;
}
.qa-btn:hover {
  border-color: var(--color-primary);
  background: rgba(26, 107, 92, 0.04);
}
.qa-icon { font-size: 28px; }

@media (max-width: 900px) {
  .stat-cards { grid-template-columns: repeat(2, 1fr); }
  .platform-cards { grid-template-columns: 1fr; }
  .category-cards { grid-template-columns: repeat(2, 1fr); }
  .orders-table-head, .orders-table-row {
    grid-template-columns: 1fr;
    gap: 4px;
  }
  .quick-actions { flex-wrap: wrap; }
}
</style>
