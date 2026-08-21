<script setup lang="ts">
// 素衡OS 全系统总唤醒弹层
// 「素衡素衡」唤醒词（或导航栏手动唤醒）触发：
// 接收指令 → 智能体逐个点亮 → 全部在线 + 系统内容统计 + 快捷入口
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { WAKE_EVENT } from '@/composables/useWakeWord'
import { SYSTEM_AGENTS, AGENT_GROUPS, systemContentStats } from '@/mock/agents'
import { tText } from '@/i18n'
import { speak } from '@/composables/useSpeech'

const router = useRouter()
const { t, locale } = useI18n()

const visible = ref(false)
const phase = ref<'idle' | 'receiving' | 'activating' | 'online'>('idle')
const activatedCount = ref(0)

const stats = systemContentStats()
let timers: number[] = []

function agentName(a: (typeof SYSTEM_AGENTS)[number]): string {
  return tText(a.name, locale.value as any)
}

const onlineCount = computed(() =>
  Math.min(activatedCount.value, SYSTEM_AGENTS.length),
)

function startWake() {
  timers.forEach((id) => window.clearTimeout(id))
  timers = []
  visible.value = true
  phase.value = 'receiving'
  activatedCount.value = 0

  // 阶段一：接收指令（雷达动画）
  timers.push(
    window.setTimeout(() => {
      phase.value = 'activating'
      // 阶段二：智能体逐个点亮
      SYSTEM_AGENTS.forEach((_, i) => {
        timers.push(
          window.setTimeout(() => {
            activatedCount.value = i + 1
            if (activatedCount.value >= SYSTEM_AGENTS.length) {
              phase.value = 'online'
              // 语音播报唤醒完成
              speak(t('wake.voiceAllOnline', { agents: SYSTEM_AGENTS.length }), { rate: 1.1 })
            }
          }, i * 110),
        )
      })
    }, 1100),
  )
}

function onWakeEvent() {
  startWake()
}

function goAgent(path: string) {
  close()
  router.push(path).catch(() => {})
}

function enterChat() {
  close()
  router.push('/chat').catch(() => {})
}

function close() {
  timers.forEach((id) => window.clearTimeout(id))
  timers = []
  visible.value = false
  phase.value = 'idle'
  activatedCount.value = 0
}

const contentStats = computed(() => [
  { icon: '🛍️', value: stats.crossBorderProducts, label: t('wake.statCross') },
  { icon: '📦', value: stats.domesticProducts, label: t('wake.statDomestic') },
  { icon: '📖', value: stats.knowledgeEntries, label: t('wake.statKnowledge') },
  { icon: '💬', value: stats.socialApps, label: t('wake.statSocial') },
  { icon: '🌍', value: stats.countries, label: t('wake.statCountries') },
  { icon: '🌐', value: stats.languages, label: t('wake.statLangs') },
  { icon: '🏬', value: stats.marketplaces + 3, label: t('wake.statPlatforms') },
])

onMounted(() => window.addEventListener(WAKE_EVENT, onWakeEvent))
onUnmounted(() => {
  window.removeEventListener(WAKE_EVENT, onWakeEvent)
  timers.forEach((id) => window.clearTimeout(id))
})
</script>

