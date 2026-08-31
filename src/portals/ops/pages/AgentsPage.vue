<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElNotification } from 'element-plus'
import { AGENT_LIST, useAgentsStore } from '@/stores/agents'
import type { AgentId, AgentMeta, AgentGroup } from '@/stores/agents'
import { speakBroadcast } from '@/composables/useSpeech'
import AgentChatDialog from '@/components/AgentChatDialog.vue'
import type { Domain } from '@/services/knowledge'

/**
 * 智能体中心（运营端）
 * 按业务域分组展示：中医健康智能体 / 电商智能体。
 * 统一激活界面：一键激活/全部停用、逐个开关、运行状态与自动化覆盖率统计，
 * 状态持久化（localStorage）。
 * 内容对话框：中医健康（中医健康大数据）/ 跨境电商（采购信息数据库）/
 *             国内电商（淘宝、拼多多、京东数据库）——接入 DeepSeek/豆包/扣子免费版。
 */

const { t } = useI18n()
const store = useAgentsStore()

/** 内容对话框入口 */
const activeDialog = ref<Domain | null>(null)

const DIALOG_CARDS: Array<{ domain: Domain; titleKey: string; descKey: string; icon: string; color: string }> = [
  {
    domain: 'general',
    titleKey: 'portal.agentsCenter.dialogUnified',
    descKey: 'portal.agentsCenter.dialogUnifiedDesc',
    icon: 'ChatLineRound',
    color: '#1a6b5c',
  },
]

function isActive(id: AgentId): boolean {
  return store.isActive(id)
}

function onToggle(agent: AgentMeta, on: boolean) {
  store.setActive(agent.id, on)
  ElNotification({
    title: t(agent.nameKey),
    message: on ? t('portal.agentsCenter.active') : t('portal.agentsCenter.inactive'),
    type: on ? 'success' : 'info',
    duration: 2500,
    position: 'bottom-right',
  })
}

function onMasterActivate() {
  store.activateAll()
  ElNotification({
    title: t('portal.agentsCenter.title'),
    message: `${t('portal.agentsCenter.active')} · ${store.activeCount}/${store.totalCount}`,
    type: 'success',
    duration: 3000,
    position: 'bottom-right',
  })
  // 优雅女声播报：主人，我已经全部激活，请您耐心使用本智能体
  // （开关由接单智能体面板「语音播报」按键统一控制）
  speakBroadcast(t('portal.agentsCenter.activateVoice'))
}

function onMasterDeactivate() {
  store.deactivateAll()
  ElNotification({
    title: t('portal.agentsCenter.title'),
    message: t('portal.agentsCenter.inactive'),
    type: 'info',
    duration: 2500,
    position: 'bottom-right',
  })
}

const automationLabel = computed(() => `${store.automationRate}%`)

/* 智能体按业务域分组：中医健康智能体 / 电商智能体 */
const agentGroups = computed(() => {
  const groups: Array<{ id: AgentGroup; titleKey: string; icon: string; agents: AgentMeta[]; activeCount: number }> = []
  for (const g of ['tcm', 'ecom'] as AgentGroup[]) {
    const agents = AGENT_LIST.filter((a) => a.group === g)
    if (!agents.length) continue
    groups.push({
      id: g,
      titleKey: g === 'tcm' ? 'portal.agentsCenter.groupTcm' : 'portal.agentsCenter.groupEcom',
      icon: g === 'tcm' ? 'FirstAidKit' : 'ShoppingCart',
      agents,
      activeCount: agents.filter((a) => store.isActive(a.id)).length,
    })
  }
  return groups
})
</script>

