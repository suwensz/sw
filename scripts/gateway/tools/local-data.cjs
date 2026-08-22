/**
 * 素衡OS · 工具 L0 本地数据（suheng-gateway tools 模块）
 *
 * Function Calling 工具的零依赖本地实现数据源（阶段3a）：
 *   - 供应商品池（关键词/价格区间/起订量/供应商数）——题材与前端 MOCK_PROCURE_LEADS 对齐
 *   - 供应商档案（工商/风险/产能）
 *   - 价格走势（基于关键词哈希的确定性伪随机序列，演示用）
 *
 * 阶段3b 配置 1688 开放平台 AppKey 后（vault keys.ali1688）自动切换 L1 官方 API，
 * 本文件保留为降级数据（trace.provider = 'local-fallback'）。
 */

/** 供应商品池：一条 = 一类可采购商品 */
const SUPPLY_PRODUCTS = [
  {
    keywords: ['艾灸条', '艾草', 'moxa', '艾柱'],
    category: '中药养生',
    priceRange: [0.8, 3.5],
    currency: 'CNY',
    moq: 100,
    unit: '盒',
    supplierCount: 142,
    leadTimeDays: 7,
    hotRegion: '湖北蕲春 / 河南南阳',
    hsCode: '0910.30',
  },
  {
    keywords: ['枸杞', 'goji', '干制草本'],
    category: '药食同源',
    priceRange: [6, 12],
    currency: 'USD/kg',
    moq: 500,
    unit: 'kg',
    supplierCount: 96,
    leadTimeDays: 10,
    hotRegion: '宁夏中宁 / 青海柴达木',
    hsCode: '1211.90',
  },
  {
    keywords: ['真丝连衣裙', '丝绸', '香云纱', 'silk dress'],
    category: '服装服饰',
    priceRange: [22, 68],
    currency: 'USD',
    moq: 50,
    unit: '件',
    supplierCount: 78,
    leadTimeDays: 15,
    hotRegion: '广东佛山 / 浙江杭州',
    hsCode: '6204.43',
  },
  {
    keywords: ['充电宝', '锂离子', 'power bank', '移动电源'],
    category: '3C数码',
    priceRange: [5, 15],
    currency: 'USD',
    moq: 200,
    unit: '个',
    supplierCount: 210,
    leadTimeDays: 12,
    hotRegion: '广东深圳 / 东莞',
    hsCode: '8507.60',
  },
  {
    keywords: ['草本护肤', '面霜', 'herbal cream', '护肤品'],
    category: '美妆个护',
    priceRange: [4, 18],
    currency: 'USD',
    moq: 300,
    unit: '瓶',
    supplierCount: 64,
    leadTimeDays: 20,
    hotRegion: '广东广州 / 上海',
    hsCode: '3304.99',
  },
  {
    keywords: ['LED', '户外灯具', 'led light', '照明'],
    category: '照明灯具',
    priceRange: [3, 14],
    currency: 'USD',
    moq: 500,
    unit: '套',
    supplierCount: 158,
    leadTimeDays: 18,
    hotRegion: '广东中山 / 浙江宁波',
    hsCode: '9405.40',
  },
  {
    keywords: ['背包', '箱包', 'backpack', '运动包'],
    category: '箱包配饰',
    priceRange: [4, 20],
    currency: 'USD',
    moq: 200,
    unit: '个',
    supplierCount: 132,
    leadTimeDays: 14,
    hotRegion: '广东广州 / 河北保定',
    hsCode: '4202.92',
  },
  {
    keywords: ['养生茶', '中药茶包', '花茶', 'wellness tea'],
    category: '药食同源',
    priceRange: [9, 35],
    currency: 'USD',
    moq: 150,
    unit: '盒',
    supplierCount: 88,
    leadTimeDays: 9,
    hotRegion: '安徽亳州 / 福建宁德',
    hsCode: '3003.90',
  },
  {
    keywords: ['保温杯', '不锈钢杯', 'thermos'],
    category: '家居日用',
    priceRange: [2, 9],
    currency: 'USD',
    moq: 300,
    unit: '个',
    supplierCount: 175,
    leadTimeDays: 15,
    hotRegion: '浙江永康 / 广东潮州',
    hsCode: '9617.00',
  },
  {
    keywords: ['按摩仪', '按摩器', 'massage device', '磁悬浮'],
    category: '健康器械',
    priceRange: [12, 45],
    currency: 'USD',
    moq: 100,
    unit: '台',
    supplierCount: 57,
    leadTimeDays: 16,
    hotRegion: '广东深圳 / 福建厦门',
    hsCode: '9019.10',
  },
]

