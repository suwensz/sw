<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useTradeStore } from '@/stores/trade'
import { tText } from '@/i18n'
import { localizeNumber } from '@/utils/numbers'

const { t, locale } = useI18n()
const trade = useTradeStore()

const platformTab = ref<'all' | 'pdd' | 'jd' | 'taobao'>('all')
const search = ref('')

const platformMeta: Record<string, { name: string; color: string }> = {
  pdd: { name: '拼多多', color: '#e02e24' },
  jd: { name: 'JD 京东', color: '#e1251b' },
  taobao: { name: '淘宝', color: '#ff5000' },
}

const statusLabels: Record<string, string> = {
  paid: t('myOrders.stPaid'), shipped: t('myOrders.stShipped'),
  completed: t('myOrders.stCompleted'), refunding: t('myOrders.stRefunding'),
}

const filtered = computed(() =>
  trade.orders.filter((o) => {
    if (platformTab.value !== 'all' && o.platform !== platformTab.value) return false
    if (search.value) {
      const q = search.value.toLowerCase()
      return (
        o.orderNo.toLowerCase().includes(q) ||
        o.buyer.toLowerCase().includes(q) ||
        tText(o.product).toLowerCase().includes(q)
      )
    }
    return true
  }),
)
</script>

<template>
  <div class="orders-page qh-container">
    <div class="page-head">
      <h1>{{ t('myOrders.title') }}</h1>
      <p>{{ t('myOrders.subtitle') }}</p>
    </div>

    <!-- 平台分类统计 -->
    <div class="platform-tabs">
      <button
        v-for="p in (['all', 'pdd', 'jd', 'taobao'] as const)"
        :key="p"
        :class="['platform-tab', { active: platformTab === p }]"
        :style="platformTab === p && p !== 'all' ? { borderColor: platformMeta[p].color, color: platformMeta[p].color } : {}"
        @click="platformTab = p"
      >
        <template v-if="p === 'all'">{{ t('myOrders.all') }} <b>{{ trade.orders.length }}</b></template>
        <template v-else>{{ platformMeta[p].name }} <b>{{ trade.orderStats[p] }}</b></template>
      </button>
    </div>

    <div class="orders-toolbar">
      <el-input v-model="search" :placeholder="t('common.searchPlaceholder')" clearable style="max-width: 320px" />
      <span class="total-amount">{{ t('myOrders.totalAmount') }}：<b>¥{{ localizeNumber(trade.orderStats.totalAmount, locale) }}</b></span>
    </div>

    <div class="orders-list">
      <div v-for="o in filtered" :key="o.id" class="qh-card order-card">
        <div class="order-top">
          <span class="platform-badge" :style="{ background: platformMeta[o.platform].color }">
            {{ platformMeta[o.platform].name }}
          </span>
          <span class="order-no">{{ o.orderNo }}</span>
          <span class="order-date">{{ o.createdAt }}</span>
          <span :class="['st-tag', o.status]">{{ statusLabels[o.status] }}</span>
        </div>
        <div class="order-main">
          <div class="order-product">{{ tText(o.product) }} ×{{ o.qty }}</div>
          <div class="order-buyer">{{ t('myOrders.buyer') }}：{{ o.buyer }}</div>
        </div>
        <div class="order-bottom">
          <span class="order-amount">¥{{ localizeNumber(o.amount, locale) }}</span>
        </div>
      </div>
      <div v-if="!filtered.length" class="empty">{{ t('shop.noProducts') }}</div>
    </div>
  </div>
</template>

<style scoped>
.orders-page { padding: 32px 48px; }
.page-head { margin-bottom: 20px; }
.page-head h1 { font-size: 26px; font-weight: 600; margin: 0 0 6px; }
.page-head p { color: var(--color-text-secondary); margin: 0; }
.platform-tabs { display: flex; gap: 10px; margin-bottom: 14px; flex-wrap: wrap; }
.platform-tab {
  padding: 9px 18px; border-radius: 999px; border: 1.5px solid var(--color-border);
  background: var(--color-bg-card); cursor: pointer; font-size: 14px; color: var(--color-text-regular);
}
.platform-tab b { color: var(--color-primary); margin-left: 2px; }
.platform-tab.active { border-color: var(--color-primary); color: var(--color-primary); background: rgba(26, 107, 92, 0.06); font-weight: 600; }
.orders-toolbar { display: flex; align-items: center; gap: 16px; margin-bottom: 16px; }
.total-amount { font-size: 14px; color: var(--color-text-secondary); }
.total-amount b { color: var(--color-accent); font-size: 18px; }
.orders-list { display: flex; flex-direction: column; gap: 12px; }
.order-card { padding: 16px 20px; }
.order-top { display: flex; align-items: center; gap: 12px; padding-bottom: 10px; border-bottom: 1px dashed var(--color-border); }
.platform-badge { color: #fff; font-size: 12px; font-weight: 600; padding: 2px 10px; border-radius: 4px; }
.order-no { font-size: 13px; font-weight: 500; }
.order-date { font-size: 12px; color: var(--color-text-secondary); }
.order-top .st-tag { margin-left: auto; }
.st-tag { display: inline-block; padding: 3px 10px; border-radius: 999px; font-size: 12px; font-weight: 500; background: var(--color-bg-soft); }
.st-tag.paid { background: rgba(26, 107, 92, 0.1); color: var(--color-primary); }
.st-tag.shipped { background: rgba(230, 162, 60, 0.14); color: var(--color-warning); }
.st-tag.completed { background: rgba(82, 166, 122, 0.14); color: var(--color-success); }
.st-tag.refunding { background: rgba(217, 107, 92, 0.14); color: var(--color-danger); }
.order-main { display: flex; align-items: center; justify-content: space-between; padding: 12px 0; gap: 12px; }
.order-product { font-size: 15px; font-weight: 500; }
.order-buyer { font-size: 13px; color: var(--color-text-secondary); }
.order-bottom { display: flex; justify-content: flex-end; }
.order-amount { font-size: 18px; font-weight: 700; color: var(--color-accent); }
.empty { text-align: center; color: var(--color-text-secondary); padding: 40px 0; }
@media (max-width: 768px) { .orders-page { padding: 16px; } }
</style>
