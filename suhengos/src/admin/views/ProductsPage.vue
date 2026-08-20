<script setup lang="ts">
import { computed, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { mockProducts } from '@/mock/products'
import type { Product } from '@/types'

const keyword = ref('')
const stockEditing = ref<Record<string, number>>({})

const products = computed<Product[]>(() =>
  mockProducts.filter((p) => {
    if (!keyword.value) return true
    const k = keyword.value.toLowerCase()
    return (
      p.name.zh.includes(keyword.value) ||
      p.name.en.toLowerCase().includes(k) ||
      p.slug.toLowerCase().includes(k)
    )
  }),
)

function stockOf(p: Product) {
  return stockEditing.value[p.id] ?? p.stock
}

function saveStock(p: Product) {
  const v = stockOf(p)
  ElMessage.success(`商品「${p.name.zh}」库存已更新为 ${v}`)
}

function fmtPrice(p: Product) {
  return p.currency === 'USD' ? `$${p.price}` : `¥${p.price}`
}
</script>

<template>
  <div class="products-page">
    <el-card shadow="never">
      <template #header>
        <div class="toolbar">
          <el-input
            v-model="keyword"
            placeholder="搜索商品名称 / slug"
            clearable
            :prefix-icon="'Search'"
            style="width: 260px"
          />
          <div class="toolbar-right">
            <el-button plain>批量导入</el-button>
            <el-button type="primary">上架新商品</el-button>
          </div>
        </div>
      </template>

      <el-table :data="products" style="width: 100%">
        <el-table-column label="商品" min-width="240">
          <template #default="{ row }">
            <div class="product-cell">
              <el-image :src="row.image" fit="cover" class="product-img" lazy />
              <div class="product-meta">
                <span class="product-name">{{ row.name.zh }}</span>
                <span class="product-slug">{{ row.slug }}</span>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="category" label="分类" width="110" />
        <el-table-column label="价格" width="100">
          <template #default="{ row }">{{ fmtPrice(row as Product) }}</template>
        </el-table-column>
        <el-table-column label="评分" width="90" sortable prop="rating">
          <template #default="{ row }">{{ row.rating }} ({{ row.reviewCount }})</template>
        </el-table-column>
        <el-table-column label="库存" width="170">
          <template #default="{ row }">
            <div class="stock-editor">
              <el-input-number
                :model-value="stockOf(row as Product)"
                :min="0"
                :step="10"
                size="small"
                controls-position="right"
                @update:model-value="(v: number | undefined) => (stockEditing[(row as Product).id] = v ?? 0)"
              />
              <el-button link type="primary" size="small" @click="saveStock(row as Product)">保存</el-button>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="90">
          <template #default="{ row }">
            <el-tag :type="row.stock > 0 ? 'success' : 'danger'" size="small">
              {{ row.stock > 0 ? '在售' : '缺货' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="140" fixed="right">
          <template #default>
            <el-button link type="primary" size="small">编辑</el-button>
            <el-button link type="primary" size="small">多语言</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<style scoped>
.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.toolbar-right {
  display: flex;
  gap: 8px;
}

.product-cell {
  display: flex;
  align-items: center;
  gap: 10px;
}

.product-img {
  width: 44px;
  height: 44px;
  border-radius: 8px;
  flex-shrink: 0;
  background: var(--color-bg-soft);
}

.product-meta {
  display: flex;
  flex-direction: column;
  line-height: 1.35;
}

.product-name {
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text-primary);
}

.product-slug {
  font-size: 12px;
  color: var(--color-text-secondary);
}

.stock-editor {
  display: flex;
  align-items: center;
  gap: 6px;
}

.stock-editor :deep(.el-input-number) {
  width: 100px;
}
</style>
