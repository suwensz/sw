<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '@/stores/auth'
import { useAppStore } from '@/stores/app'
import { constitutionTypes } from '@/mock/constitution'
import { useCartStore } from '@/stores/cart'
import { usePaymentStore } from '@/stores/payment'
import { tText } from '@/i18n'
import { localizeNumber } from '@/utils/numbers'

const router = useRouter()
const { t, locale } = useI18n()
const authStore = useAuthStore()
const appStore = useAppStore()
const cartStore = useCartStore()

const activeTab = ref('profile')

const tabs = computed(() => [
  { key: 'profile', label: t('account.profile'), icon: 'User' },
  { key: 'health', label: t('account.health'), icon: 'FirstAidKit' },
  { key: 'orders', label: t('account.orders'), icon: 'List' },
  { key: 'payment', label: t('payment.tabTitle'), icon: 'CreditCard' },
  { key: 'security', label: t('account.security'), icon: 'Lock' },
])

const payment = usePaymentStore()

// 汇率换算演示
const demoAmount = ref(100)
const demoCurrency = ref('USD')
const demoCny = computed(() => payment.toCny(demoAmount.value, demoCurrency.value))

const primaryConstitution = computed(() => {
  const c = authStore.user?.healthProfile?.constitution
  if (!c) return null
  return constitutionTypes.find((ct) => ct.id === c)
})

const profileForm = ref({
  name: authStore.user?.name || '',
  gender: authStore.user?.healthProfile?.gender || 'other',
  birthYear: authStore.user?.healthProfile?.birthYear || 1990,
  height: authStore.user?.healthProfile?.height || 170,
  weight: authStore.user?.healthProfile?.weight || 65,
})

const healthConditions = ref<string[]>([...(authStore.user?.healthProfile?.conditions || [])])
const allergies = ref<string[]>([...(authStore.user?.healthProfile?.allergies || [])])

const conditionOptions = [
  { value: 'none', label: '无' },
  { value: 'hypertension', label: '高血压' },
  { value: 'diabetes', label: '糖尿病' },
  { value: 'insomnia', label: '失眠' },
  { value: 'anxiety', label: '焦虑' },
  { value: 'digestive', label: '消化系统问题' },
  { value: 'respiratory', label: '呼吸系统问题' },
  { value: 'cardiovascular', label: '心血管疾病' },
]

function saveProfile() {
  authStore.updateHealthProfile({
    gender: profileForm.value.gender as any,
    birthYear: profileForm.value.birthYear,
    height: profileForm.value.height,
    weight: profileForm.value.weight,
    conditions: healthConditions.value,
    allergies: allergies.value,
  })
  authStore.updateProfile({ name: profileForm.value.name })
  ElMessage.success(t('account.profileUpdated'))
}

const mockOrders = [
  { id: 'QH20240315001', date: '2024-03-15', status: 'Delivered', total: 86.96, items: 3 },
  { id: 'QH20240220002', date: '2024-02-20', status: 'Shipped', total: 29.99, items: 1 },
  { id: 'QH20240110003', date: '2024-01-10', status: 'Delivered', total: 52.97, items: 2 },
]

function logout() {
  authStore.logout()
  cartStore.clearCart()
  ElMessage.success(t('auth.logoutSuccess'))
  router.push('/')
}
</script>

