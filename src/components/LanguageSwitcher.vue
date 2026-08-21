<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { setLocale, localeOptions, langRegionOrder, getLocale } from '@/i18n'
import type { LocaleCode, LangRegion } from '@/types'

const { t } = useI18n()
const open = ref(false)
const rootEl = ref<HTMLElement | null>(null)

const current = computed(() => localeOptions.find((o) => o.code === getLocale()))

const currentLabel = computed(() => current.value?.nativeLabel || '')

/** 区域主题色 */
const regionColors: Record<LangRegion, string> = {
  mainland: '#de2910',
  hkmo: '#d4a853',
  mideast: '#2f6f4e',
  sea: '#3a7ca5',
  global: '#7c6cb0',
}

/** 按区域分组：保持 langRegionOrder 顺序 */
const grouped = computed(() =>
  langRegionOrder
    .map((region) => ({
      region,
      langs: localeOptions.filter((o) => o.region === region),
    }))
    .filter((g) => g.langs.length > 0),
)

function toggle() {
  open.value = !open.value
}

function handleCommand(code: string) {
  setLocale(code as LocaleCode)
  open.value = false
}

function onDocClick(e: MouseEvent) {
  if (open.value && rootEl.value && !rootEl.value.contains(e.target as Node)) {
    open.value = false
  }
}

onMounted(() => document.addEventListener('click', onDocClick))
onBeforeUnmount(() => document.removeEventListener('click', onDocClick))
</script>

<template>
  <div ref="rootEl" class="lang-switcher">
    <button class="lang-trigger" :title="t('langRegions.pickLang')" @click.stop="toggle">
      <el-icon><Promotion /></el-icon>
      <span>{{ currentLabel }}</span>
      <el-icon class="arrow" :class="{ up: open }"><ArrowDown /></el-icon>
    </button>

    <transition name="lang-pop">
      <div v-if="open" class="lang-panel">
        <div class="panel-header">{{ t('langRegions.pickLang') }}</div>
        <div class="panel-body">
          <div v-for="g in grouped" :key="g.region" class="region-block">
            <div class="region-label">
              <span class="region-dot" :style="{ background: regionColors[g.region] }"></span>
              {{ t(`langRegions.${g.region}`) }}
            </div>
            <div class="lang-grid">
              <button
                v-for="opt in g.langs"
                :key="opt.code"
                :class="['lang-item', { active: opt.code === getLocale() }]"
                @click="handleCommand(opt.code)"
              >
                <span class="lang-flag">{{ opt.flag }}</span>
                <span class="lang-name">{{ opt.nativeLabel }}</span>
                <span v-if="opt.code === getLocale()" class="lang-check">✓</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<style scoped>
.lang-switcher {
  position: relative;
  flex-shrink: 0;
}
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
  transition: transform 0.2s;
}
.lang-trigger .arrow.up {
  transform: rotate(180deg);
}

/* 区域分组下拉面板 */
.lang-panel {
  position: absolute;
  top: calc(100% + 10px);
  right: 0;
  width: 320px;
  max-height: 420px;
  overflow-y: auto;
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: 14px;
  box-shadow: 0 12px 36px rgba(0, 0, 0, 0.16);
  z-index: 900;
}
.panel-header {
  padding: 12px 16px;
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-primary);
  border-bottom: 1px solid var(--color-border);
  background: linear-gradient(135deg, rgba(26, 107, 92, 0.08), rgba(212, 168, 83, 0.08));
  border-radius: 14px 14px 0 0;
  position: sticky;
  top: 0;
  backdrop-filter: blur(6px);
}
.panel-body {
  padding: 8px 12px 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.region-block {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.region-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text-secondary);
  padding: 2px 4px;
}
.region-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}
.lang-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 6px;
}
.lang-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border: 1px solid transparent;
  border-radius: 10px;
  background: var(--color-bg-soft);
  color: var(--color-text-regular);
  font-size: 13px;
  cursor: pointer;
  text-align: left;
  transition: all 0.18s;
}
.lang-item:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
  transform: translateY(-1px);
}
.lang-item.active {
  background: rgba(26, 107, 92, 0.10);
  border-color: var(--color-primary);
  color: var(--color-primary);
  font-weight: 600;
}
.lang-flag {
  font-size: 15px;
  line-height: 1;
}
.lang-name {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.lang-check {
  font-size: 12px;
  color: var(--color-primary);
}

.lang-pop-enter-active,
.lang-pop-leave-active {
  transition: all 0.22s ease;
}
.lang-pop-enter-from,
.lang-pop-leave-to {
  opacity: 0;
  transform: translateY(-6px) scale(0.97);
}
</style>
