<script setup lang="ts">
import { ref, nextTick, watch, computed, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Microphone, Mute } from '@element-plus/icons-vue'
import { useChatStore } from '@/stores/chat'
import { useAuthStore } from '@/stores/auth'
import { useCartStore } from '@/stores/cart'
import { suggestedQuestions } from '@/mock/conversation'
import { mockProducts } from '@/mock/products'
import { TCM_KNOWLEDGE, KNOWLEDGE_CATEGORY_DEFS, type KnowledgeCategory } from '@/mock/tcmKnowledge'
import { WAKE_EVENT, useWakeWord } from '@/composables/useWakeWord'
import { systemContentStats } from '@/mock/agents'
import { tText, getLocale } from '@/i18n'
import LanguageSwitcher from '@/components/LanguageSwitcher.vue'
import type { Product } from '@/types'

const router = useRouter()
const route = useRoute()
const { t, locale } = useI18n()
const chatStore = useChatStore()
const authStore = useAuthStore()
const cartStore = useCartStore()

// 「素衡素衡」唤醒开关（单例：与智能体工作台 / 全系统共享同一唤醒实例）
const { supported: wakeSupported, enabled: wakeEnabled, toggle: toggleWake } = useWakeWord()

const messageInput = ref('')
const messagesContainer = ref<HTMLElement>()
const searchKeyword = ref('')

const filteredConversations = computed(() => {
  if (!searchKeyword.value) return chatStore.conversations
  return chatStore.conversations.filter((c) =>
    c.title.toLowerCase().includes(searchKeyword.value.toLowerCase()),
  )
})

const suggestions = computed(() => {
  const key = locale.value as keyof typeof suggestedQuestions
  return suggestedQuestions[key] || suggestedQuestions.en
})

const userHealthProfile = computed(() => authStore.user?.healthProfile)

// ===== 中医知识库 =====
const kbKeyword = ref('')
const kbCategory = ref<KnowledgeCategory | 'all'>('all')

const kbFiltered = computed(() => {
  const kw = kbKeyword.value.trim().toLowerCase()
  return TCM_KNOWLEDGE.filter((e) => {
    if (kbCategory.value !== 'all' && e.category !== kbCategory.value) return false
    if (!kw) return true
    const hay = [
      e.title.zh, e.title.en,
      e.summary.zh, e.summary.en,
      ...e.tags,
    ].join(' ').toLowerCase()
    return hay.includes(kw)
  })
})

function askKnowledge(titleZh: string) {
  sendSuggestion(`${t('chat.kbAskPrefix')}「${titleZh}」`)
}

function scrollToBottom() {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  })
}

function selectConversation(id: string) {
  chatStore.selectConversation(id)
  scrollToBottom()
}

function newChat() {
  chatStore.createConversation()
  scrollToBottom()
}

async function sendMessage() {
  const content = messageInput.value.trim()
  if (!content || chatStore.isAiThinking) return
  messageInput.value = ''
  await chatStore.sendMessage(content)
  scrollToBottom()
}

function sendSuggestion(q: string) {
  messageInput.value = q
  sendMessage()
}

function deleteConv(id: string, e: Event) {
  e.stopPropagation()
  chatStore.deleteConversation(id)
}

async function clearChat() {
  try {
    await ElMessageBox.confirm(t('chat.confirmClear'), t('chat.clearHistory'), {
      confirmButtonText: t('common.confirm'),
      cancelButtonText: t('common.cancel'),
      type: 'warning',
    })
    chatStore.clearMessages()
  } catch {
    // cancelled
  }
}

function addAllToCart(products: Product[]) {
  products.forEach((p) => cartStore.addToCart(p))
  ElMessage.success(t('shop.addToCartSuccess'))
}

function addProduct(p: Product) {
  cartStore.addToCart(p)
  ElMessage.success(t('shop.addToCartSuccess'))
}

function goToProduct(slug: string) {
  router.push(`/shop/${slug}`)
}

function formatTime(iso: string): string {
  const date = new Date(iso)
  return date.toLocaleTimeString(locale.value, { hour: '2-digit', minute: '2-digit' })
}

