# 中医智能体对话模块

## 文件位置
- `src/views/ChatPage.vue`
- `src/stores/chat.ts`
- `src/mock/conversation.ts`

## 布局
- 左侧：会话列表（新建/切换/删除）
- 中间：消息区（AI 左对齐浅米底，用户右对齐深青绿底）+ 输入框 + 快捷问题
- 右侧：健康档案面板 + 商品推荐面板（移动端折叠为抽屉）

## 交互
- 发送消息后模拟 AI 打字机响应（800ms 延迟 + 逐字追加）
- AI 响应基于关键词匹配：体质、失眠、湿气、枸杞、产品等触发不同回复
- 推荐商品点击跳转 `/shop/:id`

## Store 关键 API

```ts
const chat = useChatStore()
chat.createConversation()
chat.selectConversation(id)
chat.deleteConversation(id)
await chat.sendMessage('我最近失眠怎么办')
```

## 扩展真实 AI
当前为 Mock 响应。接入真实 LLM 时：
1. 创建 `src/api/chat.ts` 调用后端 SSE 接口
2. 在 `chat.ts` 的 `sendMessage` 中替换 `simulateAIReply`
3. 使用 `ReadableStream` + `getReader()` 实现流式输出（遵循流式优先原则）
