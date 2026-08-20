<script setup lang="ts">
import { computed, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { mockProducts } from '@/mock/products'
import { MARKETPLACES, generateCompetitors, generateSupplyChain, generateMarketDemands } from '@/mock/operations'
import { constitutionTypes, allConstitutionQuestions } from '@/mock/constitution'
import { mockConversations, suggestedQuestions } from '@/mock/conversation'
import { currencies, shippingMethods } from '@/mock/shop'
import { DIET_RECIPES } from '@/mock/wuyun'

/**
 * Mock 数据管理（开发端）
 * 浏览各 Mock 数据集；可将覆盖版本写入 localStorage（qh_mock_override_<id>），
 * 供联调脚本 / 后续 API 适配层读取，避免直接改源码。
 */

interface Dataset {
  id: string
  label: string
  source: string
  data: unknown
}

function countOf(data: unknown): number {
  if (Array.isArray(data)) return data.length
  if (data && typeof data === 'object') return Object.keys(data as object).length
  return 0
}

const datasets: Dataset[] = [
  { id: 'products', label: '商品库', source: 'src/mock/products.ts', data: mockProducts },
  { id: 'marketplaces', label: '电商平台', source: 'src/mock/operations.ts', data: MARKETPLACES },
  { id: 'competitors', label: '竞品样本', source: 'src/mock/operations.ts', data: generateCompetitors() },
  { id: 'supplychain', label: '供应链条目', source: 'src/mock/operations.ts', data: generateSupplyChain() },
  { id: 'demands', label: '市场需求', source: 'src/mock/operations.ts', data: generateMarketDemands() },
  { id: 'constitution', label: '体质类型', source: 'src/mock/constitution.ts', data: constitutionTypes },
  { id: 'questions', label: '体质问卷题', source: 'src/mock/constitution.ts', data: allConstitutionQuestions },
  { id: 'conversations', label: '会话样本', source: 'src/mock/conversation.ts', data: mockConversations },
  { id: 'suggested', label: '推荐提问', source: 'src/mock/conversation.ts', data: suggestedQuestions },
  { id: 'currencies', label: '币种选项', source: 'src/mock/shop.ts', data: currencies },
  { id: 'shipping', label: '物流方式', source: 'src/mock/shop.ts', data: shippingMethods },
  { id: 'recipes', label: '五运六气食谱', source: 'src/mock/wuyun.ts', data: DIET_RECIPES },
]

const activeId = ref(datasets[0].id)
const active = computed(() => datasets.find((d) => d.id === activeId.value) || datasets[0])

const draft = ref('')
const hasOverride = ref(false)

function overrideKey(id: string) {
  return `qh_mock_override_${id}`
}

function hasOverrideFor(id: string) {
  return !!localStorage.getItem(overrideKey(id))
}

function selectDataset(id: string) {
  activeId.value = id
  loadDraft()
}

function loadDraft() {
  const saved = localStorage.getItem(overrideKey(active.value.id))
  hasOverride.value = !!saved
  draft.value = saved ?? JSON.stringify(active.value.data, null, 2)
}

function saveOverride() {
  try {
    JSON.parse(draft.value)
  } catch {
    ElMessage.error('JSON 格式有误，请检查后再保存')
    return
  }
  localStorage.setItem(overrideKey(active.value.id), draft.value)
  hasOverride.value = true
  ElMessage.success(`已保存「${active.value.label}」的数据覆盖`)
}

function clearOverride() {
  localStorage.removeItem(overrideKey(active.value.id))
  hasOverride.value = false
  draft.value = JSON.stringify(active.value.data, null, 2)
  ElMessage.success(`已恢复「${active.value.label}」的内置数据`)
}

loadDraft()
</script>

<template>
  <div class="mock-page">
    <el-alert
      type="info"
      :closable="false"
      show-icon
      title="Mock 数据管理"
      description="覆盖版本写入 localStorage（键 qh_mock_override_*），供联调脚本与 API 适配层读取；清除后恢复源码内置数据。"
      class="page-alert"
    />

    <div class="mock-body">
      <div class="mock-list">
        <el-table :data="datasets" height="100%" highlight-current-row @row-click="(row: Dataset) => selectDataset(row.id)">
          <el-table-column prop="label" label="数据集" min-width="110" />
          <el-table-column label="条目" width="70" align="center">
            <template #default="{ row }">{{ countOf(row.data) }}</template>
          </el-table-column>
          <el-table-column label="覆盖" width="60" align="center">
            <template #default="{ row }">
              <el-tag v-if="hasOverrideFor(row.id)" type="warning" size="small">有</el-tag>
              <span v-else class="muted">—</span>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <div class="mock-editor">
        <div class="editor-head">
          <div>
            <span class="editor-title">{{ active.label }}</span>
            <span class="editor-source">{{ active.source }}</span>
          </div>
          <div class="editor-actions">
            <el-button size="small" @click="clearOverride" :disabled="!hasOverride">清除覆盖</el-button>
            <el-button size="small" type="primary" @click="saveOverride">保存覆盖</el-button>
          </div>
        </div>
        <el-input
          v-model="draft"
          type="textarea"
          :rows="24"
          class="json-area"
          spellcheck="false"
          :input-style="{ fontFamily: 'Consolas, Menlo, monospace', fontSize: '12px' }"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.mock-page {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 560px;
}

.page-alert {
  margin-bottom: 16px;
}

.mock-body {
  flex: 1;
  display: flex;
  gap: 16px;
  min-height: 0;
}

.mock-list {
  width: 300px;
  flex-shrink: 0;
}

.mock-editor {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 16px;
}

.editor-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.editor-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--color-text-primary);
  margin-right: 10px;
}

.editor-source {
  font-size: 12px;
  color: var(--color-text-secondary);
}

.editor-actions {
  display: flex;
  gap: 8px;
}

.json-area {
  flex: 1;
}

.muted {
  color: var(--color-text-secondary);
}

@media (max-width: 1080px) {
  .mock-body {
    flex-direction: column;
  }
  .mock-list {
    width: 100%;
    max-height: 260px;
  }
}
</style>
