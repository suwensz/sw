import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Product, SocialAppId } from '@/types'
import { COUNTRY_SOCIAL_MAP } from '@/mock/socialData'

const STORAGE_KEY = 'qh_social_state'

interface SocialState {
  activeApp: SocialAppId | 'all'
  matchCountry: string
  /** 聊天弹窗是否打开 */
  chatOpen: boolean
  /** 当前聊天的社交软件 */
  chatApp: SocialAppId
  /** 聊天关联的商品（从商品卡/详情页发起咨询时） */
  chatProduct: Product | null
}

function load(): SocialState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<SocialState>
      return {
        activeApp: parsed.activeApp ?? 'all',
        matchCountry: parsed.matchCountry ?? 'VN',
        chatOpen: false, // 启动时不自动弹窗
        chatApp: parsed.chatApp ?? 'whatsapp',
        chatProduct: null,
      }
    }
  } catch { /* ignore */ }
  return {
    activeApp: 'all',
    matchCountry: 'VN',
    chatOpen: false,
    chatApp: 'whatsapp',
    chatProduct: null,
  }
}

export const useSocialStore = defineStore('social', () => {
  const state = ref<SocialState>(load())

  function persist() {
    // chatProduct 与 chatOpen 不持久化（会话内状态）
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      activeApp: state.value.activeApp,
      matchCountry: state.value.matchCountry,
      chatApp: state.value.chatApp,
    }))
  }

  function setActiveApp(app: SocialAppId | 'all') {
    state.value.activeApp = app
    persist()
  }

  function setMatchCountry(code: string) {
    state.value.matchCountry = code
    persist()
  }

  /** 当前匹配国家的主流社交软件列表 */
  function countryApps(code?: string): SocialAppId[] {
    const c = COUNTRY_SOCIAL_MAP.find((x) => x.code === (code || state.value.matchCountry))
    return c ? c.apps : ['whatsapp', 'messenger']
  }

  /** 打开与客户的聊天弹窗（可携带商品上下文） */
  function openChat(app: SocialAppId, product?: Product) {
    state.value.chatApp = app
    state.value.chatProduct = product ?? null
    state.value.chatOpen = true
    persist()
  }

  function closeChat() {
    state.value.chatOpen = false
    persist()
  }

  return { state, setActiveApp, setMatchCountry, countryApps, openChat, closeChat }
})
