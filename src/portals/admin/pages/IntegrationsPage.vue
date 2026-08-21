<script setup lang="ts">
import { computed } from 'vue'
import { ElMessage } from 'element-plus'
import { useI18n } from 'vue-i18n'
import { useAdminStore } from '@/stores/admin'

const { t } = useI18n()
const admin = useAdminStore()

const connectedCount = computed(() => admin.integrations.filter((i) => i.connected).length)

function toggle(id: string) {
  admin.toggleIntegration(id)
  const target = admin.integrations.find((i) => i.id === id)
  if (target) {
    ElMessage.success(
      target.connected ? t('admin.integrations.connect') + ' ✓' : t('admin.integrations.disconnect'),
    )
  }
}
</script>

<template>
  <div class="portal-page">
    <h2>{{ t('admin.menu.integrations') }}</h2>
    <p class="portal-stat-desc">
      已连接 {{ connectedCount }} / {{ admin.integrations.length }} 个平台（{{ t('admin.integrations.platform') }}）。
    </p>

    <div class="integ-grid">
      <el-card
        v-for="item in admin.integrations"
        :key="item.id"
        shadow="hover"
        class="integ-card"
        :class="{ connected: item.connected }"
      >
        <div class="integ-head">
          <span class="integ-icon">{{ item.icon }}</span>
          <div>
            <div class="integ-name">{{ item.name }}</div>
            <div class="integ-desc">{{ item.desc }}</div>
          </div>
          <el-tag :type="item.connected ? 'success' : 'info'" size="small" effect="light" class="integ-tag">
            {{ item.connected ? t('admin.integrations.connected') : t('admin.integrations.disconnected') }}
          </el-tag>
        </div>
        <el-button
          :type="item.connected ? 'danger' : 'primary'"
          plain
          style="width: 100%; margin-top: 12px"
          @click="toggle(item.id)"
        >
          {{ item.connected ? t('admin.integrations.disconnect') : t('admin.integrations.connect') }}
        </el-button>
      </el-card>
    </div>
  </div>
</template>

<style scoped>
.integ-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}
.integ-card {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}
.integ-card.connected {
  border-color: rgba(26, 107, 92, 0.35);
}
.integ-head {
  display: flex;
  align-items: center;
  gap: 12px;
}
.integ-icon {
  font-size: 30px;
  flex-shrink: 0;
}
.integ-name {
  font-weight: 600;
  color: var(--color-text-primary);
}
.integ-desc {
  font-size: 12px;
  color: var(--color-text-secondary);
}
.integ-tag {
  margin-left: auto;
}
</style>
