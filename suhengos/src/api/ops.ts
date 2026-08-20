/**
 * Ops 运营 API 服务
 */

import http from './http'
import type { Marketplace, CompetitorProduct, SupplyChainItem, MarketDemand, MarketplaceId } from '@/types'

export const opsApi = {
  /** 获取平台列表 */
  getMarketplaces(): Promise<Marketplace[]> {
    return http.get('/api/v1/ops/marketplaces') as unknown as Promise<Marketplace[]>
  },

  /** 获取竞品情报 */
  getCompetitors(keyword?: string): Promise<CompetitorProduct[]> {
    return http.get('/api/v1/ops/competitors', { params: { keyword } }) as unknown as Promise<CompetitorProduct[]>
  },

  /** 获取供应链 */
  getSupplyChain(): Promise<SupplyChainItem[]> {
    return http.get('/api/v1/ops/supply-chain') as unknown as Promise<SupplyChainItem[]>
  },

  /** 获取市场需求 */
  getDemands(): Promise<MarketDemand[]> {
    return http.get('/api/v1/ops/demands') as unknown as Promise<MarketDemand[]>
  },
}