<template>
  <div class="account-page qh-container">
    <div class="account-layout">
      <!-- 侧边栏 -->
      <aside class="account-sidebar qh-card">
        <div class="user-info">
          <div class="avatar">
            {{ authStore.user?.avatar ? '' : (authStore.user?.name?.[0] || 'U') }}
            <img v-if="authStore.user?.avatar" :src="authStore.user.avatar" alt="avatar" />
          </div>
          <h3>{{ authStore.user?.name }}</h3>
          <p>{{ authStore.user?.email }}</p>
          <div v-if="primaryConstitution" class="constitution-badge">
            {{ primaryConstitution.name.zh }}
          </div>
        </div>
        <nav class="account-nav">
          <button
            v-for="tab in tabs"
            :key="tab.key"
            :class="['nav-item', { active: activeTab === tab.key }]"
            @click="activeTab = tab.key"
          >
            <el-icon><component :is="tab.icon" /></el-icon>
            {{ tab.label }}
          </button>
          <button class="nav-item logout" @click="logout">
            <el-icon><SwitchButton /></el-icon>
            {{ t('auth.logout') }}
          </button>
        </nav>
      </aside>

      <!-- 主内容 -->
      <main class="account-main">
        <!-- 个人资料 -->
        <div v-show="activeTab === 'profile'" class="panel qh-card">
          <h2>{{ t('account.personalInfo') }}</h2>
          <el-form label-position="top" class="profile-form">
            <el-form-item label="Full Name">
              <el-input v-model="profileForm.name" />
            </el-form-item>
            <div class="form-row two-col">
              <el-form-item label="Email">
                <el-input :model-value="authStore.user?.email" disabled />
              </el-form-item>
              <el-form-item label="Phone">
                <el-input :model-value="authStore.user?.phone || ''" disabled />
              </el-form-item>
            </div>
            <div class="form-row two-col">
              <el-form-item :label="t('register.gender')">
                <el-radio-group v-model="profileForm.gender">
                  <el-radio value="male">{{ t('register.male') }}</el-radio>
                  <el-radio value="female">{{ t('register.female') }}</el-radio>
                  <el-radio value="other">{{ t('register.other') }}</el-radio>
                </el-radio-group>
              </el-form-item>
              <el-form-item :label="t('register.birthYear')">
                <el-input-number v-model="profileForm.birthYear" :min="1920" :max="2020" />
              </el-form-item>
            </div>
            <div class="form-row two-col">
              <el-form-item :label="t('register.height')">
                <el-input-number v-model="profileForm.height" :min="50" :max="250" />
                <span class="unit">cm</span>
              </el-form-item>
              <el-form-item :label="t('register.weight')">
                <el-input-number v-model="profileForm.weight" :min="20" :max="300" />
                <span class="unit">kg</span>
              </el-form-item>
            </div>
            <el-button type="primary" @click="saveProfile">{{ t('account.saveChanges') }}</el-button>
          </el-form>
        </div>

        <!-- 健康档案 -->
        <div v-show="activeTab === 'health'" class="panel qh-card">
          <h2>{{ t('account.healthRecord') }}</h2>
          <div class="bmi-display">
            <div class="bmi-number">{{ authStore.bmi }}</div>
            <div class="bmi-label">BMI</div>
            <div v-if="primaryConstitution" class="constitution-display" :style="{ '--c': primaryConstitution.color }">
              {{ primaryConstitution.name[locale as 'zh'] || primaryConstitution.name.en }}
            </div>
          </div>
          <el-form label-position="top">
            <el-form-item :label="t('register.healthConditions')">
              <el-checkbox-group v-model="healthConditions">
                <el-checkbox v-for="opt in conditionOptions" :key="opt.value" :value="opt.value">
                  {{ opt.label }}
                </el-checkbox>
              </el-checkbox-group>
            </el-form-item>
            <el-button type="primary" @click="saveProfile">{{ t('account.saveChanges') }}</el-button>
          </el-form>
        </div>

        <!-- 订单 -->
        <div v-show="activeTab === 'orders'" class="panel qh-card">
          <h2>{{ t('account.orderHistory') }}</h2>
          <div class="orders-list">
            <div v-for="order in mockOrders" :key="order.id" class="order-item">
              <div class="order-info">
                <strong>{{ order.id }}</strong>
                <span class="order-date">{{ order.date }}</span>
                <span class="order-items">{{ order.items }} items</span>
              </div>
              <span :class="['order-status', order.status.toLowerCase()]">{{ order.status }}</span>
              <span class="order-total">${{ order.total }}</span>
            </div>
          </div>
        </div>

        <!-- 支付端口 -->
        <div v-show="activeTab === 'payment'" class="panel qh-card">
          <h2>{{ t('payment.title') }}</h2>
          <p class="pay-sub">{{ t('payment.subtitle') }}（{{ t('payment.rateDate') }}: {{ payment.lastRateUpdate }}）</p>

          <!-- 结算开关 -->
          <div class="pay-switch-row">
            <div>
              <strong>{{ t('payment.settleCny') }}</strong>
              <p>{{ t('payment.settleCnyDesc') }}</p>
            </div>
            <el-switch :model-value="payment.settings.settlementCny" @change="(v: any) => payment.setSettlementCny(!!v)" />
          </div>

          <!-- 换算演示 -->
          <div class="pay-demo">
            <el-input-number v-model="demoAmount" :min="1" :max="1000000" />
            <el-select v-model="demoCurrency" style="width: 110px">
              <el-option v-for="r in payment.settings.rates" :key="r.code" :value="r.code" :label="`${r.symbol} ${r.code}`" />
            </el-select>
            <span class="pay-arrow">→</span>
            <span class="pay-cny">¥{{ localizeNumber(demoCny, locale) }} <small>CNY</small></span>
            <el-button size="small" :loading="false" @click="payment.refreshDailyRates()">{{ t('payment.refreshRates') }}</el-button>
          </div>

          <!-- 汇率表（可编辑） -->
          <el-table :data="payment.settings.rates" size="small" class="rate-table">
            <el-table-column :label="t('payment.colCurrency')" width="150">
              <template #default="{ row }">{{ row.symbol }} {{ tText(row.name) }} ({{ row.code }})</template>
            </el-table-column>
            <el-table-column :label="t('payment.colRate')" width="170">
              <template #default="{ row }">
                <el-input-number
                  :model-value="row.rateToCny"
                  :step="row.rateToCny < 0.01 ? 0.00001 : row.rateToCny < 1 ? 0.001 : 0.01"
                  :precision="row.rateToCny < 0.01 ? 5 : row.rateToCny < 1 ? 4 : 2"
                  :controls="false"
                  size="small"
                  style="width: 130px"
                  @update:model-value="(v: any) => v != null && payment.setRate(row.code, v)"
                />
              </template>
            </el-table-column>
            <el-table-column :label="t('payment.colAutoDaily')" width="140">
              <template #default="{ row }">
                <el-switch :model-value="row.autoDaily" size="small" @change="(v: any) => payment.setAutoDaily(row.code, !!v)" />
              </template>
            </el-table-column>
          </el-table>

          <!-- 支付方式 -->
          <h3 class="methods-title">{{ t('payment.methods') }}</h3>
          <div class="pay-methods">
            <div :class="['method-card', { on: payment.settings.methods.creditCard }]" @click="payment.setMethod('creditCard', !payment.settings.methods.creditCard)">
              <span class="method-icon">💳</span>
              <span>{{ t('payment.mCreditCard') }}</span>
              <span class="method-desc">{{ t('payment.mCreditCardDesc') }}</span>
            </div>
            <div :class="['method-card', { on: payment.settings.methods.wechat }]" @click="payment.setMethod('wechat', !payment.settings.methods.wechat)">
              <span class="method-icon">💚</span>
              <span>{{ t('payment.mWechat') }}</span>
              <span class="method-desc">{{ t('payment.mWechatDesc') }}</span>
            </div>
            <div :class="['method-card', { on: payment.settings.methods.alipay }]" @click="payment.setMethod('alipay', !payment.settings.methods.alipay)">
              <span class="method-icon">🔵</span>
              <span>{{ t('payment.mAlipay') }}</span>
              <span class="method-desc">{{ t('payment.mAlipayDesc') }}</span>
            </div>
          </div>
        </div>

        <!-- 安全设置 -->
        <div v-show="activeTab === 'security'" class="panel qh-card">
          <h2>{{ t('account.securitySettings') }}</h2>
          <div class="security-item">
            <div>
              <strong>{{ t('account.changePassword') }}</strong>
              <p>Last changed 30 days ago</p>
            </div>
            <el-button>{{ t('account.changePassword') }}</el-button>
          </div>
          <div class="security-item">
            <div>
              <strong>Two-Factor Authentication</strong>
              <p>Add an extra layer of security</p>
            </div>
            <el-button>Enable</el-button>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<style scoped>
