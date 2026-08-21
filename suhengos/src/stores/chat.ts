import { defineStore } from 'pinia'
import { ref, nextTick } from 'vue'
import type { Conversation, ChatMessage } from '@/types'
import { mockConversations, mockMessages, getAiReply } from '@/mock/conversation'
import { mockProducts } from '@/mock/products'

export const useChatStore = defineStore('chat', () => {
  const conversations = ref<Conversation[]>([...mockConversations])
  const currentConversationId = ref<string | null>(null)
  const messages = ref<ChatMessage[]>([])
  const isAiThinking = ref(false)

  function selectConversation(id: string) {
    currentConversationId.value = id
    messages.value = mockMessages[id] ? [...mockMessages[id]] : []
  }

  function createConversation(): string {
    const id = 'c-' + Date.now()
    const conv: Conversation = {
      id,
      title: '新对话',
      lastMessage: '',
      updatedAt: new Date().toISOString(),
      unread: 0,
    }
    conversations.value.unshift(conv)
    currentConversationId.value = id
    messages.value = []
    return id
  }

  function deleteConversation(id: string) {
    conversations.value = conversations.value.filter((c) => c.id !== id)
    if (currentConversationId.value === id) {
      currentConversationId.value = null
      messages.value = []
    }
  }

  async function sendMessage(content: string): Promise<void> {
    if (!content.trim() || isAiThinking.value) return

    if (!currentConversationId.value) {
      createConversation()
    }
    const convId = currentConversationId.value!

    const userMsg: ChatMessage = {
      id: 'm-' + Date.now(),
      role: 'user',
      content,
      timestamp: new Date().toISOString(),
    }
    messages.value.push(userMsg)

    // 更新会话标题（首条消息）
    const conv = conversations.value.find((c) => c.id === convId)
    if (conv) {
      if (conv.title === '新对话') {
        conv.title = content.slice(0, 20)
      }
      conv.lastMessage = content
      conv.updatedAt = new Date().toISOString()
    }

    isAiThinking.value = true
    await nextTick()

    // 模拟 AI 回复延迟
    await new Promise((r) => setTimeout(r, 1200))

    const reply = getAiReply(content)
    const recommendedProducts = reply.products
      ? reply.products.map((pid) => mockProducts.find((p) => p.id === pid)).filter(Boolean)
      : []

    const aiMsg: ChatMessage = {
      id: 'm-' + Date.now() + '-ai',
      role: 'assistant',
      content: reply.content,
      timestamp: new Date().toISOString(),
      products: recommendedProducts.length > 0 ? (recommendedProducts as any) : undefined,
    }
    messages.value.push(aiMsg)

    if (conv) {
      conv.lastMessage = reply.content.slice(0, 50)
      conv.updatedAt = new Date().toISOString()
    }

    isAiThinking.value = false
  }

  function clearMessages() {
    if (currentConversationId.value) {
      messages.value = []
      const conv = conversations.value.find((c) => c.id === currentConversationId.value)
      if (conv) {
        conv.lastMessage = ''
      }
    }
  }

  return {
    conversations,
    currentConversationId,
    messages,
    isAiThinking,
    selectConversation,
    createConversation,
    deleteConversation,
    sendMessage,
    clearMessages,
  }
})
