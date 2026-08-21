// 电商运营 Mock 数据：平台、竞品、供应链、市场需求
import type { Marketplace, CompetitorProduct, SupplyChainItem, MarketDemand, MarketplaceId } from '@/types'
import { mockProducts as products } from './products'

const T = (zh: string, en: string, ja: string, ko: string, es: string, fr: string) => ({ zh, en, ja, ko, es, fr })

export const MARKETPLACES: Marketplace[] = [
  { id: 'shopee', name: 'Shopee', region: T('东南亚', 'Southeast Asia', '東南アジア', '동남아', 'Sudeste Asiático', 'Asie du Sud-Est'), currency: 'USD', flag: '🛒', connected: true },
  { id: 'lazada', name: 'Lazada', region: T('东南亚', 'Southeast Asia', '東南アジア', '동남아', 'Sudeste Asiático', 'Asie du Sud-Est'), currency: 'USD', flag: '🛍️', connected: true },
  { id: 'tiktok', name: 'TikTok Shop', region: T('东南亚', 'Southeast Asia', '東南アジア', '동남아', 'Sudeste Asiático', 'Asie du Sud-Est'), currency: 'USD', flag: '🎵', connected: true },
  { id: 'tokopedia', name: 'Tokopedia', region: T('印尼', 'Indonesia', 'インドネシア', '인도네시아', 'Indonesia', 'Indonésie'), currency: 'IDR', flag: '🏪', connected: false },
  { id: 'noon', name: 'Noon', region: T('中东', 'Middle East', '中東', '중동', 'Medio Oriente', 'Moyen-Orient'), currency: 'AED', flag: '☀️', connected: true },
  { id: 'amazon_me', name: 'Amazon ME', region: T('中东', 'Middle East', '中東', '중동', 'Medio Oriente', 'Moyen-Orient'), currency: 'AED', flag: '📦', connected: false },
  { id: 'jd', name: '京东全球售', region: T('国内出海', 'China Cross-border', '中国越境', '중국 크로스보더', 'China Cross-border', 'Chine Cross-border'), currency: 'CNY', flag: '🐶', connected: true },
  { id: 'taobao', name: '淘宝海外', region: T('国内出海', 'China Cross-border', '中国越境', '중국 크로스보더', 'China Cross-border', 'Chine Cross-border'), currency: 'CNY', flag: '🍑', connected: false },
  { id: 'pinduoduo', name: 'Temu/拼多多', region: T('国内出海', 'China Cross-border', '中国越境', '중국 크로스보더', 'China Cross-border', 'Chine Cross-border'), currency: 'USD', flag: '🎯', connected: true },
]

// 竞品样本（围绕中医药产品）
const COMPETITOR_TITLES: Record<string, { zh: string; en: string }> = {
  p1: { zh: 'Goji Berries Organic Premium 500g', en: 'Goji Berries Organic 500g' },
  p2: { zh: 'Dried Longan Pulp Seedless 400g', en: 'Dried Longan 400g' },
  p3: { zh: 'Red Dates Jujube Premium Grade 1kg', en: 'Red Dates Jujube 1kg' },
  p4: { zh: 'Angelica Sinensis Dong Quai Root', en: 'Dong Quai Root Slices' },
  p5: { zh: 'Ginseng Tea Bags Energy Boost', en: 'Ginseng Energy Tea 20 bags' },
  p6: { zh: 'Moxa Rolls Pure Moxibustion 10pcs', en: 'Pure Moxa Rolls 10pcs' },
  p7: { zh: 'Cupping Therapy Set 12 Cups', en: 'Cupping Therapy Set 12 Cups' },
  p8: { zh: 'Tremella Mushroom White Fungus', en: 'Tremella White Fungus 200g' },
}

function randomTrend(): number[] {
  return Array.from({ length: 12 }, () => Math.floor(200 + Math.random() * 800))
}

export function generateCompetitors(keyword: string = ''): CompetitorProduct[] {
  const platforms: MarketplaceId[] = ['shopee', 'lazada', 'tiktok', 'noon', 'jd', 'taobao', 'pinduoduo']
  const entries = Object.entries(COMPETITOR_TITLES)
  return entries.flatMap(([id, title], i) => {
    return platforms.slice(0, 4 + Math.floor(Math.random() * 3)).map((pf, j) => {
      const price = 8 + Math.random() * 45
      const sales = Math.floor(100 + Math.random() * 9000)
      return {
        id: `${id}-${pf}-${j}`,
        title: title.en,
        platform: pf,
        price: Number(price.toFixed(2)),
        currency: ['jd', 'taobao'].includes(pf) ? 'CNY' : pf === 'noon' ? 'AED' : 'USD',
        sales30d: sales,
        rating: Number((3.8 + Math.random() * 1.2).toFixed(1)),
        reviews: Math.floor(sales * (0.1 + Math.random() * 0.4)),
        stockStatus: (Math.random() > 0.2 ? 'in_stock' : Math.random() > 0.5 ? 'low' : 'out') as CompetitorProduct['stockStatus'],
        url: '#',
        image: products[i % products.length].image,
        delta: Number(((-5 + Math.random() * 15)).toFixed(1)),
      }
    })
  }).filter((c) => !keyword || c.title.toLowerCase().includes(keyword.toLowerCase()))
}

