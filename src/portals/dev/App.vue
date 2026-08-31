<script setup lang="ts">
import { computed, provide } from 'vue'
import { useRoute } from 'vue-router'
import PortalLayout from '@/portals/common/PortalLayout.vue'
import VoiceAssistant from '@/components/VoiceAssistant.vue'
import { PORTAL_META_KEY } from '@/portals/common/portalMeta'
import { devMenuGroups } from './menu'

const route = useRoute()

const portalMeta = {
  title: '素衡OS 开发端',
  subtitle: 'Developer Console',
  portalTag: '开发端',
}

provide(PORTAL_META_KEY, portalMeta)

// 登录页独立全屏渲染（不套门户布局）
const isAuthPage = computed(() => route.path === '/login')
</script>

<template>
  <RouterView v-if="isAuthPage" />
  <PortalLayout
    v-else
    :title="portalMeta.title"
    :subtitle="portalMeta.subtitle"
    :groups="devMenuGroups"
    :portal-tag="portalMeta.portalTag"
    show-lang-switch
  />
  <!-- 全系统语音唤醒助手 -->
  <VoiceAssistant v-if="!isAuthPage" />
</template>
