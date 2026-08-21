<script setup lang="ts">
import { computed, nextTick, onUnmounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useSocialStore } from '@/stores/social'
import { appCountries, COUNTRY_BUYER_NAMES, SOCIAL_APP_MAP } from '@/mock/socialData'
import { tText } from '@/i18n'
import type { SocialAppId } from '@/types'

const { t, locale } = useI18n()
const social = useSocialStore()

const visible = computed({
  get: () => social.state.chatOpen,
  set: (v: boolean) => { if (!v) social.closeChat() },
})

const app = computed(() => SOCIAL_APP_MAP[social.state.chatApp as SocialAppId] ?? SOCIAL_APP_MAP.whatsapp)
const appColor = computed(() => app.value.color)
const productName = computed(() =>
  social.state.chatProduct ? tText(social.state.chatProduct.name, locale.value as any) : '',
)

interface Customer {
  id: string
  name: string
  country: string
  flag: string
  online: boolean
}
interface Msg {
  id: number
  from: 'me' | 'customer'
  text: string
  time: string
}

function hashCode(s: string): number {
  let h = 0
  for (const ch of s) h = (h * 31 + ch.charCodeAt(0)) % 100000
  return h
}

/** 该社交软件覆盖国家的客户列表（确定性生成） */
const customers = computed<Customer[]>(() => {
  return appCountries(app.value.id).slice(0, 8).map((c, i) => {
    const names = COUNTRY_BUYER_NAMES[c.code]
    const name = names
      ? names[(hashCode(app.value.id + c.code) + i) % names.length]
      : `Customer ${i + 1}`
    return {
      id: `${app.value.id}-${c.code}`,
      name,
      country: c.code,
      flag: c.flag,
      online: hashCode(c.code + app.value.id) % 3 !== 0,
    }
  })
})

const activeId = ref('')
const messages = ref<Record<string, Msg[]>>({})
const input = ref('')
const typing = ref(false)
const bodyRef = ref<HTMLElement | null>(null)
let msgId = 0
let replyTimer: ReturnType<typeof setTimeout> | null = null

const activeCustomer = computed(() => customers.value.find((c) => c.id === activeId.value))
const activeMsgs = computed<Msg[]>(() => messages.value[activeId.value] || [])

