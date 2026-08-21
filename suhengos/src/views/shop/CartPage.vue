<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useCartStore } from '@/stores/cart'
import { useAppStore } from '@/stores/app'
import { tText } from '@/i18n'
import { localizePrice, localizeNumber } from '@/utils/numbers'

const router = useRouter()
const { t, locale } = useI18n()
const cartStore = useCartStore()
const appStore = useAppStore()

function formatPrice(usd: number) {
  const p = appStore.convertPrice(usd)
  return localizePrice(p.value, p.symbol, locale.value)
}

async function removeItem(productId: string) {
  try {
    await ElMessageBox.confirm(t('cart.confirmRemove'), t('cart.remove'), {
      confirmButtonText: t('common.confirm'),
      cancelButtonText: t('common.cancel'),
      type: 'warning',
    })
    cartStore.removeFromCart(productId)
    ElMessage.success(t('common.success'))
  } catch {
    // cancelled
  }
}

function checkout() {
  if (cartStore.selectedCount === 0) {
    ElMessage.warning(t('cart.selectAll'))
    return
  }
  router.push('/checkout')
}
</script>

<template>
  <div class="cart-page qh-container">
    <h1 class="page-title">{{ t('cart.title') }}</h1>

    <!-- 空购物车 -->
    <div v-if="cartStore.items.length === 0" class="empty-cart qh-card">
      <el-icon :size="64" color="#8c8c8c"><ShoppingCart /></el-icon>
      <h2>{{ t('cart.empty') }}</h2>
      <p>{{ t('cart.emptyDesc') }}</p>
      <el-button type="primary" size="large" @click="router.push('/shop')">
        {{ t('cart.goShopping') }}
      </el-button>
    </div>

    <!-- 购物车列表 -->
    <div v-else class="cart-layout">
      <div class="cart-items qh-card">
        <div class="cart-header">
          <el-checkbox
            :model-value="cartStore.isAllSelected"
            @change="cartStore.toggleSelectAll()"
          >
            {{ t('cart.selectAll') }}
          </el-checkbox>
          <span class="header-info">{{ t('cart.totalItems', { count: localizeNumber(cartStore.totalItems, locale) }) }}</span>
          <span class="header-action"></span>
        </div>

        <div
          v-for="item in cartStore.items"
          :key="item.productId"
          :class="['cart-item', { selected: cartStore.selectedIds.has(item.productId) }]"
        >
          <el-checkbox
            :model-value="cartStore.selectedIds.has(item.productId)"
            @change="cartStore.toggleSelect(item.productId)"
          />
          <div class="item-image" @click="router.push(`/shop/${item.product.slug}`)">
            <img :src="item.product.image" :alt="tText(item.product.name, locale as any)" />
          </div>
          <div class="item-info" @click="router.push(`/shop/${item.product.slug}`)">
            <h3>{{ tText(item.product.name, locale as any) }}</h3>
            <p>{{ tText(item.product.description, locale as any) }}</p>
          </div>
          <div class="item-price">{{ formatPrice(item.product.price) }}</div>
          <el-input-number
            :model-value="item.quantity"
            :min="1"
            :max="item.product.stock"
            size="small"
            @update:model-value="(v: number | undefined) => cartStore.updateQuantity(item.productId, v ?? 1)"
          />
          <div class="item-subtotal">{{ formatPrice(item.product.price * item.quantity) }}</div>
          <button class="remove-btn" @click="removeItem(item.productId)">
            <el-icon><Delete /></el-icon>
          </button>
        </div>
      </div>

      <!-- 结算栏 -->
      <div class="cart-summary qh-card">
        <h3>{{ t('checkout.orderSummary') }}</h3>
        <div class="summary-row">
          <span>{{ t('cart.selected') }} ({{ t('cart.totalItems', { count: localizeNumber(cartStore.selectedCount, locale) }) }})</span>
          <span>{{ formatPrice(cartStore.subtotal) }}</span>
        </div>
        <div class="summary-row">
          <span>{{ t('cart.shipping') }}</span>
          <span class="free">{{ t('common.freeShipping') }}</span>
        </div>
        <div class="summary-total">
          <span>{{ t('cart.total') }}</span>
          <span class="total-price">{{ formatPrice(cartStore.subtotal) }}</span>
        </div>
        <el-button
          type="primary"
          size="large"
          class="checkout-btn"
          :disabled="cartStore.selectedCount === 0"
          @click="checkout"
        >
          {{ t('cart.checkout') }}
        </el-button>
        <el-button text class="continue-btn" @click="router.push('/shop')">
          {{ t('checkout.continueShopping') }}
        </el-button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.cart-page {
  padding: 32px 48px;
}
.page-title {
  font-size: 28px;
  font-weight: 600;
  margin: 0 0 24px;
}
.empty-cart {
  text-align: center;
  padding: 64px 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}
