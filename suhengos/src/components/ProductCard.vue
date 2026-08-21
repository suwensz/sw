<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import type { Product } from '@/types'
import { useCartStore } from '@/stores/cart'
import { useAppStore } from '@/stores/app'
import { tText } from '@/i18n'
import { localizePrice, localizeNumber } from '@/utils/numbers'

const props = defineProps<{
  product: Product
}>()

const router = useRouter()
const { locale } = useI18n()
const cartStore = useCartStore()
const appStore = useAppStore()

const name = computed(() => tText(props.product.name, locale.value as any))
const desc = computed(() => tText(props.product.description, locale.value as any))

const price = computed(() => {
  return appStore.convertPrice(props.product.price)
})
const originalPrice = computed(() => {
  if (!props.product.originalPrice) return null
  return appStore.convertPrice(props.product.originalPrice)
})
const priceText = computed(() => localizePrice(price.value.value, price.value.symbol, locale.value))
const originalPriceText = computed(() =>
  originalPrice.value ? localizePrice(originalPrice.value.value, originalPrice.value.symbol, locale.value) : '',
)

function goDetail() {
  router.push(`/shop/${props.product.slug}`)
}

function quickAdd(e: Event) {
  e.stopPropagation()
  cartStore.addToCart(props.product)
  ElMessage.success('Added to cart')
}
</script>

<template>
  <div class="product-card qh-card" @click="goDetail">
    <div class="product-image">
      <img :src="product.image" :alt="name" loading="lazy" />
      <div v-if="product.originalPrice" class="discount-badge">
        -{{ localizeNumber(Math.round((1 - product.price / product.originalPrice) * 100), locale) }}%
      </div>
      <button class="quick-add" @click="quickAdd">
        <el-icon><ShoppingCart /></el-icon>
      </button>
    </div>
    <div class="product-info">
      <h3 class="product-name" :title="name">{{ name }}</h3>
      <p class="product-desc">{{ desc }}</p>
      <div class="product-meta">
        <div class="rating">
          <el-icon><StarFilled /></el-icon>
          <span>{{ localizeNumber(product.rating, locale) }}</span>
          <span class="review-count">({{ localizeNumber(product.reviewCount, locale) }})</span>
        </div>
        <div class="price">
          <span class="current">{{ priceText }}</span>
          <span v-if="originalPrice" class="original">{{ originalPriceText }}</span>
        </div>
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
.quick-add {
  position: absolute;
  bottom: 10px;
  right: 10px;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  background: var(--color-primary);
  color: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transform: translateY(8px);
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}
.product-card:hover .quick-add {
  opacity: 1;
  transform: translateY(0);
}
.quick-add:hover {
  background: var(--color-primary-light);
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
.product-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: auto;
}
.rating {
  display: flex;
  align-items: center;
  gap: 3px;
  font-size: 13px;
  color: var(--color-text-regular);
}
.rating .el-icon {
  color: var(--color-accent);
}
.review-count {
  color: var(--color-text-secondary);
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