// 「素衡素衡」语音唤醒响应：推送全系统唤醒报告并聚焦输入框
function onWake() {
  const s = systemContentStats()
  chatStore.pushSystemMessage(
    t('wake.report', {
      agents: s.agents,
      products: s.crossBorderProducts,
      domestic: s.domesticProducts,
      kb: s.knowledgeEntries,
      social: s.socialApps,
    }),
  )
  ElMessage.success(t('wake.greeting'))
  scrollToBottom()
  nextTick(() => {
    const input = document.querySelector<HTMLTextAreaElement>('.input-wrapper textarea')
    input?.focus()
  })
}

// 智能体工作台输入框提问直达：?q= 自动发送并清除参数
function consumeAskQuery() {
  const q = route.query.q
  if (typeof q === 'string' && q.trim()) {
    sendSuggestion(q.trim())
    router.replace({ query: {} }).catch(() => {})
  }
}

onMounted(() => {
  if (chatStore.conversations.length > 0 && !chatStore.currentConversationId) {
    selectConversation(chatStore.conversations[0].id)
  } else if (chatStore.currentConversationId) {
    scrollToBottom()
  }
  window.addEventListener(WAKE_EVENT, onWake)
  consumeAskQuery()
})

onUnmounted(() => {
  window.removeEventListener(WAKE_EVENT, onWake)
})

watch(() => chatStore.messages.length, scrollToBottom)
watch(() => route.query.q, () => consumeAskQuery())
</script>