/** 供应商档案 */
const SUPPLIERS = [
  {
    companyName: '蕲春艾源艾制品有限公司',
    matchedKeywords: ['艾灸条', '艾草', 'moxa'],
    basic: {
      founded: '2015-06-18', legalPerson: '张某某', registeredCapital: '500万元',
      region: '湖北省黄冈市蕲春县', employees: '120-150人', nature: '有限责任公司',
    },
    risk: { level: 'low', disputes: 0, abnormalOps: false, taxRating: 'A' },
    capacity: { mainProducts: '艾灸条/艾柱/艾绒贴', monthlyOutput: '200万盒', certifications: 'GMP、ISO9001', exportShare: '35%' },
  },
  {
    companyName: '中宁枸杞实业有限公司',
    matchedKeywords: ['枸杞', 'goji'],
    basic: {
      founded: '2010-03-22', legalPerson: '李某某', registeredCapital: '2000万元',
      region: '宁夏中卫市中宁县', employees: '300-500人', nature: '有限责任公司',
    },
    risk: { level: 'low', disputes: 2, abnormalOps: false, taxRating: 'A' },
    capacity: { mainProducts: '枸杞干果/原浆/冻干', monthlyOutput: '800吨', certifications: '有机认证、HACCP', exportShare: '60%' },
  },
  {
    companyName: '佛山香云纱世家服饰有限公司',
    matchedKeywords: ['真丝连衣裙', '丝绸', '香云纱', 'silk dress'],
    basic: {
      founded: '2012-11-05', legalPerson: '陈某某', registeredCapital: '800万元',
      region: '广东省佛山市顺德区', employees: '80-100人', nature: '有限责任公司',
    },
    risk: { level: 'medium', disputes: 5, abnormalOps: false, taxRating: 'B' },
    capacity: { mainProducts: '香云纱连衣裙/盘扣上衣/非遗文创', monthlyOutput: '3万件', certifications: '非遗工坊认证', exportShare: '25%' },
  },
  {
    companyName: '深圳驰能新能源科技有限公司',
    matchedKeywords: ['充电宝', '锂离子', 'power bank'],
    basic: {
      founded: '2018-01-15', legalPerson: '王某', registeredCapital: '1000万元',
      region: '广东省深圳市宝安区', employees: '200-300人', nature: '有限责任公司',
    },
    risk: { level: 'low', disputes: 1, abnormalOps: false, taxRating: 'A' },
    capacity: { mainProducts: '移动电源/储能电源/磁吸充电', monthlyOutput: '50万个', certifications: 'CE、FCC、UN38.3', exportShare: '70%' },
  },
  {
    companyName: '亳州本草养生茶业有限公司',
    matchedKeywords: ['养生茶', '中药茶包', '花茶', 'wellness tea'],
    basic: {
      founded: '2016-09-08', legalPerson: '刘某某', registeredCapital: '300万元',
      region: '安徽省亳州市谯城区', employees: '50-80人', nature: '有限责任公司',
    },
    risk: { level: 'low', disputes: 0, abnormalOps: false, taxRating: 'B' },
    capacity: { mainProducts: '复方养生茶包/花果茶', monthlyOutput: '150万包', certifications: 'SC认证、ISO22000', exportShare: '20%' },
  },
  {
    companyName: '中山极光照明有限公司',
    matchedKeywords: ['LED', '户外灯具', 'led light'],
    basic: {
      founded: '2013-05-30', legalPerson: '周某', registeredCapital: '600万元',
      region: '广东省中山市古镇', employees: '150-200人', nature: '有限责任公司',
    },
    risk: { level: 'low', disputes: 3, abnormalOps: false, taxRating: 'A' },
    capacity: { mainProducts: '户外投光灯/太阳能路灯', monthlyOutput: '20万套', certifications: 'CE、ROHS、IP66', exportShare: '80%' },
  },
]

