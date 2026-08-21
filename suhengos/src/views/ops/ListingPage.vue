<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useOpsStore } from '@/stores/ops'
import { mockProducts as products } from '@/mock/products'
import { tText } from '@/i18n'
import type { MarketplaceId, ListingTask } from '@/types'
import { ElMessage } from 'element-plus'

const { t, locale } = useI18n()
const ops = useOpsStore()

const showCreate = ref(false)
const selectedProductId = ref('')
const selectedPlatforms = ref<MarketplaceId[]>([])

const connectedPlatforms = computed(() => ops.connectedMarketplaces)

function togglePlatform(id: MarketplaceId) {
  const idx = selectedPlatforms.value.indexOf(id)
  if (idx >= 0) selectedPlatforms.value.splice(idx, 1)
  else selectedPlatforms.value.push(id)
}

function createTask() {
  if (!selectedProductId.value || !selectedPlatforms.value.length) return
  ops.createListingTask(selectedProductId.value, selectedPlatforms.value)
  showCreate.value = false
  selectedProductId.value = ''
  selectedPlatforms.value = []
}

function publish(id: string) {
  ops.publishTask(id)
  ElMessage.success('✓')
}

function remove(id: string) {
  ops.deleteListingTask(id)
}

function statusType(s: ListingTask['status']) {
  return s === 'published' ? 'success' : s === 'failed' ? 'danger' : s === 'generating' ? 'warning' : 'info'
}
</script>

