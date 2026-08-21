<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useDomesticStore } from '@/stores/domestic'
import { useAgentOrdersStore, type AgentOrderRecord } from '@/stores/agentOrders'
import { DOMESTIC_PLATFORMS, DOMESTIC_CATEGORIES } from '@/mock/domesticData'
import type { DomesticOrderStatus, DomesticPlatform, DomesticCategory, DomesticOrder } from '@/types'

const { t, locale } = useI18n()
const store = useDomesticStore()
/** 接单智能体订单：与右下角悬浮球（OrderAgentWidget）共享同一 store，实时同步 */
const agentOrdersStore = useAgentOrdersStore()

/** 订单来源页签：平台订单 / 接单智能体订单 */
const orderSource = ref<'platform' | 'agent'>('platform')

const COUNTRY_FLAGS: Record<string, string> = {
  AE: '🇦🇪', SA: '🇸🇦', TH: '🇹🇭', VN: '🇻🇳', ID: '🇮🇩', MY: '🇲🇾', PH: '🇵🇭', CN: '🇨🇳',
}

/** 订单渠道颜色映射（跨境 / 淘宝 / 拼多多 / 京东 / 抖音 / 快速订单） */
const CHANNEL_COLORS: Record<string, { bg: string; color: string }> = {
  overseas: { bg: '#e7f3ee', color: '#1a6b5c' },
  taobao: { bg: '#ffe9e6', color: '#e8403f' },
  pdd: { bg: '#fdeede', color: '#e02e24' },
  jd: { bg: '#fff1e3', color: '#e1251b' },
  douyin: { bg: '#eae9f5', color: '#1b1f3b' },
  quick: { bg: '#fdf6e7', color: '#a5761c' },
}

function countryName(code: string): string {
  return t(`portal.agent.countries.${code}`)
}

function channelName(channel: string): string {
  return t(`portal.agent.channels.${channel}`)
}

/** 双语字段（"中文 / English"）按当前界面语言取一半 */
function bilingualLabel(text: string): string {
  if (!text) return ''
  const parts = text.split(' / ')
  if (parts.length < 2) return text
  return locale.value === 'zh' || locale.value === 'zh-TW' ? parts[0] : parts[1]
}

function agentTimeLabel(ts: number): string {
  const mins = Math.floor((Date.now() - ts) / 60000)
  if (mins <= 0) return t('portal.agent.justNow')
  if (mins < 60) return `${mins} ${t('portal.agent.minutesAgo')}`
  return new Date(ts).toLocaleString('sv-GB').replace('T', ' ').slice(0, 16)
}

function acceptAgentOrder(id: number) {
  agentOrdersStore.setStatus(id, 'handled')
}

/** 渠道徽标样式（跨境 / 淘宝 / 拼多多 / 京东 / 抖音 / 快速订单） */
function channelStyle(channel: string): Record<string, string> {
  const c = CHANNEL_COLORS[channel] || CHANNEL_COLORS.overseas
  return { color: c.color, borderColor: `${c.color}55`, background: `${c.color}12` }
}

/** agent 订单详情弹窗（客户内容可点击查看订单全部内容） */
const agentDetailOrder = ref<AgentOrderRecord | null>(null)
const agentDetailVisible = ref(false)

function openAgentDetail(order: AgentOrderRecord) {
  agentDetailOrder.value = order
  agentDetailVisible.value = true
}

function acceptAgentDetail() {
  if (agentDetailOrder.value && agentDetailOrder.value.status === 'pending') {
    acceptAgentOrder(agentDetailOrder.value.id)
  }
  agentDetailVisible.value = false
}

const agentStats = computed(() => ({
  total: agentOrdersStore.orders.length,
  pending: agentOrdersStore.pendingCount,
  handled: agentOrdersStore.handledCount,
}))

/** 订单数据库分页：每次加载 20 条，避免 1000 条全量渲染卡顿 */
const AGENT_PAGE_SIZE = 20
const agentPage = ref(1)
const agentPageOrders = computed(() =>
  agentOrdersStore.orders.slice(0, agentPage.value * AGENT_PAGE_SIZE),
)
const agentHasMore = computed(() => agentPageOrders.value.length < agentOrdersStore.orders.length)

const filterPlatform = ref<DomesticPlatform | ''>('')
const filterStatus = ref<DomesticOrderStatus | ''>('')
const filterCategory = ref<DomesticCategory | ''>('')