<template>
  <div class="chat-page">
    <div class="chat-layout">
      <!-- 左侧会话列表 -->
      <aside class="conversation-sidebar">
        <button class="new-chat-btn" @click="newChat">
          <el-icon><Plus /></el-icon>
          {{ t('chat.newConversation') }}
        </button>
        <el-input
          v-model="searchKeyword"
          :placeholder="t('chat.searchConversations')"
          :prefix-icon="'Search'"
          class="search-input"
          clearable
        />
        <div class="conversation-list">
          <div
            v-for="conv in filteredConversations"
            :key="conv.id"
            :class="['conv-item', { active: conv.id === chatStore.currentConversationId }]"
            @click="selectConversation(conv.id)"
          >
            <el-icon class="conv-icon"><ChatDotRound /></el-icon>
            <div class="conv-info">
              <div class="conv-title">{{ conv.title }}</div>
              <div class="conv-preview">{{ conv.lastMessage || t('chat.noConversations') }}</div>
            </div>
            <button class="conv-delete" @click="(e) => deleteConv(conv.id, e)">
              <el-icon><Delete /></el-icon>
            </button>
          </div>
          <div v-if="filteredConversations.length === 0" class="empty-conv">
            {{ t('chat.noConversations') }}
          </div>
        </div>
      </aside>

      <!-- 中间聊天区 -->
      <main class="chat-main">
        <div class="chat-header">
          <div>
            <h2>{{ t('chat.title') }}</h2>
            <p>{{ t('chat.subtitle') }}</p>
          </div>
          <button v-if="chatStore.messages.length > 0" class="clear-btn" @click="clearChat">
            <el-icon><Delete /></el-icon>
          </button>
        </div>

        <div ref="messagesContainer" class="messages-area">
          <!-- 空状态/欢迎 -->
          <div v-if="chatStore.messages.length === 0" class="welcome-block">
            <div class="welcome-avatar">
              <svg viewBox="0 0 80 80" fill="none">
                <path d="M40 12 C28 24 28 44 40 68 C52 44 52 24 40 12Z" fill="currentColor" opacity="0.9"/>
                <circle cx="40" cy="32" r="6" fill="white" opacity="0.8"/>
              </svg>
            </div>
            <h3>{{ t('chat.welcomeTitle') }}</h3>
            <p>{{ t('chat.welcomeDesc') }}</p>
            <div class="suggestions">
              <button
                v-for="(q, i) in suggestions"
                :key="i"
                class="suggestion-chip"
                @click="sendSuggestion(q)"
              >
                {{ q }}
              </button>
            </div>
          </div>

          <!-- 消息列表 -->
          <template v-else>
            <div
              v-for="msg in chatStore.messages"
              :key="msg.id"
              :class="['message-row', msg.role]"
            >
              <div v-if="msg.role === 'assistant'" class="msg-avatar ai">
                <svg viewBox="0 0 40 40" fill="none">
                  <path d="M20 6 C14 12 14 22 20 34 C26 22 26 12 20 6Z" fill="currentColor"/>
                </svg>
              </div>
              <div class="msg-content">
                <div class="msg-bubble">
                  <span class="msg-role">{{ msg.role === 'user' ? t('chat.you') : t('chat.assistant') }}</span>
                  <div class="msg-text" v-html="msg.content.replace(/\n/g, '<br>')"></div>
                </div>
                <span class="msg-time">{{ formatTime(msg.timestamp) }}</span>

                <!-- 推荐产品 -->
                <div v-if="msg.products && msg.products.length > 0" class="msg-products">
                  <div
                    v-for="p in msg.products"
                    :key="p.id"
                    class="mini-product"
                    @click="goToProduct(p.slug)"
                  >
                    <img :src="p.image" :alt="tText(p.name, locale as any)" />
                    <div class="mini-product-info">
                      <div class="mini-product-name">{{ tText(p.name, locale as any) }}</div>
                      <div class="mini-product-price">${{ p.price }}</div>
                    </div>
                    <button class="mini-add-btn" @click.stop="addProduct(p)">
                      <el-icon><Plus /></el-icon>
                    </button>
                  </div>
                  <button class="add-all-btn" @click="addAllToCart(msg.products)">
                    <el-icon><ShoppingCart /></el-icon>
                    {{ t('chat.addAllToCart') }}
                  </button>
                </div>
              </div>
              <div v-if="msg.role === 'user'" class="msg-avatar user">
                <img :src="authStore.user?.avatar" alt="me" />
              </div>
            </div>

            <!-- AI 思考中 -->
            <div v-if="chatStore.isAiThinking" class="message-row assistant">
              <div class="msg-avatar ai">
                <svg viewBox="0 0 40 40" fill="none">
                  <path d="M20 6 C14 12 14 22 20 34 C26 22 26 12 20 6Z" fill="currentColor"/>
                </svg>
              </div>
              <div class="msg-content">
                <div class="msg-bubble thinking">
                  <span class="thinking-dots">
                    <i></i><i></i><i></i>
                  </span>
                </div>
              </div>
            </div>
          </template>
        </div>

        <!-- 输入区：左侧内嵌语言切换 + 唤醒开关 -->
        <div class="input-area">
          <div class="input-wrapper">
            <LanguageSwitcher class="input-lang" />
            <button
              v-if="wakeSupported"
              :class="['wake-mic', { on: wakeEnabled }]"
              :title="wakeEnabled ? t('wake.onTitle') : t('wake.offTitle')"
              @click="toggleWake()"
            >
              <el-icon :size="18"><Microphone v-if="wakeEnabled" /><Mute v-else /></el-icon>
              <span v-if="wakeEnabled" class="mic-dot"></span>
            </button>
            <el-input
              v-model="messageInput"
              type="textarea"
              :rows="2"
              :placeholder="t('chat.typeMessage')"
              resize="none"
              @keydown.enter.exact.prevent="sendMessage"
            />
            <button
              class="send-btn"
              :disabled="!messageInput.trim() || chatStore.isAiThinking"
              @click="sendMessage"
            >
              <el-icon :size="20"><Promotion /></el-icon>
            </button>
          </div>
          <div class="input-meta">
            <p v-if="wakeSupported && wakeEnabled" class="wake-hint">
              <span class="hint-dot"></span>{{ t('wake.listeningHint') }}
            </p>
            <p class="input-hint">Enter 发送，Shift+Enter 换行</p>
          </div>
        </div>
      </main>

      <!-- 右侧面板 -->
      <aside class="info-sidebar">
        <!-- 中医知识库 -->
        <div class="sidebar-section kb-section">
          <h3>
            <el-icon><Reading /></el-icon>
            {{ t('chat.knowledgeTitle') }}
            <span class="kb-count">{{ kbFiltered.length }}/{{ TCM_KNOWLEDGE.length }}</span>
          </h3>
          <el-input
            v-model="kbKeyword"
            :placeholder="t('chat.kbSearchPlaceholder')"
            :prefix-icon="'Search'"
            size="small"
            clearable
            class="kb-search"
          />
          <div class="kb-cats">
            <button
              v-for="c in KNOWLEDGE_CATEGORY_DEFS"
              :key="c.key"
              :class="['kb-cat-chip', { active: kbCategory === c.key }]"
              @click="kbCategory = c.key"
            >
              {{ t(c.labelKey) }}
            </button>
          </div>
          <div class="kb-list">
            <div v-for="e in kbFiltered" :key="e.id" class="kb-item" @click="askKnowledge(tText(e.title, 'zh'))">
              <div class="kb-item-head">
                <strong>{{ tText(e.title, locale as any) }}</strong>
                <span :class="['kb-cat-tag', `cat-${e.category}`]">{{ t(`chat.kbCat_${e.category}`) }}</span>
              </div>
              <p class="kb-item-summary">{{ tText(e.summary, locale as any) }}</p>
              <div class="kb-item-tags">
                <span v-for="tag in e.tags" :key="tag" class="kb-tag">{{ tag }}</span>
              </div>
            </div>
            <div v-if="!kbFiltered.length" class="kb-empty">{{ t('chat.kbEmpty') }}</div>
          </div>
        </div>

        <div class="sidebar-section">
          <h3>{{ t('chat.healthProfile') }}</h3>
          <div v-if="userHealthProfile" class="profile-info">
            <div class="profile-row" v-if="userHealthProfile.gender">
              <span class="label">{{ t('auth.gender') }}</span>
              <span class="value">{{ t('auth.' + userHealthProfile.gender) }}</span>
            </div>
            <div class="profile-row" v-if="userHealthProfile.age">
              <span class="label">{{ t('auth.age') }}</span>
              <span class="value">{{ userHealthProfile.age }}</span>
            </div>
            <div class="profile-row" v-if="userHealthProfile.constitution">
              <span class="label">{{ t('home.constitution') }}</span>
              <span class="value accent">{{ t('constitution.' + userHealthProfile.constitution) }}</span>
            </div>
            <div class="profile-row" v-if="userHealthProfile.allergies?.length">
              <span class="label">{{ t('auth.allergies') }}</span>
              <span class="value">{{ userHealthProfile.allergies.join(', ') }}</span>
            </div>
          </div>
          <div v-else class="empty-profile">
            <el-icon><User /></el-icon>
            <p>{{ t('chat.noRecommendations') }}</p>
          </div>
        </div>

        <div class="sidebar-section">
          <h3>{{ t('chat.recommendedProducts') }}</h3>
          <div class="sidebar-products">
            <div
              v-for="p in mockProducts.slice(0, 3)"
              :key="p.id"
              class="sidebar-product"
              @click="goToProduct(p.slug)"
            >
              <img :src="p.image" :alt="tText(p.name, locale as any)" />
              <div class="sp-info">
                <div class="sp-name">{{ tText(p.name, locale as any) }}</div>
                <div class="sp-price">${{ p.price }}</div>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </div>
  </div>