<template>
  <Teleport to="body">
    <Transition name="wake-fade">
      <div v-if="visible" class="wake-overlay" @click.self="phase === 'online' && close()">
        <div class="wake-panel">
          <!-- 阶段一：接收唤醒指令 -->
          <div v-if="phase === 'receiving'" class="wake-receiving">
            <div class="radar">
              <span class="ring r1"></span>
              <span class="ring r2"></span>
              <span class="ring r3"></span>
              <div class="radar-core">
                <svg viewBox="0 0 80 80" fill="none">
                  <path d="M40 12 C28 24 28 44 40 68 C52 44 52 24 40 12Z" fill="currentColor" opacity="0.9"/>
                  <circle cx="40" cy="32" r="6" fill="#fff" opacity="0.85"/>
                </svg>
              </div>
            </div>
            <h2 class="wake-receive-title">{{ t('wake.receiveTitle') }}</h2>
            <p class="wake-receive-sub">{{ t('wake.receiveSub') }}</p>
          </div>

          <!-- 阶段二/三：智能体点亮 + 全部在线 -->
          <template v-else>
            <header class="wake-header">
              <div class="wake-title-row">
                <span class="wake-logo">
                  <svg viewBox="0 0 40 40" fill="none">
                    <path d="M20 6 C14 12 14 22 20 34 C26 22 26 12 20 6Z" fill="currentColor"/>
                  </svg>
                </span>
                <div>
                  <h2>{{ t('wake.allOnlineTitle') }}</h2>
                  <p>
                    <span class="online-count">{{ onlineCount }}</span> / {{ SYSTEM_AGENTS.length }}
                    {{ t('wake.allOnlineSuffix') }}
                    <span v-if="phase === 'activating'" class="waking-tag">{{ t('wake.activating') }}…</span>
                    <span v-else class="done-tag">✓ {{ t('wake.contentReady') }}</span>
                  </p>
                </div>
                <button class="wake-close-btn" @click="close">✕</button>
              </div>
              <div class="wake-progress">
                <div class="wake-progress-bar" :style="{ width: (onlineCount / SYSTEM_AGENTS.length) * 100 + '%' }"></div>
              </div>
            </header>

            <div class="agents-grid">
              <div
                v-for="(agent, i) in SYSTEM_AGENTS"
                :key="agent.id"
                :class="['agent-card', { online: i < activatedCount }]"
                @click="i < activatedCount && goAgent(agent.path)"
              >
                <span class="agent-icon">{{ agent.icon }}</span>
                <div class="agent-meta">
                  <div class="agent-name">
                    {{ agentName(agent) }}
                    <span
                      class="agent-status-dot"
                      :class="{ on: i < activatedCount }"
                    ></span>
                  </div>
                  <div class="agent-desc">{{ tText(agent.desc, locale as any) }}</div>
                </div>
                <span
                  v-for="g in AGENT_GROUPS.filter((g) => g.key === agent.group)"
                  :key="g.key"
                  class="agent-group-tag"
                  :style="{ color: g.color, borderColor: g.color + '66', background: g.color + '14' }"
                >{{ tText(g.label, locale as any) }}</span>
              </div>
            </div>

            <!-- 系统内容统计 -->
            <div v-if="phase === 'online'" class="wake-content">
              <div class="content-stats">
                <div v-for="s in contentStats" :key="s.label" class="content-stat">
                  <span class="cs-icon">{{ s.icon }}</span>
                  <span class="cs-value">{{ s.value }}</span>
                  <span class="cs-label">{{ s.label }}</span>
                </div>
              </div>
              <div class="wake-actions">
                <button class="wa-btn primary" @click="enterChat">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 11.5a8.5 8.5 0 0 1-8.5 8.5c-1.6 0-3.1-.4-4.4-1.2L3 20l1.2-5.1A8.5 8.5 0 1 1 21 11.5z"/>
                  </svg>
                  {{ t('wake.enterChat') }}
                </button>
                <button class="wa-btn ghost" @click="close">{{ t('wake.close') }}</button>
              </div>
              <p class="wake-hint">{{ t('wake.clickAgent') }}</p>
            </div>
          </template>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.wake-overlay {
  position: fixed;
  inset: 0;
  z-index: 3000;
  background: rgba(8, 15, 13, 0.72);
  backdrop-filter: blur(6px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}
.wake-panel {
  width: min(860px, 96vw);
  max-height: 88vh;
  overflow-y: auto;
  background: var(--color-bg-card, #fff);
  border-radius: 20px;
  padding: 28px 32px;
  box-shadow: 0 24px 80px rgba(0, 0, 0, 0.4);
}

/* ===== 阶段一：接收 ===== */
.wake-receiving {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 56px 0 48px;
}
.radar {
  position: relative;
  width: 140px;
  height: 140px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-primary, #1a6b5c);
}
.radar .ring {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 2px solid var(--color-primary, #1a6b5c);
  opacity: 0;
  animation: radar-ripple 1.5s ease-out infinite;
}
.radar .r2 { animation-delay: 0.4s; }
.radar .r3 { animation-delay: 0.8s; }
@keyframes radar-ripple {
  0% { transform: scale(0.35); opacity: 0.9; }
  100% { transform: scale(1.15); opacity: 0; }
}
.radar-core {
  width: 84px;
  height: 84px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--color-primary, #1a6b5c), var(--color-primary-light, #2e9382));
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  box-shadow: 0 0 32px color-mix(in srgb, var(--color-primary, #1a6b5c) 55%, transparent);
}
.radar-core svg { width: 44px; height: 44px; }
.wake-receive-title {
  margin: 28px 0 8px;
  font-size: 24px;
  color: var(--color-text-primary, #1f2937);
}
.wake-receive-sub {
  margin: 0;
  font-size: 14px;
  color: var(--color-text-secondary, #6b7280);
}

/* ===== 阶段二/三 ===== */
.wake-header { margin-bottom: 18px; }
.wake-title-row {
  display: flex;
  align-items: center;
  gap: 14px;
}
.wake-logo {
  width: 46px;
  height: 46px;
  border-radius: 14px;
  background: linear-gradient(135deg, var(--color-primary, #1a6b5c), var(--color-primary-light, #2e9382));
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.wake-logo svg { width: 26px; height: 26px; }
.wake-title-row h2 {
  margin: 0;
  font-size: 20px;
  color: var(--color-text-primary, #1f2937);
}
.wake-title-row p {
  margin: 2px 0 0;
  font-size: 13px;
  color: var(--color-text-secondary, #6b7280);
}
.online-count {
  font-size: 18px;
  font-weight: 700;
  color: var(--color-primary, #1a6b5c);
}
.waking-tag { color: #b45309; margin-left: 8px; font-weight: 500; }
.done-tag { color: #15803d; margin-left: 8px; font-weight: 500; }
.wake-close-btn {
  margin-left: auto;
  width: 34px;
  height: 34px;
  border-radius: 10px;
  border: none;
  background: var(--color-bg-soft, #f3f4f6);
  color: var(--color-text-secondary, #6b7280);
  cursor: pointer;
  font-size: 15px;
  transition: all 0.2s;
}
.wake-close-btn:hover { background: rgba(217, 107, 92, 0.12); color: var(--color-danger, #d96b5c); }
.wake-progress {
  margin-top: 14px;
  height: 5px;
  border-radius: 3px;
  background: var(--color-bg-soft, #f3f4f6);
  overflow: hidden;
}
.wake-progress-bar {
  height: 100%;
  border-radius: 3px;
  background: linear-gradient(90deg, var(--color-primary, #1a6b5c), var(--color-primary-light, #2e9382));
  transition: width 0.12s ease;
}

/* 智能体网格 */
.agents-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}
.agent-card {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid var(--color-border, #e5e7eb);
  background: var(--color-bg, #fafafa);
  opacity: 0.38;
  filter: grayscale(0.7);
  cursor: default;
  transition: opacity 0.35s ease, filter 0.35s ease, border-color 0.2s, box-shadow 0.2s;
  position: relative;
}
.agent-card.online {
  opacity: 1;
  filter: none;
  cursor: pointer;
  border-color: color-mix(in srgb, var(--color-primary, #1a6b5c) 30%, var(--color-border, #e5e7eb));
}
.agent-card.online:hover {
  border-color: var(--color-primary, #1a6b5c);
  box-shadow: 0 3px 14px color-mix(in srgb, var(--color-primary, #1a6b5c) 18%, transparent);
  transform: translateY(-1px);
}
.agent-icon {
  font-size: 24px;
  flex-shrink: 0;
  width: 40px;
  text-align: center;
}
.agent-meta { flex: 1; min-width: 0; }
.agent-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-primary, #1f2937);
  display: flex;
  align-items: center;
  gap: 6px;
}
.agent-status-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--color-border, #d1d5db);
  flex-shrink: 0;
}
.agent-status-dot.on {
  background: #22c55e;
  box-shadow: 0 0 6px rgba(34, 197, 94, 0.8);
  animation: dot-pulse 1.8s ease-in-out infinite;
}
@keyframes dot-pulse {
  0%, 100% { box-shadow: 0 0 4px rgba(34, 197, 94, 0.6); }
  50% { box-shadow: 0 0 10px rgba(34, 197, 94, 1); }
}
.agent-desc {
  font-size: 11px;
  color: var(--color-text-secondary, #6b7280);
  margin-top: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.agent-group-tag {
  position: absolute;
  top: 8px;
  right: 10px;
  font-size: 9px;
  font-weight: 500;
  padding: 1px 6px;
  border-radius: 8px;
  border: 1px solid;
  white-space: nowrap;
}

/* 内容统计 + 操作 */
.wake-content { margin-top: 18px; }
.content-stats {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 8px;
}
.content-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 12px 4px 10px;
  border-radius: 12px;
  background: var(--color-bg-soft, #f6f7f8);
  border: 1px solid var(--color-border, #e5e7eb);
}
.cs-icon { font-size: 18px; }
.cs-value {
  font-size: 19px;
  font-weight: 700;
  color: var(--color-primary, #1a6b5c);
}
.cs-label {
  font-size: 10px;
  color: var(--color-text-secondary, #6b7280);
}
.wake-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
  margin-top: 18px;
}
.wa-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 11px 26px;
  border-radius: 999px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  border: none;
  transition: all 0.2s;
}
.wa-btn.primary {
  background: var(--color-primary, #1a6b5c);
  color: #fff;
}
.wa-btn.primary:hover { background: var(--color-primary-light, #2e9382); }
.wa-btn.ghost {
  background: transparent;
  color: var(--color-text-secondary, #6b7280);
  border: 1px solid var(--color-border, #e5e7eb);
}
.wa-btn.ghost:hover { color: var(--color-text-primary, #1f2937); border-color: var(--color-text-secondary, #9ca3af); }
.wake-hint {
  text-align: center;
  font-size: 12px;
  color: var(--color-text-secondary, #9ca3af);
  margin: 12px 0 0;
}

/* 过渡 */
.wake-fade-enter-active,
.wake-fade-leave-active { transition: opacity 0.3s ease; }
.wake-fade-enter-from,
.wake-fade-leave-to { opacity: 0; }

@media (max-width: 640px) {
  .agents-grid { grid-template-columns: 1fr; }
  .content-stats { grid-template-columns: repeat(4, 1fr); }
}
</style>
