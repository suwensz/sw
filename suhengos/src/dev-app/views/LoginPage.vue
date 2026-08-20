<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import PortalLogin from '@/components/PortalLogin.vue'

const route = useRoute()
const router = useRouter()

const forbidden = computed(() => route.query.error === 'forbidden')

function onLoginSuccess() {
  router.push((route.query.redirect as string) || { path: '/mock' })
}
</script>

<template>
  <PortalLogin
    portal-name="开发端"
    subtitle="内部研发工作台：Mock 管理 / i18n 检查 / 环境日志 / Feature Flags"
    dev-hint="dev_dev@coze.dev / dev123456"
    @success="onLoginSuccess"
  />
  <div v-if="forbidden" class="forbidden-tip">当前账号无开发端权限（需要 dev 或 admin 角色）</div>
</template>

<style scoped>
.forbidden-tip {
  position: fixed;
  top: 18px;
  left: 50%;
  transform: translateX(-50%);
  padding: 8px 16px;
  font-size: 13px;
  color: #b45248;
  background: #fdf1f0;
  border: 1px solid #f3d6d3;
  border-radius: 8px;
}
</style>