</template>

<style scoped>
.chat-page {
  height: calc(100vh - 64px - 320px);
  min-height: 600px;
}
.chat-layout {
  display: grid;
  grid-template-columns: 280px 1fr 280px;
  gap: 0;
  height: 100%;
  background: var(--color-bg);
}

/* 左侧 */
.conversation-sidebar {
  background: var(--color-bg-card);
  border-right: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  padding: 16px;
  overflow: hidden;
}
.new-chat-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 12px;
  background: var(--color-primary);
  color: #fff;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
  margin-bottom: 12px;
}
.new-chat-btn:hover {
  background: var(--color-primary-light);
}
.search-input {
  margin-bottom: 12px;
}
.conversation-list {
  flex: 1;
  overflow-y: auto;
}
.conv-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px;
  border-radius: 10px;
  cursor: pointer;
  transition: background 0.2s;
  position: relative;
}
.conv-item:hover {
  background: var(--color-bg-soft);
}
.conv-item.active {
  background: rgba(26, 107, 92, 0.08);
}
.conv-icon {
  color: var(--color-primary);
  margin-top: 2px;
  flex-shrink: 0;
}
.conv-info {
  flex: 1;
  min-width: 0;
}
.conv-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.conv-preview {
  font-size: 12px;
  color: var(--color-text-secondary);
  margin-top: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.conv-delete {
  opacity: 0;
  border: none;
  background: none;
  color: var(--color-text-secondary);
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.2s;
}
.conv-item:hover .conv-delete {
  opacity: 1;
}
.conv-delete:hover {
  color: var(--color-danger);
  background: rgba(217, 107, 92, 0.1);
}
.empty-conv {
  text-align: center;
  color: var(--color-text-secondary);
  font-size: 13px;
  padding: 32px 0;
}

/* 中间 */
.chat-main {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  border-bottom: 1px solid var(--color-border);
  background: var(--color-bg-card);
}
.chat-header h2 {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
}
.chat-header p {
  font-size: 12px;
  color: var(--color-text-secondary);
  margin: 2px 0 0;
}
.clear-btn {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  border: none;
  background: var(--color-bg-soft);
  color: var(--color-text-regular);
  cursor: pointer;
  transition: all 0.2s;
}
.clear-btn:hover {
  color: var(--color-danger);
  background: rgba(217, 107, 92, 0.1);
}
.messages-area {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
}
.welcome-block {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  text-align: center;
  padding: 32px;
}
.welcome-avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-light));
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  margin-bottom: 20px;
}
.welcome-block h3 {
  font-size: 22px;
  margin: 0 0 8px;
}
.welcome-block p {
  color: var(--color-text-regular);
  margin: 0 0 28px;
  max-width: 400px;
}
.suggestions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: center;
  max-width: 560px;
}
.suggestion-chip {
  padding: 10px 18px;
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: 999px;
  font-size: 13px;
  color: var(--color-text-regular);
  cursor: pointer;
  transition: all 0.2s;
}
.suggestion-chip:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
  background: rgba(26, 107, 92, 0.04);
}

