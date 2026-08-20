/**
 * Products & Shop API 服务
 */

import http from './http'
import type { Product, CurrencyOption, ShippingMethod } from '@/types'

export const productsApi = {
  /** 获取商品列表 */
  list(): Promise<Product[]> {
    return http.get('/api/v1/products') as unknown as Promise<Product[]>
  },

  /** 获取单个商品 */
  get(id: string): Promise<Product> {
    return http.get(`/api/v1/products/${id}`) as unknown as Promise<Product>
  },
}

export const shopApi = {
  /** 获取货币列表 */
  currencies(): Promise<CurrencyOption[]> {
    return http.get('/api/v1/shop/currencies') as unknown as Promise<CurrencyOption[]>
  },

  /** 获取物流方式 */
  shipping(): Promise<ShippingMethod[]> {
    return http.get('/api/v1/shop/shipping') as unknown as Promise<ShippingMethod[]>
  },
}
