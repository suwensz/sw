<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import { useCartStore } from '@/stores/cart'
import { useAppStore } from '@/stores/app'
import { useAuthStore } from '@/stores/auth'
import { tText } from '@/i18n'
import { localizePrice, localizeNumber } from '@/utils/numbers'

const router = useRouter()
const { t, locale } = useI18n()
const cartStore = useCartStore()
const appStore = useAppStore()
const authStore = useAuthStore()

const step = ref(1)
const orderPlaced = ref(false)
const orderId = ref('')

const selectedItems = computed(() =>
  cartStore.items.filter((i) => cartStore.selectedIds.has(i.productId)),
)

const subtotal = computed(() =>
  selectedItems.value.reduce((sum, i) => sum + i.product.price * i.quantity, 0),
)
const shippingCost = computed(() => {
  if (selectedItems.value.length === 0) return 0
  if (subtotal.value >= 50) return 0
  return 9.99
})
const tax = computed(() => subtotal.value * 0.05)
const total = computed(() => subtotal.value + shippingCost.value + tax.value)

function formatPrice(usd: number) {
  const p = appStore.convertPrice(usd)
  return localizePrice(p.value, p.symbol, locale.value)
}

// 收货地址
const form = ref({
  firstName: authStore.user?.name?.split(' ')[0] || '',
  lastName: authStore.user?.name?.split(' ')[1] || '',
  email: authStore.user?.email || '',
  phone: authStore.user?.phone || '',
  country: 'US',
  address: '',
  city: '',
  state: '',
  zip: '',
})