<template>
  <div class="portal-page agents-page">
    <!-- 头部：一键激活 -->
    <header class="agents-hero">
      <div class="agents-hero-text">
        <h1 class="agents-hero-title">
          <el-icon :size="26" color="#d4a853"><Cpu /></el-icon>
          {{ t('portal.agentsCenter.title') }}
        </h1>
        <p class="agents-hero-subtitle">{{ t('portal.agentsCenter.subtitle') }}</p>
      </div>
      <div class="agents-hero-actions">
        <el-button
          v-if="!store.allActive"
          type="primary"
          size="large"
          round
          @click="onMasterActivate"
        >
          <el-icon><Open /></el-icon>
          {{ t('portal.agentsCenter.masterOn') }}
        </el-button>
        <el-button v-else size="large" round plain @click="onMasterDeactivate">
          <el-icon><TurnOff /></el-icon>
          {{ t('portal.agentsCenter.masterOff') }}
        </el-button>
      </div>
    </header>

    <!-- 统计 -->
    <section class="agents-stats">
      <div class="agents-stat">
        <div class="agents-stat-value">{{ store.activeCount }}<small>/{{ store.totalCount }}</small></div>
        <div class="agents-stat-label">{{ t('portal.agentsCenter.activatedLabel') }}</div>
      </div>
      <div class="agents-stat">
        <div class="agents-stat-value">{{ store.totalCount }}</div>
        <div class="agents-stat-label">{{ t('portal.agentsCenter.totalLabel') }}</div>
      </div>
      <div class="agents-stat">
        <div class="agents-stat-value agents-stat-accent">{{ automationLabel }}</div>
        <div class="agents-stat-label">{{ t('portal.agentsCenter.automationLabel') }}</div>
      </div>
      <div class="agents-progress">
        <el-progress
          :percentage="store.automationRate"
          :stroke-width="10"
          :color="'#1a6b5c'"
        />
      </div>
    </section>

    <!-- 内容对话框：中医健康 / 跨境电商 / 国内电商 -->
    <section class="agents-dialogs">
      <header class="agents-dialog-head">
        <div class="agents-dialog-title">
          <el-icon :size="18" color="#1a6b5c"><ChatLineRound /></el-icon>
          {{ t('portal.agentsCenter.dialogSection') }}
        </div>
        <el-tag size="small" effect="plain" type="success">{{ t('portal.agentsCenter.dialogSource') }}</el-tag>
      </header>
      <div class="agents-dialog-grid">
        <article
          v-for="card in DIALOG_CARDS"
          :key="card.domain"
          class="dialog-card"
          :style="{ '--accent': card.color }"
          @click="activeDialog = card.domain"
        >
          <span class="dialog-card-ico">
            <el-icon :size="24" color="#faf8f3"><component :is="card.icon" /></el-icon>
          </span>
          <div class="dialog-card-body">
            <div class="dialog-card-title">{{ t(card.titleKey) }}</div>
            <p class="dialog-card-desc">{{ t(card.descKey) }}</p>
          </div>
          <el-button size="small" type="primary" round class="dialog-card-btn">
            {{ t('portal.agentsCenter.dialogEnter') }}
            <el-icon><ArrowRight /></el-icon>
          </el-button>
        </article>
      </div>
    </section>

    <!-- 智能体分组卡片：中医健康智能体 / 电商智能体 -->
    <section v-for="group in agentGroups" :key="group.id" class="agents-group">
      <header class="agents-group-head">
        <div class="agents-group-title">
          <el-icon :size="18" color="#b8860b"><component :is="group.icon" /></el-icon>
          {{ t(group.titleKey) }}
        </div>
        <el-tag size="small" effect="plain" type="success">
          {{ group.activeCount }} / {{ group.agents.length }}
        </el-tag>
      </header>

      <div class="agents-grid">
        <article
          v-for="agent in group.agents"
          :key="agent.id"
          class="agent-item"
          :class="{ 'is-active': isActive(agent.id) }"
        >
          <div class="agent-item-icon" :style="{ background: agent.accent }">
            <el-icon :size="22" color="#faf8f3">
              <component :is="agent.icon" />
            </el-icon>
            <span v-if="isActive(agent.id)" class="agent-item-dot"></span>
          </div>
          <div class="agent-item-body">
            <div class="agent-item-name">
              {{ t(agent.nameKey) }}
              <el-tag size="small" :type="isActive(agent.id) ? 'success' : 'info'" effect="plain">
                {{ isActive(agent.id) ? t('portal.agentsCenter.active') : t('portal.agentsCenter.inactive') }}
              </el-tag>
            </div>
            <p class="agent-item-desc">{{ t(agent.descKey) }}</p>
            <div class="agent-item-status">
              <span v-if="isActive(agent.id)" class="status-running">
                <span class="status-dot"></span>
                {{ t('portal.agentsCenter.running') }}
              </span>
              <span v-else class="status-standby">{{ t('portal.agentsCenter.standby') }}</span>
            </div>
          </div>
          <el-switch
            :model-value="isActive(agent.id)"
            size="large"
            @change="(v: string | number | boolean) => onToggle(agent, !!v)"
          />
        </article>
      </div>
    </section>

    <!-- 内容对话框 -->
    <AgentChatDialog
      :model-value="activeDialog !== null"
      :domain="activeDialog ?? 'general'"
      @update:model-value="(v: boolean) => v || (activeDialog = null)"
    />
  </div>
</template>

