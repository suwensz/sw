<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import { useSellerStore, type SellForm } from '@/stores/seller'
import { tText } from '@/i18n'
import { localizeNumber, localizePrice } from '@/utils/numbers'
import { useAppStore } from '@/stores/app'

const router = useRouter()
const { t, locale } = useI18n()
const seller = useSellerStore()
const appStore = useAppStore()

const form = ref<SellForm>({
  name: '',
  category: 'health_tonic',
  price: 0,
  originalPrice: undefined,
  stock: 1,
  image: '',
  description: '',
})

const categoryOptions = computed(() => [
  { value: 'health_tonic', label: t('shop.categoryHealthTonic') },
  { value: 'food_tea', label: t('shop.categoryFoodTea') },
  { value: 'beauty', label: t('shop.categoryBeauty') },
  { value: 'home_living', label: t('shop.categoryHomeLiving') },
  { value: 'fashion', label: t('shop.categoryFashion') },
  { value: 'electronics', label: t('shop.categoryElectronics') },
  { value: 'outdoor', label: t('shop.categoryOutdoor') },
  { value: 'crafts', label: t('shop.categoryCrafts') },
])

const submitting = ref(false)

function handleSubmit() {
  if (!form.value.name.trim()) {
    ElMessage.warning(t('shop.sellProductName'))
    return
  }
  if (form.value.price <= 0) {
    ElMessage.warning(t('shop.sellPrice'))
    return
  }
  if (!form.value.description.trim()) {
    ElMessage.warning(t('shop.sellDescription'))
    return
  }

  submitting.value = true
  setTimeout(() => {
    seller.addProduct({ ...form.value })
    submitting.value = false
    ElMessage.success(t('shop.sellSuccess'))
    // 重置表单
    form.value = {
      name: '',
      category: 'health_tonic',
      price: 0,
      originalPrice: undefined,
      stock: 1,
      image: '',
      description: '',
    }
  }, 600)
}

function removeProduct(id: string) {
  seller.removeProduct(id)
}

function goProduct(slug: string) {
  router.push(`/shop/${slug}`)
}

function convertedPrice(price: number) {
  const r = appStore.convertPrice(price)
  return localizePrice(r.value, r.symbol, locale.value)
}
</script>

