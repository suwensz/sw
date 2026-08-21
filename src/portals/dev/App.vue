<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import PortalLayout from '@/portals/common/PortalLayout.vue'
import VoiceAssistant from '@/components/VoiceAssistant.vue'
import { devMenuGroups } from './menu'

const route = useRoute()

const portalMeta = {
  title: '素衡OS 开发端',
  subtitle: 'Developer Console',
  portalTag: '开发端',
}

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
  />
  <!-- 全系统语音唤醒助手 -->
  <VoiceAssistant v-if="!isAuthPage" />
</template>