.account-page {
  padding: 32px 48px;
}
.account-layout {
  display: grid;
  grid-template-columns: 260px 1fr;
  gap: 24px;
  align-items: start;
}
.account-sidebar {
  padding: 24px;
  position: sticky;
  top: 80px;
}
.user-info {
  text-align: center;
  padding-bottom: 20px;
  border-bottom: 1px solid var(--color-border);
  margin-bottom: 16px;
}
.avatar {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-light));
  color: #fff;
  font-size: 28px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 12px;
  overflow: hidden;
}
.avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.user-info h3 {
  font-size: 17px;
  margin: 0 0 4px;
}
.user-info p {
  font-size: 13px;
  color: var(--color-text-secondary);
  margin: 0 0 8px;
}
.constitution-badge {
  display: inline-block;
  padding: 3px 12px;
  background: rgba(26, 107, 92, 0.1);
  color: var(--color-primary);
  border-radius: 999px;
  font-size: 12px;
  font-weight: 500;
}
.account-nav {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  border: none;
  background: none;
  font-size: 14px;
  color: var(--color-text-regular);
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.15s;
  text-align: left;
}
.nav-item:hover {
  background: var(--color-bg-soft);
}
.nav-item.active {
  background: rgba(26, 107, 92, 0.1);
  color: var(--color-primary);
  font-weight: 500;
}
.nav-item.logout {
  margin-top: 8px;
  color: var(--color-danger);
}
.nav-item.logout:hover {
  background: rgba(217, 107, 92, 0.1);
}
.panel {
  padding: 28px;
}
.panel h2 {
  font-size: 20px;
  font-weight: 600;
  margin: 0 0 24px;
}
.form-row {
  display: grid;
  gap: 16px;
}
.form-row.two-col {
  grid-template-columns: 1fr 1fr;
}
.unit {
  margin-left: 8px;
  font-size: 13px;
  color: var(--color-text-secondary);
}
.bmi-display {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 24px;
  background: var(--color-bg-soft);
  border-radius: 12px;
  margin-bottom: 24px;
}
.bmi-number {
  font-size: 42px;
  font-weight: 700;
  color: var(--color-primary);
}
.bmi-label {
  font-size: 14px;
  color: var(--color-text-secondary);
}
.constitution-display {
  margin-left: auto;
  padding: 8px 20px;
  background: color-mix(in srgb, var(--c) 15%, white);
  color: var(--c);
  border-radius: 999px;
  font-weight: 600;
}
.orders-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.order-item {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 16px 20px;
  background: var(--color-bg-soft);
  border-radius: 10px;
}
.order-info {
  flex: 1;
  display: flex;
  gap: 16px;
  align-items: center;
}
.order-date,
.order-items {
  font-size: 13px;
  color: var(--color-text-secondary);
}
.order-status {
  padding: 4px 12px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 500;
}
.order-status.delivered {
  background: rgba(82, 166, 122, 0.15);
  color: var(--color-success);
}
.order-status.shipped {
  background: rgba(230, 162, 60, 0.15);
  color: var(--color-warning);
}
.order-total {
  font-weight: 600;
  font-size: 16px;
}
.security-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 0;
  border-bottom: 1px solid var(--color-border);
}
.security-item:last-child {
  border-bottom: none;
}