// 供应链
export function generateSupplyChain(): SupplyChainItem[] {
  return products.map((p, i) => {
    const statuses: SupplyChainItem['status'][] = ['in_stock', 'transit', 'production', 'shortage']
    // 供应商与产地多语言（zh/en，其余语言回退英文）
    const suppliers = [
      { zh: '亳州中药材基地', en: 'Bozhou TCM Herb Base' },
      { zh: '安国药材市场', en: 'Anguo Herb Market' },
      { zh: '云南文山种植合作社', en: 'Yunnan Wenshan Growers Co-op' },
      { zh: '宁夏中宁枸杞庄园', en: 'Ningxia Zhongning Goji Estate' },
      { zh: '吉林抚松人参基地', en: 'Jilin Fusong Ginseng Base' },
    ]
    const origins = [
      { zh: '宁夏中宁', en: 'Zhongning, Ningxia' },
      { zh: '广东高州', en: 'Gaozhou, Guangdong' },
      { zh: '新疆若羌', en: 'Ruoqiang, Xinjiang' },
      { zh: '甘肃岷县', en: 'Minxian, Gansu' },
      { zh: '吉林长白山', en: 'Changbai Mountain, Jilin' },
      { zh: '湖北蕲春', en: 'Qichun, Hubei' },
      { zh: '江苏苏州', en: 'Suzhou, Jiangsu' },
      { zh: '福建古田', en: 'Gutian, Fujian' },
    ]
    const stock = Math.floor(50 + Math.random() * 2000)
    return {
      id: `sc-${p.id}`,
      productId: p.id,
      productName: p.name,
      supplier: suppliers[i % suppliers.length],
      origin: origins[i % origins.length],
      batch: `B${2024}${String(i + 1).padStart(3, '0')}`,
      stock,
      inboundDate: new Date(Date.now() - Math.random() * 30 * 86400000).toISOString().split('T')[0],
      leadTimeDays: 3 + Math.floor(Math.random() * 20),
      cost: Number((p.price * 0.35 + Math.random() * 5).toFixed(2)),
      status: stock < 100 ? 'shortage' : statuses[i % statuses.length],
      qualityGrade: (['A', 'A', 'A', 'B', 'B', 'C'] as const)[i % 6],
    }
  })
}

// 市场需求
export function generateMarketDemands(): MarketDemand[] {
  const keywords = [
    { zh: '有机枸杞', en: 'organic goji berries', ja: 'オーガニッククコ', ko: '유기농 구기자', es: 'goji orgánico', fr: 'goji bio' },
    { zh: '艾灸盒', en: 'moxibustion box', ja: '艾灸ボックス', ko: '뜸질 기기', es: 'caja moxibustión', fr: 'boîte moxa' },
    { zh: '拔罐器', en: 'cupping set', ja: 'カッピング', ko: '부항기', es: 'set ventosas', fr: 'kit ventouses' },
    { zh: '人参茶包', en: 'ginseng tea bags', ja: '高麗茶ティーバッグ', ko: '인삼차', es: 'té ginseng', fr: 'thé ginseng' },
    { zh: '红枣礼盒', en: 'red dates gift box', ja: 'なつめギフト', ko: '대추 선물세트', es: 'caja dátiles', fr: 'coffret dattes' },
    { zh: '当归切片', en: 'dong quai slices', ja: '当帰スライス', ko: '당귀 슬라이스', es: 'rodajas dong quai', fr: 'tranches dong quai' },
    { zh: '银耳干货', en: 'tremella mushroom', ja: '白キクラゲ', ko: '은이버섯', es: 'hongo tremella', fr: 'champignon tremella' },
    { zh: '养生茶组合', en: 'wellness tea set', ja: '健康茶セット', ko: '건강차 세트', es: 'set té bienestar', fr: 'coffret thé bien-être' },
  ]
  const categories = ['herbs', 'tea', 'device', 'gift', 'supplement']
  const regions: MarketplaceId[] = ['shopee', 'lazada', 'noon', 'tiktok', 'jd']
  return keywords.map((kw, i) => {
    const volume = Math.floor(5000 + Math.random() * 95000)
    const growth = Number((Math.random() * 80 - 10).toFixed(1))
    const competition = (volume > 60000 ? 'high' : volume > 20000 ? 'medium' : 'low') as MarketDemand['competition']
    return {
      id: `dmd-${i}`,
      keyword: kw,
      category: categories[i % categories.length],
      region: regions[i % regions.length],
      searchVolume: volume,
      growthRate: growth,
      competition,
      trend: randomTrend(),
      avgPrice: Number((9 + Math.random() * 40).toFixed(2)),
      opportunity: Number((growth / 10 + (competition === 'low' ? 30 : competition === 'medium' ? 15 : 5) + Math.random() * 20).toFixed(0)),
    }
  }).sort((a, b) => b.opportunity - a.opportunity)
}
