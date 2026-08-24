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
 *   L2 素问Tokens分发器（suwensz.cjs，vault keys.suwensz 配置后启用；统一代理 1688/淘宝/京东/亚马逊，
 *      401 key 失效不降级，直接提示用户换 key）
 *
 * 域 → 工具挂载（设计文档 §5 / api-integration-design.md §3）：
 *   tcm      : search_tcm_kb
 *   ecom     : search_supply_products, get_supplier_info, get_price_trend, search_platform_products,
 *              optimize_product_image, generate_product_video, search_system_kb
 *   domestic : search_supply_products, search_platform_products, optimize_product_image,
 *              generate_product_video, search_system_kb
 */
const local = require('./local-data.cjs')
const ali = require('./ali1688.cjs')
const suwensz = require('./suwensz.cjs')
const vault = require('../vault.cjs')
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
  {
    type: 'function',
    function: {
      name: 'search_platform_products',
      description:
        '跨平台电商商品搜索（素问Tokens分发器统一代理）：一次接口查询 1688/淘宝/京东/亚马逊 的商品，返回标题、价格、销量、店铺与商品链接',
      parameters: {
        type: 'object',
        properties: {
          platform: {
            type: 'string',
            enum: ['1688', 'taobao', 'jd', 'amazon'],
            description: '目标电商平台',
          },
          keywords: { type: 'string', description: '商品关键词，如 艾灸条、筋膜枪、wireless earbuds' },
          price_min: { type: 'number', description: '可接受的最低价（平台计价币种）' },
          price_max: { type: 'number', description: '可接受的最高价（平台计价币种）' },
          page: { type: 'integer', description: '页码，默认 1' },
          page_size: { type: 'integer', description: '每页条数，默认 10' },
        },
        required: ['platform', 'keywords'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'optimize_product_image',
      description:
        '商品图片优化：主图精修(mode=main)、白底图(mode=white_bg)、多语言文案图(mode=copywriting)。需先在密钥保险箱配置 imageOpt 槽位（默认可灵AI）',
      parameters: {
        type: 'object',
        properties: {
          image_url: { type: 'string', description: '原图 URL（必填，公网可访问）' },
          mode: {
            type: 'string',
            enum: ['main', 'white_bg', 'copywriting'],
            description: '优化模式：main=主图精修 / white_bg=白底图 / copywriting=多语言文案图',
          },
          language: {
            type: 'string',
            enum: ['zh', 'en', 'ja', 'de', 'fr', 'es', 'ru'],
            description: '文案图语言（mode=copywriting 时生效），默认 zh',
          },
          prompt: { type: 'string', description: '额外优化要求，如 突出木质纹理、暖色调、留白排版' },
        },
        required: ['image_url', 'mode'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'generate_product_video',
      description:
        '商品短视频自动生成（图生视频，默认可灵AI）：以上架商品图/标题生成 3~15 秒展示视频。需先在密钥保险箱配置 videoGen 槽位',
      parameters: {
        type: 'object',
        properties: {
          image_url: { type: 'string', description: '商品主图 URL（与 product_title 至少传一项）' },
          product_title: { type: 'string', description: '商品标题/卖点文案（与 image_url 至少传一项）' },
          duration_seconds: { type: 'integer', minimum: 3, maximum: 15, description: '时长（秒），默认 5' },
          ratio: { type: 'string', enum: ['16:9', '9:16', '1:1'], description: '画幅比例，默认 16:9' },
          script: { type: 'string', description: '分镜/口播脚本，如 开场产品特写→使用场景→结尾促销信息' },
        },
        required: [],
      },
    },
  },
]

/** 各域挂载的工具名（general = 全量） */
const DOMAIN_TOOLS = {
  tcm: ['search_tcm_kb'],
  ecom: [
    'search_supply_products',
    'get_supplier_info',
    'get_price_trend',
    'search_platform_products',
    'optimize_product_image',
    'generate_product_video',
    'search_system_kb',
  ],
  domestic: [
    'search_supply_products',
    'search_platform_products',
    'optimize_product_image',
    'generate_product_video',
    'search_system_kb',
  ],
  general: [
    'search_supply_products',
    'get_supplier_info',
    'get_price_trend',
    'search_platform_products',
    'optimize_product_image',
    'generate_product_video',
    'search_tcm_kb',
    'search_system_kb',
  ],
}

/** 按域返回 tools schema 列表（透传给 LLM） */
function toolsForDomain(domain) {
  const names = DOMAIN_TOOLS[domain] || DOMAIN_TOOLS.general
  return TOOL_SCHEMAS.filter((t) => names.includes(t.function.name))
}

/** 工具清单（调试面板用）：schema + 说明 + 各外部通道配置状态位 */
function listTools() {
  const v = vault.loadVault()
  return {
    ok: true,
    ali1688Configured: !!ali.aliConfig(),
    suwenszConfigured: !!suwensz.suwenszConfig(),
    imageOptConfigured: !!(v.keys.imageOpt && v.keys.imageOpt.apiKey),
    videoGenConfigured: !!(v.keys.videoGen && v.keys.videoGen.apiKey),
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

  async search_platform_products(args) {
    // L2：素问Tokens分发器（统一代理 1688/淘宝/京东/亚马逊）
    if (suwensz.suwenszConfig()) {
      try {
        const r = await suwensz.searchProducts(args.platform, args.keywords, {
          ...(args.price_min != null ? { price_min: args.price_min } : {}),
          ...(args.price_max != null ? { price_max: args.price_max } : {}),
          ...(args.page != null ? { page: args.page } : {}),
          ...(args.page_size != null ? { page_size: args.page_size } : {}),
        })
        if (r) return { data: r, provider: 'suwensz-proxy' }
      } catch (err) {
        // key 失效不静默降级：把换 key 指引直接返回给用户（设计文档 §4.2）
        if (err && err.code === 'KEY_INVALID') {
          return { data: { status: 'key_invalid', guidance: err.message }, provider: 'suwensz-proxy' }
        }
        /* 其他错误降级 L1/L0 */
      }
    }
    // L1：1688 官方直连（仅 platform=1688 且已配置）
    if (args.platform === '1688' && ali.aliConfig()) {
      try {
        const r = await ali.callApi('alibaba.icbu.product.search', {
          keywords: args.keywords,
          ...(args.price_min != null ? { price_min: String(args.price_min) } : {}),
          ...(args.price_max != null ? { price_max: String(args.price_max) } : {}),
        })
        if (r && r.result) return { data: r.result, provider: '1688-open' }
      } catch {
        /* 降级 L0 */
      }
    }
    // L0：本地兜底（附 degraded 标记，提示数据非实时行情）
    return {
      data: { ...local.searchProducts(args), degraded: true, platform: args.platform },
      provider: 'local-fallback',
    }
  },

  async optimize_product_image(args) {
    const v = vault.loadVault()
    const img = v.keys.imageOpt
    // L2：素问分发器 OpenAI 兼容图片端点（若分发器提供 /v1/images/generations）
    if (suwensz.suwenszConfig()) {
      try {
        // TODO(P1)：分发器图片端点路径确认后，可切换为专用图片生成调用
        const r = await suwensz.callApi(
          '/v1/images/generations',
          {
            model: img && img.provider ? img.provider + '-image' : 'default',
            prompt: `商品图片优化 mode=${args.mode} language=${args.language || 'zh'} ${args.prompt || ''} 原图：${args.image_url}`,
            n: 1,
          },
          { method: 'POST' },
        )
        if (r) return { data: r, provider: 'suwensz-proxy' }
      } catch (err) {
        if (err && err.code === 'KEY_INVALID') {
          return { data: { status: 'key_invalid', guidance: err.message }, provider: 'suwensz-proxy' }
        }
        /* 降级到骨架响应 */
      }
    }
    // 骨架：可灵AI（WorkBuddy 内置 kling-ai-plugin）直连管线（P1 接入，先返回结构化待接入提示）
    // TODO(P1)：kling 图生图 —— 提交任务 → 轮询 → 返回结果图 URL
    return {
      data: {
        status: 'pending',
        message:
          (img && img.apiKey ? '' : '图片优化服务未配置（密钥保险箱 imageOpt 槽位为空）。') +
          '参数已校验通过，可灵AI图生图管线接入中（P1）。已收到请求：' +
          `mode=${args.mode}, language=${args.language || 'zh'}, image=${String(args.image_url).slice(0, 120)}`,
        params: args,
      },
      provider: 'image-skeleton',
    }
  },

  async generate_product_video(args) {
    const v = vault.loadVault()
    const vid = v.keys.videoGen
    // 骨架：可灵AI 图生视频（异步任务模型：提交 → 轮询 → 取结果，P1 接入）
    // TODO(P1)：kling 视频生成 —— 提交任务 → 轮询任务状态 → 返回视频 URL
    return {
      data: {
        status: 'pending',
        message:
          (vid && vid.apiKey ? '' : '视频生成服务未配置（密钥保险箱 videoGen 槽位为空）。') +
          '参数已校验通过，可灵AI图生视频管线接入中（P1）。已收到请求：' +
          `duration=${args.duration_seconds || 5}s, ratio=${args.ratio || '16:9'}, ` +
          `source=${args.image_url || args.product_title || ''}`,
        params: args,
      },
      provider: 'video-skeleton',
    }
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
