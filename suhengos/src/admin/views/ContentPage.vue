<script setup lang="ts">
import { computed, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { useAdminStore } from '@/stores/admin'

const admin = useAdminStore()
const filter = ref<'all' | 'pending' | 'approved' | 'rejected'>('pending')

const moduleLabels: Record<string, string> = {
  shop: '电商',
  health: '健康',
  ops: '运营',
  ui: '界面',
}

const statusMeta: Record<string, { label: string; type: 'info' | 'success' | 'danger' }> = {
  pending: { label: '待审核', type: 'info' },
  approved: { label: '已通过', type: 'success' },
  rejected: { label: '已驳回', type: 'danger' },
}

const filtered = computed(() => admin.contentReviews.filter((c) => filter.value === 'all' || c.status === filter.value))

function approve(id: string) {
  admin.reviewContent(id, 'approved')
  ElMessage.success('已通过该条翻译')
}

function reject(id: string) {
  admin.reviewContent(id, 'rejected')
  ElMessage.warning('已驳回该条翻译')
}
</script>

<template>
  <div class="content-page">
    <el-card shadow="never">
      <template #header>
        <div class="toolbar">
          <div class="toolbar-left">
            <el-radio-group v-model="filter">
              <el-radio-button value="pending">待审核（{{ admin.stats.pendingReviews }}）</el-radio-button>
              <el-radio-button value="approved">已通过</el-radio-button>
              <el-radio-button value="rejected">已驳回</el-radio-button>
              <el-radio-button value="all">全部</el-radio-button>
            </el-radio-group>
          </div>
          <span class="locale-hint">支持 12 语言：zh / en / ja / ko / es / fr / ar / id / ms / vi / th / fil</span>
        </div>
      </template>

      <div v-if="filtered.length === 0" class="empty">
        <el-empty description="暂无待审核内容" />
      </div>

      <div v-else class="review-list">
        <div v-for="item in filtered" :key="item.id" class="review-card">
          <div class="review-head">
            <div class="review-tags">
              <el-tag size="small" effect="plain">{{ moduleLabels[item.module] }}</el-tag>
              <el-tag size="small" type="warning" effect="plain">{{ item.locale.toUpperCase() }}</el-tag>
              <span class="review-key">{{ item.key }}</span>
            </div>
            <el-tag :type="statusMeta[item.status].type" size="small">{{ statusMeta[item.status].label }}</el-tag>
          </div>
          <div class="review-body">
            <div class="text-row">
              <span class="text-label">源文</span>
              <p class="text-content">{{ item.sourceText }}</p>
            </div>
            <div class="text-row">
              <span class="text-label">译文</span>
              <p class="text-content" :dir="item.locale === 'ar' ? 'rtl' : 'ltr'">{{ item.translatedText }}</p>
            </div>
          </div>
          <div v-if="item.status === 'pending'" class="review-actions">
            <span class="review-time">提交于 {{ item.submittedAt.slice(0, 10) }}</span>
            <div class="btns">
              <el-button size="small" type="danger" plain @click="reject(item.id)">驳回</el-button>
              <el-button size="small" type="primary" @click="approve(item.id)">通过</el-button>
            </div>
          </div>
        </div>
      </div>
    </el-card>
  </div>
</template>

<style scoped>
.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.locale-hint {
  font-size: 12px;
  color: var(--color-text-secondary);
}

.empty {
  padding: 32px 0;
}

.review-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.review-card {
  border: 1px solid var(--color-border);
  border-radius: 10px;
  padding: 16px 18px;
  background: var(--color-bg-card);
}

.review-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.review-tags {
  display: flex;
  align-items: center;
  gap: 8px;
}

.review-key {
  font-size: 12px;
  font-family: Consolas, Monaco, monospace;
  color: var(--color-text-secondary);
}

.review-body {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

@media (max-width: 900px) {
  .review-body {
    grid-template-columns: 1fr;
  }
}

.text-row {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.text-label {
  font-size: 11px;
  color: var(--color-text-secondary);
}

.text-content {
  margin: 0;
  font-size: 14px;
  line-height: 1.6;
  color: var(--color-text-primary);
  background: var(--color-bg-soft);
  border-radius: 6px;
  padding: 8px 12px;
}

.review-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 12px;
}

.review-time {
  font-size: 12px;
  color: var(--color-text-secondary);
}
</style>