/* 消息气泡 */
.message-row {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
  align-items: flex-start;
}
.message-row.user {
  flex-direction: row-reverse;
}
.msg-avatar {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}
.msg-avatar.ai {
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-light));
  color: #fff;
}
.msg-avatar.ai svg {
  width: 22px;
  height: 22px;
}
.msg-avatar.user {
  background: var(--color-bg-soft);
  overflow: hidden;
}
.msg-avatar.user img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.msg-content {
  max-width: 70%;
}
.message-row.user .msg-content {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}
.msg-bubble {
  padding: 14px 18px;
  border-radius: 16px;
  font-size: 14px;
  line-height: 1.7;
}
.message-row.assistant .msg-bubble {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-top-left-radius: 4px;
  color: var(--color-text-primary);
}
.message-row.user .msg-bubble {
  background: var(--color-primary);
  color: #fff;
  border-top-right-radius: 4px;
}
.msg-role {
  display: block;
  font-size: 12px;
  font-weight: 600;
  margin-bottom: 6px;
  opacity: 0.7;
}
.msg-time {
  font-size: 11px;
  color: var(--color-text-secondary);
  margin-top: 6px;
  display: block;
}
.msg-text :deep(strong) {
  color: var(--color-primary);
}
.message-row.user .msg-text :deep(strong) {
  color: var(--color-accent-light);
}

/* 思考中 */
.msg-bubble.thinking {
  padding: 16px 20px;
}
.thinking-dots {
  display: inline-flex;
  gap: 4px;
}
.thinking-dots i {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--color-primary);
  animation: bounce 1.4s infinite;
}
.thinking-dots i:nth-child(2) { animation-delay: 0.2s; }
.thinking-dots i:nth-child(3) { animation-delay: 0.4s; }
@keyframes bounce {
  0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
  30% { transform: translateY(-6px); opacity: 1; }
}

