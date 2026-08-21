<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useDomesticStore } from '@/stores/domestic'
import { DOMESTIC_PLATFORMS, DOMESTIC_CATEGORIES } from '@/mock/domesticData'
import type { DomesticPlatform, DomesticCategory, DomesticProduct } from '@/types'
import type { DomesticProductForm } from '@/stores/domestic'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const store = useDomesticStore()

// ---- 筛选 ----
const filterPlatform = ref<DomesticPlatform | ''>('')
const filterCategory = ref<DomesticCategory | ''>('')
const searchQuery = ref('')

const filteredProducts = computed(() => {
  return store.products.filter((p) => {
    if (filterPlatform.value && !p.platforms.includes(filterPlatform.value)) return false
    if (filterCategory.value && p.category !== filterCategory.value) return false
    if (searchQuery.value && !p.title.includes(searchQuery.value)) return false
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

// ---- 上架/编辑弹窗 ----
const dialogVisible = ref(false)
const editingId = ref<string | null>(null)
const formData = ref<DomesticProductForm>({
  title: '',
  category: 'office',
  platforms: ['taobao'],
  price: 0,
  originalPrice: undefined,
  stock: 100,
  image: '',
  description: '',
  author: '',
  episodes: undefined,
  format: 'physical',
})

// 从 URL query ?action=new 自动打开弹窗
watch(() => route.query.action, (action) => {
  if (action === 'new') {
    openDialog()
    router.replace({ query: {} })
  }
}, { immediate: true })

function openDialog(product?: DomesticProduct) {
  if (product) {
    editingId.value = product.id
    formData.value = {
      title: product.title,
      category: product.category,
      platforms: [...product.platforms],
      price: product.price,
      originalPrice: product.originalPrice,
      stock: product.stock,
      image: product.image,
      description: product.description,
      author: product.author,
      episodes: product.episodes,
      format: product.format,
    }
  } else {
    editingId.value = null
    formData.value = {
      title: '',
      category: 'office',
      platforms: ['taobao'],
      price: 0,
      originalPrice: undefined,
      stock: 100,
      image: '',
      description: '',
      author: '',
      episodes: undefined,
      format: 'physical',
    }
  }
  dialogVisible.value = true
}

function togglePlatformInForm(pl: DomesticPlatform) {
  const idx = formData.value.platforms.indexOf(pl)
  if (idx >= 0) {
    formData.value.platforms.splice(idx, 1)
  } else {
    formData.value.platforms.push(pl)
  }
}

function handleSubmit() {
  if (!formData.value.title.trim()) {
    return
  }
  if (formData.value.price <= 0) {
    return
  }
  if (editingId.value) {
    store.updateProduct(editingId.value, formData.value)
  } else {
    store.addProduct(formData.value)
  }
  dialogVisible.value = false
}

function handleDelete(id: string) {
  store.removeProduct(id)
}

function togglePlatform(id: string, pl: DomesticPlatform) {
  store.togglePlatform(id, pl)
}
</script>

<template>
  <div class="product-manage">
    <div class="page-header">
      <div>
        <h1>{{ t('domestic.productManageTitle') }}</h1>
        <p>{{ t('domestic.productManageSubtitle') }}</p>
      </div>
      <button class="add-btn" @click="openDialog()">
        <span>＋</span>{{ t('domestic.listNewProduct') }}
      </button>
    </div>

    <!-- 筛选栏 -->
    <div class="filter-bar">
      <div class="filter-group">
        <span class="filter-label">{{ t('domestic.platform') }}：</span>
        <button
          :class="['filter-chip', { active: filterPlatform === '' }]"
          @click="filterPlatform = ''"
        >{{ t('domestic.allPlatforms') }}</button>
        <button
          v-for="p in DOMESTIC_PLATFORMS"
          :key="p.id"
          :class="['filter-chip', { active: filterPlatform === p.id }]"
          :style="filterPlatform === p.id ? { background: p.color, color: '#fff' } : {}"
          @click="filterPlatform = p.id"
        >{{ p.icon }} {{ p.shortName }}</button>
      </div>
      <div class="filter-group">
        <span class="filter-label">{{ t('domestic.category') }}：</span>
        <button
          :class="['filter-chip', { active: filterCategory === '' }]"
          @click="filterCategory = ''"
        >{{ t('domestic.allCategories') }}</button>
        <button
          v-for="c in DOMESTIC_CATEGORIES"
          :key="c.id"
          :class="['filter-chip', { active: filterCategory === c.id }]"
          @click="filterCategory = c.id"
        >{{ c.icon }} {{ c.name }}</button>
      </div>
      <input
        v-model="searchQuery"
        class="search-input"
        :placeholder="t('domestic.searchProduct')"
      />
    </div>

    <!-- 商品列表 -->
    <div class="product-table">
      <div class="table-head">
        <span class="col-img"></span>
        <span class="col-title">{{ t('domestic.productTitle') }}</span>
        <span class="col-category">{{ t('domestic.category') }}</span>
        <span class="col-platforms">{{ t('domestic.platforms') }}</span>
        <span class="col-price">{{ t('domestic.price') }}</span>
        <span class="col-stock">{{ t('domestic.stock') }}</span>
        <span class="col-sales">{{ t('domestic.sales') }}</span>
        <span class="col-actions">{{ t('domestic.actions') }}</span>
      </div>
      <div v-for="p in filteredProducts" :key="p.id" class="table-row">
        <span class="col-img">
          <img :src="p.image" :alt="p.title" class="product-thumb" />
        </span>
        <span class="col-title">
          <div class="title-text">{{ p.title }}</div>
          <div class="title-sub" v-if="p.author">{{ t('domestic.authorLabel') }}：{{ p.author }}</div>
          <div class="title-sub" v-if="p.episodes">{{ t('domestic.episodesLabel') }}：{{ p.episodes }}</div>
        </span>
        <span class="col-category">
          <span class="cat-tag">{{ categoryInfo(p.category).icon }} {{ categoryInfo(p.category).name }}</span>
        </span>
        <span class="col-platforms">
          <button
            v-for="pl in DOMESTIC_PLATFORMS"
            :key="pl.id"
            :class="['pl-tag', { active: p.platforms.includes(pl.id) }]"
            :style="p.platforms.includes(pl.id) ? { background: pl.color + '20', color: pl.color, borderColor: pl.color } : {}"
            :title="p.platforms.includes(pl.id) ? t('domestic.clickToRemove') : t('domestic.clickToAdd')"
            @click="togglePlatform(p.id, pl.id)"
          >{{ pl.shortName }}</button>
        </span>
        <span class="col-price">
          <div class="price-now">{{ formatMoney(p.price) }}</div>
          <div class="price-orig" v-if="p.originalPrice">{{ formatMoney(p.originalPrice) }}</div>
        </span>
        <span class="col-stock" :class="{ 'low-stock': p.stock <= 50 }">{{ p.stock }}</span>
        <span class="col-sales">{{ p.sales }}</span>
        <span class="col-actions">
          <button class="action-btn edit" @click="openDialog(p)">{{ t('domestic.edit') }}</button>
          <button class="action-btn delete" @click="handleDelete(p.id)">{{ t('domestic.delete') }}</button>
        </span>
      </div>
      <div v-if="filteredProducts.length === 0" class="empty-row">
        {{ t('domestic.noProducts') }}
      </div>
    </div>

    <!-- 上架/编辑弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="editingId ? t('domestic.editProduct') : t('domestic.listNewProduct')"
      width="560px"
      class="product-dialog"
    >
      <el-form label-width="90px" label-position="left">
        <el-form-item :label="t('domestic.productTitle')">
          <el-input v-model="formData.title" :placeholder="t('domestic.titlePlaceholder')" />
        </el-form-item>
        <el-form-item :label="t('domestic.category')">
          <el-select v-model="formData.category" style="width: 100%">
            <el-option v-for="c in DOMESTIC_CATEGORIES" :key="c.id" :label="c.icon + ' ' + c.name" :value="c.id" />
          </el-select>
        </el-form-item>
        <el-form-item :label="t('domestic.platforms')">
          <div class="platform-picker">
            <button
              v-for="pl in DOMESTIC_PLATFORMS"
              :key="pl.id"
              :class="['pp-btn', { active: formData.platforms.includes(pl.id) }]"
              :style="formData.platforms.includes(pl.id) ? { background: pl.color, color: '#fff', borderColor: pl.color } : {}"
              @click="togglePlatformInForm(pl.id)"
            >{{ pl.icon }} {{ pl.shortName }}</button>
          </div>
        </el-form-item>
        <div class="form-row">
          <el-form-item :label="t('domestic.price')" style="flex: 1">
            <el-input-number v-model="formData.price" :min="0" :precision="2" style="width: 100%" />
          </el-form-item>
          <el-form-item :label="t('domestic.originalPrice')" style="flex: 1; margin-left: 16px">
            <el-input-number v-model="formData.originalPrice" :min="0" :precision="2" style="width: 100%" />
          </el-form-item>
        </div>
        <div class="form-row">
          <el-form-item :label="t('domestic.stock')" style="flex: 1">
            <el-input-number v-model="formData.stock" :min="0" style="width: 100%" />
          </el-form-item>
          <el-form-item :label="t('domestic.format')" style="flex: 1; margin-left: 16px">
            <el-select v-model="formData.format" style="width: 100%">
              <el-option :label="t('domestic.formatPhysical')" value="physical" />
              <el-option :label="t('domestic.formatDigital')" value="digital" />
            </el-select>
          </el-form-item>
        </div>
        <el-form-item :label="t('domestic.authorLabel')" v-if="formData.category === 'comic' || formData.category === 'short_drama'">
          <el-input v-model="formData.author" :placeholder="t('domestic.authorPlaceholder')" />
        </el-form-item>
        <el-form-item :label="t('domestic.episodesLabel')" v-if="formData.category === 'short_drama'">
          <el-input-number v-model="formData.episodes" :min="1" style="width: 100%" />
        </el-form-item>
        <el-form-item :label="t('domestic.image')">
          <el-input v-model="formData.image" :placeholder="t('domestic.imagePlaceholder')" />
        </el-form-item>
        <el-form-item :label="t('domestic.description')">
          <el-input v-model="formData.description" type="textarea" :rows="3" :placeholder="t('domestic.descPlaceholder')" />
        </el-form-item>
      </el-form>
      <template #footer>
        <button class="dialog-btn cancel" @click="dialogVisible = false">{{ t('common.cancel') }}</button>
        <button class="dialog-btn confirm" @click="handleSubmit">{{ t('common.confirm') }}</button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.product-manage {
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
.add-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 20px;
  background: var(--color-primary);
  color: #fff;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
  white-space: nowrap;
}
.add-btn:hover { background: var(--color-primary-light); }
.add-btn span { font-size: 18px; line-height: 1; }

.filter-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  align-items: center;
  margin-bottom: 20px;
  padding: 16px;
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: 12px;
}
.filter-group {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}
.filter-label {
  font-size: 13px;
  color: var(--color-text-secondary);
  white-space: nowrap;
}
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
.search-input {
  flex: 1;
  min-width: 200px;
  padding: 8px 14px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  font-size: 14px;
  background: var(--color-bg-soft);
  color: var(--color-text-primary);
}
.search-input:focus {
  outline: none;
  border-color: var(--color-primary);
}

.product-table {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  overflow: hidden;
}
.table-head {
  display: grid;
  grid-template-columns: 60px 1fr 100px 160px 100px 70px 70px 120px;
  gap: 8px;
  padding: 12px 16px;
  background: var(--color-bg-soft);
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text-secondary);
}
.table-row {
  display: grid;
  grid-template-columns: 60px 1fr 100px 160px 100px 70px 70px 120px;
  gap: 8px;
  padding: 12px 16px;
  border-top: 1px solid var(--color-border);
  align-items: center;
  font-size: 13px;
  transition: background 0.15s;
}
.table-row:hover { background: var(--color-bg-soft); }
.product-thumb {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  object-fit: cover;
}
.title-text {
  font-weight: 500;
  color: var(--color-text-primary);
  line-height: 1.4;
}
.title-sub {
  font-size: 11px;
  color: var(--color-text-secondary);
  margin-top: 2px;
}
.cat-tag {
  display: inline-block;
  padding: 2px 8px;
  background: var(--color-bg-soft);
  border-radius: 6px;
  font-size: 12px;
  color: var(--color-text-regular);
}
.pl-tag {
  padding: 2px 8px;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  font-size: 11px;
  color: var(--color-text-secondary);
  background: transparent;
  cursor: pointer;
  transition: all 0.15s;
  margin-right: 4px;
}
.pl-tag:hover { border-color: var(--color-primary); }
.price-now { font-weight: 600; color: var(--color-primary); }
.price-orig { font-size: 11px; color: var(--color-text-secondary); text-decoration: line-through; }
.low-stock { color: #E6A23C; font-weight: 600; }
.action-btn {
  padding: 4px 10px;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
  background: transparent;
  transition: all 0.15s;
  margin-right: 4px;
}
.action-btn.edit { color: var(--color-primary); border-color: var(--color-primary); }
.action-btn.edit:hover { background: var(--color-primary); color: #fff; }
.action-btn.delete { color: var(--color-danger); border-color: var(--color-danger); }
.action-btn.delete:hover { background: var(--color-danger); color: #fff; }
.empty-row {
  padding: 60px 16px;
  text-align: center;
  color: var(--color-text-secondary);
  font-size: 14px;
}

.platform-picker {
  display: flex;
  gap: 8px;
}
.pp-btn {
  padding: 6px 16px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: transparent;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}
.pp-btn:hover { border-color: var(--color-primary); }

.form-row {
  display: flex;
  gap: 0;
}
.dialog-btn {
  padding: 8px 20px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
  margin-left: 10px;
}
.dialog-btn.cancel { background: transparent; }
.dialog-btn.cancel:hover { background: var(--color-bg-soft); }
.dialog-btn.confirm {
  background: var(--color-primary);
  color: #fff;
  border-color: var(--color-primary);
}
.dialog-btn.confirm:hover { background: var(--color-primary-light); }

@media (max-width: 768px) {
  .table-head, .table-row {
    grid-template-columns: 1fr;
    gap: 4px;
  }
  .filter-bar { flex-direction: column; align-items: stretch; }
}
</style>