function nowTime(): string {
  const d = new Date()
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function greet(c: Customer): Msg[] {
  const time = nowTime()
  if (social.state.chatProduct) {
    return [{
      id: ++msgId,
      from: 'customer',
      text: t('social.custGreet', { app: tText(app.value.name, locale.value as any), product: productName.value }),
      time,
    }]
  }
  return [{ id: ++msgId, from: 'customer', text: t('social.custGreetNoProduct'), time }]
}

function selectCustomer(c: Customer) {
  if (replyTimer) { clearTimeout(replyTimer); replyTimer = null }
  typing.value = false
  activeId.value = c.id
  if (!messages.value[c.id]) messages.value[c.id] = greet(c)
  scrollBottom()
}

function replyPool(): string[] {
  const p = productName.value
  const base = [t('social.custReply2'), t('social.custReply3'), t('social.custReply4')]
  return p ? [t('social.custReply1', { product: p }), ...base] : base
}

function scrollBottom() {
  nextTick(() => {
    if (bodyRef.value) bodyRef.value.scrollTop = bodyRef.value.scrollHeight
  })
}

function send(text?: string) {
  const content = (text ?? input.value).trim()
  if (!content || !activeCustomer.value) return
  messages.value[activeId.value].push({ id: ++msgId, from: 'me', text: content, time: nowTime() })
  input.value = ''
  scrollBottom()
  // 模拟客户输入中 → 自动回复
  typing.value = true
  if (replyTimer) clearTimeout(replyTimer)
  replyTimer = setTimeout(() => {
    typing.value = false
    const pool = replyPool()
    const reply = pool[hashCode(activeId.value + msgId) % pool.length]
    if (messages.value[activeId.value]) {
      messages.value[activeId.value].push({ id: ++msgId, from: 'customer', text: reply, time: nowTime() })
    }
    scrollBottom()
  }, 1300)
}

const quickReplies = computed(() => [
  t('social.quickReply1'),
  t('social.quickReply2'),
  t('social.quickReply3'),
])

// 弹窗打开时初始化会话
watch(visible, (v) => {
  if (v) {
    activeId.value = ''
    messages.value = {}
    const first = customers.value[0]
    if (first) selectCustomer(first)
  } else {
    typing.value = false
    if (replyTimer) { clearTimeout(replyTimer); replyTimer = null }
  }
})

onUnmounted(() => {
  if (replyTimer) clearTimeout(replyTimer)
})
</script>

<template>
  <el-dialog
    v-model="visible"
    width="760px"
    :show-close="true"
    class="social-chat-dialog"
    :append-to-body="true"
  >
    <template #header>
      <div class="chat-header" :style="{ '--app-color': appColor }">
        <span class="app-badge" :style="{ background: appColor }">
          <el-icon><ChatDotRound /></el-icon>
        </span>
        <div class="header-text">
          <span class="header-title">{{ tText(app.name, locale as any) }} · {{ t('social.chatTitle') }}</span>
          <span class="header-sub">
            {{ t('social.customers') }} {{ customers.length }} · {{ activeCustomer ? activeCustomer.flag + ' ' + activeCustomer.name : '' }}
          </span>
        </div>
        <div v-if="social.state.chatProduct" class="header-product">
          <img :src="social.state.chatProduct.image" :alt="productName" />
          <span class="product-name">{{ productName }}</span>
        </div>
      </div>
    </template>

    <div class="chat-body">
      <!-- 客户列表 -->
      <aside class="customer-list">
        <p class="list-title">{{ t('social.customers') }}</p>
        <button
          v-for="c in customers"
          :key="c.id"
          :class="['customer-item', { active: c.id === activeId }]"
          @click="selectCustomer(c)"
        >
          <span class="customer-flag">{{ c.flag }}</span>
          <span class="customer-info">
            <span class="customer-name">{{ c.name }}</span>
            <span class="customer-country">{{ tText((appCountries(app.id).find(x => x.code === c.country))!.name, locale as any) }}</span>
          </span>
          <span :class="['online-dot', { on: c.online }]"></span>
        </button>
      </aside>

      <!-- 聊天窗口 -->
      <section class="chat-pane">
        <div v-if="activeCustomer" class="chat-top">
          <span class="chat-top-name">{{ activeCustomer.flag }} {{ activeCustomer.name }}</span>
          <span :class="['chat-top-status', { on: activeCustomer.online }]">
            {{ activeCustomer.online ? t('social.online') : t('social.offline') }}
          </span>
        </div>
        <div ref="bodyRef" class="chat-messages">
          <div
            v-for="m in activeMsgs"
            :key="m.id"
            :class="['msg-row', m.from]"
          >
            <div :class="['bubble', m.from]">
              <p class="msg-text">{{ m.text }}</p>
              <span class="msg-time">{{ m.time }}</span>
            </div>
          </div>
          <div v-if="typing && activeCustomer" class="msg-row customer">
            <div class="bubble customer typing-bubble">
              <span class="typing-text">{{ t('social.typing', { name: activeCustomer.name }) }}</span>
            </div>
          </div>
        </div>
        <div class="quick-replies">
          <button v-for="q in quickReplies" :key="q" class="quick-btn" @click="send(q)">{{ q }}</button>
        </div>
        <div class="chat-input-row">
          <el-input
            v-model="input"
            :placeholder="t('social.inputPlaceholder')"
            @keyup.enter="send()"
          />
          <button class="send-btn" :style="{ background: appColor }" @click="send()">
            <el-icon><Promotion /></el-icon>{{ t('social.send') }}
          </button>
        </div>
      </section>
    </div>
  </el-dialog>
</template>

<style scoped>
.chat-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding-right: 24px;
}
.app-badge {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 20px;
  flex-shrink: 0;
}
.header-text {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.header-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text-primary);
}
.header-sub {
  font-size: 12px;
  color: var(--color-text-secondary);
}
.header-product {
  display: flex;
  align-items: center;
  gap: 8px;
  max-width: 220px;
  padding: 4px 10px;
  background: var(--color-bg-soft);
  border-radius: 8px;
}
.header-product img {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  object-fit: cover;
}
.header-product .product-name {
  font-size: 12px;
  color: var(--color-text-regular);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.chat-body {
  display: grid;
  grid-template-columns: 200px 1fr;
  gap: 0;
  height: 460px;
  margin: -10px -20px -20px;
}

/* 客户列表 */
.customer-list {
  border-right: 1px solid var(--color-border);
  overflow-y: auto;
  padding: 8px;
  background: var(--color-bg-soft);
  border-radius: 8px 0 0 8px;
}
.list-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text-secondary);
  margin: 4px 6px 8px;
}
.customer-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  border: none;
  background: none;
  border-radius: 8px;
  cursor: pointer;
  text-align: left;
  transition: background 0.15s;
}
.customer-item:hover {
  background: var(--color-bg-card);
}
.customer-item.active {
  background: var(--color-bg-card);
  box-shadow: inset 0 0 0 1px var(--app-color, var(--color-primary));
}
.customer-flag {
  font-size: 20px;
  flex-shrink: 0;
}
.customer-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}
.customer-name {
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.customer-country {
  font-size: 11px;
  color: var(--color-text-secondary);
}
.online-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--color-text-placeholder);
  flex-shrink: 0;
}
.online-dot.on {
  background: var(--color-success);
}

