<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import type { Product, SocialAppId } from '@/types'
import { useCartStore } from '@/stores/cart'
import { useAppStore } from '@/stores/app'
import { useSocialStore } from '@/stores/social'
import { COUNTRY_SOCIAL_MAP, SOCIAL_APP_MAP, productMarket } from '@/mock/socialData'
import { tText } from '@/i18n'
import { localizePrice, localizeNumber } from '@/utils/numbers'

const props = defineProps<{
  product: Product
}>()

const router = useRouter()
const { t, locale } = useI18n()
const cartStore = useCartStore()
const appStore = useAppStore()
const social = useSocialStore()

const name = computed(() => tText(props.product.name, locale.value as any))
const desc = computed(() => tText(props.product.description, locale.value as any))

const price = computed(() => appStore.convertPrice(props.product.price))
const originalPrice = computed(() => {
  if (!props.product.originalPrice) return null
  return appStore.convertPrice(props.product.originalPrice)
})
const priceText = computed(() => localizePrice(price.value.value, price.value.symbol, locale.value))
const originalPriceText = computed(() =>
  originalPrice.value ? localizePrice(originalPrice.value.value, originalPrice.value.symbol, locale.value) : '',
)

const salesText = computed(() => {
  const s = props.product.sales
  if (s >= 1000) return localizeNumber(Math.floor(s / 100) / 10, locale.value) + 'k'
  return localizeNumber(s, locale.value)
})

const isLowStock = computed(() => props.product.stock > 0 && props.product.stock <= 20)
const isNew = computed(() => props.product.tags.includes('new'))

// 按客户国家同步主流社交软件到商品（优先侧栏选择的国家，否则用商品主销市场）
const market = computed(() => {
  const matched = COUNTRY_SOCIAL_MAP.find((x) => x.code === social.state.matchCountry)
  return matched || productMarket(props.product.id)
})
const marketApps = computed(() => market.value.apps.slice(0, 2))

function appName(id: SocialAppId): string { return tText(SOCIAL_APP_MAP[id].name, locale.value as any) }
function appColorOf(id: SocialAppId): string { return SOCIAL_APP_MAP[id].color }

function openChat(app: SocialAppId, e: Event) {
  e.stopPropagation()
  social.openChat(app, props.product)
}

function goDetail() {
  router.push(`/shop/${props.product.slug}`)
}

function quickAdd(e: Event) {
  e.stopPropagation()
  cartStore.addToCart(props.product)
  ElMessage.success(t('shop.addToCartSuccess'))
}

function buyNow(e: Event) {
  e.stopPropagation()
  cartStore.addToCart(props.product)
  router.push('/checkout')
}
</script>

<template>
  <div class="product-card qh-card" @click="goDetail">
    <div class="product-image">
      <img :src="product.image" :alt="name" loading="lazy" />
      <div v-if="product.originalPrice" class="discount-badge">
        -{{ localizeNumber(Math.round((1 - product.price / product.originalPrice) * 100), locale) }}%
      </div>
      <div v-if="isNew" class="new-badge">NEW</div>
      <div class="card-actions">
        <button class="action-btn cart" @click="quickAdd" :title="t('common.addToCart')">
          <el-icon><ShoppingCart /></el-icon>
        </button>
        <button class="action-btn buy" @click="buyNow" :title="t('common.buyNow')">
          <el-icon><Promotion /></el-icon>
        </button>
      </div>
    </div>
    <div class="product-info">
      <h3 class="product-name" :title="name">{{ name }}</h3>
      <p class="product-desc">{{ desc }}</p>
      <div class="market-social-row" :title="t('social.contactVia')">
        <span class="market-flag">{{ market.flag }}</span>
        <button
          v-for="a in marketApps"
          :key="a"
          class="market-app"
          :style="{ color: appColorOf(a), borderColor: appColorOf(a) + '66', background: appColorOf(a) + '0f' }"
          @click="openChat(a, $event)"
        >
          <span class="market-app-dot" :style="{ background: appColorOf(a) }"></span>{{ appName(a) }}
        </button>
      </div>
      <div class="product-meta">
        <div class="rating-row">
          <el-icon><StarFilled /></el-icon>
          <span>{{ localizeNumber(product.rating, locale) }}</span>
          <span class="review-count">({{ localizeNumber(product.reviewCount, locale) }})</span>
          <span class="sales-text">{{ t('shop.salesLabel') }} {{ salesText }}</span>
        </div>
        <div class="price">
          <span class="current">{{ priceText }}</span>
          <span v-if="originalPrice" class="original">{{ originalPriceText }}</span>
        </div>
        <div v-if="isLowStock" class="low-stock">{{ t('shop.stockLow') }}</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.product-card {
  cursor: pointer;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
.product-image {
  position: relative;
  aspect-ratio: 1;
  overflow: hidden;
  background: var(--color-bg-soft);
}
.product-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}
.product-card:hover .product-image img {
  transform: scale(1.06);
}
.discount-badge {
  position: absolute;
  top: 10px;
  left: 10px;
  padding: 3px 10px;
  background: var(--color-danger);
  color: #fff;
  font-size: 12px;
  font-weight: 600;
  border-radius: 999px;
}
.new-badge {
  position: absolute;
  top: 10px;
  right: 10px;
  padding: 2px 8px;
  background: var(--color-success);
  color: #fff;
  font-size: 11px;
  font-weight: 600;
  border-radius: 4px;
}
.card-actions {
  position: absolute;
  bottom: 10px;
  right: 10px;
  display: flex;
  gap: 6px;
  opacity: 0;
  transform: translateY(8px);
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}
.product-card:hover .card-actions {
  opacity: 1;
  transform: translateY(0);
}
.action-btn {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}
.action-btn.cart {
  background: var(--color-primary);
  color: #fff;
}
.action-btn.cart:hover {
  background: var(--color-primary-light);
}
.action-btn.buy {
  background: var(--color-accent);
  color: #fff;
}
.action-btn.buy:hover {
  opacity: 0.85;
}
.product-info {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
}
.product-name {
  font-size: 15px;
  font-weight: 600;
  margin: 0;
  color: var(--color-text-primary);
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.product-desc {
  font-size: 13px;
  color: var(--color-text-secondary);
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.5;
  flex: 1;
}
.market-social-row {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}
.market-flag {
  font-size: 14px;
}
.market-app {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 9px;
  font-size: 11px;
  font-weight: 500;
  border: 1px solid;
  border-radius: 999px;
  cursor: pointer;
  transition: transform 0.15s;
}
.market-app:hover {
  transform: translateY(-1px);
}
.market-app-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
}
.product-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: auto;
}
.rating-row {
  display: flex;
  align-items: center;
  gap: 3px;
  font-size: 12px;
  color: var(--color-text-regular);
  flex-wrap: wrap;
}
.rating-row .el-icon {
  color: var(--color-accent);
  font-size: 13px;
}
.review-count {
  color: var(--color-text-secondary);
}
.sales-text {
  color: var(--color-text-secondary);
  margin-left: 4px;
}
.low-stock {
  font-size: 11px;
  color: var(--color-danger);
  font-weight: 500;
  margin-top: 2px;
}
.price {
  display: flex;
  align-items: baseline;
  gap: 6px;
}
.current {
  font-size: 18px;
  font-weight: 700;
  color: var(--color-primary);
}
.original {
  font-size: 12px;
  color: var(--color-text-secondary);
  text-decoration: line-through;
}
</style>
