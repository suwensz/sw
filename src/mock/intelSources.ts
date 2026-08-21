// 竞品分析扩展：海外社交/搜索引擎需求情报渠道、B端C端采购需求、云供应链/一件代发供应链源
import type { IntelChannel, DemandLead, SupplySource } from '@/types'

const T = (zh: string, en: string, ja: string, ko: string, es: string, fr: string) => ({ zh, en, ja, ko, es, fr })

/** 需求情报渠道：社交平台 / 搜索引擎 / B2B网络 */
export const INTEL_CHANNELS: IntelChannel[] = [
  {
    id: 'facebook',
    name: T('Facebook', 'Facebook', 'Facebook', 'Facebook', 'Facebook', 'Facebook'),
    type: 'social',
    region: T('全球/中东/东南亚', 'Global / ME / SEA', 'グローバル/中東/東南アジア', '글로벌/중동/동남아', 'Global / MO / ASEAN', 'Global / MO / ASEAN'),
    audience: 'B2B+B2C',
    desc: T('社群小组与Marketplace采购贴文，抓取B端批发与C端零售需求', 'Groups & Marketplace posts, B2B wholesale and B2C retail demand', 'グループとマーケットプレイスの調達投稿', '그룹·마켓플레이스 조달 게시물', 'Publicaciones de grupos y Marketplace', 'Publications de groupes et Marketplace'),
    connected: true,
  },
  {
    id: 'msn',
    name: T('MSN', 'MSN', 'MSN', 'MSN', 'MSN', 'MSN'),
    type: 'social',
    region: T('北美/欧洲', 'North America / Europe', '北米/欧州', '북미/유럽', 'Norteamérica / Europa', 'Amérique du Nord / Europe'),
    audience: 'B2C',
    desc: T('Microsoft Start资讯流与购物频道消费趋势数据', 'Microsoft Start feed and shopping channel consumer trends', 'Microsoft Startフィードの消費トレンド', 'Microsoft Start 피드 소비 트렌드', 'Tendencias de consumo de Microsoft Start', 'Tendances de consommation Microsoft Start'),
    connected: true,
  },
  {
    id: 'yahoo',
    name: T('雅虎', 'Yahoo', 'Yahoo', 'Yahoo', 'Yahoo', 'Yahoo'),
    type: 'search',
    region: T('日本/中国台湾地区/东南亚', 'Japan / Taiwan,China / SEA', '日本/台湾(中国)/東南アジア', '일본/대만(중국)/동남아', 'Japón / Taiwán,China / ASEAN', 'Japon / Taïwan,Chine / ASEAN'),
    audience: 'B2C',
    desc: T('雅虎购物与拍卖搜索词，C端零售热需洞察', 'Yahoo Shopping & Auction search terms, B2C retail demand insights', 'Yahooショッピング検索語、C端需要', 'Yahoo 쇼핑 검색어, B2C 수요', 'Términos de Yahoo Shopping, demanda B2C', 'Termes Yahoo Shopping, demande B2C'),
    connected: true,
  },
  {
    id: 'google',
    name: T('Google 搜索', 'Google Search', 'Google検索', 'Google 검색', 'Google Búsqueda', 'Google Recherche'),
    type: 'search',
    region: T('全球', 'Global', 'グローバル', '글로벌', 'Global', 'Global'),
    audience: 'B2B+B2C',
    desc: T('搜索关键词趋势与采购意向词（wholesale/bulk/supplier）', 'Keyword trends and procurement intent terms (wholesale/bulk/supplier)', '検索トレンドと調達意向語', '검색 트렌드와 조달 의도어', 'Tendencias de palabras clave e intención de compra', 'Tendances de mots-clés et intention d\'achat'),
    connected: true,
  },
  {
    id: 'me_social',
    name: T('中东主流社交（WhatsApp/Telegram）', 'ME Social (WhatsApp/Telegram)', '中東SNS（WhatsApp/Telegram）', '중동 SNS(WhatsApp/Telegram)', 'Social MO (WhatsApp/Telegram)', 'Social MO (WhatsApp/Telegram)'),
    type: 'social',
    region: T('中东（阿联酋/沙特/卡塔尔）', 'Middle East (UAE/KSA/Qatar)', '中東（UAE/サウジ/カタール）', '중동(UAE/사우디/카타르)', 'Medio Oriente (EAU/Arabia/Catar)', 'Moyen-Orient (EAU/Arabie/Qatar)'),
    audience: 'B2B+B2C',
    desc: T('贸易商社群与批发频道，抓取中东B端大宗采购需求', 'Trader communities and wholesale channels, ME bulk procurement demand', '貿易商コミュニティと卸チャネル', '무역상 커뮤니티와 도매 채널', 'Comunidades de comerciantes y canales mayoristas', 'Communautés de commerçants et canaux de gros'),
    connected: true,
  },
  {
    id: 'sea_social',
    name: T('东南亚主流社交（Zalo/LINE/KakaoTalk）', 'SEA Social (Zalo/LINE/KakaoTalk)', '東南アジアSNS（Zalo/LINE/Kakao）', '동남아 SNS(Zalo/LINE/Kakao)', 'Social ASEAN (Zalo/LINE/Kakao)', 'Social ASEAN (Zalo/LINE/Kakao)'),
    type: 'social',
    region: T('越南/泰国/韩国/马来西亚', 'Vietnam / Thailand / Korea / Malaysia', 'ベトナム/タイ/韓国/マレーシア', '베트남/태국/한국/말레이시아', 'Vietnam / Tailandia / Corea / Malasia', 'Vietnam / Thaïlande / Corée / Malaisie'),
    audience: 'B2B+B2C',
    desc: T('本地化社交电商社群，抓取各国C端爆款与B端补货需求', 'Local social commerce groups, C2C hits and B2B restock demand', '現地ソーシャルECグループ', '현지 소셜커머스 그룹', 'Grupos locales de comercio social', 'Groupes locaux de commerce social'),
    connected: false,
  },
  {
    id: 'b2b_net',
    name: T('B2B网络（阿里国际站/环球资源）', 'B2B Networks (Alibaba.com/GlobalSources)', 'B2Bネット（Alibaba.com）', 'B2B 네트워크(Alibaba.com)', 'Redes B2B (Alibaba.com)', 'Réseaux B2B (Alibaba.com)'),
    type: 'b2b',
    region: T('全球', 'Global', 'グローバル', '글로벌', 'Global', 'Global'),
    audience: 'B2B',
    desc: T('RFQ询盘与批发采购意向，B端大宗订单情报', 'RFQ inquiries and wholesale intent, B2B bulk order intel', 'RFQと卸意向、B端大量注文', 'RFQ와 도매 의도, B2B 대량 주문', 'Consultas RFQ e intención mayorista', 'Demandes RFQ et intention de gros'),
    connected: true,
  },
]

