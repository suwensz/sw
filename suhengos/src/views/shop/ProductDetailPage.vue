<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import { mockProducts } from '@/mock/products'
import { useCartStore } from '@/stores/cart'
import { useAppStore } from '@/stores/app'
import { tText } from '@/i18n'
import { localizePrice, localizeNumber } from '@/utils/numbers'
import ProductCard from '@/components/ProductCard.vue'

const router = useRouter()
const route = useRoute()
const { t, locale } = useI18n()
const cartStore = useCartStore()
const appStore = useAppStore()

const slug = computed(() => route.params.slug as string)
const product = computed(() => mockProducts.find((p) => p.slug === slug.value))

const quantity = ref(1)
const activeTab = ref('description')

const price = computed(() => {
  if (!product.value) return { value: 0, symbol: '$' }
  return appStore.convertPrice(product.value.price)
})
const originalPrice = computed(() => {
  if (!product.value?.originalPrice) return null
  return appStore.convertPrice(product.value.originalPrice)
})
const priceText = computed(() => localizePrice(price.value.value, price.value.symbol, locale.value))
const originalPriceText = computed(() =>
  originalPrice.value ? localizePrice(originalPrice.value.value, originalPrice.value.symbol, locale.value) : '',
)

const relatedProducts = computed(() => {
  if (!product.value) return []
  return mockProducts
    .filter((p) => p.id !== product.value!.id && p.category === product.value!.category)
    .slice(0, 4)
})

function addToCart() {
  if (product.value) {
    cartStore.addToCart(product.value, quantity.value)
    ElMessage.success(t('shop.addToCartSuccess'))
  }
}

function buyNow() {
  if (product.value) {
    cartStore.addToCart(product.value, quantity.value)
    router.push('/checkout')
  }
}

const tabs = computed(() => [
  { key: 'description', label: t('shop.productDescription') },
  { key: 'ingredients', label: t('shop.ingredients') },
  { key: 'usage', label: t('shop.usage') },
])
</script>

<template>
  <div class="product-detail-page qh-container" v-if="product">
    <!-- 面包屑 -->
    <div class="breadcrumb">
      <router-link to="/">{{ t('nav.home') }}</router-link>
      <el-icon><ArrowRight /></el-icon>
      <router-link to="/shop">{{ t('nav.shop') }}</router-link>
      <el-icon><ArrowRight /></el-icon>
      <span class="current">{{ tText(product.name, locale as any) }}</span>
    </div>

    <div class="detail-layout">
      <!-- 图片区 -->
      <div class="detail-gallery">
        <div class="main-image qh-card">
          <img :src="product.image" :alt="tText(product.name, locale as any)" />
          <div v-if="product.originalPrice" class="discount-tag">
            -{{ localizeNumber(Math.round((1 - product.price / product.originalPrice) * 100), locale) }}%
          </div>
        </div>
      </div>

      <!-- 信息区 -->
      <div class="detail-info">
        <h1 class="product-title">{{ tText(product.name, locale as any) }}</h1>
        <p class="product-short-desc">{{ tText(product.description, locale as any) }}</p>

        <div class="product-rating">
          <el-rate :model-value="product.rating" disabled show-score text-color="#ff9900" />
          <span class="review-count">{{ localizeNumber(product.reviewCount, locale) }} {{ t('shop.reviews') }}</span>
          <span class="stock" :class="{ 'out': product.stock === 0 }">
            <el-icon><CircleCheckFilled v-if="product.stock > 0" /><CircleCloseFilled v-else /></el-icon>
            {{ product.stock > 0 ? t('common.inStock') : t('common.outOfStock') }}
          </span>
        </div>

        <div class="price-block">
          <span class="current-price">{{ priceText }}</span>
          <span v-if="originalPrice" class="original-price">{{ originalPriceText }}</span>
          <span v-if="product.tags.includes('bestseller')" class="tag-badge bestseller">Bestseller</span>
          <span v-if="product.tags.includes('organic')" class="tag-badge organic">Organic</span>
        </div>

        <div class="product-meta-row">
          <span class="meta-label">{{ t('shop.categories') }}:</span>
          <el-tag size="small" effect="plain">{{ t('shop.category' + product.category.charAt(0).toUpperCase() + product.category.slice(1)) }}</el-tag>
        </div>

        <!-- 数量 -->
        <div class="quantity-row">
          <span class="meta-label">{{ t('cart.quantity') }}:</span>
          <el-input-number v-model="quantity" :min="1" :max="product.stock" />
        </div>

        <!-- 操作按钮 -->
        <div class="action-buttons">
          <button class="btn-cart" @click="addToCart">
            <el-icon><ShoppingCart /></el-icon>
            {{ t('common.addToCart') }}
          </button>
          <button class="btn-buy" @click="buyNow">
            {{ t('common.buyNow') }}
          </button>
        </div>

        <!-- 服务保障 -->
        <div class="service-guarantees">
          <div class="guarantee">
            <el-icon><Van /></el-icon>
            <span>{{ t('common.freeShipping') }}</span>
          </div>
          <div class="guarantee">
            <el-icon><RefreshLeft /></el-icon>
            <span>30 {{ t('footer.returns') }}</span>
          </div>
          <div class="guarantee">
            <el-icon><CircleCheck /></el-icon>
            <span>100% Authentic</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 详情标签页 -->
    <div class="detail-tabs qh-card">
      <div class="tabs-header">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          :class="['tab-btn', { active: activeTab === tab.key }]"
          @click="activeTab = tab.key"
        >
          {{ tab.label }}
        </button>
      </div>
      <div class="tab-content">
        <template v-if="activeTab === 'description'">
          <p>{{ tText(product.detail, locale as any) }}</p>
        </template>
        <template v-else-if="activeTab === 'ingredients'">
          <p>{{ tText(product.ingredients, locale as any) }}</p>
        </template>
        <template v-else>
          <p>{{ tText(product.usage, locale as any) }}</p>
        </template>
      </div>
    </div>

    <!-- 相关推荐 -->
    <div v-if="relatedProducts.length > 0" class="related-section">
      <h2>{{ t('shop.relatedProducts') }}</h2>
      <div class="related-grid">
        <ProductCard v-for="p in relatedProducts" :key="p.id" :product="p" />
      </div>
    </div>
  </div>

  <div v-else class="not-found qh-container">
    <el-result icon="warning" title="404" sub-title="Product not found">
      <template #extra>
        <el-button type="primary" @click="router.push('/shop')">{{ t('nav.shop') }}</el-button>
      </template>
    </el-result>
  </div>
