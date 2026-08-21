<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { mockProducts } from '@/mock/products'
import ProductCard from '@/components/ProductCard.vue'
import { tText } from '@/i18n'
import { localizeNumber } from '@/utils/numbers'
import { useSocialStore } from '@/stores/social'
import { COUNTRY_SOCIAL_MAP, SOCIAL_APP_MAP } from '@/mock/socialData'
import { useSellerStore } from '@/stores/seller'
import type { SocialAppId, Product } from '@/types'

const router = useRouter()
const { t, locale } = useI18n()
const social = useSocialStore()
const seller = useSellerStore()

// 合并官方商品 + 卖家上架商品
const allProducts = computed<Product[]>(() => [...mockProducts, ...seller.products])

// ===== 分类体系 =====
const categories = computed(() => [
  { id: 'all', label: t('shop.categoryAll'), icon: '🛒', color: '#1a6b5c' },
  { id: 'health_tonic', label: t('shop.categoryHealthTonic'), icon: '💊', color: '#e8743b' },
  { id: 'food_tea', label: t('shop.categoryFoodTea'), icon: '🍵', color: '#52a67a' },
  { id: 'beauty', label: t('shop.categoryBeauty'), icon: '💄', color: '#d4a853' },
  { id: 'home_living', label: t('shop.categoryHomeLiving'), icon: '🏠', color: '#5b8def' },
  { id: 'fashion', label: t('shop.categoryFashion'), icon: '👗', color: '#c065a4' },
  { id: 'electronics', label: t('shop.categoryElectronics'), icon: '📱', color: '#4a90d9' },
  { id: 'outdoor', label: t('shop.categoryOutdoor'), icon: '⛺', color: '#3d9970' },
  { id: 'crafts', label: t('shop.categoryCrafts'), icon: '🎨', color: '#9b59b6' },
])

// ===== 社交匹配 =====
const matchInfo = computed(() => {
  const c = COUNTRY_SOCIAL_MAP.find((x) => x.code === social.state.matchCountry)
  return c ? { country: c, apps: c.apps.slice(0, 3) } : null
})

const countryOptions = COUNTRY_SOCIAL_MAP.map((c) => ({
  value: c.code,
  label: `${c.flag} ${tText(c.name)}`,
}))

function appName(id: SocialAppId): string { return tText(SOCIAL_APP_MAP[id].name) }
function appColor(id: SocialAppId): string { return SOCIAL_APP_MAP[id].color }

// ===== 筛选与排序 =====
const searchQuery = ref('')
const selectedCategory = ref('all')
const sortBy = ref('default')
const priceRange = ref<[number, number]>([1, 1000])

const sortOptions = computed(() => [
  { value: 'default', label: t('shop.sortDefault') },
  { value: 'price-asc', label: t('shop.sortPriceAsc') },
  { value: 'price-desc', label: t('shop.sortPriceDesc') },
  { value: 'rating', label: t('shop.sortRating') },
  { value: 'sales', label: t('shop.sortSales') },
  { value: 'newest', label: t('shop.sortNewest') },
])

const filteredProducts = computed(() => {
  let result = [...allProducts.value]
  if (selectedCategory.value !== 'all') {
    result = result.filter((p) => p.category === selectedCategory.value)
  }
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    result = result.filter(
      (p) =>
        tText(p.name, locale.value as any).toLowerCase().includes(q) ||
        tText(p.description, locale.value as any).toLowerCase().includes(q),
    )
  }
  result = result.filter(
    (p) => p.price >= priceRange.value[0] && p.price <= priceRange.value[1],
  )
  switch (sortBy.value) {
    case 'price-asc': result.sort((a, b) => a.price - b.price); break
    case 'price-desc': result.sort((a, b) => b.price - a.price); break
    case 'rating': result.sort((a, b) => b.rating - a.rating); break
    case 'sales': result.sort((a, b) => b.sales - a.sales); break
    case 'newest': result.sort((a, b) => b.id.localeCompare(a.id)); break
  }
  return result
})