const LEAD_KEYWORDS: { kw: [string, string]; side: 'B2B' | 'B2C'; market: [string, string] }[] = [
  { kw: ['organic goji berries bulk', '有机枸杞批发'], side: 'B2B', market: ['Middle East', '中东'] },
  { kw: ['xiangyunsha silk dress wholesale', '香云纱服饰批发'], side: 'B2B', market: ['Southeast Asia', '东南亚'] },
  { kw: ['moxibustion starter kit', '艾灸入门套装'], side: 'B2C', market: ['North America', '北美'] },
  { kw: ['herbal face mask supplier', '中草药面膜供应商'], side: 'B2B', market: ['Southeast Asia', '东南亚'] },
  { kw: ['bamboo towel bulk order', '竹纤维毛巾大宗订单'], side: 'B2B', market: ['Japan/Korea', '日韩'] },
  { kw: ['TCM wellness plan subscription', '中医养生方案订阅'], side: 'B2C', market: ['Global', '全球'] },
  { kw: ['power bank dropshipping supplier', '充电宝一件代发供应商'], side: 'B2B', market: ['Southeast Asia', '东南亚'] },
  { kw: ['LED downlight container order', 'LED筒灯整柜订单'], side: 'B2B', market: ['Middle East', '中东'] },
  { kw: ['ginseng gift box retail', '人参礼盒零售'], side: 'B2C', market: ['Japan/Korea', '日韩'] },
  { kw: ['luggage OEM factory', '行李箱OEM工厂'], side: 'B2B', market: ['Southeast Asia', '东南亚'] },
  { kw: ['pearl skincare set resale', '珍珠护肤品分销'], side: 'B2C', market: ['Southeast Asia', '东南亚'] },
  { kw: ['hardware door lock distributor', '五金门锁经销商'], side: 'B2B', market: ['Middle East', '中东'] },
]

