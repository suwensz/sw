<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'

interface ApiEndpoint {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE'
  path: string
  name: string
  desc: string
  auth: boolean
  example: string
}

const endpoints = ref<ApiEndpoint[]>([
  {
    method: 'POST',
    path: '/api/v1/auth/login',
    name: '账号登录',
    desc: '登录获取访问令牌',
    auth: false,
    example: `curl -X POST https://api.suheng-os.com/api/v1/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{"email": "dev_user@coze.dev", "password": "dev123456"}'`,
  },
  {
    method: 'GET',
    path: '/api/v1/health/constitution',
    name: '体质辨识',
    desc: '根据答题结果返回体质类型',
    auth: true,
    example: `curl https://api.suheng-os.com/api/v1/health/constitution \\
  -H "Authorization: Bearer {ACCESS_TOKEN}" \\
  -d '{"answers": [{"qid": 1, "score": 4}]}'`,
  },
  {
    method: 'GET',
    path: '/api/v1/products',
    name: '商品列表',
    desc: '获取可售中医药商品',
    auth: true,
    example: `curl https://api.suheng-os.com/api/v1/products?lang=zh&currency=USD \\
  -H "Authorization: Bearer {ACCESS_TOKEN}"`,
  },
  {
    method: 'POST',
    path: '/api/v1/orders',
    name: '创建订单',
    desc: '提交跨境订单',
    auth: true,
    example: `curl -X POST https://api.suheng-os.com/api/v1/orders \\
  -H "Authorization: Bearer {ACCESS_TOKEN}" \\
  -H "Content-Type: application/json" \\
  -d '{"items": [{"productId": "p001", "qty": 2}]}'`,
  },
  {
    method: 'GET',
    path: '/api/v1/alerts',
    name: '健康预警',
    desc: '查询家人健康预警列表',
    auth: true,
    example: `curl https://api.suheng-os.com/api/v1/alerts?familyId=f001 \\
  -H "Authorization: Bearer {ACCESS_TOKEN}"`,
  },
  {
    method: 'PUT',
    path: '/api/v1/listings',
    name: '更新上架任务',
    desc: '更新自动上架任务状态',
    auth: true,
    example: `curl -X PUT https://api.suheng-os.com/api/v1/listings/{id} \\
  -H "Authorization: Bearer {ACCESS_TOKEN}" \\
  -d '{"status": "published"}'`,
  },
  {
    method: 'DELETE',
    path: '/api/v1/family/{id}',
    name: '删除家人',
    desc: '删除家人健康档案',
    auth: true,
    example: `curl -X DELETE https://api.suheng-os.com/api/v1/family/f001 \\
  -H "Authorization: Bearer {ACCESS_TOKEN}"`,
  },
])

const keyword = ref('')
const filtered = computed(() => {
  const kw = keyword.value.trim().toLowerCase()
  if (!kw) return endpoints.value
  return endpoints.value.filter(
    (e) => e.path.toLowerCase().includes(kw) || e.name.includes(kw) || e.desc.includes(kw),
  )
})

function copyExample(example: string) {
  navigator.clipboard?.writeText(example)
  ElMessage.success('已复制示例')
}
</script>

<template>
  <div class="portal-page">
    <h2>API 文档</h2>
    <p class="portal-stat-desc">素衡OS 开放接口（沙箱环境：https://api.suheng-os.com）。当前为演示版 Mock 数据。</p>

    <el-input
      v-model="keyword"
      placeholder="搜索接口路径 / 名称 / 说明"
      clearable
      style="max-width: 360px; margin-bottom: 16px"
    >
      <template #prefix><el-icon><Search /></el-icon></template>
    </el-input>

    <el-collapse>
      <el-collapse-item v-for="api in filtered" :key="api.path" :name="api.path">
        <template #title>
          <el-tag
            size="small"
            :type="api.method === 'GET' ? 'success' : api.method === 'POST' ? 'warning' : api.method === 'PUT' ? 'primary' : 'danger'"
          >
            {{ api.method }}
          </el-tag>
          <code class="api-path">{{ api.path }}</code>
          <span class="api-name">{{ api.name }}</span>
          <el-tag v-if="api.auth" size="small" type="info" effect="plain">需鉴权</el-tag>
        </template>
        <div class="api-desc">{{ api.desc }}</div>
        <div style="margin: 8px 0 6px">
          <b>请求示例</b>
          <el-button size="small" text type="primary" @click="copyExample(api.example)">
            <el-icon><CopyDocument /></el-icon> 复制
          </el-button>
        </div>
        <div class="code-block">{{ api.example }}</div>
      </el-collapse-item>
    </el-collapse>
  </div>
</template>

<style scoped>
.api-path {
  font-family: Consolas, monospace;
  margin: 0 10px;
  color: var(--color-primary-dark);
  font-size: 14px;
}
.api-name {
  flex: 1;
  color: var(--color-text-regular);
  font-size: 13px;
}
.api-desc {
  color: var(--color-text-secondary);
  font-size: 13px;
  margin-bottom: 8px;
}
</style>
