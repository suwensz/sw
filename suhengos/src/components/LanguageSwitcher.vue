<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { setLocale, localeOptions, getLocale } from '@/i18n'
import type { LocaleCode } from '@/types'

const { locale } = useI18n()

const currentLabel = computed(() => {
  const opt = localeOptions.find((o) => o.code === getLocale())
  return opt ? opt.nativeLabel : ''
})

function handleCommand(code: string) {
  setLocale(code as LocaleCode)
  locale.value = code as LocaleCode
}
</script>

<template>
  <el-dropdown trigger="click" @command="handleCommand">
    <button class="lang-trigger">
      <el-icon><Promotion /></el-icon>
      <span>{{ currentLabel }}</span>
      <el-icon class="arrow"><ArrowDown /></el-icon>
    </button>
    <template #dropdown>
      <el-dropdown-menu>
        <el-dropdown-item
          v-for="opt in localeOptions"
          :key="opt.code"
          :command="opt.code"
          :class="{ 'is-active': opt.code === getLocale() }"
        >
          {{ opt.nativeLabel }}
        </el-dropdown-item>
      </el-dropdown-menu>
    </template>
  </el-dropdown>
</template>

<style scoped>
.lang-trigger {
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
.lang-trigger:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}
.lang-trigger .arrow {
  font-size: 12px;
}
:deep(.el-dropdown-menu__item.is-active) {
  color: var(--color-primary);
  font-weight: 600;
}
</style>