const LEAD_CHANNEL_IDS = ['facebook', 'google', 'yahoo', 'msn', 'me_social', 'sea_social', 'b2b_net']

/** B端/C端采购需求信息 */
export function generateDemandLeads(): DemandLead[] {
  return LEAD_KEYWORDS.map((item, i) => {
    const demandCount = Math.floor(200 + Math.random() * 4800)
    const isB2B = item.side === 'B2B'
    return {
      id: `lead-${i}`,
      channelId: LEAD_CHANNEL_IDS[i % LEAD_CHANNEL_IDS.length],
      keyword: {
        zh: `${item.kw[1]}（${item.kw[0]}）`,
        en: item.kw[0],
        ja: item.kw[0],
        ko: item.kw[0],
        es: item.kw[0],
        fr: item.kw[0],
      },
      side: item.side,
      market: {
        zh: item.market[1],
        en: item.market[0],
        ja: item.market[0],
        ko: item.market[0],
        es: item.market[0],
        fr: item.market[0],
      },
      demandCount,
      buyers: Math.floor(demandCount * (isB2B ? 0.06 + Math.random() * 0.1 : 0.4 + Math.random() * 0.5)),
      avgOrderValue: Number((isB2B ? 800 + Math.random() * 9200 : 15 + Math.random() * 180).toFixed(2)),
      currency: 'USD',
      hot: i % 4 === 0,
    }
  })
}