const statusList: { id: DomesticOrderStatus | ''; label: string; color: string }[] = [
  { id: '', label: t('domestic.allStatus'), color: '' },
  { id: 'pending', label: t('domestic.stPending'), color: '#E6A23C' },
  { id: 'confirmed', label: t('domestic.stConfirmed'), color: '#409EFF' },
  { id: 'shipped', label: t('domestic.stShipped'), color: '#67C23A' },
  { id: 'completed', label: t('domestic.stCompleted'), color: '#909399' },
  { id: 'refunded', label: t('domestic.stRefunded'), color: '#F56C6C' },
]

const filteredOrders = computed(() => {
  return store.orders.filter((o) => {
    if (filterPlatform.value && o.platform !== filterPlatform.value) return false
    if (filterStatus.value && o.status !== filterStatus.value) return false
    if (filterCategory.value && o.category !== filterCategory.value) return false
    return true
  })
})

function platformInfo(id: DomesticPlatform) {
  return DOMESTIC_PLATFORMS.find((p) => p.id === id)!
}
function categoryInfo(id: DomesticCategory) {
  return DOMESTIC_CATEGORIES.find((c) => c.id === id)!
}

function formatMoney(n: number): string {
  return '¥' + n.toLocaleString('zh-CN', { maximumFractionDigits: 0 })
}

