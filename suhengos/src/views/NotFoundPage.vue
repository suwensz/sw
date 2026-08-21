<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'

const router = useRouter()
const { t } = useI18n()
</script>

<template>
  <div class="not-found">
    <div class="content qh-card">
      <div class="code">404</div>
      <h1>{{ t('common.notFound') }}</h1>
      <p>{{ t('common.notFoundDesc') }}</p>
      <el-button type="primary" size="large" @click="router.push('/')">
        {{ t('common.backHome') }}
      </el-button>
    </div>
  </div>
</template>

<style scoped>
.not-found {
  min-height: calc(100vh - 64px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}
.content {
  text-align: center;
  padding: 60px 48px;
  max-width: 480px;
}
.code {
  font-size: 96px;
  font-weight: 700;
  color: var(--color-primary);
  line-height: 1;
  margin-bottom: 16px;
  background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
h1 {
  font-size: 24px;
  margin: 0 0 8px;
}
p {
  color: var(--color-text-secondary);
  margin: 0 0 24px;
}
</style>
