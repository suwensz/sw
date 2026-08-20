<script setup lang="ts">
import { computed, ref } from 'vue'
import { useAdminStore } from '@/stores/admin'
import type { AdminOrder } from '@/stores/admin'

const admin = useAdminStore()
const statusFilter = ref<'all' | AdminOrder['status']>('all')
const keyword = ref('')

const statusMap: Record<AdminOrder['status'], { label: string; type: 'info' | 'success' | 'primary' | 'warning' | 'danger' }> = {
  pending: { label: '待支付', type: 'info' },
  paid: { label: '已支付', type: 'primary' },
  shipped: { label: '已发货', type: 'warning' },
  completed: { label: '已完成', type: 'success' },
  refunded: { label: '已退款', type: 'danger' },
}

const filtered = computed(() =>
  admin.orders.filter((o) => {
    if (statusFilter.value !== 'all' && o.status !== statusFilter.value) return false
    if (!keyword.value) return true
    const k = keyword.value.toLowerCase()
    return o.id.toLowerCase().includes(k) || o.userEmail.toLowerCase().includes(k) || o.productName.includes(keyword.value)
  }),
)
</script>

<template>
  <div class="orders-page">
    <el-card shadow="never">
      <template #header>
        <div class="toolbar">
          <div class="toolbar-left">
            <el-input
              v-model="keyword"
              placeholder="搜索订单号 / 用户 / 商品"
              clearable
              :prefix-icon="'Search'"
              style="width: 240px"
            />
            <el-radio-group v-model="statusFilter">
              <el-radio-button value="all">全部</el-radio-button>
              <el-radio-button value="pending">待支付</el-radio-button>
              <el-radio-button value="paid">已支付</el-radio-button>
              <el-radio-button value="shipped">已发货</el-radio-button>
              <el-radio-button value="completed">已完成</el-radio-button>
              <el-radio-button value="refunded">已退款</el-radio-button>
            </el-radio-group>
          </div>
          <el-button plain>导出 CSV</el-button>
        </div>
      </template>

      <el-table :data="filtered" style="width: 100%">
        <el-table-column prop="id" label="订单号" width="120" />
        <el-table-column prop="userEmail" label="用户" min-width="160" show-overflow-tooltip />
        <el-table-column prop="productName" label="商品" min-width="140" show-overflow-tooltip />
        <el-table-column label="金额" width="100">
          <template #default="{ row }">
            {{ row.currency === 'USD' ? '$' : '¥' }}{{ row.amount }}
          </template>
        </el-table-column>
        <el-table-column label="下单时间" width="150">
          <template #default="{ row }">{{ row.createdAt.replace('T', ' ').slice(0, 16) }}</template>
        </el-table-column>
        <el-table-column label="状态" width="90">
          <template #default="{ row }">
            <el-tag :type="statusMap[row.status as AdminOrder['status']].type" size="small">{{ statusMap[row.status as AdminOrder['status']].label }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="140" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small">详情</el-button>
            <el-button v-if="row.status === 'paid'" link type="warning" size="small">发货</el-button>
            <el-button v-if="row.status === 'pending'" link type="danger" size="small">取消</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<style scoped>
.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 12px;
}
</style>