/** 云供应链 / 一件代发 / 国内国外供应链源 */
export const SUPPLY_SOURCES: SupplySource[] = [
  {
    id: 'cloud_sc',
    name: T('云供应链平台（国内中心仓）', 'Cloud Supply Chain (CN Hub)', 'クラウドサプライチェーン（中国ハブ）', '클라우드 공급망(중국 허브)', 'Cadena de Suministro Cloud (CN)', 'Chaîne d\'Approvisionnement Cloud (CN)'),
    type: 'cloud',
    region: T('中国（广州/义乌中心仓）', 'China (Guangzhou/Yiwu hub)', '中国（広州/義烏）', '중국(광저우/이우)', 'China (Guangzhou/Yiwu)', 'Chine (Guangzhou/Yiwu)'),
    categories: T('全品类：养生/日用/五金/服饰/数码', 'All: wellness/daily/hardware/apparel/digital', '全カテゴリ', '전 카테고리', 'Todas las categorías', 'Toutes catégories'),
    moq: 1,
    priceIndex: 1.0,
    leadTimeDays: 3,
    rating: 4.8,
    connected: true,
  },
  {
    id: 'ali1688',
    name: T('1688 一件代发', '1688 Dropshipping', '1688 一件代発', '1688 무재고 유통', '1688 Dropshipping', '1688 Dropshipping'),
    type: 'dropship',
    region: T('中国（全国产业带）', 'China (nationwide industrial belts)', '中国（全国産業ベルト）', '중국(전국 산업벨트)', 'China (cinturones industriales)', 'Chine (ceintures industrielles)'),
    categories: T('日用品/五金建材/数码周边/服饰', 'Daily/hardware/digital/apparel', '日用品/五金/デジタル/衣類', '일용품/하드웨어/디지털/의류', 'Diario/ferretería/digital/ropa', 'Quincaillerie/quotidien/numérique/vêtements'),
    moq: 1,
    priceIndex: 0.72,
    leadTimeDays: 2,
    rating: 4.7,
    connected: true,
  },
  {
    id: 'dropship_cn',
    name: T('国内一件代发（义乌/广州产业带）', 'CN Dropshipping (Yiwu/Guangzhou)', '国内一件代発（義烏/広州）', '국내 무재고 유통(이우/광저우)', 'Dropshipping CN (Yiwu/Guangzhou)', 'Dropshipping CN (Yiwu/Guangzhou)'),
    type: 'domestic',
    region: T('中国', 'China', '中国', '중국', 'China', 'Chine'),
    categories: T('小商品/箱包/饰品/户外用品', 'Small goods/luggage/accessories/outdoor', '小商品/バッグ/雑貨/アウトドア', '소상품/가방/액세서리/아웃도어', 'Pequeños productos/equipaje/accesorios', 'Petits produits/bagages/accessoires'),
    moq: 1,
    priceIndex: 0.65,
    leadTimeDays: 2,
    rating: 4.6,
    connected: true,
  },
  {
    id: 'dropship_us',
    name: T('海外仓一件代发（美西仓）', 'Overseas Warehouse Dropshipping (US West)', '海外倉庫一件代発（米国西岸）', '해외창고 무재고 유통(미서부)', 'Almacén exterior (Oeste de EE.UU.)', 'Entrepôt extérieur (Ouest des EU)'),
    type: 'overseas',
    region: T('美国（洛杉矶仓）', 'USA (LA warehouse)', 'アメリカ（ロサンゼルス）', '미국(LA 창고)', 'EE.UU. (Los Ángeles)', 'États-Unis (Los Angeles)'),
    categories: T('数码周边/香云纱服饰/护肤品', 'Digital/xiangyunsha apparel/skincare', 'デジタル/香雲紗/スキンケア', '디지털/샹윈사/스킨케어', 'Digital/ropa xiangyunsha/cuidado', 'Numérique/vêtements/soins'),
    moq: 1,
    priceIndex: 1.35,
    leadTimeDays: 1,
    rating: 4.5,
    connected: false,
  },
  {
    id: 'dropship_me',
    name: T('中东海外仓（迪拜仓）', 'ME Overseas Warehouse (Dubai)', '中東海外倉庫（ドバイ）', '중동 해외창고(두바이)', 'Almacén MO (Dubái)', 'Entrepôt MO (Dubaï)'),
    type: 'overseas',
    region: T('阿联酋（覆盖海湾六国）', 'UAE (covers GCC)', 'UAE（GCC圏）', 'UAE(GCC 권역)', 'EAU (cubren el CCG)', 'EAU (couvre le CCG)'),
    categories: T('中医养生产品/五金建材/日用', 'TCM wellness/hardware/daily', '漢方養生/五金/日用品', '한방 양생/하드웨어/일용품', 'Bienestar TCM/ferretería/diario', 'Bien-être TCM/quincaillerie/quotidien'),
    moq: 10,
    priceIndex: 1.28,
    leadTimeDays: 1,
    rating: 4.6,
    connected: false,
  },
  {
    id: 'cloud_sea',
    name: T('东南亚云仓（马来西亚/泰国）', 'SEA Cloud Warehouse (MY/TH)', '東南アジアクラウド倉庫（MY/TH）', '동남아 클라우드 창고(MY/TH)', 'Almacén Cloud ASEAN (MY/TH)', 'Entrepôt Cloud ASEAN (MY/TH)'),
    type: 'cloud',
    region: T('马来西亚/泰国（辐射东南亚）', 'Malaysia/Thailand (SEA coverage)', 'マレーシア/タイ', '말레이시아/태국', 'Malasia/Tailandia', 'Malaisie/Thaïlande'),
    categories: T('全品类，本地次日达', 'All categories, local next-day', '全カテゴリ、翌日配達', '전 카테고리, 익일 배송', 'Todas, entrega local al día siguiente', 'Toutes, livraison locale le lendemain'),
    moq: 5,
    priceIndex: 1.15,
    leadTimeDays: 1,
    rating: 4.4,
    connected: false,
  },
]