/* 消息中的产品推荐 */
.msg-products {
  margin-top: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.mini-product {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px;
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
}
.mini-product:hover {
  border-color: var(--color-primary-light);
}
.mini-product img {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  object-fit: cover;
}
.mini-product-info {
  flex: 1;
  min-width: 0;
}
.mini-product-name {
  font-size: 13px;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.mini-product-price {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-primary);
  margin-top: 2px;
}
.mini-add-btn {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: none;
  background: var(--color-primary);
  color: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.add-all-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: var(--color-accent);
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  align-self: flex-start;
  transition: background 0.2s;
}
.add-all-btn:hover {
  background: var(--color-accent-light);
  color: var(--color-text-primary);
}

/* 输入区 */
.input-area {
  padding: 12px 24px 14px;
  border-top: 1px solid var(--color-border);
  background: var(--color-bg-card);
}
.input-wrapper {
  position: relative;
  display: flex;
  align-items: flex-end;
  gap: 8px;
}
.input-wrapper :deep(.el-textarea__inner) {
  border-radius: 12px;
  padding: 12px 56px 12px 16px;
  border-color: var(--color-border);
  resize: none;
}
/* 语言切换触发器（沿用 LanguageSwitcher，下拉面板向上展开以避免被裁） */
.input-lang {
  flex-shrink: 0;
}
.input-lang :deep(.lang-panel) {
  top: auto;
  bottom: calc(100% + 10px);
  right: auto;
  left: 0;
}
.input-lang :deep(.lang-trigger) {
  width: 44px;
  height: 44px;
  padding: 0;
  border-radius: 10px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.input-lang :deep(.lang-trigger .el-icon:first-child) {
  font-size: 18px;
}
.input-lang :deep(.lang-trigger span) {
  display: none;
}
.input-lang :deep(.lang-trigger .arrow) {
  display: none;
}
/* 唤醒麦克风按钮（沿用智能体工作台视觉） */
.wake-mic {
  position: relative;
  width: 44px;
  height: 44px;
  flex-shrink: 0;
  border: 1px solid var(--color-border);
  border-radius: 10px;
  background: var(--color-bg-card);
  color: var(--color-text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}
.wake-mic:hover {
  color: var(--color-primary);
  border-color: var(--color-primary);
  background: rgba(26, 107, 92, 0.06);
}
.wake-mic.on {
  color: #fff;
  background: var(--color-primary);
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(26, 107, 92, 0.12);
}
.mic-dot {
  position: absolute;
  top: 6px;
  right: 6px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--color-success, #5fb350);
  box-shadow: 0 0 0 2px var(--color-bg-card);
  animation: mic-pulse 1.4s ease-in-out infinite;
}
@keyframes mic-pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.4; transform: scale(0.6); }
}
.send-btn {
  position: absolute;
  right: 8px;
  bottom: 8px;
  width: 40px;
  height: 40px;
  border-radius: 10px;
  border: none;
  background: var(--color-primary);
  color: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}
.send-btn:disabled {
  background: var(--color-border);
  cursor: not-allowed;
}
.send-btn:not(:disabled):hover {
  background: var(--color-primary-light);
}
.input-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 8px;
}
.wake-hint {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin: 0;
  font-size: 11px;
  color: var(--color-primary);
}
.hint-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--color-success, #5fb350);
  animation: mic-pulse 1.4s ease-in-out infinite;
}
.input-hint {
  font-size: 11px;
  color: var(--color-text-secondary);
  margin: 0;
  text-align: right;
}

/* 右侧面板 */
.info-sidebar {
  background: var(--color-bg-card);
  border-left: 1px solid var(--color-border);
  padding: 20px;
  overflow-y: auto;
}
.sidebar-section {
  margin-bottom: 28px;
}
.sidebar-section h3 {
  font-size: 15px;
  font-weight: 600;
  margin: 0 0 14px;
  color: var(--color-text-primary);
  padding-bottom: 10px;
  border-bottom: 1px solid var(--color-border);
}

