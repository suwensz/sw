<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { mockProducts } from '@/mock/products'
import ProductCard from '@/components/ProductCard.vue'
import { tText } from '@/i18n'
import { localizeNumber } from '@/utils/numbers'

const router = useRouter()
const { t, locale } = useI18n()

const searchQuery = ref('')
const selectedCategory = ref('all')
const sortBy = ref('default')
const priceRange = ref<[number, number]>([0, 100])

const categories = computed(() => [
  { id: 'all', label: t('shop.categoryAll') },
  { id: 'herb', label: t('shop.categoryHerb') },
  { id: 'tea', label: t('shop.categoryTea') },
  { id: 'patent', label: t('shop.categoryPatent') },
  { id: 'health', label: t('shop.categoryHealth') },
  { id: 'device', label: t('shop.categoryDevice') },
  { id: 'food', label: t('shop.categoryFood') },
])

const filteredProducts = computed(() => {
  let result = [...mockProducts]
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
    case 'price-asc':
      result.sort((a, b) => a.price - b.price)
      break
    case 'price-desc':
      result.sort((a, b) => b.price - a.price)
      break
    case 'rating':
      result.sort((a, b) => b.rating - a.rating)
      break
    case 'sales':
      result.sort((a, b) => b.reviewCount - a.reviewCount)
      break
  }
  return result
})

const sortOptions = computed(() => [
  { value: 'default', label: t('shop.sortDefault') },
  { value: 'price-asc', label: t('shop.sortPriceAsc') },
  { value: 'price-desc', label: t('shop.sortPriceDesc') },
  { value: 'rating', label: t('shop.sortRating') },
  { value: 'sales', label: t('shop.sortSales') },
])

function resetFilters() {
  searchQuery.value = ''
  selectedCategory.value = 'all'
  sortBy.value = 'default'
  priceRange.value = [0, 100]
}
</script>

<template>
  <div class="shop-page qh-container">
    <!-- 页面头部 -->
    <div class="page-header">
      <h1>{{ t('shop.title') }}</h1>
      <p>{{ t('shop.subtitle') }}</p>
    </div>

    <div class="shop-layout">
      <!-- 侧边筛选 -->
      <aside class="shop-sidebar">
        <div class="filter-section">
          <h3>{{ t('shop.categories') }}</h3>
          <div class="category-list">
            <button
              v-for="cat in categories"
              :key="cat.id"
              :class="['category-item', { active: selectedCategory === cat.id }]"
              @click="selectedCategory = cat.id"
            >
              {{ cat.label }}
            </button>
          </div>
        </div>

        <div class="filter-section">
          <h3>{{ t('shop.priceRange') }}</h3>
          <el-slider
            v-model="priceRange"
            range
            :max="100"
            :min="0"
            :step="1"
            :format-tooltip="(v: number) => '$' + localizeNumber(v, locale)"
          />
          <div class="price-display">
            <span>${{ localizeNumber(priceRange[0], locale) }}</span>
            <span>${{ localizeNumber(priceRange[1], locale) }}</span>
          </div>
        </div>

        <el-button plain class="reset-btn" @click="resetFilters">
          {{ t('shop.clearFilters') }}
        </el-button>
      </aside>

      <!-- 商品列表 -->
      <main class="shop-main">
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
</template>

<style scoped>
.shop-page {
  padding: 32px 48px;
}
.page-header {
  margin-bottom: 24px;
}
.page-header h1 {
  font-size: 28px;
  font-weight: 600;
  margin: 0 0 6px;
}
.page-header p {
  color: var(--color-text-secondary);
  margin: 0;
}
.shop-layout {
  display: grid;
  grid-template-columns: 220px 1fr;
  gap: 28px;
}
.shop-sidebar {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 20px;
  height: fit-content;
  position: sticky;
  top: 80px;
}
.filter-section {
  margin-bottom: 24px;
}
.filter-section h3 {
  font-size: 14px;
  font-weight: 600;
  margin: 0 0 12px;
}
.category-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.category-item {
  padding: 9px 12px;
  border: none;
  background: none;
  text-align: left;
  font-size: 14px;
  color: var(--color-text-regular);
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.15s;
}
.category-item:hover {
  background: var(--color-bg-soft);
  color: var(--color-primary);
}
.category-item.active {
  background: rgba(26, 107, 92, 0.1);
  color: var(--color-primary);
  font-weight: 500;
}
.price-display {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  color: var(--color-text-regular);
  margin-top: 8px;
}
.reset-btn {
  width: 100%;
  border-radius: 8px;
}
.shop-toolbar {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
}
.search-input {
  flex: 1;
}
.sort-select {
  width: 180px;
}
.products-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 60px 0;
  color: var(--color-text-secondary);
}
@media (max-width: 1024px) {
  .products-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
@media (max-width: 768px) {
  .shop-page {
    padding: 16px;
  }
  .shop-layout {
    grid-template-columns: 1fr;
  }
  .shop-sidebar {
    position: static;
  }
  .products-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }
  .sort-select {
    width: 140px;
  }
}
</style>