const countries = [
  { code: 'US', name: 'United States', flag: '🇺🇸' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦' },
  { code: 'UK', name: 'United Kingdom', flag: '🇬🇧' },
  { code: 'AU', name: 'Australia', flag: '🇦🇺' },
  { code: 'JP', name: 'Japan', flag: '🇯🇵' },
  { code: 'KR', name: 'South Korea', flag: '🇰🇷' },
  { code: 'SG', name: 'Singapore', flag: '🇸🇬' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪' },
  { code: 'FR', name: 'France', flag: '🇫🇷' },
  { code: 'ES', name: 'Spain', flag: '🇪🇸' },
]

const shippingMethod = ref('standard')
const shippingMethods = computed(() => [
  {
    id: 'standard',
    name: t('checkout.standardShipping'),
    duration: '7-14 ' + t('checkout.businessDays'),
    price: subtotal.value >= 50 ? 0 : 9.99,
  },
  {
    id: 'express',
    name: t('checkout.expressShipping'),
    duration: '3-5 ' + t('checkout.businessDays'),
    price: 19.99,
  },
  { id: 'priority', name: t('checkout.priorityShipping'), duration: '1-3 ' + t('checkout.businessDays'), price: 39.99 },
])

const paymentMethod = ref('card')
const cardForm = ref({ number: '', expiry: '', cvc: '', name: '' })

function placeOrder() {
  if (!form.value.firstName || !form.value.lastName || !form.value.address || !form.value.city || !form.value.zip) {
    ElMessage.error(t('checkout.completeAddress'))
    return
  }
  if (paymentMethod.value === 'card' && (!cardForm.value.number || !cardForm.value.expiry || !cardForm.value.cvc)) {
    ElMessage.error(t('checkout.completePayment'))
    return
  }
  orderId.value = 'QH' + Date.now().toString().slice(-10)
  orderPlaced.value = true
  cartStore.clearCart()
}

function continueShopping() {
  router.push('/shop')
}
</script>

<template>
  <div class="checkout-page qh-container">
    <h1 class="page-title">{{ t('checkout.title') }}</h1>

    <!-- 成功页 -->
    <div v-if="orderPlaced" class="success-card qh-card">
      <div class="success-icon">
        <el-icon :size="56"><CircleCheckFilled /></el-icon>
      </div>
      <h2>{{ t('checkout.orderSuccess') }}</h2>
      <p class="order-id">{{ t('checkout.orderNumber') }}: <strong>{{ orderId }}</strong></p>
      <p class="success-desc">{{ t('checkout.confirmationEmail') }}</p>
      <el-button type="primary" size="large" @click="continueShopping">
        {{ t('checkout.continueShopping') }}
      </el-button>
    </div>

    <!-- 空购物车 -->
    <div v-else-if="selectedItems.length === 0" class="empty-state qh-card">
      <el-icon :size="56"><ShoppingCart /></el-icon>
      <h2>{{ t('cart.empty') }}</h2>
      <el-button type="primary" @click="router.push('/shop')">{{ t('checkout.continueShopping') }}</el-button>
    </div>

    <!-- 结算流程 -->
    <div v-else class="checkout-layout">
      <!-- 左侧表单 -->
      <div class="checkout-main">
        <!-- 步骤指示 -->
        <div class="steps-bar">
          <div :class="['step', { active: step === 1, done: step > 1 }]">
            <span class="step-num">{{ step > 1 ? '✓' : 1 }}</span>
            <span>{{ t('checkout.shippingAddress') }}</span>
          </div>
          <div class="step-line"></div>
          <div :class="['step', { active: step === 2, done: step > 2 }]">
            <span class="step-num">{{ step > 2 ? '✓' : 2 }}</span>
            <span>{{ t('checkout.shippingMethod') }}</span>
          </div>
          <div class="step-line"></div>
          <div :class="['step', { active: step === 3 }]">
            <span class="step-num">3</span>
            <span>{{ t('checkout.payment') }}</span>
          </div>
        </div>

        <!-- 地址 -->
        <div v-show="step === 1" class="step-panel qh-card">
          <h3>{{ t('checkout.shippingAddress') }}</h3>
          <el-form :model="form" label-position="top">
            <div class="form-row two-col">
              <el-form-item :label="t('checkout.firstName')">
                <el-input v-model="form.firstName" />
              </el-form-item>
              <el-form-item :label="t('checkout.lastName')">
                <el-input v-model="form.lastName" />
              </el-form-item>
            </div>
            <div class="form-row two-col">
              <el-form-item :label="t('checkout.email')">
                <el-input v-model="form.email" />
              </el-form-item>
              <el-form-item :label="t('checkout.phone')">
                <el-input v-model="form.phone" />
              </el-form-item>
            </div>
            <el-form-item :label="t('checkout.country')">
              <el-select v-model="form.country" class="full">
                <el-option v-for="c in countries" :key="c.code" :label="c.flag + ' ' + c.name" :value="c.code" />
              </el-select>
            </el-form-item>
            <el-form-item label="Address">
              <el-input v-model="form.address" />
            </el-form-item>
            <div class="form-row three-col">
              <el-form-item label="City">
                <el-input v-model="form.city" />
              </el-form-item>
              <el-form-item label="State / Province">
                <el-input v-model="form.state" />
              </el-form-item>
              <el-form-item label="ZIP / Postal Code">
                <el-input v-model="form.zip" />
              </el-form-item>
            </div>
          </el-form>
          <div class="panel-actions">
            <el-button @click="router.push('/cart')">{{ t('common.back') }}</el-button>
            <el-button type="primary" @click="step = 2">{{ t('common.continue') }}</el-button>
          </div>
        </div>

        <!-- 物流方式 -->
        <div v-show="step === 2" class="step-panel qh-card">
          <h3>{{ t('checkout.shippingMethod') }}</h3>
          <div class="shipping-options">
            <div
              v-for="m in shippingMethods"
              :key="m.id"
              :class="['shipping-option', { selected: shippingMethod === m.id }]"
              @click="shippingMethod = m.id"
            >
              <el-radio :model-value="shippingMethod === m.id">{{ m.name }}</el-radio>
              <span class="duration">{{ m.duration }}</span>
              <span class="price">{{ m.price === 0 ? t('checkout.free') : formatPrice(m.price) }}</span>
            </div>
          </div>
          <div class="panel-actions">
            <el-button @click="step = 1">{{ t('common.back') }}</el-button>
            <el-button type="primary" @click="step = 3">{{ t('common.continue') }}</el-button>
          </div>
        </div>

        <!-- 支付 -->
        <div v-show="step === 3" class="step-panel qh-card">
          <h3>{{ t('checkout.paymentMethod') }}</h3>
          <div class="payment-methods">
            <div
              :class="['pay-method', { selected: paymentMethod === 'card' }]"
              @click="paymentMethod = 'card'"
            >
              <el-icon><CreditCard /></el-icon>
              <span>Credit / Debit Card</span>
            </div>
            <div
              :class="['pay-method', { selected: paymentMethod === 'paypal' }]"
              @click="paymentMethod = 'paypal'"
            >
              <el-icon><Wallet /></el-icon>
              <span>PayPal</span>
            </div>
            <div
              :class="['pay-method', { selected: paymentMethod === 'apple' }]"
              @click="paymentMethod = 'apple'"
            >
              <el-icon><Iphone /></el-icon>
              <span>Apple Pay</span>
            </div>
          </div>

          <div v-if="paymentMethod === 'card'" class="card-form">
            <el-form label-position="top">
              <el-form-item label="Card Number">
                <el-input v-model="cardForm.number" placeholder="1234 5678 9012 3456" />
              </el-form-item>
              <div class="form-row two-col">
                <el-form-item label="Expiry Date">
                  <el-input v-model="cardForm.expiry" placeholder="MM/YY" />
                </el-form-item>
                <el-form-item label="CVC">
                  <el-input v-model="cardForm.cvc" placeholder="123" />
                </el-form-item>
              </div>
              <el-form-item label="Cardholder Name">
                <el-input v-model="cardForm.name" />
              </el-form-item>
            </el-form>
          </div>
          <div v-else class="pay-placeholder">
            <p>You will be redirected to {{ paymentMethod === 'paypal' ? 'PayPal' : 'Apple Pay' }} to complete payment.</p>
          </div>

          <div class="panel-actions">
            <el-button @click="step = 2">{{ t('common.back') }}</el-button>
            <el-button type="primary" size="large" @click="placeOrder">
              {{ t('checkout.placeOrder') }} · {{ formatPrice(total) }}
            </el-button>
          </div>
        </div>
      </div>

      <!-- 右侧订单摘要 -->
      <aside class="checkout-summary qh-card">
        <h3>{{ t('checkout.orderSummary') }}</h3>
        <div class="summary-items">
          <div v-for="item in selectedItems" :key="item.productId" class="summary-item">
            <div class="sum-image">
              <img :src="item.product.image" :alt="tText(item.product.name, locale as any)" />
              <span class="sum-qty">{{ localizeNumber(item.quantity, locale) }}</span>
            </div>
            <div class="sum-info">
              <span class="sum-name">{{ tText(item.product.name, locale as any) }}</span>
              <span class="sum-price">{{ formatPrice(item.product.price * item.quantity) }}</span>
            </div>
          </div>
        </div>
        <div class="summary-divider"></div>
        <div class="summary-line">
          <span>{{ t('cart.subtotal') }}</span>
          <span>{{ formatPrice(subtotal) }}</span>
        </div>
        <div class="summary-line">
          <span>{{ t('cart.shipping') }}</span>
          <span>{{ shippingCost === 0 ? t('checkout.free') : formatPrice(shippingCost) }}</span>
        </div>
        <div class="summary-line">
          <span>{{ t('checkout.tax') }} (5%)</span>
          <span>{{ formatPrice(tax) }}</span>
        </div>
        <div class="summary-divider"></div>
        <div class="summary-total">
          <span>{{ t('cart.total') }}</span>
          <span class="total-amount">{{ formatPrice(total) }}</span>
        </div>

        <div class="currency-switch">
          <span>{{ t('common.currency') }}:</span>
          <el-select v-model="appStore.currency" size="small" style="width: 110px">
            <el-option label="USD ($)" value="USD" />
            <el-option label="CNY (¥)" value="CNY" />
            <el-option label="EUR (€)" value="EUR" />
            <el-option label="JPY (¥)" value="JPY" />
            <el-option label="GBP (£)" value="GBP" />
          </el-select>
        </div>
      </aside>
    </div>
  </div>
</template>

<style scoped>
.checkout-page {
  padding: 32px 48px;
}
.page-title {
  font-size: 28px;
  font-weight: 600;
  margin: 0 0 24px;
}
.success-card,
.empty-state {
  text-align: center;
  padding: 64px 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}
.success-icon {
  color: var(--color-success);
}
.success-card h2 {
  margin: 12px 0 4px;
}
.order-id {
  font-size: 15px;
  color: var(--color-text-regular);
}
.success-desc {
  color: var(--color-text-secondary);
  margin: 0 0 16px;
}
.checkout-layout {
  display: grid;
  grid-template-columns: 1fr 360px;
  gap: 24px;
  align-items: start;
}
.steps-bar {
  display: flex;
  align-items: center;
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 16px 24px;
  margin-bottom: 20px;
}
.step {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  color: var(--color-text-secondary);
}
.step.active {
  color: var(--color-primary);
  font-weight: 600;
}
.step.done {
  color: var(--color-success);
}
.step-num {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--color-bg-soft);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 600;
}
.step.active .step-num {
  background: var(--color-primary);
  color: #fff;
}
.step.done .step-num {
  background: var(--color-success);
  color: #fff;
}
.step-line {
  flex: 1;
  height: 1px;
  background: var(--color-border);
  margin: 0 16px;
}
.step-panel {
  padding: 28px;
}
.step-panel h3 {
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 20px;
}
.form-row {
  display: grid;
  gap: 16px;
}
.form-row.two-col {
  grid-template-columns: 1fr 1fr;
}
.form-row.three-col {
  grid-template-columns: 1fr 1fr 1fr;
}
.full {
  width: 100%;
}
.panel-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid var(--color-border);
}
.shipping-options {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.shipping-option {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  border: 2px solid var(--color-border);
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
}
.shipping-option:hover {
  border-color: var(--color-primary-light);
}
.shipping-option.selected {
  border-color: var(--color-primary);
  background: rgba(26, 107, 92, 0.03);
}
.duration {
  font-size: 13px;
  color: var(--color-text-secondary);
}
.price {
  font-size: 16px;
  font-weight: 600;
  color: var(--color-primary);
}
.payment-methods {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 20px;
}
.pay-method {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 20px 12px;
  border: 2px solid var(--color-border);
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 13px;
}
.pay-method:hover {
  border-color: var(--color-primary-light);
}
.pay-method.selected {
  border-color: var(--color-primary);
  background: rgba(26, 107, 92, 0.03);
  color: var(--color-primary);
}
.pay-method .el-icon {
  font-size: 28px;
}
.card-form {
  padding-top: 16px;
  border-top: 1px solid var(--color-border);
}
.pay-placeholder {
  padding: 24px;
  text-align: center;
  background: var(--color-bg-soft);
  border-radius: 10px;
  color: var(--color-text-regular);
}
.checkout-summary {
  padding: 24px;
  position: sticky;
  top: 80px;
}
.checkout-summary h3 {
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 20px;
}
.summary-items {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 240px;
  overflow-y: auto;
}
.summary-item {
  display: flex;
  gap: 12px;
}
.sum-image {
  position: relative;
  width: 56px;
  height: 56px;
  border-radius: 8px;
  overflow: hidden;
  background: var(--color-bg-soft);
  flex-shrink: 0;
}
.sum-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.sum-qty {
  position: absolute;
  top: -4px;
  right: -4px;
  min-width: 20px;
  height: 20px;
  padding: 0 5px;
  background: var(--color-primary);
  color: #fff;
  font-size: 11px;
  border-radius: 999px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.sum-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 4px;
}
.sum-name {
  font-size: 13px;
  color: var(--color-text-primary);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.sum-price {
  font-size: 13px;
  font-weight: 600;
}
.summary-divider {
  height: 1px;
  background: var(--color-border);
  margin: 16px 0;
}
.summary-line {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
  color: var(--color-text-regular);
  margin-bottom: 10px;
}
.summary-total {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
}
.summary-total span:first-child {
  font-size: 15px;
  font-weight: 600;
}
.total-amount {
  font-size: 24px;
  font-weight: 700;
  color: var(--color-primary);
}
.currency-switch {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid var(--color-border);
  font-size: 13px;
  color: var(--color-text-secondary);
}
@media (max-width: 1024px) {
  .checkout-layout {
    grid-template-columns: 1fr;
  }
  .checkout-summary {
    position: static;
  }
}
@media (max-width: 768px) {
  .checkout-page {
    padding: 16px;
  }
  .form-row.two-col,
  .form-row.three-col {
    grid-template-columns: 1fr;
  }
  .payment-methods {
    grid-template-columns: 1fr;
  }
  .steps-bar {
    padding: 12px;
    font-size: 12px;
  }
  .step span:last-child {
    display: none;
  }
}
</style>
