# 7. 状态管理（Pinia）

所有 store 使用 Composition API 风格（`defineStore('name', () => {...})`）。

## Store 清单

| Store | 文件 | 职责 |
|-------|------|------|
| `useAuthStore` | `stores/auth.ts` | 用户、登录注册、BMI、个人资料 |
| `useCartStore` | `stores/cart.ts` | 购物车（勾选、数量、结算） |
| `useChatStore` | `stores/chat.ts` | 智能体会话与消息 |
| `useAppStore` | `stores/app.ts` | 语言、币种、测评结果 |
| `useHealthStore` | `stores/health.ts` | 家人、手表、预警 |
| `useOpsStore` | `stores/ops.ts` | 竞品、供应链、需求、创意、上架 |

## 持久化

| Store | 持久化方式 | Key |
|-------|-----------|-----|
| auth | localStorage | `qh_auth_user` / `qh_auth_token` |
| app | localStorage | `qh_locale` / `qh_currency` |
| cart | 内存（登录后可扩展） | — |
| 其他 | 内存（Mock 数据） | — |

## 模式示例

```ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useMyStore = defineStore('my', () => {
  // state
  const items = ref<Item[]>([])
  const loading = ref(false)

  // getters
  const count = computed(() => items.value.length)

  // actions
  async function fetchItems() {
    loading.value = true
    try {
      items.value = await api.getItems()
    } finally {
      loading.value = false
    }
  }

  return { items, loading, count, fetchItems }
})
```

## 注意事项
- 禁止在 store 中直接操作 DOM
- 异步 action 使用 async/await，配合 loading 状态
- 跨 store 调用：在 action 内部 `const other = useOtherStore()`
- 避免在 store 中使用 `i18n.global.t`（会触发 TS 类型深度展开），改用 `tText` 或在组件中翻译