/* 中医知识库 */
.kb-section h3 {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.kb-count {
  font-size: 11px;
  font-weight: 500;
  color: var(--color-primary);
  background: color-mix(in srgb, var(--color-primary) 10%, transparent);
  border-radius: 10px;
  padding: 2px 8px;
}
.kb-search {
  margin-bottom: 10px;
}
.kb-cats {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 12px;
}
.kb-cat-chip {
  font-size: 11px;
  padding: 3px 10px;
  border-radius: 12px;
  border: 1px solid var(--color-border);
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all 0.15s ease;
  user-select: none;
}
.kb-cat-chip:hover {
  color: var(--color-primary);
  border-color: var(--color-primary);
}
.kb-cat-chip.active {
  color: #fff;
  background: var(--color-primary);
  border-color: var(--color-primary);
}
.kb-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.kb-item {
  border: 1px solid var(--color-border);
  border-radius: 10px;
  padding: 10px 12px;
  cursor: pointer;
  transition: all 0.15s ease;
  background: var(--color-bg);
}
.kb-item:hover {
  border-color: var(--color-primary);
  box-shadow: 0 2px 8px color-mix(in srgb, var(--color-primary) 12%, transparent);
}
.kb-item-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.kb-item-head strong {
  font-size: 13px;
  color: var(--color-text-primary);
}
.kb-cat-tag {
  flex-shrink: 0;
  font-size: 10px;
  padding: 1px 7px;
  border-radius: 9px;
  font-weight: 500;
}
.kb-cat-tag.cat-formula {
  color: #b45309;
  background: rgba(217, 119, 6, 0.12);
}
.kb-cat-tag.cat-herb {
  color: #15803d;
  background: rgba(34, 197, 94, 0.12);
}
.kb-cat-tag.cat-acupoint {
  color: #b91c1c;
  background: rgba(239, 68, 68, 0.12);
}
.kb-cat-tag.cat-diet {
  color: #9a3412;
  background: rgba(249, 115, 22, 0.12);
}
.kb-cat-tag.cat-classic {
  color: #4338ca;
  background: rgba(99, 102, 241, 0.12);
}
.kb-item-summary {
  font-size: 12px;
  line-height: 1.5;
  color: var(--color-text-secondary);
  margin: 6px 0 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.kb-item-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 7px;
}
.kb-tag {
  font-size: 10px;
  color: var(--color-text-secondary);
  background: var(--color-bg-card);
  border: 1px dashed var(--color-border);
  border-radius: 8px;
  padding: 1px 6px;
}
.kb-empty {
  font-size: 12px;
  color: var(--color-text-secondary);
  text-align: center;
  padding: 20px 0;
}
.profile-info {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.profile-row {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
}
.profile-row .label {
  color: var(--color-text-secondary);
}
.profile-row .value {
  color: var(--color-text-primary);
  font-weight: 500;
}
.profile-row .value.accent {
  color: var(--color-primary);
}
.empty-profile {
  text-align: center;
  padding: 24px 0;
  color: var(--color-text-secondary);
}
.empty-profile .el-icon {
  font-size: 32px;
  margin-bottom: 8px;
}
.empty-profile p {
  font-size: 12px;
  margin: 0;
}
.sidebar-products {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.sidebar-product {
  display: flex;
  gap: 10px;
  padding: 8px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s;
}
.sidebar-product:hover {
  background: var(--color-bg-soft);
}
.sidebar-product img {
  width: 44px;
  height: 44px;
  border-radius: 8px;
  object-fit: cover;
}
.sp-info {
  flex: 1;
  min-width: 0;
}
.sp-name {
  font-size: 12px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.sp-price {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-primary);
  margin-top: 4px;
}

@media (max-width: 1024px) {
  .info-sidebar {
    display: none;
  }
  .chat-layout {
    grid-template-columns: 260px 1fr;
  }
}
@media (max-width: 768px) {
  .chat-page {
    height: calc(100vh - 56px - 400px);
  }
  .conversation-sidebar {
    display: none;
  }
  .chat-layout {
    grid-template-columns: 1fr;
  }
  .msg-content {
    max-width: 85%;
  }
}
</style>