.empty-cart h2 {
  margin: 8px 0 4px;
  color: var(--color-text-primary);
}
.empty-cart p {
  color: var(--color-text-secondary);
  margin: 0 0 16px;
}
.cart-layout {
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: 24px;
  align-items: start;
}
.cart-items {
  padding: 0;
  overflow: hidden;
}
.cart-header {
  display: grid;
  grid-template-columns: 40px 1fr 100px 140px 100px 40px;
  align-items: center;
  gap: 16px;
  padding: 16px 24px;
  background: var(--color-bg-soft);
  font-size: 13px;
  color: var(--color-text-secondary);
  font-weight: 500;
}
.header-info {
  grid-column: 2;
}
.cart-item {
  display: grid;
  grid-template-columns: 40px 80px 1fr 100px 140px 100px 40px;
  align-items: center;
  gap: 16px;
  padding: 20px 24px;
  border-bottom: 1px solid var(--color-border);
  transition: background 0.2s;
}
.cart-item:last-child {
  border-bottom: none;
}
.cart-item.selected {
  background: rgba(26, 107, 92, 0.02);
}
.item-image {
  width: 80px;
  height: 80px;
  border-radius: 10px;
  overflow: hidden;
  cursor: pointer;
  background: var(--color-bg-soft);
}
.item-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.item-info {
  cursor: pointer;
}
.item-info h3 {
  font-size: 15px;
  font-weight: 500;
  margin: 0 0 4px;
  color: var(--color-text-primary);
}
.item-info p {
  font-size: 12px;
  color: var(--color-text-secondary);
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.item-price {
  font-size: 14px;
  color: var(--color-text-regular);
}
.item-subtotal {
  font-size: 16px;
  font-weight: 600;
  color: var(--color-primary);
}
.remove-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: none;
  color: var(--color-text-secondary);
  cursor: pointer;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}
.remove-btn:hover {
  color: var(--color-danger);
  background: rgba(217, 107, 92, 0.1);
}
.cart-summary {
  padding: 24px;
  position: sticky;
  top: 80px;
}
.cart-summary h3 {
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 20px;
}
.summary-row {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
  color: var(--color-text-regular);
  margin-bottom: 12px;
}
.summary-row .free {
  color: var(--color-success);
}
.summary-total {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  padding-top: 16px;
  margin-top: 8px;
  border-top: 1px solid var(--color-border);
}
.summary-total span:first-child {
  font-size: 15px;
  font-weight: 500;
}
.total-price {
  font-size: 26px;
  font-weight: 700;
  color: var(--color-primary);
}
.checkout-btn {
  width: 100%;
  margin-top: 20px;
  height: 46px;
  border-radius: 10px;
  font-size: 16px;
}
.continue-btn {
  width: 100%;
  margin-top: 8px;
}
@media (max-width: 1024px) {
  .cart-layout {
    grid-template-columns: 1fr;
  }
  .cart-summary {
    position: static;
  }
}
@media (max-width: 768px) {
  .cart-page {
    padding: 16px;
  }
  .cart-item {
    grid-template-columns: 30px 60px 1fr;
    grid-template-rows: auto auto;
    gap: 8px;
    padding: 16px;
  }
  .item-price,
  .item-subtotal,
  .remove-btn {
    grid-column: 3;
  }
  .cart-header {
    display: none;
  }
}
</style>
