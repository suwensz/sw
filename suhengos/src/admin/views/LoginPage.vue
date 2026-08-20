<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import PortalLogin from '@/components/PortalLogin.vue'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const forbidden = computed(() => route.query.error === 'forbidden')

function onLoginSuccess() {
  if (auth.user?.role === 'admin') {
    router.push((route.query.redirect as string) || { name: 'AdminDashboard' })
  } else {
    auth.logout()
  }
}
</script>

<template>
  <div>
    <PortalLogin
      portal-name="管理端"
      subtitle="素衡OS 后台管理系统，仅限管理员账号"
      dev-hint="dev_admin@coze.dev / dev123456"
      @success="onLoginSuccess"
    />
    <div v-if="forbidden" class="forbidden-tip">
      <el-alert title="当前账号不是管理员，无法进入管理端" type="warning" show-icon :closable="false" />
    </div>
  </div>
</template>

<style scoped>
.forbidden-tip {
  position: fixed;
  top: 18px;
  left: 50%;
  transform: translateX(-50%);
  width: min(420px, 90vw);
}
</style>