/* 支付端口 */
.pay-sub { font-size: 13px; color: var(--color-text-secondary); margin: -12px 0 20px; }
.pay-switch-row {
  display: flex; align-items: center; justify-content: space-between;
  padding: 14px 0; border-bottom: 1px solid var(--color-border);
}
.pay-switch-row p { margin: 4px 0 0; font-size: 13px; color: var(--color-text-secondary); }
.pay-demo { display: flex; align-items: center; gap: 10px; margin: 18px 0; flex-wrap: wrap; }
.pay-arrow { color: var(--color-text-secondary); }
.pay-cny { font-size: 22px; font-weight: 700; color: var(--color-accent); }
.pay-cny small { font-size: 12px; color: var(--color-text-secondary); font-weight: 400; }
.rate-table { margin-bottom: 20px; }
.methods-title { font-size: 16px; margin: 0 0 12px; }
.pay-methods { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
.method-card {
  display: flex; flex-direction: column; align-items: flex-start; gap: 6px;
  padding: 16px; border: 1.5px solid var(--color-border); border-radius: 12px;
  cursor: pointer; transition: all 0.2s; font-weight: 600; font-size: 14px;
}
.method-card.on { border-color: var(--color-primary); background: rgba(26, 107, 92, 0.05); }
.method-icon { font-size: 22px; }
.method-desc { font-size: 12px; font-weight: 400; color: var(--color-text-secondary); }
@media (max-width: 768px) { .pay-methods { grid-template-columns: 1fr; } }
.security-item strong {
  display: block;
  margin-bottom: 4px;
}
.security-item p {
  font-size: 13px;
  color: var(--color-text-secondary);
  margin: 0;
}
@media (max-width: 768px) {
  .account-page {
    padding: 16px;
  }
  .account-layout {
    grid-template-columns: 1fr;
  }
  .account-sidebar {
    position: static;
  }
}
</style>