function formatTime(ts: number): string {
  const d = new Date(ts)
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function statusLabel(s: DomesticOrderStatus) {
  return statusList.find((x) => x.id === s)
}

// ---- 订单详情 ----
const detailOrder = ref<DomesticOrder | null>(null)

const detailVisible = computed({
  get: () => detailOrder.value !== null,
  set: (v: boolean) => { if (!v) detailOrder.value = null },
})

function showDetail(order: DomesticOrder) {
  detailOrder.value = order
}

function closeDetail() {
  detailOrder.value = null
}

// ---- 状态流转操作 ----
function confirmOrder(id: string) {
  store.updateOrderStatus(id, 'confirmed')
}
function shipOrder(id: string) {
  store.updateOrderStatus(id, 'shipped')
}
function completeOrder(id: string) {
  store.updateOrderStatus(id, 'completed')
  detailOrder.value = null
}

// ---- 模拟接单 ----
function simulateNewOrder() {
  store.receiveNewOrder()
}

// 统计
const stats = computed(() => ({
  total: store.orders.length,
  pending: store.pendingOrders,
  confirmed: store.confirmedOrders,
  shipped: store.shippedOrders,
  completed: store.completedOrders,
}))
</script>

<template>
  <div class="order-manage">
    <div class="page-header">
      <div>
        <h1>{{ t('domestic.orderManageTitle') }}</h1>
        <p>{{ t('domestic.orderManageSubtitle') }}</p>
      </div>
      <button class="sim-btn" @click="simulateNewOrder">
        <span>🔔</span>{{ t('domestic.simulateNewOrder') }}
      </button>
    </div>

    <!-- 订单来源页签：平台订单 / 接单智能体订单（与悬浮球实时同步） -->
    <div class="source-tabs">
      <button
        class="source-tab"
        :class="{ active: orderSource === 'platform' }"
        @click="orderSource = 'platform'"
      >
        {{ t('portal.agent.platformTab') }} <b>{{ store.orders.length }}</b>
      </button>
      <button
        class="source-tab"
        :class="{ active: orderSource === 'agent' }"
        @click="orderSource = 'agent'"
      >
        {{ t('portal.agent.syncTab') }} <b>{{ agentOrdersStore.orders.length }}</b>
        <span v-if="agentOrdersStore.pendingCount" class="source-dot"></span>
      </button>
    </div>

    <!-- ====== 接单智能体订单（跨境批发，与悬浮球共享数据源） ====== -->
    <div v-show="orderSource === 'agent'" class="agent-orders">
      <div class="agent-sync-tip">
        <el-icon color="#1a6b5c"><Connection /></el-icon>
        {{ t('portal.agent.syncTip') }}
      </div>

      <div class="status-summary">
        <div class="ss-item" :class="{ active: true }">
          <span class="ss-label">{{ t('portal.agent.totalOrders') }}</span>
          <span class="ss-value">{{ agentStats.total }}</span>
        </div>
        <div class="ss-item">
          <span class="ss-label">{{ t('portal.agent.tabOrders') }}</span>
          <span class="ss-value pending">{{ agentStats.pending }}</span>
        </div>
        <div class="ss-item">
          <span class="ss-label">{{ t('portal.agent.handled') }}</span>
          <span class="ss-value completed">{{ agentStats.handled }}</span>
        </div>
      </div>

      <div class="agent-order-list">
        <article
          v-for="o in agentPageOrders"
          :key="o.id"
          class="agent-order-card"
          :class="{ 'is-done': o.status !== 'pending' }"
        >
          <div class="ao-top">
            <span v-if="o.channel === 'overseas'" class="ao-country">
              {{ COUNTRY_FLAGS[o.country] || '' }} {{ countryName(o.country) }}
            </span>
            <span v-else class="agent-channel-badge" :style="channelStyle(o.channel)">
              {{ channelName(o.channel) }}
            </span>
            <el-tag v-if="o.docType" size="small" effect="plain" class="agent-doc-tag">
              {{ bilingualLabel(o.docType) }}
            </el-tag>
            <el-tag v-else-if="o.isWholesale" size="small" type="warning" effect="plain">
              {{ t('portal.agent.orderWholesale') }}
            </el-tag>
            <span class="ao-time">{{ agentTimeLabel(o.createdAt) }}</span>
            <el-tag size="small" :type="o.status === 'pending' ? 'danger' : o.status === 'handled' ? 'success' : 'info'">
              {{ o.status === 'pending' ? t('domestic.stPending') : o.status === 'handled' ? t('portal.agent.handled') : t('portal.agent.ignored') }}
            </el-tag>
          </div>
          <div class="ao-product">
            <button type="button" class="agent-product-link" @click="openAgentDetail(o)">
              <span class="ao-no">{{ o.orderNo }}</span>
              <span class="ao-name">{{ bilingualLabel(o.productName) }}</span>
              <span class="agent-view-hint">
                <el-icon :size="12"><View /></el-icon>
                {{ t('portal.agent.viewDetail') }}
              </span>
            </button>
          </div>
          <button type="button" class="agent-customer" @click="openAgentDetail(o)">
            {{ t('portal.agent.customerLabel') }}：<b>{{ o.customerName }}</b>
          </button>
          <div class="ao-grid">
            <div class="ao-field">
              <label>{{ t('portal.agent.quantity') }}</label>
              <span>{{ o.quantity.toLocaleString() }} {{ o.unit }}</span>
            </div>
            <div class="ao-field">
              <label>{{ t('portal.agent.amount') }}</label>
              <span class="ao-amount">{{ o.currency }} {{ o.amount.toLocaleString() }}</span>
            </div>
            <div class="ao-field">
              <label>{{ t('portal.agent.shipDate') }}</label>
              <span>{{ o.shipDate }}</span>
            </div>
            <div class="ao-field">
              <label>{{ t('portal.agent.eta') }}</label>
              <span>{{ o.eta }}</span>
            </div>
          </div>
          <div class="ao-field">
            <label>{{ t('portal.agent.shipRequirement') }}</label>
            <span>{{ bilingualLabel(o.shipRequirement) }}</span>
          </div>
          <div class="ao-field">
            <label>{{ t('portal.agent.qualityRequirement') }}</label>
            <span>{{ bilingualLabel(o.qualityRequirement) }}</span>
          </div>
          <div class="ao-foot">
            <el-tag size="small" :type="o.sample ? 'success' : 'info'" effect="plain">
              {{ o.sample ? t('portal.agent.sampleYes') : t('portal.agent.sampleNo') }}
            </el-tag>
            <div class="ao-foot-actions">
              <button class="action-btn detail" @click="openAgentDetail(o)">
                <el-icon :size="13"><View /></el-icon>
                {{ t('portal.agent.viewDetail') }}
              </button>
              <button v-if="o.status === 'pending'" class="action-btn confirm" @click="acceptAgentOrder(o.id)">
                {{ t('portal.agent.accept') }}
              </button>
            </div>
          </div>
        </article>
        <div v-if="!agentOrdersStore.orders.length" class="empty-row">
          {{ t('portal.agent.empty') }}
        </div>
        <div v-if="agentHasMore" class="agent-load-more">
          <button class="action-btn confirm" @click="agentPage++">
            {{ t('portal.agent.loadMore') }}（{{ agentPageOrders.length }}/{{ agentOrdersStore.orders.length }}）
          </button>
        </div>
      </div>
    </div>

    <!-- ====== 平台订单（原有） ====== -->
    <div v-show="orderSource === 'platform'">
    <!-- 状态统计条 -->
    <div class="status-summary">
      <div class="ss-item" :class="{ active: filterStatus === '' }" @click="filterStatus = ''">
        <span class="ss-label">{{ t('domestic.allOrders') }}</span>
        <span class="ss-value">{{ stats.total }}</span>
      </div>
      <div class="ss-item" :class="{ active: filterStatus === 'pending' }" @click="filterStatus = 'pending'">
        <span class="ss-label">{{ t('domestic.stPending') }}</span>
        <span class="ss-value pending">{{ stats.pending }}</span>
      </div>
      <div class="ss-item" :class="{ active: filterStatus === 'confirmed' }" @click="filterStatus = 'confirmed'">
        <span class="ss-label">{{ t('domestic.stConfirmed') }}</span>
        <span class="ss-value confirmed">{{ stats.confirmed }}</span>
      </div>
      <div class="ss-item" :class="{ active: filterStatus === 'shipped' }" @click="filterStatus = 'shipped'">
        <span class="ss-label">{{ t('domestic.stShipped') }}</span>
        <span class="ss-value shipped">{{ stats.shipped }}</span>
      </div>
      <div class="ss-item" :class="{ active: filterStatus === 'completed' }" @click="filterStatus = 'completed'">
        <span class="ss-label">{{ t('domestic.stCompleted') }}</span>
        <span class="ss-value completed">{{ stats.completed }}</span>
      </div>
    </div>

    <!-- 筛选栏 -->
    <div class="filter-bar">
      <div class="filter-group">
        <span class="filter-label">{{ t('domestic.platform') }}：</span>
        <button :class="['filter-chip', { active: filterPlatform === '' }]" @click="filterPlatform = ''">{{ t('domestic.allPlatforms') }}</button>
        <button
          v-for="p in DOMESTIC_PLATFORMS"
          :key="p.id"
          :class="['filter-chip', { active: filterPlatform === p.id }]"
          :style="filterPlatform === p.id ? { background: p.color, color: '#fff', borderColor: p.color } : {}"
          @click="filterPlatform = p.id"
        >{{ p.icon }} {{ p.shortName }}</button>
      </div>
      <div class="filter-group">
        <span class="filter-label">{{ t('domestic.category') }}：</span>
        <button :class="['filter-chip', { active: filterCategory === '' }]" @click="filterCategory = ''">{{ t('domestic.allCategories') }}</button>
        <button
          v-for="c in DOMESTIC_CATEGORIES"
          :key="c.id"
          :class="['filter-chip', { active: filterCategory === c.id }]"
          @click="filterCategory = c.id"
        >{{ c.icon }} {{ c.name }}</button>
      </div>
    </div>

    <!-- 订单列表 -->
    <div class="order-table">
      <div class="table-head">
        <span class="col-platform">{{ t('domestic.platform') }}</span>
        <span class="col-order">{{ t('domestic.orderNo') }}</span>
        <span class="col-product">{{ t('domestic.product') }}</span>
        <span class="col-qty">{{ t('domestic.qty') }}</span>
        <span class="col-amount">{{ t('domestic.amount') }}</span>
        <span class="col-buyer">{{ t('domestic.buyer') }}</span>
        <span class="col-status">{{ t('domestic.status') }}</span>
        <span class="col-time">{{ t('domestic.time') }}</span>
        <span class="col-actions">{{ t('domestic.actions') }}</span>
      </div>
      <div v-for="o in filteredOrders" :key="o.id" class="table-row" @click="showDetail(o)">
        <span class="col-platform">
          <span class="platform-badge" :style="{ background: platformInfo(o.platform).color + '15', color: platformInfo(o.platform).color }">
            {{ platformInfo(o.platform).icon }} {{ platformInfo(o.platform).shortName }}
          </span>
        </span>
        <span class="col-order">{{ o.orderNo }}</span>
        <span class="col-product" :title="o.productTitle">
          <div class="product-cell">
            <img :src="o.productImage" class="order-thumb" />
            <span class="product-name">{{ o.productTitle.length > 14 ? o.productTitle.slice(0, 14) + '…' : o.productTitle }}</span>
          </div>
        </span>
        <span class="col-qty">×{{ o.qty }}</span>
        <span class="col-amount money">{{ formatMoney(o.amount) }}</span>
        <span class="col-buyer">
          <img v-if="o.buyerAvatar" :src="o.buyerAvatar" class="buyer-avatar" />
          {{ o.buyer }}
        </span>
        <span class="col-status">
          <span class="status-tag" :style="{ background: statusLabel(o.status)?.color + '15', color: statusLabel(o.status)?.color }">
            {{ statusLabel(o.status)?.label }}
          </span>
        </span>
        <span class="col-time">{{ formatTime(o.createdAt) }}</span>
        <span class="col-actions" @click.stop>
          <button v-if="o.status === 'pending'" class="action-btn confirm" @click="confirmOrder(o.id)">{{ t('domestic.confirm') }}</button>
          <button v-if="o.status === 'confirmed'" class="action-btn ship" @click="shipOrder(o.id)">{{ t('domestic.ship') }}</button>
          <button v-if="o.status === 'shipped'" class="action-btn complete" @click="completeOrder(o.id)">{{ t('domestic.complete') }}</button>
          <button v-if="o.status === 'pending' || o.status === 'confirmed'" class="action-btn detail" @click="showDetail(o)">{{ t('domestic.detail') }}</button>
          <button v-if="o.status === 'shipped' || o.status === 'completed' || o.status === 'refunded'" class="action-btn detail" @click="showDetail(o)">{{ t('domestic.detail') }}</button>
        </span>
      </div>
      <div v-if="filteredOrders.length === 0" class="empty-row">
        {{ t('domestic.noOrders') }}
      </div>
    </div>

    </div><!-- /平台订单 -->

    <!-- 订单详情弹窗 -->
    <el-dialog :model-value="detailVisible" :title="t('domestic.orderDetail')" width="520px" class="order-detail-dialog" @update:model-value="closeDetail">
      <template v-if="detailOrder">
        <div class="detail-section">
          <div class="detail-row">
            <span class="dl">{{ t('domestic.platform') }}</span>
            <span class="dv">
              <span class="platform-badge" :style="{ background: platformInfo(detailOrder.platform).color + '15', color: platformInfo(detailOrder.platform).color }">
                {{ platformInfo(detailOrder.platform).icon }} {{ platformInfo(detailOrder.platform).name }}
              </span>
            </span>
          </div>
          <div class="detail-row">
            <span class="dl">{{ t('domestic.orderNo') }}</span>
            <span class="dv">{{ detailOrder.orderNo }}</span>
          </div>
          <div class="detail-row">
            <span class="dl">{{ t('domestic.status') }}</span>
            <span class="dv">
              <span class="status-tag" :style="{ background: statusLabel(detailOrder.status)?.color + '15', color: statusLabel(detailOrder.status)?.color }">
                {{ statusLabel(detailOrder.status)?.label }}
              </span>
            </span>
          </div>
        </div>
        <div class="detail-section">
          <div class="detail-product">
            <img :src="detailOrder.productImage" class="detail-thumb" />
            <div>
              <div class="dp-title">{{ detailOrder.productTitle }}</div>
              <div class="dp-cat">{{ categoryInfo(detailOrder.category).icon }} {{ categoryInfo(detailOrder.category).name }}</div>
              <div class="dp-price">{{ formatMoney(detailOrder.amount) }}（{{ t('domestic.qty') }} ×{{ detailOrder.qty }}）</div>
            </div>
          </div>
        </div>
        <div class="detail-section">
          <div class="detail-row">
            <span class="dl">{{ t('domestic.buyer') }}</span>
            <span class="dv">
              <img v-if="detailOrder.buyerAvatar" :src="detailOrder.buyerAvatar" class="buyer-avatar" />
              {{ detailOrder.buyer }}
            </span>
          </div>
          <div class="detail-row" v-if="detailOrder.buyerPhone">
            <span class="dl">{{ t('domestic.phone') }}</span>
            <span class="dv">{{ detailOrder.buyerPhone }}</span>
          </div>
          <div class="detail-row" v-if="detailOrder.address">
            <span class="dl">{{ t('domestic.address') }}</span>
            <span class="dv">{{ detailOrder.address }}</span>
          </div>
          <div class="detail-row" v-if="detailOrder.remark">
            <span class="dl">{{ t('domestic.remark') }}</span>
            <span class="dv remark">{{ detailOrder.remark }}</span>
          </div>
        </div>
        <div class="detail-section" v-if="detailOrder.trackingNo">
          <div class="detail-row">
            <span class="dl">{{ t('domestic.trackingNo') }}</span>
            <span class="dv">{{ detailOrder.trackingNo }}</span>
          </div>
          <div class="detail-row" v-if="detailOrder.carrier">
            <span class="dl">{{ t('domestic.carrier') }}</span>
            <span class="dv">{{ detailOrder.carrier }}</span>
          </div>
        </div>
        <div class="detail-actions" v-if="detailOrder && (detailOrder.status === 'pending' || detailOrder.status === 'confirmed')">
          <button v-if="detailOrder.status === 'pending'" class="action-btn confirm" @click="confirmOrder(detailOrder.id); closeDetail()">
            {{ t('domestic.confirm') }}
          </button>
          <button v-if="detailOrder.status === 'confirmed'" class="action-btn ship" @click="shipOrder(detailOrder.id); closeDetail()">
            {{ t('domestic.ship') }}
          </button>
        </div>
      </template>
    </el-dialog>

    <!-- 接单智能体订单详情弹窗（点击客户内容查看订单全部内容） -->
    <el-dialog
      v-model="agentDetailVisible"
      :title="t('portal.agent.detailTitle')"
      width="520px"
      class="agent-detail-dialog"
    >
      <template v-if="agentDetailOrder">
        <div class="agent-detail-head">
          <span v-if="agentDetailOrder.channel === 'overseas'" class="ao-country">
            {{ COUNTRY_FLAGS[agentDetailOrder.country] || '' }} {{ countryName(agentDetailOrder.country) }}
          </span>
          <span v-else class="agent-channel-badge" :style="channelStyle(agentDetailOrder.channel)">
            {{ channelName(agentDetailOrder.channel) }}
          </span>
          <el-tag v-if="agentDetailOrder.docType" size="small" effect="plain" class="agent-doc-tag">
            {{ bilingualLabel(agentDetailOrder.docType) }}
          </el-tag>
          <el-tag v-else-if="agentDetailOrder.isWholesale" size="small" type="warning" effect="plain">
            {{ t('portal.agent.orderWholesale') }}
          </el-tag>
        </div>

        <div class="detail-section">
          <div class="detail-row">
            <span class="dl">{{ t('portal.agent.orderNoLabel') }}</span>
            <span class="dv mono">{{ agentDetailOrder.orderNo }}</span>
          </div>
          <div class="detail-row">
            <span class="dl">{{ t('portal.agent.customerLabel') }}</span>
            <span class="dv">{{ agentDetailOrder.customerName }}</span>
          </div>
          <div class="detail-row">
            <span class="dl">{{ t('portal.agent.productLabel') }}</span>
            <span class="dv">{{ bilingualLabel(agentDetailOrder.productName) }}</span>
          </div>
        </div>
        <div class="detail-section">
          <div class="detail-row">
            <span class="dl">{{ t('portal.agent.quantity') }}</span>
            <span class="dv">{{ agentDetailOrder.quantity.toLocaleString() }} {{ agentDetailOrder.unit }}</span>
          </div>
          <div class="detail-row">
            <span class="dl">{{ t('portal.agent.amount') }}</span>
            <span class="dv money">{{ agentDetailOrder.currency }} {{ agentDetailOrder.amount.toLocaleString() }}</span>
          </div>
          <div class="detail-row">
            <span class="dl">{{ t('portal.agent.channelLabel') }}</span>
            <span class="dv">
              <span class="agent-channel-badge" :style="channelStyle(agentDetailOrder.channel)">
                {{ channelName(agentDetailOrder.channel) }}
              </span>
            </span>
          </div>
        </div>
        <div class="detail-section">
          <div class="detail-row">
            <span class="dl">{{ t('portal.agent.shipRequirement') }}</span>
            <span class="dv">{{ bilingualLabel(agentDetailOrder.shipRequirement) }}</span>
          </div>
          <div class="detail-row">
            <span class="dl">{{ t('portal.agent.qualityRequirement') }}</span>
            <span class="dv">{{ bilingualLabel(agentDetailOrder.qualityRequirement) }}</span>
          </div>
          <div class="detail-row">
            <span class="dl">{{ t('portal.agent.sample') }}</span>
            <span class="dv">
              <el-tag size="small" :type="agentDetailOrder.sample ? 'success' : 'info'" effect="plain">
                {{ agentDetailOrder.sample ? t('portal.agent.sampleYes') : t('portal.agent.sampleNo') }}
              </el-tag>
            </span>
          </div>
        </div>
        <div class="detail-section">
          <div class="detail-row">
            <span class="dl">{{ t('portal.agent.shipDate') }}</span>
            <span class="dv">{{ agentDetailOrder.shipDate }}</span>
          </div>
          <div class="detail-row">
            <span class="dl">{{ t('portal.agent.eta') }}</span>
            <span class="dv">{{ agentDetailOrder.eta }}</span>
          </div>
        </div>
      </template>

      <template #footer>
        <el-button size="small" @click="agentDetailVisible = false">
          {{ t('portal.agent.close') }}
        </el-button>
        <el-button
          v-if="agentDetailOrder && agentDetailOrder.status === 'pending'"
          size="small"
          type="primary"
          @click="acceptAgentDetail"
        >
          {{ t('portal.agent.accept') }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.order-manage {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px;
}
.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 20px;
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
.sim-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 18px;
  background: var(--color-accent);
  color: #fff;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}
.sim-btn:hover { opacity: 0.9; }

/* 订单来源页签 */
.source-tabs {
  display: flex;
  gap: 10px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}
.source-tab {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 10px 20px;
  border: 1.5px solid var(--color-border);
  border-radius: 999px;
  background: var(--color-bg-card);
  cursor: pointer;
  font-size: 14px;
  color: var(--color-text-regular);
  transition: all 0.2s;
}
.source-tab b { color: var(--color-primary); margin-left: 2px; }
.source-tab.active {
  border-color: var(--color-primary);
  color: var(--color-primary);
  background: rgba(26, 107, 92, 0.06);
  font-weight: 600;
}
.source-dot {
  position: absolute;
  top: 6px;
  right: 8px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #f56c6c;
  animation: source-blink 1.6s ease-in-out infinite;
}
@keyframes source-blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.35; }
}

