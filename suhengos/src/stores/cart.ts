import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { CartItem, Product } from '@/types'

const STORAGE_KEY = 'qh_cart'

function loadCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as CartItem[]) : []
  } catch {
    return []
  }
}

export const useCartStore = defineStore('cart', () => {
  const items = ref<CartItem[]>(loadCart())
  const selectedIds = ref<Set<string>>(new Set(items.value.map((i) => i.productId)))

  const totalItems = computed(() => items.value.reduce((sum, i) => sum + i.quantity, 0))
  const selectedItems = computed(() =>
    items.value.filter((i) => selectedIds.value.has(i.productId)),
  )
  const selectedCount = computed(() =>
    selectedItems.value.reduce((sum, i) => sum + i.quantity, 0),
  )
  const subtotal = computed(() =>
    selectedItems.value.reduce((sum, i) => sum + i.product.price * i.quantity, 0),
  )
  const isAllSelected = computed(
    () => items.value.length > 0 && items.value.every((i) => selectedIds.value.has(i.productId)),
  )

  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items.value))
  }

  function addToCart(product: Product, quantity = 1) {
    const existing = items.value.find((i) => i.productId === product.id)
    if (existing) {
      existing.quantity += quantity
    } else {
      items.value.push({ productId: product.id, quantity, product })
      selectedIds.value.add(product.id)
    }
    save()
  }

  function removeFromCart(productId: string) {
    items.value = items.value.filter((i) => i.productId !== productId)
    selectedIds.value.delete(productId)
    save()
  }

  function updateQuantity(productId: string, quantity: number) {
    const item = items.value.find((i) => i.productId === productId)
    if (item) {
      item.quantity = Math.max(1, quantity)
      save()
    }
  }

  function toggleSelect(productId: string) {
    if (selectedIds.value.has(productId)) {
      selectedIds.value.delete(productId)
    } else {
      selectedIds.value.add(productId)
    }
  }

  function toggleSelectAll() {
    if (isAllSelected.value) {
      selectedIds.value.clear()
    } else {
      items.value.forEach((i) => selectedIds.value.add(i.productId))
    }
  }

  function clearSelected() {
    items.value = items.value.filter((i) => !selectedIds.value.has(i.productId))
    selectedIds.value.clear()
    save()
  }

  function clearCart() {
    items.value = []
    selectedIds.value.clear()
    save()
  }

  return {
    items,
    selectedIds,
    totalItems,
    selectedItems,
    selectedCount,
    subtotal,
    isAllSelected,
    addToCart,
    removeFromCart,
    updateQuantity,
    toggleSelect,
    toggleSelectAll,
    clearSelected,
    clearCart,
  }
})
