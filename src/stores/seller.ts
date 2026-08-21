import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Product } from '@/types'
import { lt } from '@/utils/locale'

const STORAGE_KEY = 'qh_seller_products'

function loadProducts(): Product[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Product[]) : []
  } catch {
    return []
  }
}

let idCounter = 100

export interface SellForm {
  name: string
  category: string
  price: number
  originalPrice?: number
  stock: number
  image: string
  description: string
}

export const useSellerStore = defineStore('seller', () => {
  const products = ref<Product[]>(loadProducts())

  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(products.value))
  }

  function addProduct(form: SellForm): Product {
    const id = `s${++idCounter}`
    const slug = `sell-${id}`
    const product: Product = {
      id,
      slug,
      category: form.category,
      price: form.price,
      originalPrice: form.originalPrice || undefined,
      currency: 'USD',
      rating: 5.0,
      reviewCount: 0,
      image: form.image || 'https://picsum.photos/seed/' + id + '/400/400',
      stock: form.stock,
      sales: 0,
      tags: ['new'],
      name: lt(form.name, form.name),
      description: lt(form.description, form.description),
      detail: lt(form.description, form.description),
      ingredients: lt('-', '-'),
      usage: lt('-', '-'),
    }
    products.value.unshift(product)
    save()
    return product
  }

  function removeProduct(id: string) {
    products.value = products.value.filter((p) => p.id !== id)
    save()
  }

  const totalCount = computed(() => products.value.length)

  return { products, addProduct, removeProduct, totalCount }
})