/* 接单智能体订单 */
.agent-sync-tip {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 14px;
  padding: 10px 14px;
  border-radius: 10px;
  background: rgba(26, 107, 92, 0.06);
  border: 1px dashed rgba(26, 107, 92, 0.35);
  font-size: 13px;
  color: #1a6b5c;
}
.agent-order-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 16px;
}
.agent-load-more {
  display: flex;
  justify-content: center;
  padding: 6px 0 2px;
}
.agent-order-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 14px 16px;
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: 12px;
}
.agent-order-card.is-done { opacity: 0.62; }
.ao-top {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.ao-country { font-size: 14px; font-weight: 600; }
.ao-time {
  margin-left: auto;
  font-size: 12px;
  color: var(--color-text-secondary);
}
.ao-product { display: flex; align-items: baseline; gap: 10px; flex-wrap: wrap; }
.ao-no { font-size: 12px; font-family: monospace; color: var(--color-text-secondary); }
.ao-name { font-size: 14px; font-weight: 600; color: var(--color-text-primary); }

/* 渠道徽标（跨境 / 淘宝 / 拼多多 / 京东 / 抖音 / 快速订单） */
.agent-channel-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 10px;
  border: 1px solid;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
}
.agent-doc-tag { flex-shrink: 0; }

/* 客户内容可点击 → 查看订单详情 */
.agent-product-link {
  display: flex;
  align-items: baseline;
  gap: 10px;
  flex-wrap: wrap;
  padding: 0;
  border: none;
  background: transparent;
  cursor: pointer;
  text-align: left;
  font: inherit;
  transition: opacity 0.15s;
}
.agent-product-link:hover .ao-name { color: var(--color-primary); }
.agent-view-hint {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: 11px;
  color: var(--color-primary);
  opacity: 0.75;
}
.agent-customer {
  padding: 0;
  border: none;
  background: transparent;
  cursor: pointer;
  text-align: left;
  font-size: 13px;
  color: var(--color-text-regular);
}
.agent-customer b { color: var(--color-primary); font-weight: 600; }
.agent-customer:hover b { text-decoration: underline; }
.ao-foot-actions { display: flex; align-items: center; gap: 6px; }
.ao-foot-actions .action-btn { display: inline-flex; align-items: center; gap: 4px; }