<template>
  <div class="sell-page qh-container">
    <!-- 面包屑 -->
    <div class="breadcrumb">
      <router-link to="/shop">{{ t('nav.shop') }}</router-link>
      <el-icon><ArrowRight /></el-icon>
      <span class="current">{{ t('shop.sellNow') }}</span>
    </div>

    <div class="sell-layout">
      <!-- 上架表单 -->
      <div class="sell-form-card qh-card">
        <div class="form-header">
          <h1>{{ t('shop.sellTitle') }}</h1>
          <p class="form-desc">{{ t('shop.sellDesc') }}</p>
        </div>

        <el-form label-position="top" class="sell-form">
          <el-form-item :label="t('shop.sellProductName')">
            <el-input v-model="form.name" :placeholder="t('shop.sellProductName')" maxlength="60" show-word-limit />
          </el-form-item>

          <div class="form-row">
            <el-form-item :label="t('shop.sellCategory')">
              <el-select v-model="form.category" style="width: 100%">
                <el-option v-for="c in categoryOptions" :key="c.value" :value="c.value" :label="c.label" />
              </el-select>
            </el-form-item>

            <el-form-item :label="t('shop.sellStock')">
              <el-input-number v-model="form.stock" :min="1" :max="99999" style="width: 100%" />
            </el-form-item>
          </div>

          <div class="form-row">
            <el-form-item :label="t('shop.sellPrice')">
              <el-input-number v-model="form.price" :min="0.01" :precision="2" :step="1" style="width: 100%" />
            </el-form-item>

            <el-form-item :label="t('shop.sellOriginalPrice')">
              <el-input-number v-model="form.originalPrice" :min="0" :precision="2" :step="1" style="width: 100%" placeholder="0" />
            </el-form-item>
          </div>

          <el-form-item :label="t('shop.sellImage')">
            <el-input v-model="form.image" placeholder="https://..." />
            <div v-if="form.image" class="image-preview">
              <img :src="form.image" alt="preview" />
            </div>
          </el-form-item>

          <el-form-item :label="t('shop.sellDescription')">
            <el-input v-model="form.description" type="textarea" :rows="4" :placeholder="t('shop.sellDescription')" maxlength="300" show-word-limit />
          </el-form-item>

          <el-button type="primary" size="large" class="submit-btn" :loading="submitting" @click="handleSubmit">
            {{ t('shop.sellSubmit') }}
          </el-button>
        </el-form>
      </div>

      <!-- 我上架的商品 -->
      <div class="my-list-card qh-card">
        <div class="list-header">
          <h2>{{ t('shop.sellMyList') }}</h2>
          <span class="list-count">{{ seller.totalCount }}</span>
        </div>

        <div v-if="seller.products.length > 0" class="my-products">
          <div v-for="p in seller.products" :key="p.id" class="my-product-item">
            <img :src="p.image" class="my-prod-img" :alt="tText(p.name, locale as any)" @click="goProduct(p.slug)" />
            <div class="my-prod-info" @click="goProduct(p.slug)">
              <p class="my-prod-name">{{ tText(p.name, locale as any) }}</p>
              <div class="my-prod-meta">
                <span class="my-prod-price">{{ convertedPrice(p.price) }}</span>
                <span class="my-prod-stock">{{ t('shop.sellStock') }}: {{ localizeNumber(p.stock, locale) }}</span>
              </div>
            </div>
            <el-button type="danger" size="small" plain circle @click="removeProduct(p.id)">
              <el-icon><Delete /></el-icon>
            </el-button>
          </div>
        </div>
        <div v-else class="my-empty">
          <el-icon :size="36"><Box /></el-icon>
          <p>{{ t('shop.sellEmpty') }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.sell-page {
  padding: 24px 48px 48px;
  max-width: 1200px;
  margin: 0 auto;
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
.sell-layout {
  display: grid;
  grid-template-columns: 1fr 340px;
  gap: 24px;
  align-items: start;
}
.sell-form-card {
  padding: 28px;
}
.form-header {
  margin-bottom: 24px;
}
.form-header h1 {
  font-size: 24px;
  font-weight: 600;
  margin: 0 0 6px;
}
.form-desc {
  font-size: 14px;
  color: var(--color-text-secondary);
  margin: 0;
}
.sell-form .form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}
.image-preview {
  margin-top: 8px;
  border-radius: 8px;
  overflow: hidden;
  width: 120px;
  height: 120px;
  border: 1px solid var(--color-border);
}
.image-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.submit-btn {
  width: 100%;
  border-radius: 10px;
  font-size: 16px;
  font-weight: 600;
  margin-top: 8px;
}

/* 我上架的商品列表 */
.my-list-card {
  padding: 20px;
  position: sticky;
  top: 110px;
}
.list-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}
.list-header h2 {
  font-size: 16px;
  font-weight: 600;
  margin: 0;
}
.list-count {
  font-size: 13px;
  color: var(--color-text-secondary);
  background: var(--color-bg-soft);
  padding: 2px 10px;
  border-radius: 999px;
}
.my-products {
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: 500px;
  overflow-y: auto;
}
.my-product-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px;
  border-radius: 8px;
  transition: background 0.15s;
}
.my-product-item:hover {
  background: var(--color-bg-soft);
}
.my-prod-img {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  object-fit: cover;
  cursor: pointer;
  flex-shrink: 0;
}
.my-prod-info {
  flex: 1;
  min-width: 0;
  cursor: pointer;
}
.my-prod-name {
  font-size: 13px;
  margin: 0 0 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: var(--color-text-primary);
}
.my-prod-meta {
  display: flex;
  align-items: baseline;
  gap: 8px;
}
.my-prod-price {
  font-size: 14px;
  font-weight: 700;
  color: var(--color-primary);
}
.my-prod-stock {
  font-size: 11px;
  color: var(--color-text-secondary);
}
.my-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 40px 0;
  color: var(--color-text-secondary);
}
.my-empty p {
  font-size: 13px;
  margin: 0;
}

@media (max-width: 1024px) {
  .sell-layout {
    grid-template-columns: 1fr;
  }
  .my-list-card {
    position: static;
  }
}
@media (max-width: 768px) {
  .sell-page {
    padding: 16px;
  }
  .sell-form .form-row {
    grid-template-columns: 1fr;
  }
}
</style>
