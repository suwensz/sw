<script setup lang="ts">
import { computed } from 'vue'
import { useAdminStore } from '@/stores/admin'
import { useI18n } from 'vue-i18n'
import type { AdminOrder } from '@/stores/admin'

const admin = useAdminStore()
const { locale } = useI18n()

const statusMap: Record<AdminOrder['status'], { label: string; type: 'info' | 'success' | 'primary' | 'warning' | 'danger' }> = {
  pending: { label: '待支付', type: 'info' },
  paid: { label: '已支付', type: 'primary' },
  shipped: { label: '已发货', type: 'warning' },
  completed: { label: '已完成', type: 'success' },
  refunded: { label: '已退款', type: 'danger' },
}

const recentOrders = computed(() => admin.orders.slice(0, 8))

const trend = computed(() => {
  // 近 8 周订单量趋势（Mock）
  const weeks = ['W31', 'W32', 'W33', 'W34', 'W35', 'W36', 'W37', 'W38']
  const values = [42, 55, 48, 63, 71, 66, 80, 92]
  const max = Math.max(...values)
  return weeks.map((w, i) => ({ week: w, value: values[i], pct: Math.round((values[i] / max) * 100) }))
})

function fmtAmount(n: number) {
  return n.toLocaleString(locale.value === 'zh' ? 'zh-CN' : String(locale.value))
}
</script>

<template>
  <div class="dashboard">
    <!-- 统计卡片 -->
    <div class="stat-grid">
      <div class="stat-card">
        <div class="stat-icon stat-icon--users"><el-icon><User /></el-icon></div>
        <div class="stat-body">
          <span class="stat-value">{{ admin.stats.totalUsers }}</span>
          <span class="stat-label">注册用户（活跃 {{ admin.stats.activeUsers }}）</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon stat-icon--orders"><el-icon><List /></el-icon></div>
        <div class="stat-body">
          <span class="stat-value">{{ admin.stats.totalOrders }}</span>
          <span class="stat-label">订单总数（待处理 {{ admin.stats.pendingOrders }}）</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon stat-icon--revenue"><el-icon><Coin /></el-icon></div>
        <div class="stat-body">
          <span class="stat-value">¥{{ fmtAmount(admin.stats.totalRevenue) }}</span>
          <span class="stat-label">有效交易额（不含退款）</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon stat-icon--review"><el-icon><DocumentChecked /></el-icon></div>
        <div class="stat-body">
          <span class="stat-value">{{ admin.stats.pendingReviews }}</span>
          <span class="stat-label">待审核多语言内容</span>
        </div>
      </div>
    </div>

    <div class="dash-grid">
      <!-- 订单趋势 -->
      <el-card shadow="never" class="trend-card">
        <template #header>
          <div class="card-header">
            <span>近 8 周订单趋势</span>
            <el-tag size="small" type="success" effect="plain">环比 +15%</el-tag>
          </div>
        </template>
        <div class="trend-bars">
          <div v-for="t in trend" :key="t.week" class="trend-col">
            <div class="trend-bar-wrap">
              <div class="trend-bar" :style="{ height: t.pct + '%' }"></div>
            </div>
            <span class="trend-week">{{ t.week }}</span>
            <span class="trend-value">{{ t.value }}</span>
          </div>
        </div>
      </el-card>

      <!-- 最近订单 -->
      <el-card shadow="never" class="orders-card">
        <template #header>
          <div class="card-header">
            <span>最近订单</span>
            <router-link to="/orders" class="see-all">查看全部</router-link>
          </div>
        </template>
        <el-table :data="recentOrders" size="small" :show-header="true" style="width: 100%">
          <el-table-column prop="id" label="订单号" width="110" />
          <el-table-column prop="userEmail" label="用户" min-width="150" show-overflow-tooltip />
          <el-table-column prop="productName" label="商品" min-width="130" show-overflow-tooltip />
          <el-table-column label="金额" width="90">
            <template #default="{ row }">
              {{ row.currency === 'USD' ? '$' : '¥' }}{{ row.amount }}
            </template>
          </el-table-column>
          <el-table-column label="状态" width="86">
            <template #default="{ row }">
              <el-tag size="small" :type="statusMap[row.status as keyof typeof statusMap].type" effect="light">
                {{ statusMap[row.status as keyof typeof statusMap].label }}
              </el-tag>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </div>
  </div>
</template>

<style scoped>
.stat-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 16px;
  margin-bottom: 20px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 20px;
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: 12px;
}

.stat-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 46px;
  height: 46px;
  border-radius: 10px;
  font-size: 22px;
}

.stat-icon--users { background: rgba(26, 107, 92, 0.1); color: var(--color-primary); }
.stat-icon--orders { background: rgba(212, 168, 83, 0.14); color: #b08a35; }
.stat-icon--revenue { background: rgba(82, 166, 122, 0.14); color: var(--color-success); }
.stat-icon--review { background: rgba(217, 107, 92, 0.12); color: var(--color-danger); }

.stat-body {
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-size: 24px;
  font-weight: 600;
  color: var(--color-text-primary);
  line-height: 1.2;
}

.stat-label {
  font-size: 12px;
  color: var(--color-text-secondary);
  margin-top: 4px;
}

.dash-grid {
  display: grid;
  grid-template-columns: 1fr 1.4fr;
  gap: 16px;
}

@media (max-width: 1100px) {
  .dash-grid {
    grid-template-columns: 1fr;
  }
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-weight: 600;
}

.see-all {
  font-size: 13px;
  font-weight: 400;
  color: var(--color-primary);
}

.trend-bars {
  display: flex;
  align-items: flex-end;
  gap: 10px;
  height: 220px;
  padding-top: 8px;
}

.trend-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  height: 100%;
}

.trend-bar-wrap {
  flex: 1;
  display: flex;
  align-items: flex-end;
  width: 100%;
}

.trend-bar {
  width: 100%;
  max-width: 34px;
  margin: 0 auto;
  border-radius: 6px 6px 2px 2px;
  background: linear-gradient(180deg, var(--color-primary-light), var(--color-primary-dark));
  transition: height 0.4s ease;
}

.trend-week {
  font-size: 11px;
  color: var(--color-text-secondary);
}

.trend-value {
  font-size: 12px;
  color: var(--color-text-regular);
}
</style>
