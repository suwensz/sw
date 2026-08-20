<script setup lang="ts">
import { useRouter, useRoute } from 'vue-router'
import PortalLogin from '@/components/PortalLogin.vue'

const router = useRouter()
const route = useRoute()

function onLoginSuccess() {
  router.push((route.query.redirect as string) || { path: '/competitor' })
}
</script>

<template>
  <PortalLogin
    portal-name="运营端"
    subtitle="跨境电商运营工作台：竞品 / 供应链 / 需求 / 创意 / Listing"
    dev-hint="dev_user@coze.dev / dev123456"
    @success="onLoginSuccess"
  />
</template>