/* 聊天窗 */
.chat-pane {
  display: flex;
  flex-direction: column;
  min-width: 0;
}
.chat-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  border-bottom: 1px solid var(--color-border);
}
.chat-top-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-primary);
}
.chat-top-status {
  font-size: 12px;
  color: var(--color-text-secondary);
}
.chat-top-status.on {
  color: var(--color-success);
}
.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.msg-row {
  display: flex;
}
.msg-row.me {
  justify-content: flex-end;
}
.bubble {
  max-width: 72%;
  padding: 8px 12px;
  border-radius: 12px;
}
.bubble.customer {
  background: var(--color-bg-soft);
  border-bottom-left-radius: 4px;
}
.bubble.me {
  background: var(--app-color, var(--color-primary));
  border-bottom-right-radius: 4px;
}
.bubble.me .msg-text,
.bubble.me .msg-time {
  color: #fff;
}
.msg-text {
  font-size: 13px;
  line-height: 1.6;
  margin: 0;
  color: var(--color-text-primary);
  word-break: break-word;
}
.msg-time {
  font-size: 10px;
  color: var(--color-text-secondary);
  display: block;
  margin-top: 3px;
  text-align: right;
}
.typing-bubble .typing-text {
  font-size: 12px;
  color: var(--color-text-secondary);
  animation: blink 1.2s infinite;
}
@keyframes blink {
  0%, 100% { opacity: 0.5; }
  50% { opacity: 1; }
}

.quick-replies {
  display: flex;
  gap: 8px;
  padding: 8px 16px 0;
  flex-wrap: wrap;
}
.quick-btn {
  padding: 4px 12px;
  font-size: 12px;
  border: 1px solid var(--color-border);
  border-radius: 999px;
  background: var(--color-bg-card);
  color: var(--color-text-regular);
  cursor: pointer;
  transition: all 0.15s;
}
.quick-btn:hover {
  border-color: var(--app-color, var(--color-primary));
  color: var(--app-color, var(--color-primary));
}
.chat-input-row {
  display: flex;
  gap: 10px;
  padding: 10px 16px 14px;
}
.chat-input-row .el-input {
  flex: 1;
}
.send-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 0 18px;
  border: none;
  border-radius: 8px;
  color: #fff;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: opacity 0.2s;
}
.send-btn:hover {
  opacity: 0.88;
}

@media (max-width: 768px) {
  .chat-body {
    grid-template-columns: 1fr;
    height: 520px;
  }
  .customer-list {
    max-height: 140px;
    border-right: none;
    border-bottom: 1px solid var(--color-border);
  }
}
</style>