<style scoped>
.agents-page {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

/* 头部 */
.agents-hero {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 22px 26px;
  border-radius: 16px;
  background: linear-gradient(135deg, #124d42, #1a6b5c);
  color: #faf8f3;
  box-shadow: 0 10px 28px rgba(18, 77, 66, 0.28);
}
.agents-hero-text {
  flex: 1;
  min-width: 0;
}
.agents-hero-title {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0;
  font-size: 22px;
  font-weight: 700;
}
.agents-hero-subtitle {
  margin: 8px 0 0;
  font-size: 13px;
  color: rgba(250, 248, 243, 0.78);
}
.agents-hero-actions {
  flex-shrink: 0;
}

/* 统计 */
.agents-stats {
  display: grid;
  grid-template-columns: repeat(3, 180px) 1fr;
  gap: 14px;
  align-items: stretch;
}
.agents-stat {
  background: #ffffff;
  border: 1px solid var(--color-border, #e4e7ed);
  border-radius: 14px;
  padding: 16px 18px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.agents-stat-value {
  font-size: 28px;
  font-weight: 800;
  color: #1a6b5c;
  line-height: 1.1;
}
.agents-stat-value small {
  font-size: 15px;
  font-weight: 600;
  color: var(--color-text-secondary, #909399);
}
.agents-stat-accent {
  color: #b8860b;
}
.agents-stat-label {
  font-size: 12px;
  color: var(--color-text-secondary, #909399);
}
.agents-progress {
  background: #ffffff;
  border: 1px solid var(--color-border, #e4e7ed);
  border-radius: 14px;
  padding: 16px 18px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

/* 内容对话框区块 */
.agents-dialogs {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.agents-dialog-head {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 2px 4px;
}
.agents-dialog-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 700;
  color: var(--color-text-primary, #303133);
}
.agents-dialog-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 14px;
}
.dialog-card {
  display: flex;
  align-items: center;
  gap: 14px;
  background: #ffffff;
  border: 1px solid var(--color-border, #e4e7ed);
  border-radius: 14px;
  padding: 16px;
  cursor: pointer;
  transition: box-shadow 0.2s ease, border-color 0.2s ease, transform 0.2s ease;
}
.dialog-card:hover {
  box-shadow: 0 6px 18px rgba(15, 43, 36, 0.1);
  border-color: var(--accent);
  transform: translateY(-2px);
}
.dialog-card-ico {
  flex-shrink: 0;
  width: 46px;
  height: 46px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--accent);
}
.dialog-card-body {
  flex: 1;
  min-width: 0;
}
.dialog-card-title {
  font-size: 15px;
  font-weight: 700;
  color: var(--color-text-primary, #303133);
}
.dialog-card-desc {
  margin: 4px 0 0;
  font-size: 12px;
  line-height: 1.5;
  color: var(--color-text-secondary, #909399);
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}
.dialog-card-btn {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  gap: 2px;
}

/* 分组 */
.agents-group {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.agents-group-head {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 2px 4px;
}
.agents-group-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 700;
  color: var(--color-text-primary, #303133);
}

/* 卡片网格 */
.agents-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 14px;
}
.agent-item {
  display: flex;
  align-items: center;
  gap: 14px;
  background: #ffffff;
  border: 1px solid var(--color-border, #e4e7ed);
  border-radius: 14px;
  padding: 16px;
  transition: box-shadow 0.2s ease, border-color 0.2s ease;
}
.agent-item:hover {
  box-shadow: 0 6px 18px rgba(15, 43, 36, 0.1);
}
.agent-item.is-active {
  border-color: rgba(26, 107, 92, 0.4);
}
.agent-item-icon {
  position: relative;
  flex-shrink: 0;
  width: 46px;
  height: 46px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.agent-item.is-active .agent-item-icon {
  box-shadow: 0 0 0 3px rgba(26, 107, 92, 0.15);
}
.agent-item-dot {
  position: absolute;
  top: -3px;
  right: -3px;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #2fa06e;
  border: 2px solid #ffffff;
}
.agent-item-body {
  flex: 1;
  min-width: 0;
}
.agent-item-name {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 700;
  color: var(--color-text-primary, #303133);
}
.agent-item-desc {
  margin: 4px 0 4px;
  font-size: 12px;
  line-height: 1.5;
  color: var(--color-text-secondary, #909399);
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}
.agent-item-status {
  font-size: 12px;
}
.status-running {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  color: #1a6b5c;
  font-weight: 600;
}
.status-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #2fa06e;
  animation: status-blink 1.6s ease-in-out infinite;
}
@keyframes status-blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.35; }
}
.status-standby {
  color: var(--color-text-secondary, #909399);
}

/* 响应式 */
@media (max-width: 900px) {
  .agents-stats {
    grid-template-columns: repeat(3, 1fr);
  }
  .agents-progress {
    grid-column: 1 / -1;
  }
}
@media (max-width: 640px) {
  .agents-hero {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