// ===== 限时促销（有折扣的商品） =====
const flashSaleProducts = computed(() =>
  allProducts.value.filter((p) => p.originalPrice).slice(0, 6),
)

// ===== 热销排行 Top5 =====
const hotRanking = computed(() =>
  [...allProducts.value].sort((a, b) => b.sales - a.sales).slice(0, 5),
)

// ===== 新品上架 =====
const newArrivals = computed(() =>
  [...allProducts.value].sort((a, b) => b.id.localeCompare(a.id)).slice(0, 4),
)

// ===== Banner 轮播 =====
const banners = computed(() => [
  { title: t('shop.bannerTitle1'), sub: t('shop.bannerSub1'), bg: 'linear-gradient(135deg, #1a6b5c 0%, #2d8a76 50%, #52a67a 100%)' },
  { title: t('shop.bannerTitle2'), sub: t('shop.bannerSub2'), bg: 'linear-gradient(135deg, #e8743b 0%, #f0a050 50%, #d4a853 100%)' },
  { title: t('shop.bannerTitle3'), sub: t('shop.bannerSub3'), bg: 'linear-gradient(135deg, #9b59b6 0%, #c065a4 50%, #d4a853 100%)' },
])

function selectCategory(catId: string) {
  selectedCategory.value = catId
  // 滚动到商品列表区域
  const el = document.querySelector('.product-grid-section')
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function resetFilters() {
  searchQuery.value = ''
  selectedCategory.value = 'all'
  sortBy.value = 'default'
  priceRange.value = [1, 1000]
}

function goSell() {
  router.push('/sell')
}
</script>

<template>
  <div class="market-page qh-container">
    <!-- Banner 轮播 -->
    <div class="banner-section">
      <el-carousel height="260px" :interval="4000" arrow="hover" indicator-position="outside">
        <el-carousel-item v-for="(b, i) in banners" :key="i">
          <div class="banner-slide" :style="{ background: b.bg }">
            <div class="banner-content">
              <h2 class="banner-title">{{ b.title }}</h2>
              <p class="banner-sub">{{ b.sub }}</p>
              <div class="banner-actions">
                <button class="banner-btn primary" @click="selectCategory('all')">{{ t('shop.shopNow') }}</button>
                <button class="banner-btn ghost" @click="goSell">{{ t('shop.sellNow') }}</button>
              </div>
            </div>
            <div class="banner-deco"></div>
          </div>
        </el-carousel-item>
      </el-carousel>
    </div>

    <!-- 分类导航卡 -->
    <div class="category-cards">
      <button
        v-for="cat in categories"
        :key="cat.id"
        :class="['cat-card', { active: selectedCategory === cat.id }]"
        @click="selectCategory(cat.id)"
      >
        <span class="cat-icon" :style="{ background: cat.color + '15' }">{{ cat.icon }}</span>
        <span class="cat-label">{{ cat.label }}</span>
      </button>
    </div>

    <!-- 限时促销 -->
    <div v-if="flashSaleProducts.length > 0" class="flash-section">
      <div class="section-header">
        <h2 class="section-title">
          <span class="title-icon">⚡</span>{{ t('shop.flashSale') }}
        </h2>
        <span class="flash-timer">限时折扣</span>
      </div>
      <div class="flash-scroll">
        <div v-for="p in flashSaleProducts" :key="p.id" class="flash-item" @click="router.push(`/shop/${p.slug}`)">
          <div class="flash-img">
            <img :src="p.image" :alt="tText(p.name, locale as any)" loading="lazy" />
            <span class="flash-discount">
              -{{ localizeNumber(Math.round((1 - p.price / (p.originalPrice || p.price)) * 100), locale) }}%
            </span>
          </div>
          <div class="flash-info">
            <p class="flash-name">{{ tText(p.name, locale as any) }}</p>
            <div class="flash-price">
              <span class="now">${{ localizeNumber(p.price, locale) }}</span>
              <span class="was">${{ localizeNumber(p.originalPrice || 0, locale) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 热销排行 + 新品上架 -->
    <div class="dual-section">
      <!-- 热销排行 -->
      <div class="hot-section">
        <div class="section-header">
          <h2 class="section-title"><span class="title-icon">🔥</span>{{ t('shop.hotRanking') }}</h2>
        </div>
        <div class="hot-list">
          <div
            v-for="(p, i) in hotRanking"
            :key="p.id"
            class="hot-item"
            @click="router.push(`/shop/${p.slug}`)"
          >
            <span :class="['hot-rank', { top: i < 3 }]">{{ i + 1 }}</span>
            <img :src="p.image" class="hot-img" :alt="tText(p.name, locale as any)" loading="lazy" />
            <div class="hot-info">
              <p class="hot-name">{{ tText(p.name, locale as any) }}</p>
              <div class="hot-meta">
                <span class="hot-price">${{ localizeNumber(p.price, locale) }}</span>
                <span class="hot-sales">{{ t('shop.salesLabel') }} {{ localizeNumber(p.sales, locale) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 新品上架 -->
      <div class="new-section">
        <div class="section-header">
          <h2 class="section-title"><span class="title-icon">✨</span>{{ t('shop.newArrivals') }}</h2>
        </div>
        <div class="new-grid">
          <ProductCard v-for="p in newArrivals" :key="p.id" :product="p" />
        </div>
      </div>
    </div>

    <!-- 商品列表区 -->
    <div class="product-grid-section">
      <div class="market-layout">
        <!-- 侧边栏 -->
        <aside class="market-sidebar">
          <div class="filter-section">
            <h3>{{ t('shop.priceRange') }}</h3>
            <el-slider
              v-model="priceRange"
              range
              :max="1000"
              :min="1"
              :step="1"
              :format-tooltip="(v: number) => '$' + localizeNumber(v, locale)"
            />
            <div class="price-display">
              <span>${{ localizeNumber(priceRange[0], locale) }}</span>
              <span>${{ localizeNumber(priceRange[1], locale) }}</span>
            </div>
          </div>

          <div class="filter-section">
            <h3>{{ t('social.matchTitle') }}</h3>
            <el-select :model-value="social.state.matchCountry" style="width: 100%" size="small" @update:model-value="(v: any) => social.setMatchCountry(v)">
              <el-option v-for="o in countryOptions" :key="o.value" :value="o.value" :label="o.label" />
            </el-select>
            <div v-if="matchInfo" class="match-apps">
              <button
                v-for="app in matchInfo.apps"
                :key="app"
                class="match-app-chip"
                :style="{ background: appColor(app) + '15', color: appColor(app) }"
                @click="social.openChat(app)"
              >
                <span class="chip-dot" :style="{ background: appColor(app) }"></span>{{ appName(app) }}
              </button>
            </div>
            <p class="match-hint">{{ t('social.matchHint') }}</p>
          </div>

          <el-button type="primary" class="sell-btn" @click="goSell">
            <el-icon><Sell /></el-icon>{{ t('shop.sellNow') }}
          </el-button>

          <el-button plain class="reset-btn" @click="resetFilters">
            {{ t('shop.clearFilters') }}
          </el-button>
        </aside>

        <!-- 商品网格 -->
        <main class="market-main">
          <div class="shop-toolbar">
            <el-input
              v-model="searchQuery"
              :placeholder="t('common.searchPlaceholder')"
              :prefix-icon="'Search'"
              clearable
              class="search-input"
            />
            <el-select v-model="sortBy" class="sort-select">
              <el-option
                v-for="opt in sortOptions"
                :key="opt.value"
                :label="opt.label"
                :value="opt.value"
              />
            </el-select>
          </div>

          <div class="result-bar">
            <span class="result-count">
              {{ localizeNumber(filteredProducts.length, locale) }} {{ t('shop.categories') }}
            </span>
            <span v-if="selectedCategory !== 'all'" class="active-cat">
              {{ categories.find((c) => c.id === selectedCategory)?.label }}
            </span>
          </div>

          <div v-if="filteredProducts.length > 0" class="products-grid">
            <ProductCard v-for="p in filteredProducts" :key="p.id" :product="p" />
          </div>
          <div v-else class="empty-state">
            <el-icon :size="48"><Box /></el-icon>
            <p>{{ t('shop.noProducts') }}</p>
            <el-button type="primary" @click="resetFilters">{{ t('shop.clearFilters') }}</el-button>
          </div>
        </main>
      </div>
    </div>
  </div>
</template>

<style scoped>
.market-page {
  padding: 20px 48px 48px;
  max-width: 1400px;
  margin: 0 auto;
}

/* ===== Banner ===== */
.banner-section {
  margin-bottom: 24px;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}
.banner-slide {
  height: 100%;
  display: flex;
  align-items: center;
  position: relative;
  overflow: hidden;
}
.banner-content {
  padding: 0 56px;
  z-index: 2;
  max-width: 600px;
}
.banner-title {
  font-size: 32px;
  font-weight: 700;
  color: #fff;
  margin: 0 0 10px;
  line-height: 1.3;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}
.banner-sub {
  font-size: 15px;
  color: rgba(255, 255, 255, 0.9);
  margin: 0 0 22px;
  line-height: 1.6;
}
.banner-actions {
  display: flex;
  gap: 12px;
}
.banner-btn {
  padding: 10px 24px;
  border-radius: 999px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  border: none;
  transition: all 0.25s;
}
.banner-btn.primary {
  background: #fff;
  color: var(--color-primary);
}
.banner-btn.primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
}
.banner-btn.ghost {
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
  border: 1.5px solid rgba(255, 255, 255, 0.6);
}
.banner-btn.ghost:hover {
  background: rgba(255, 255, 255, 0.3);
}
.banner-deco {
  position: absolute;
  right: -40px;
  top: -40px;
  width: 280px;
  height: 280px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.08);
}
.banner-deco::after {
  content: '';
  position: absolute;
  right: 60px;
  top: 60px;
  width: 160px;
  height: 160px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.06);
}

/* ===== 分类卡 ===== */
.category-cards {
  display: grid;
  grid-template-columns: repeat(9, 1fr);
  gap: 10px;
  margin-bottom: 28px;
}
.cat-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 14px 6px;
  border: 1px solid var(--color-border);
  border-radius: 12px;
  background: var(--color-bg-card);
  cursor: pointer;
  transition: all 0.2s;
}
.cat-card:hover {
  border-color: var(--color-primary);
  transform: translateY(-3px);
  box-shadow: 0 4px 16px rgba(26, 107, 92, 0.1);
}
.cat-card.active {
  border-color: var(--color-primary);
  background: rgba(26, 107, 92, 0.06);
}
.cat-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
}
.cat-label {
  font-size: 12px;
  font-weight: 500;
  color: var(--color-text-regular);
  text-align: center;
  white-space: nowrap;
}