/* agent 订单详情弹窗 */
.agent-detail-head {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--color-border);
  margin-bottom: 4px;
}
.agent-detail-dialog .dl { width: 96px; }
.agent-detail-dialog .dv.money { color: var(--color-primary); font-weight: 600; }
.agent-detail-dialog .dv.mono { font-family: monospace; }
.ao-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 10px;
}
.ao-field { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.ao-field label { font-size: 11px; color: var(--color-text-secondary); }
.ao-field span { font-size: 13px; color: var(--color-text-regular); word-break: break-word; }
.ao-amount { color: #b8860b; font-weight: 700; }
.ao-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.status-summary {
  display: flex;
  gap: 0;
  margin-bottom: 16px;
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  overflow: hidden;
}
.ss-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 14px;
  cursor: pointer;
  transition: background 0.15s;
  border-right: 1px solid var(--color-border);
}
.ss-item:last-child { border-right: none; }
.ss-item:hover { background: var(--color-bg-soft); }
.ss-item.active { background: var(--color-bg-soft); }
.ss-label { font-size: 12px; color: var(--color-text-secondary); }
.ss-value { font-size: 22px; font-weight: 700; color: var(--color-text-primary); }
.ss-value.pending { color: #E6A23C; }
.ss-value.confirmed { color: #409EFF; }
.ss-value.shipped { color: #67C23A; }
.ss-value.completed { color: #909399; }

.filter-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  align-items: center;
  margin-bottom: 16px;
  padding: 14px 16px;
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: 12px;
}
.filter-group { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
.filter-label { font-size: 13px; color: var(--color-text-secondary); white-space: nowrap; }
.filter-chip {
  padding: 4px 12px;
  border: 1px solid var(--color-border);
  background: transparent;
  border-radius: 999px;
  font-size: 13px;
  color: var(--color-text-regular);
  cursor: pointer;
  transition: all 0.2s;
}
.filter-chip:hover { border-color: var(--color-primary); color: var(--color-primary); }
.filter-chip.active {
  background: var(--color-primary);
  color: #fff;
  border-color: var(--color-primary);
}

.order-table {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  overflow: hidden;
}
.table-head {
  display: grid;
  grid-template-columns: 90px 130px 1fr 50px 100px 100px 80px 100px 140px;
  gap: 8px;
  padding: 12px 16px;
  background: var(--color-bg-soft);
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text-secondary);
}
.table-row {
  display: grid;
  grid-template-columns: 90px 130px 1fr 50px 100px 100px 80px 100px 140px;
  gap: 8px;
  padding: 12px 16px;
  border-top: 1px solid var(--color-border);
  font-size: 13px;
  align-items: center;
  cursor: pointer;
  transition: background 0.15s;
}
.table-row:hover { background: var(--color-bg-soft); }
.platform-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
}
.product-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}
.order-thumb {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  object-fit: cover;
  flex-shrink: 0;
}
.product-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.money { color: var(--color-primary); font-weight: 600; }
.buyer-avatar {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  vertical-align: middle;
}
.status-tag {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
}
.action-btn {
  padding: 4px 10px;
  border: 1px solid;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
  background: transparent;
  transition: all 0.15s;
  margin-right: 4px;
}
.action-btn.confirm { color: #E6A23C; border-color: #E6A23C; }
.action-btn.confirm:hover { background: #E6A23C; color: #fff; }
.action-btn.ship { color: #409EFF; border-color: #409EFF; }
.action-btn.ship:hover { background: #409EFF; color: #fff; }
.action-btn.complete { color: #67C23A; border-color: #67C23A; }
.action-btn.complete:hover { background: #67C23A; color: #fff; }
.action-btn.detail { color: var(--color-text-regular); border-color: var(--color-border); }
.action-btn.detail:hover { background: var(--color-bg-soft); }
.empty-row {
  padding: 60px 16px;
  text-align: center;
  color: var(--color-text-secondary);
  font-size: 14px;
}

/* 详情弹窗 */
.detail-section {
  padding: 12px 0;
  border-bottom: 1px solid var(--color-border);
}
.detail-section:last-child { border-bottom: none; }
.detail-row {
  display: flex;
  gap: 16px;
  margin-bottom: 10px;
}
.detail-row:last-child { margin-bottom: 0; }
.dl {
  width: 80px;
  font-size: 13px;
  color: var(--color-text-secondary);
  flex-shrink: 0;
}
.dv {
  font-size: 14px;
  color: var(--color-text-primary);
  flex: 1;
}
.dv.remark { color: #E6A23C; }
.detail-product {
  display: flex;
  gap: 12px;
}
.detail-thumb {
  width: 60px;
  height: 60px;
  border-radius: 8px;
  object-fit: cover;
}
.dp-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text-primary);
  margin-bottom: 4px;
}
.dp-cat {
  font-size: 12px;
  color: var(--color-text-secondary);
  margin-bottom: 4px;
}
.dp-price {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-primary);
}
.detail-actions {
  display: flex;
  gap: 10px;
  padding-top: 12px;
}
.detail-actions .action-btn {
  padding: 8px 20px;
  font-size: 14px;
}

@media (max-width: 768px) {
  .table-head, .table-row {
    grid-template-columns: 1fr;
    gap: 4px;
  }
  .status-summary { flex-direction: column; }
  .ss-item { border-right: none; border-bottom: 1px solid var(--color-border); }
}
</style>