</template>

<style scoped>
.product-detail-page {
  padding: 24px 48px 48px;
}
.breadcrumb {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--color-text-secondary);
  margin-bottom: 20px;
}
.breadcrumb a {
  color: var(--color-text-regular);
  transition: color 0.2s;
}
.breadcrumb a:hover {
  color: var(--color-primary);
}
.breadcrumb .current {
  color: var(--color-primary);
}
.detail-layout {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 40px;
  margin-bottom: 40px;
}
.main-image {
  position: relative;
  overflow: hidden;
  aspect-ratio: 1;
}
.main-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.discount-tag {
  position: absolute;
  top: 16px;
  left: 16px;
  padding: 6px 14px;
  background: var(--color-danger);
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  border-radius: 8px;
}
.product-title {
  font-size: 28px;
  font-weight: 600;
  margin: 0 0 10px;
  line-height: 1.3;
}
.product-short-desc {
  font-size: 15px;
  color: var(--color-text-regular);
  line-height: 1.7;
  margin: 0 0 20px;
}
.product-rating {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 24px;
}
.review-count {
  font-size: 13px;
  color: var(--color-text-secondary);
}
.stock {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: var(--color-success);
}
.stock.out {
  color: var(--color-danger);
}
.price-block {
  display: flex;
  align-items: baseline;
  gap: 14px;
  padding: 20px;
  background: var(--color-bg-soft);
  border-radius: 12px;
  margin-bottom: 24px;
}
.current-price {
  font-size: 34px;
  font-weight: 700;
  color: var(--color-primary);
}
.original-price {
  font-size: 16px;
  color: var(--color-text-secondary);
  text-decoration: line-through;
}
.tag-badge {
  padding: 3px 10px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
}
.tag-badge.bestseller {
  background: rgba(212, 168, 83, 0.15);
  color: var(--color-accent);
}
.tag-badge.organic {
  background: rgba(82, 166, 122, 0.15);
  color: var(--color-success);
}
.product-meta-row,
.quantity-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 18px;
}
.meta-label {
  font-size: 14px;
  color: var(--color-text-secondary);
  min-width: 80px;
}
.action-buttons {
  display: flex;
  gap: 12px;
  margin: 28px 0;
}
.btn-cart,
.btn-buy {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: 50px;
  border-radius: 10px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}
.btn-cart {
  background: var(--color-bg-soft);
  color: var(--color-primary);
  border: 1px solid var(--color-primary);
}
.btn-cart:hover {
  background: rgba(26, 107, 92, 0.08);
}
.btn-buy {
  background: var(--color-primary);
  color: #fff;
}
.btn-buy:hover {
  background: var(--color-primary-light);
}
.service-guarantees {
  display: flex;
  gap: 24px;
  padding-top: 20px;
  border-top: 1px solid var(--color-border);
}
.guarantee {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--color-text-regular);
}
.guarantee .el-icon {
  color: var(--color-primary);
}
.detail-tabs {
  padding: 0;
  margin-bottom: 40px;
  overflow: hidden;
}
.tabs-header {
  display: flex;
  border-bottom: 1px solid var(--color-border);
}
.tab-btn {
  padding: 16px 28px;
  border: none;
  background: none;
  font-size: 15px;
  color: var(--color-text-regular);
  cursor: pointer;
  position: relative;
  transition: color 0.2s;
}
.tab-btn:hover {
  color: var(--color-primary);
}
.tab-btn.active {
  color: var(--color-primary);
  font-weight: 600;
}
.tab-btn.active::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--color-primary);
}
.tab-content {
  padding: 28px;
}
.tab-content p {
  font-size: 15px;
  line-height: 1.9;
  color: var(--color-text-regular);
  margin: 0;
}
.related-section h2 {
  font-size: 22px;
  font-weight: 600;
  margin: 0 0 20px;
}
.related-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}
@media (max-width: 1024px) {
  .detail-layout {
    grid-template-columns: 1fr;
    gap: 24px;
  }
  .related-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
@media (max-width: 768px) {
  .product-detail-page {
    padding: 16px;
  }
  .product-title {
    font-size: 22px;
  }
  .action-buttons {
    flex-direction: column;
  }
  .service-guarantees {
    flex-wrap: wrap;
    gap: 12px;
  }
}
</style>
