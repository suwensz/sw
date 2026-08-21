<script setup lang="ts">
import { ElMessage } from 'element-plus'
import { useI18n } from 'vue-i18n'
import { SEED_SDK } from '@/mock/devData'

const { t } = useI18n()

function download(lang: string) {
  ElMessage.success(`${lang} SDK ${t('dev.sdk.download')} ✓`)
}
</script>

<template>
  <div class="portal-page">
    <h2>{{ t('dev.menu.sdk') }}</h2>
    <p class="portal-stat-desc">多语言 SDK，覆盖主流开发环境，已内置全部开放接口封装。</p>

    <div class="sdk-grid">
      <el-card
        v-for="sdk in SEED_SDK"
        :key="sdk.lang"
        shadow="hover"
        class="sdk-card"
      >
        <div class="sdk-head">
          <span class="sdk-icon">{{ sdk.icon }}</span>
          <div class="sdk-lang">{{ sdk.lang }}</div>
        </div>
        <div class="sdk-meta">
          <el-tag size="small" effect="plain">{{ sdk.version }}</el-tag>
          <span class="sdk-size">{{ sdk.size }}</span>
        </div>
        <div class="sdk-notes">{{ sdk.notes }}</div>
        <el-button type="primary" style="width: 100%; margin-top: 12px" @click="download(sdk.lang)">
          <el-icon><Download /></el-icon> {{ t('dev.sdk.download') }}
        </el-button>
      </el-card>
    </div>
  </div>
</template>

<style scoped>
.sdk-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 16px;
}
.sdk-card {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}
.sdk-head {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}
.sdk-icon {
  font-size: 26px;
}
.sdk-lang {
  font-weight: 600;
  color: var(--color-text-primary);
}
.sdk-meta {
  display: flex;
  align-items: center;
  gap: 8px;
}
.sdk-size {
  font-size: 12px;
  color: var(--color-text-secondary);
}
.sdk-notes {
  font-size: 12px;
  color: var(--color-text-secondary);
  margin-top: 6px;
  min-height: 34px;
}
</style>
