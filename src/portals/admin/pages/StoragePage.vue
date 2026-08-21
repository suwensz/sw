<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAdminStore } from '@/stores/admin'

const { t } = useI18n()
const admin = useAdminStore()

const totalUsed = computed(() => admin.storage.reduce((s, r) => s + r.used, 0))
const totalFiles = computed(() => admin.storage.reduce((s, r) => s + r.files, 0))
const quota = 20 // GB 总量

const totalPercent = computed(() => Math.min(100, Math.round((totalUsed.value / quota) * 100)))

const ICON_MAP: Record<string, string> = {
  商品图片: 'Picture',
  视频素材: 'VideoPlay',
  文档附件: 'FolderOpened',
  语音播报缓存: 'Microphone',
  备份数据: 'Files',
}

function icon(type: string) {
  return ICON_MAP[type] || 'Coin'
}
</script>

<template>
  <div class="portal-page">
    <h2>{{ t('admin.menu.storage') }}</h2>
    <p class="portal-stat-desc">平台存储资源占用情况与清理建议。</p>

    <div class="portal-stat-grid">
      <div class="portal-stat-card">
        <div class="portal-stat-label">{{ t('admin.storage.used') }}</div>
        <div class="portal-stat-value">{{ totalUsed.toFixed(1) }} GB</div>
        <div class="portal-stat-desc">{{ quota }} GB 总量 · {{ totalPercent }}%</div>
      </div>
      <div class="portal-stat-card">
        <div class="portal-stat-label">{{ t('admin.storage.files') }}</div>
        <div class="portal-stat-value">{{ totalFiles.toLocaleString() }}</div>
        <div class="portal-stat-desc">全部资源文件数</div>
      </div>
    </div>

    <el-card shadow="never">
      <template #header><b>{{ t('admin.storage.mediaType') }}</b></template>
      <el-table :data="admin.storage">
        <el-table-column :label="t('admin.storage.mediaType')" min-width="180">
          <template #default="{ row }">
            <el-icon style="color: var(--color-primary); vertical-align: -2px"><component :is="icon(row.type)" /></el-icon>
            <span style="margin-left: 6px">{{ row.type }}</span>
          </template>
        </el-table-column>
        <el-table-column :label="t('admin.storage.used')" min-width="260">
          <template #default="{ row }">
            <el-progress
              :percentage="Math.min(100, Math.round((row.used / quota) * 100))"
              :stroke-width="12"
              :format="() => `${row.used} GB`"
            />
          </template>
        </el-table-column>
        <el-table-column prop="files" :label="t('admin.storage.files')" width="120" />
      </el-table>
      <el-alert
        :title="t('admin.storage.cleanTip') + '：视频素材与备份数据占用较高，建议清理 30 天前的临时缓存。'"
        type="info"
        :closable="false"
        show-icon
        style="margin-top: 16px"
      />
    </el-card>
  </div>
</template>
