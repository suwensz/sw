/**
 * 素衡OS · 工具注册表（suheng-gateway tools 模块，阶段3a）
 *
 * Function Calling 工具集中注册与分发：
 *   - listTools()   返回 OpenAI tools 参数格式 schema 列表（前端/网关注入 LLM）
 *   - invokeTool()  执行单个工具（含 trace：provider / latency_ms）
 *
 * 实现分级：
 *   L0 本地实现（local-data.cjs，零外部依赖，始终可用）
 *   L1 1688 开放平台（ali1688.cjs，vault keys.ali1688 配置后启用；失败自动降级 L0）
 *
 * 域 → 工具挂载（设计文档 §5）：
 *   tcm      : search_tcm_kb
 *   ecom     : search_supply_products, get_supplier_info, get_price_trend, search_system_kb
 *   domestic : search_supply_products, search_system_kb
 */
const local = require('./local-data.cjs')
const ali = require('./ali1688.cjs')
const kb = require('../kb.cjs')

/* ============== 工具 Schema（OpenAI Function Calling 格式） ============== */

const TOOL_SCHEMAS = [
  {
    type: 'function',
    function: {
      name: 'search_supply_products',
      description: '搜索供应市场的商品，返回价格区间、起订量（MOQ）、供应商数、交期与主产区',
      parameters: {
        type: 'object',
        properties: {
          keywords: { type: 'string', description: '商品关键词，如 艾灸条、枸杞、充电宝' },
          price_min: { type: 'number', description: '可接受的最低价（按商品计价币种）' },
          price_max: { type: 'number', description: '可接受的最高价（按商品计价币种）' },
          moq_max: { type: 'number', description: '可接受的最大起订量' },
        },
        required: ['keywords'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_supplier_info',
      description: '查询供应商工商与经营信息（成立年限/注册资本/风险等级/产能/认证）',
      parameters: {
        type: 'object',
        properties: {
          company_name: { type: 'string', description: '公司名称或主营品类关键词' },
          include: {
            type: 'array',
            items: { type: 'string', enum: ['basic', 'risk', 'capacity'] },
            description: '需要的板块，默认全部',
          },
        },
        required: ['company_name'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_price_trend',
      description: '查询商品历史价格走势（近30/90天，指数形式，基期=1.0）',
      parameters: {
        type: 'object',
        properties: {
          keywords: { type: 'string', description: '商品关键词' },
          range_days: { type: 'integer', enum: [30, 90], description: '统计区间天数，默认30' },
        },
        required: ['keywords'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'search_tcm_kb',
      description: '检索中医知识库（典籍/中药/方剂/穴位/食疗），供中医健康问题查证出处',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: '检索词，如 桂枝汤的组成' },
          doc_type: {
            type: 'string',
            enum: ['classic', 'herb', 'formula', 'acupoint', 'recipe'],
            description: '限定资料类型，不传则全库检索',
          },
        },
        required: ['query'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'search_system_kb',
      description:
        '检索素衡OS系统内置数据库（在售商品价格/库存/评分、店铺、订单、供应链、物流、情报等业务数据）。凡涉及系统内具体商品或业务档案的问题，应优先调用本工具查证',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: '检索词，如 长白山人参切片 价格、艾灸条 采购' },
          domain: {
            type: 'string',
            enum: ['ecom', 'domestic'],
            description: '限定业务域（ecom=跨境电商，domestic=国内电商），不传则两域都查',
          },
        },
        required: ['query'],
      },
    },
  },
]

/** 各域挂载的工具名（general = 全量） */
const DOMAIN_TOOLS = {
  tcm: ['search_tcm_kb'],
  ecom: ['search_supply_products', 'get_supplier_info', 'get_price_trend', 'search_system_kb'],
  domestic: ['search_supply_products', 'search_system_kb'],
  general: [
    'search_supply_products',
    'get_supplier_info',
    'get_price_trend',
    'search_tcm_kb',
    'search_system_kb',
  ],
}

/** 按域返回 tools schema 列表（透传给 LLM） */
function toolsForDomain(domain) {
  const names = DOMAIN_TOOLS[domain] || DOMAIN_TOOLS.general
  return TOOL_SCHEMAS.filter((t) => names.includes(t.function.name))
}

/** 工具清单（调试面板用）：schema + 说明 */
function listTools() {
  return {
    ok: true,
    ali1688Configured: !!ali.aliConfig(),
    tools: TOOL_SCHEMAS.map((t) => ({
      name: t.function.name,
      description: t.function.description,
      parameters: t.function.parameters,
      domains: Object.entries(DOMAIN_TOOLS)
        .filter(([, names]) => names.includes(t.function.name))
        .map(([d]) => d),
    })),
  }
}

/* ============== 工具执行 ============== */

/** 单个工具实现（同步或异步） */
const IMPLEMENTATIONS = {
  async search_supply_products(args) {
    // L1：1688 开放平台（已配置才尝试）
    if (ali.aliConfig()) {
      try {
        const r = await ali.callApi('alibaba.icbu.product.search', {
          keywords: args.keywords,
          ...(args.price_min != null ? { price_min: String(args.price_min) } : {}),
          ...(args.price_max != null ? { price_max: String(args.price_max) } : {}),
        })
        if (r && r.result) {
          return { data: r.result, provider: '1688-open' }
        }
      } catch {
        /* 降级 L0 */
      }
    }
    return { data: local.searchProducts(args), provider: 'local-fallback' }
  },

  async get_supplier_info(args) {
    // L1 预留：企查查/1688 诚信档案开放接口接入点
    return { data: local.supplierInfo(args), provider: 'local-fallback' }
  },

  async get_price_trend(args) {
    return { data: local.priceTrend(args), provider: 'local-fallback' }
  },

  async search_tcm_kb(args) {
    const result = await kb.search({
      query: args.query,
      domain: 'tcm',
      topK: 5,
      ...(args.doc_type ? { filters: { doc_type: [args.doc_type] } } : {}),
    })
    return { data: result, provider: 'suheng-kb' }
  },

  async search_system_kb(args) {
    const query = String(args.query || '')
    const topK = 5
    const domains = args.domain ? [args.domain] : ['ecom', 'domestic']
    const results = await Promise.all(
      domains.map((domain) => kb.search({ query, domain, topK })),
    )
    const hits = results.flatMap((r) => r.hits || []).sort((a, b) => b.score - a.score).slice(0, topK)
    return { data: { hits, total: hits.length }, provider: 'suheng-kb' }
  },
}

/**
 * 执行工具：{ok, data, trace:{name, provider, latency_ms}} | {ok:false, error}
 */
async function invokeTool(name, args) {
  const impl = IMPLEMENTATIONS[name]
  if (!impl) return { ok: false, error: `unknown tool: ${name}` }
  const started = Date.now()
  try {
    const { data, provider } = await impl(args || {})
    return {
      ok: true,
      data,
      trace: { name, provider, latency_ms: Date.now() - started },
    }
  } catch (err) {
    return {
      ok: false,
      error: String((err && err.message) || err),
      trace: { name, provider: 'error', latency_ms: Date.now() - started },
    }
  }
}

module.exports = { TOOL_SCHEMAS, DOMAIN_TOOLS, toolsForDomain, listTools, invokeTool }
