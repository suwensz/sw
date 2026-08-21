<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const steps = ref([
  { icon: 'User', title: '注册开发者账号', desc: '在开发端注册账号并完成实名认证，成为平台开发者。' },
  { icon: 'Grid', title: '创建应用', desc: '在「应用管理」中创建你的应用，填写应用名称、回调地址与所属业务域。' },
  { icon: 'Key', title: '获取密钥', desc: '创建成功后自动生成 AppKey / AppSecret，用于接口签名鉴权。' },
  { icon: 'Monitor', title: '沙箱联调', desc: '使用沙箱环境调试接口，返回 Mock 数据，不影响线上数据。' },
  { icon: 'Promotion', title: '发布上线', desc: '完成联调与联调用例后，提交应用审核，审核通过即发布上线。' },
])

const tips = ref([
  '密钥仅展示一次，请妥善保存；泄露后请在「密钥管理」中立即轮换。',
  '沙箱环境与正式环境数据完全隔离，可放心测试。',
  '所有接口均需携带 Authorization 请求头，令牌有效期 24 小时。',
  '调用频率限制：单个应用 100 次/分钟，超出将返回 429。',
])
</script>

<template>
  <div class="portal-page">
    <h2>接入指南</h2>
    <p class="portal-stat-desc">从注册到上线，完整走通素衡OS开放平台接入流程。</p>

    <el-steps direction="vertical" :active="steps.length" style="max-width: 720px">
      <el-step v-for="(s, i) in steps" :key="s.title" :title="s.title" :description="s.desc">
        <template #icon>
          <el-icon><component :is="s.icon" /></el-icon>
        </template>
      </el-step>
    </el-steps>

    <h3>开发提示</h3>
    <el-alert
      v-for="(tip, i) in tips"
      :key="i"
      :title="tip"
      type="info"
      :closable="false"
      show-icon
      style="margin-bottom: 8px; max-width: 720px"
    />

    <div style="margin-top: 16px">
      <el-button type="primary" @click="router.push('/apps')">
        <el-icon><Grid /></el-icon> 立即创建应用
      </el-button>
    </div>
  </div>
</template>