/* ============== 查询函数 ============== */

/** 关键词匹配供应商品（L0） */
function searchProducts({ keywords, price_min, price_max, moq_max }) {
  const kw = String(keywords || '').toLowerCase().trim()
  const hits = SUPPLY_PRODUCTS.filter((p) => {
    const m = !kw || p.keywords.some((k) => k.toLowerCase().includes(kw) || kw.includes(k.toLowerCase()))
    if (!m) return false
    if (price_min != null && p.priceRange[1] < price_min) return false
    if (price_max != null && p.priceRange[0] > price_max) return false
    if (moq_max != null && p.moq > moq_max) return false
    return true
  })
  return {
    total: hits.length,
    items: hits.map((p) => ({
      keywords: p.keywords[0],
      aliases: p.keywords,
      category: p.category,
      price_range: p.priceRange,
      currency: p.currency,
      moq: p.moq,
      unit: p.unit,
      supplier_count: p.supplierCount,
      lead_time_days: p.leadTimeDays,
      hot_region: p.hotRegion,
      hs_code: p.hsCode,
    })),
  }
}

/** 供应商档案查询（L0，按公司名或主营关键词） */
function supplierInfo({ company_name, include }) {
  const name = String(company_name || '').toLowerCase().trim()
  const s =
    SUPPLIERS.find((x) => x.companyName.toLowerCase().includes(name) || name.includes(x.companyName.toLowerCase())) ||
    SUPPLIERS.find((x) => x.matchedKeywords.some((k) => name.includes(k.toLowerCase())))
  if (!s) return { found: false, message: `未找到「${company_name}」的档案，可尝试主营品类关键词（如 艾灸条/枸杞/充电宝）` }
  const parts = Array.isArray(include) && include.length ? include : ['basic', 'risk', 'capacity']
  const out = { found: true, company_name: s.companyName }
  if (parts.includes('basic')) out.basic = s.basic
  if (parts.includes('risk')) out.risk = s.risk
  if (parts.includes('capacity')) out.capacity = s.capacity
  return out
}

/** 确定性伪随机：同关键词每次生成同一条走势（演示数据） */
function seededSeries(seed, n) {
  let h = 2166136261
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  const out = []
  let v = 1
  for (let i = 0; i < n; i++) {
    h = Math.imul(h ^ (h >>> 15), 2246822507)
    h ^= h >>> 13
    const r = ((h >>> 0) % 1000) / 1000 - 0.5
    v = Math.max(0.7, Math.min(1.3, v + r * 0.08))
    out.push(Math.round(v * 1000) / 1000)
  }
  return out
}

/** 价格走势（L0：关键词哈希生成确定性指数序列） */
function priceTrend({ keywords, range_days }) {
  const days = range_days === 90 ? 90 : 30
  const kw = String(keywords || '未知商品').trim()
  const product = SUPPLY_PRODUCTS.find((p) => p.keywords.some((k) => kw.includes(k)))
  const idx = seededSeries(kw, days)
  const first = idx[0]
  const last = idx[days - 1]
  const min = Math.min(...idx)
  const max = Math.max(...idx)
  const points = []
  for (let i = 0; i < days; i += Math.max(1, Math.floor(days / 10))) {
    points.push({ day: `-${days - i}d`, index: idx[i] })
  }
  points.push({ day: 'now', index: last })
  return {
    keywords: kw,
    matched_category: product ? product.category : null,
    range_days: days,
    baseline_price: product ? { range: product.priceRange, currency: product.currency } : null,
    trend_pct: Math.round((last / first - 1) * 1000) / 10,
    volatility_pct: Math.round((max / min - 1) * 1000) / 10,
    points,
    note: '演示数据：本地商品池生成的确定性指数走势（基期=1.0）',
  }
}

module.exports = { SUPPLY_PRODUCTS, SUPPLIERS, searchProducts, supplierInfo, priceTrend }