/* ===== 限时促销 ===== */
.flash-section {
  margin-bottom: 28px;
}
.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}
.section-title {
  font-size: 20px;
  font-weight: 600;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}
.title-icon {
  font-size: 22px;
}
.flash-timer {
  font-size: 13px;
  color: var(--color-danger);
  font-weight: 600;
  padding: 3px 12px;
  background: rgba(232, 116, 59, 0.1);
  border-radius: 999px;
}
.flash-scroll {
  display: flex;
  gap: 14px;
  overflow-x: auto;
  padding-bottom: 6px;
  scrollbar-width: thin;
}
.flash-scroll::-webkit-scrollbar {
  height: 5px;
}
.flash-scroll::-webkit-scrollbar-thumb {
  background: var(--color-border);
  border-radius: 3px;
}
.flash-item {
  flex-shrink: 0;
  width: 160px;
  cursor: pointer;
  border-radius: 10px;
  overflow: hidden;
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  transition: all 0.2s;
}
.flash-item:hover {
  border-color: var(--color-accent);
  transform: translateY(-2px);
}
.flash-img {
  position: relative;
  width: 100%;
  aspect-ratio: 1;
  overflow: hidden;
}
.flash-img img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.flash-discount {
  position: absolute;
  top: 6px;
  left: 6px;
  padding: 2px 8px;
  background: var(--color-danger);
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  border-radius: 4px;
}
.flash-info {
  padding: 8px 10px;
}
.flash-name {
  font-size: 12px;
  margin: 0 0 4px;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
  color: var(--color-text-primary);
}
.flash-price {
  display: flex;
  align-items: baseline;
  gap: 6px;
}
.flash-price .now {
  font-size: 16px;
  font-weight: 700;
  color: var(--color-danger);
}
.flash-price .was {
  font-size: 11px;
  color: var(--color-text-secondary);
  text-decoration: line-through;
}

