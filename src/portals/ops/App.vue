<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import PortalLayout from '@/portals/common/PortalLayout.vue'
import OrderAgentWidget from './components/OrderAgentWidget.vue'
import { opsMenuGroups } from './menu'

const route = useRoute()

const portalMeta = {
  title: '素衡OS 运营端',
  subtitle: 'Operations Console',
  portalTag: '运营端',
}

// 登录页独立全屏渲染（不套门户布局与悬浮球）
const isAuthPage = computed(() => route.path === '/login')
</script>

<template>
  <RouterView v-if="isAuthPage" />
  <template v-else>
    <PortalLayout
      :title="portalMeta.title"
      :subtitle="portalMeta.subtitle"
      :groups="opsMenuGroups"
      :portal-tag="portalMeta.portalTag"
      show-lang-switch
    />
    <!-- 右下角：接单提醒智能体 -->
    <OrderAgentWidget />
  </template>
</template>
