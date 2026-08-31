<script setup lang="ts">
import { computed } from 'vue'
import { ElMessage } from 'element-plus'
import { useI18n } from 'vue-i18n'
import { useAgentsStore, AGENT_LIST } from '@/stores/agents'
import LlmServiceConfig from '@/components/LlmServiceConfig.vue'

const { t } = useI18n()
const agents = useAgentsStore()

const tcmAgents = computed(() => AGENT_LIST.filter((a) => a.group === 'tcm'))
const ecomAgents = computed(() => AGENT_LIST.filter((a) => a.group === 'ecom'))

function activateAll() {
  agents.activateAll()
  ElMessage.success(t('admin.agentConfig.activateAll') + ' ✓')
}

function deactivateAll() {
  agents.deactivateAll()
  ElMessage.success(t('admin.agentConfig.deactivateAll'))
}
</script>

<template>
  <div class="portal-page">
    <div class="portal-page-head">
      <h2 style="margin: 0">{{ t('admin.menu.agentConfig') }}</h2>
      <div>
        <el-button size="small" type="primary" @click="activateAll">
          <el-icon><VideoPlay /></el-icon> {{ t('admin.agentConfig.activateAll') }}
        </el-button>
        <el-button size="small" @click="deactivateAll">
          <el-icon><VideoPause /></el-icon> {{ t('admin.agentConfig.deactivateAll') }}
        </el-button>
      </div>
    </div>
    <p class="portal-stat-desc">与运营端「智能体中心」实时联动，激活状态全局共享。</p>

    <div class="portal-stat-grid">
      <div class="portal-stat-card">
        <div class="portal-stat-label">{{ t('admin.agentConfig.activeCount') }}</div>
        <div class="portal-stat-value">{{ agents.activeCount }} / {{ agents.totalCount }}</div>
        <div class="portal-stat-desc">{{ t('admin.agentConfig.subtitle') }}</div>
      </div>
      <div class="portal-stat-card">
        <div class="portal-stat-label">{{ t('admin.agentConfig.automationRate') }}</div>
        <div class="portal-stat-value">{{ agents.automationRate }}%</div>
        <el-progress
          :percentage="agents.automationRate"
          :stroke-width="8"
          :color="agents.automationRate > 60 ? '#1a6b5c' : '#d4a853'"
          style="margin-top: 8px"
        />
      </div>
    </div>

    <el-divider content-position="left">{{ t('portal.agentsCenter.groupTcm') }}</el-divider>
    <div class="agent-grid">
      <div v-for="a in tcmAgents" :key="a.id" class="agent-card">
        <div class="agent-icon" :style="{ background: a.accent + '1a', color: a.accent }">
          <el-icon :size="20"><component :is="a.icon" /></el-icon>
        </div>
        <div class="agent-info">
          <div class="agent-name">{{ t(a.nameKey) }}</div>
          <div class="agent-desc">{{ t(a.descKey) }}</div>
        </div>
        <div class="agent-dot" :class="{ on: agents.isActive(a.id) }" />
        <el-switch :model-value="agents.isActive(a.id)" size="small" @change="(v: string | number | boolean) => agents.setActive(a.id, !!v)" />
      </div>
    </div>

    <el-divider content-position="left">{{ t('portal.agentsCenter.groupEcom') }}</el-divider>
    <div class="agent-grid">
      <div v-for="a in ecomAgents" :key="a.id" class="agent-card">
        <div class="agent-icon" :style="{ background: a.accent + '1a', color: a.accent }">
          <el-icon :size="20"><component :is="a.icon" /></el-icon>
        </div>
        <div class="agent-info">
          <div class="agent-name">{{ t(a.nameKey) }}</div>
          <div class="agent-desc">{{ t(a.descKey) }}</div>
        </div>
        <div class="agent-dot" :class="{ on: agents.isActive(a.id) }" />
        <el-switch :model-value="agents.isActive(a.id)" size="small" @change="(v: string | number | boolean) => agents.setActive(a.id, !!v)" />
      </div>
    </div>

    <!-- AI 服务配置（全局共享）：管理端可编辑；被开发端锁定时只读 -->
    <el-divider content-position="left">{{ t('admin.menu.agentConfig') }} · AI</el-divider>
    <LlmServiceConfig />
  </div>
</template>

<style scoped>
.agent-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 12px;
  margin-bottom: 8px;
}
.agent-card {
  display: flex;
  align-items: center;
  gap: 12px;
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 14px;
  background: var(--color-bg-card);
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}
.agent-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 20px rgba(26, 107, 92, 0.12);
}
.agent-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.agent-info {
  flex: 1;
  min-width: 0;
}
.agent-name {
  font-weight: 600;
  font-size: 14px;
  color: var(--color-text-primary);
}
.agent-desc {
  font-size: 12px;
  color: var(--color-text-secondary);
  margin-top: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.agent-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #ccc;
  flex-shrink: 0;
}
.agent-dot.on {
  background: #22c55e;
  box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.2);
}
</style>