/* ===== 热销+新品双栏 ===== */
.dual-section {
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: 24px;
  margin-bottom: 28px;
}
.hot-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.hot-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px;
  border-radius: 10px;
  cursor: pointer;
  transition: background 0.15s;
}
.hot-item:hover {
  background: var(--color-bg-soft);
}
.hot-rank {
  width: 22px;
  height: 22px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
  background: var(--color-bg-soft);
  color: var(--color-text-secondary);
  flex-shrink: 0;
}
.hot-rank.top {
  background: var(--color-accent);
  color: #fff;
}
.hot-img {
  width: 50px;
  height: 50px;
  border-radius: 8px;
  object-fit: cover;
  flex-shrink: 0;
}
.hot-info {
  flex: 1;
  min-width: 0;
}
.hot-name {
  font-size: 13px;
  margin: 0 0 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: var(--color-text-primary);
}
.hot-meta {
  display: flex;
  align-items: baseline;
  gap: 8px;
}
.hot-price {
  font-size: 14px;
  font-weight: 700;
  color: var(--color-primary);
}
.hot-sales {
  font-size: 11px;
  color: var(--color-text-secondary);
}
.new-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

/* ===== 商品列表区 ===== */
.product-grid-section {
  margin-top: 8px;
}
.market-layout {
  display: grid;
  grid-template-columns: 220px 1fr;
  gap: 28px;
}
.market-sidebar {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 20px;
  height: fit-content;
  position: sticky;
  top: 110px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.filter-section h3 {
  font-size: 14px;
  font-weight: 600;
  margin: 0 0 12px;
}
.price-display {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  color: var(--color-text-regular);
  margin-top: 8px;
}
.sell-btn {
  width: 100%;
  border-radius: 8px;
  font-weight: 600;
}
.reset-btn {
  width: 100%;
  border-radius: 8px;
}
.market-main {
  min-width: 0;
}
.shop-toolbar {
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
}
.search-input {
  flex: 1;
}
.sort-select {
  width: 180px;
}
.result-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
  font-size: 13px;
  color: var(--color-text-secondary);
}
.active-cat {
  padding: 2px 10px;
  background: rgba(26, 107, 92, 0.08);
  color: var(--color-primary);
  border-radius: 999px;
  font-weight: 500;
}
.products-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}
.match-apps {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 10px;
}
.match-app-chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  font-weight: 500;
  padding: 3px 10px;
  border: none;
  border-radius: 999px;
  cursor: pointer;
  transition: transform 0.15s;
}
.match-app-chip:hover {
  transform: translateY(-1px);
}
.chip-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}
.match-hint {
  font-size: 12px;
  color: var(--color-text-secondary);
  margin: 8px 0 0;
  line-height: 1.5;
}
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 60px 0;
  color: var(--color-text-secondary);
}

/* ===== 响应式 ===== */
@media (max-width: 1200px) {
  .category-cards {
    grid-template-columns: repeat(5, 1fr);
  }
  .new-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
@media (max-width: 1024px) {
  .products-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .dual-section {
    grid-template-columns: 1fr;
  }
  .new-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}
@media (max-width: 768px) {
  .market-page {
    padding: 12px;
  }
  .category-cards {
    grid-template-columns: repeat(3, 1fr);
  }
  .market-layout {
    grid-template-columns: 1fr;
  }
  .market-sidebar {
    position: static;
  }
  .products-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }
  .new-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .banner-content {
    padding: 0 24px;
  }
  .banner-title {
    font-size: 22px;
  }
  .sort-select {
    width: 140px;
  }
}
</style>
