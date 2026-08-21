<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'

export interface PortalMenuItem {
  label: string
  /** i18n key：设置后优先于 label 渲染，实现多语言切换 */
  labelKey?: string
  to: string
  icon?: string
}

export interface PortalMenuGroup {
  label: string
  labelKey?: string
  items: PortalMenuItem[]
}

const props = withDefaults(
  defineProps<{
    title: string
    subtitle?: string
    groups: PortalMenuGroup[]
    portalTag?: string
    /** 右上角显示多国语言选择栏 */
    showLangSwitch?: boolean
  }>(),
  {
    subtitle: '',
    portalTag: '内部门户',
    showLangSwitch: false,
  },
)

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

function onLogout() {
  authStore.logout()
  router.push('/login')
}

const currentTitle = computed(() => {
  const titleKey = route.meta.titleKey as string | undefined
  if (titleKey) return t(titleKey)
  const metaTitle = route.meta.title as string | undefined
  return metaTitle || route.name?.toString() || ''
})

const activeIndex = computed(() => route.path)

function goMainSite() {
  router.push('/')
}

function onMenuSelect(index: string) {
  if (index && index !== route.path) {
    router.push(index)
  }
}

function brandMark() {
  return props.title.slice(0, 1)
}
</script>

<template>
  <div class="portal-shell">
    <!-- 侧边栏 -->
    <aside class="portal-sidebar">
      <div class="portal-brand">
        <div class="portal-brand-logo">{{ brandMark() }}</div>
        <div class="portal-brand-text">
          <div class="portal-brand-name">{{ title }}</div>
          <div class="portal-brand-sub">{{ subtitle }}</div>
        </div>
      </div>

      <el-menu :default-active="activeIndex" @select="onMenuSelect">
        <template v-for="(group, gi) in groups" :key="gi">
          <div v-if="group.label || group.labelKey" class="portal-menu-group-label">
            {{ group.labelKey ? t(group.labelKey) : group.label }}
          </div>
          <template v-for="item in group.items" :key="item.to">
            <el-menu-item :index="item.to">
              <el-icon v-if="item.icon"><component :is="item.icon" /></el-icon>
              <span>{{ item.labelKey ? t(item.labelKey) : item.label }}</span>
            </el-menu-item>
          </template>
        </template>
      </el-menu>

      <div style="padding: 12px 18px; font-size: 12px; color: rgba(250,248,243,0.45)">
        {{ portalTag }} · Suheng OS
      </div>
    </aside>

    <!-- 主区域 -->
    <div class="portal-main">
      <header class="portal-header">
        <div class="portal-header-title">{{ currentTitle }}</div>
        <div class="portal-header-right">
          <!-- 多国语言选择栏（中东 / 东南亚等语种） -->
          <LanguageSwitcher v-if="showLangSwitch" />
          <span v-if="authStore.isLoggedIn" class="portal-user-tag">
            <el-icon><User /></el-icon>
            {{ authStore.user?.name }}
            <el-button size="small" text style="margin-left: 6px" @click="onLogout">
              {{ t('portal.auth.logout') }}
            </el-button>
          </span>
          <span v-else class="portal-user-tag">
            <el-icon><User /></el-icon>
            {{ portalTag }}{{ t('portal.layout.accountSuffix') }}
          </span>
          <el-button size="small" @click="goMainSite">
            <el-icon><Platform /></el-icon>
            <span>{{ t('portal.layout.backToMain') }}</span>
          </el-button>
        </div>
      </header>

      <main class="portal-content">
        <RouterView :key="route.path" />
      </main>
    </div>
  </div>
</template>
