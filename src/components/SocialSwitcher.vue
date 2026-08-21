<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useSocialStore } from '@/stores/social'
import { SOCIAL_APPS, SOCIAL_APP_MAP } from '@/mock/socialData'
import { tText } from '@/i18n'
import type { SocialAppId } from '@/types'

const { t } = useI18n()
const social = useSocialStore()

const currentLabel = computed(() => {
  if (social.state.activeApp === 'all') return t('social.allApps')
  const app = SOCIAL_APP_MAP[social.state.activeApp as SocialAppId]
  return app ? tText(app.name) : ''
})

const currentColor = computed(() =>
  social.state.activeApp === 'all' ? 'var(--color-primary)' : SOCIAL_APP_MAP[social.state.activeApp as SocialAppId]?.color,
)

function handleCommand(cmd: string) {
  social.setActiveApp(cmd as SocialAppId | 'all')
  // 选择具体社交软件后，弹出与该软件客户的聊天窗口
  if (cmd !== 'all') social.openChat(cmd as SocialAppId)
}
</script>

<template>
  <el-dropdown trigger="click" @command="handleCommand">
    <button class="social-trigger" :title="t('social.switchTitle')">
      <span class="social-dot" :style="{ background: currentColor }"></span>
      <el-icon><ChatDotRound /></el-icon>
      <span class="social-label">{{ currentLabel }}</span>
      <el-icon class="arrow"><ArrowDown /></el-icon>
    </button>
    <template #dropdown>
      <el-dropdown-menu class="social-menu">
        <el-dropdown-item command="all" :class="{ 'is-active': social.state.activeApp === 'all' }">
          🌍 {{ t('social.allApps') }}
        </el-dropdown-item>
        <el-dropdown-item
          v-for="app in SOCIAL_APPS"
          :key="app.id"
          :command="app.id"
          :class="{ 'is-active': social.state.activeApp === app.id }"
        >
          <span class="app-dot" :style="{ background: app.color }"></span>
          {{ tText(app.name) }}
        </el-dropdown-item>
      </el-dropdown-menu>
    </template>
  </el-dropdown>
</template>

<style scoped>
.social-trigger {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border-radius: 999px;
  border: 1px solid var(--color-border);
  background: var(--color-bg-card);
  color: var(--color-text-regular);
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}
.social-trigger:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}
.social-dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  flex-shrink: 0;
}
.social-label {
  max-width: 90px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.social-trigger .arrow {
  font-size: 12px;
}
.app-dot {
  display: inline-block;
  width: 9px;
  height: 9px;
  border-radius: 50%;
  margin-right: 6px;
}
:deep(.el-dropdown-menu__item.is-active) {
  color: var(--color-primary);
  font-weight: 600;
}
</style>