<template>
  <div class="listing-page qh-container">
    <div class="page-header">
      <div>
        <h1>{{ t('ops.listing.title') }}</h1>
        <p>{{ t('ops.subtitle') }}</p>
      </div>
      <el-button type="primary" size="large" @click="showCreate = true">
        <el-icon style="margin-right:4px"><Plus /></el-icon>{{ t('ops.listing.newTask') }}
      </el-button>
    </div>

    <!-- 已连接平台 -->
    <section class="platforms-bar qh-card">
      <span class="bar-label">{{ t('ops.platforms') }}:</span>
      <div class="platform-tags">
        <el-tag v-for="p in connectedPlatforms" :key="p.id" type="success" effect="plain">
          {{ p.flag }} {{ p.name }}
        </el-tag>
        <span v-if="!connectedPlatforms.length" class="empty-text">暂无授权平台</span>
      </div>
    </section>

    <!-- 任务列表 -->
    <section class="task-list">
      <div v-if="!ops.listingTasks.length" class="empty qh-card">
        <el-icon :size="48" color="var(--color-text-secondary)"><Upload /></el-icon>
        <p>{{ t('ops.listing.noTask') }}</p>
        <el-button type="primary" @click="showCreate = true">{{ t('ops.listing.newTask') }}</el-button>
      </div>

      <div v-for="task in ops.listingTasks" :key="task.id" class="task-card qh-card">
        <div class="task-head">
          <div class="task-product">
            <img :src="products.find((p) => p.id === task.productId)?.image" />
            <div>
              <h3>{{ tText(task.productName, locale as any) }}</h3>
              <div class="task-platforms">
                <el-tag v-for="pid in task.marketplaces" :key="pid" size="small" effect="plain">
                  {{ ops.marketplaces.find((m) => m.id === pid)?.name }}
                </el-tag>
              </div>
            </div>
          </div>
          <el-tag :type="statusType(task.status)">{{ t(`ops.listing.${task.status}`) }}</el-tag>
        </div>

        <div v-if="task.status === 'generating' || task.progress < 100" class="task-progress">
          <el-progress :percentage="task.progress" :stroke-width="6" :show-text="false" />
          <span>{{ t('ops.listing.generatingTitles') }}...</span>
        </div>

        <div v-if="Object.keys(task.titles).length" class="task-titles">
          <div v-for="(title, pid) in task.titles" :key="pid" class="title-item">
            <label>{{ ops.marketplaces.find((m) => m.id === pid)?.name }}:</label>
            <span>{{ title }}</span>
          </div>
        </div>

        <div class="task-footer">
          <span class="task-time">{{ new Date(task.createdAt).toLocaleString() }}</span>
          <div class="task-actions">
            <el-button
              v-if="task.status === 'pending'"
              type="primary"
              @click="publish(task.id)"
            >
              <el-icon style="margin-right:4px"><Promotion /></el-icon>{{ t('ops.listing.publish') }}
            </el-button>
            <el-button text type="danger" @click="remove(task.id)">
              <el-icon><Delete /></el-icon>
            </el-button>
          </div>
        </div>
      </div>
    </section>

    <!-- 新建任务弹窗 -->
    <el-dialog v-model="showCreate" :title="t('ops.listing.newTask')" width="640px">
      <el-form label-position="top">
        <el-form-item :label="t('ops.listing.selectProduct')">
          <el-select v-model="selectedProductId" filterable style="width: 100%">
            <el-option
              v-for="p in products"
              :key="p.id"
              :value="p.id"
              :label="tText(p.name, locale as any)"
            >
              <div class="product-option">
                <img :src="p.image" />
                <span>{{ tText(p.name, locale as any) }}</span>
              </div>
            </el-option>
          </el-select>
        </el-form-item>

        <el-form-item :label="t('ops.listing.selectPlatforms')">
          <div class="platform-grid">
            <div
              v-for="p in ops.marketplaces"
              :key="p.id"
              :class="['platform-option', { selected: selectedPlatforms.includes(p.id), disabled: !connectedPlatforms.find((c) => c.id === p.id) }]"
              @click="connectedPlatforms.find((c) => c.id === p.id) && togglePlatform(p.id)"
            >
              <span class="flag">{{ p.flag }}</span>
              <span>{{ p.name }}</span>
              <el-icon v-if="selectedPlatforms.includes(p.id)" class="check"><Check /></el-icon>
            </div>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreate = false">取消</el-button>
        <el-button type="primary" @click="createTask">{{ t('ops.listing.generateTitles') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.listing-page { padding: 24px 0 48px; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.page-header h1 { font-size: 24px; margin: 0 0 4px; }
.page-header p { color: var(--color-text-secondary); margin: 0; font-size: 14px; }

.platforms-bar { display: flex; align-items: center; gap: 12px; padding: 14px 20px; margin-bottom: 20px; flex-wrap: wrap; }
.bar-label { font-size: 13px; color: var(--color-text-secondary); }
.platform-tags { display: flex; gap: 8px; flex-wrap: wrap; }
.empty-text { color: var(--color-text-secondary); font-size: 13px; }

.task-list { display: flex; flex-direction: column; gap: 14px; }
.empty { padding: 60px 20px; text-align: center; color: var(--color-text-secondary); display: flex; flex-direction: column; align-items: center; gap: 14px; }

.task-card { padding: 20px; }
.task-head { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 14px; }
.task-product { display: flex; gap: 14px; align-items: center; }
.task-product img { width: 56px; height: 56px; border-radius: 10px; object-fit: cover; }
.task-product h3 { font-size: 16px; margin: 0 0 6px; }
.task-platforms { display: flex; gap: 6px; flex-wrap: wrap; }
.task-progress { display: flex; align-items: center; gap: 12px; margin-bottom: 14px; }
.task-progress .el-progress { flex: 1; }
.task-progress span { font-size: 12px; color: var(--color-primary); white-space: nowrap; }
.task-titles { background: var(--color-bg-soft); border-radius: 8px; padding: 12px; margin-bottom: 14px; }
.title-item { display: grid; grid-template-columns: 100px 1fr; gap: 10px; padding: 6px 0; font-size: 13px; border-bottom: 1px dashed var(--color-border); }
.title-item:last-child { border-bottom: none; }
.title-item label { color: var(--color-text-secondary); }
.title-item span { color: var(--color-text-primary); }
.task-footer { display: flex; justify-content: space-between; align-items: center; }
.task-time { font-size: 12px; color: var(--color-text-secondary); }
.task-actions { display: flex; gap: 8px; }

.platform-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; width: 100%; }
.platform-option { display: flex; align-items: center; gap: 8px; padding: 12px; border: 1.5px solid var(--color-border); border-radius: 10px; cursor: pointer; transition: all 0.2s; }
.platform-option:hover { border-color: var(--color-primary); }
.platform-option.selected { border-color: var(--color-primary); background: rgba(26, 107, 92, 0.05); }
.platform-option.disabled { opacity: 0.5; cursor: not-allowed; }
.flag { font-size: 20px; }
.check { margin-left: auto; color: var(--color-primary); }
.product-option { display: flex; align-items: center; gap: 10px; }
.product-option img { width: 32px; height: 32px; border-radius: 6px; object-fit: cover; }
</style>
