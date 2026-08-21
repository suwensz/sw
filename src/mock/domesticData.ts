import type { DomesticProduct, DomesticOrder, DomesticPlatform, DomesticCategory } from '@/types'

// ========= 平台信息 =========

export const DOMESTIC_PLATFORMS: {
  id: DomesticPlatform
  name: string
  shortName: string
  color: string
  icon: string
}[] = [
  { id: 'taobao', name: '淘宝', shortName: '淘宝', color: '#FF6A00', icon: '🛒' },
  { id: 'jd', name: '京东', shortName: '京东', color: '#E2231A', icon: '📦' },
  { id: 'pinduoduo', name: '拼多多', shortName: '拼多多', color: '#E0231D', icon: '🧧' },
]

export const DOMESTIC_CATEGORIES: {
  id: DomesticCategory
  name: string
  icon: string
  desc: string
}[] = [
  { id: 'office', name: '办公', icon: '📋', desc: '办公文具、桌面用品、文件管理' },
  { id: 'project_doc', name: '项目书', icon: '📑', desc: '项目方案、商业计划、标书模板' },
  { id: 'comic', name: '漫剧', icon: '🎨', desc: '原创漫画、连载漫剧、插画集' },
  { id: 'short_drama', name: '短剧', icon: '🎬', desc: '短剧剧本、微短剧、剧本杀' },
]

// ========= Mock 商品 =========

const now = Date.now()
const day = 86400000

export const MOCK_DOMESTIC_PRODUCTS: DomesticProduct[] = [
  // ---- 办公 (office) ----
  {
    id: 'dp001',
    title: '高端商务笔记本 A5 真皮手账',
    category: 'office',
    platforms: ['taobao', 'jd', 'pinduoduo'],
    price: 128,
    originalPrice: 199,
    stock: 500,
    sales: 1280,
    image: 'https://images.unsplash.com/photo-1531347657398-14d5e10a2a65?w=400',
    description: '头层牛皮封面，180°平摊，内页采用100g道林纸，适合商务送礼和日常办公记录。',
    status: 'listed',
    format: 'physical',
    createdAt: now - day * 30,
    updatedAt: now - day * 2,
  },
  {
    id: 'dp002',
    title: '智能桌面收纳盒 多功能办公整理架',
    category: 'office',
    platforms: ['taobao', 'pinduoduo'],
    price: 89,
    originalPrice: 139,
    stock: 320,
    sales: 856,
    image: 'https://images.unsplash.com/photo-1586282391339-3a8d7c4c5e9c?w=400',
    description: '多层分区设计，竹木材质，可收纳文件、笔具、手机、平板，让桌面整洁有序。',
    status: 'listed',
    format: 'physical',
    createdAt: now - day * 25,
    updatedAt: now - day * 3,
  },
  {
    id: 'dp003',
    title: '中性笔礼盒装 20支商务签名笔',
    category: 'office',
    platforms: ['jd', 'pinduoduo'],
    price: 49,
    originalPrice: 79,
    stock: 1200,
    sales: 2340,
    image: 'https://images.unsplash.com/photo-1583481273579-82c6a5dd-2c9c-4365-9c5a-0c0958c9f6e3?w=400',
    description: '0.5mm黑色中性笔，速干防水，金属笔杆，商务礼盒包装，适合企业采购。',
    status: 'listed',
    format: 'physical',
    createdAt: now - day * 20,
    updatedAt: now - day * 1,
  },
  {
    id: 'dp004',
    title: '桌面台历+计划本套装 2026年',
    category: 'office',
    platforms: ['taobao'],
    price: 68,
    originalPrice: 99,
    stock: 180,
    sales: 432,
    image: 'https://images.unsplash.com/photo-1506784983877-452609f3f5ed?w=400',
    description: '立体台历+周计划本，烫金工艺，送同款便签本，商务办公首选。',
    status: 'listed',
    format: 'physical',
    createdAt: now - day * 15,
    updatedAt: now - day * 5,
  },

  // ---- 项目书 (project_doc) ----
  {
    id: 'dp005',
    title: '商业计划书模板 PPT+Word 双版本',
    category: 'project_doc',
    platforms: ['taobao', 'jd'],
    price: 99,
    originalPrice: 299,
    stock: 9999,
    sales: 1560,
    image: 'https://images.unsplash.com/photo-1554226340-2d9b5c1e0f7a?w=400',
    description: '50页PPT+30页Word模板，覆盖融资路演、项目申报、商业方案全场景，即改即用。',
    status: 'listed',
    format: 'digital',
    createdAt: now - day * 40,
    updatedAt: now - day * 1,
  },
  {
    id: 'dp006',
    title: '政府项目申报书模板包（含标书）',
    category: 'project_doc',
    platforms: ['taobao'],
    price: 158,
    originalPrice: 399,
    stock: 9999,
    sales: 890,
    image: 'https://images.unsplash.com/photo-1450102191703-98174e21f9be?w=400',
    description: '含科技部、工信部、发改委等20+部门申报模板，附评审要点和常见问题解析。',
    status: 'listed',
    format: 'digital',
    createdAt: now - day * 35,
    updatedAt: now - day * 3,
  },
  {
    id: 'dp007',
    title: '工程项目可行性研究报告模板',
    category: 'project_doc',
    platforms: ['jd', 'pinduoduo'],
    price: 128,
    originalPrice: 259,
    stock: 9999,
    sales: 670,
    image: 'https://images.unsplash.com/photo-1497366216548-3759f6a76bc6?w=400',
    description: '建筑、市政、环保类可行性报告模板，含财务分析表和经济评价模型，Word+Excel。',
    status: 'listed',
    format: 'digital',
    createdAt: now - day * 28,
    updatedAt: now - day * 4,
  },

  // ---- 漫剧 (comic) ----
  {
    id: 'dp008',
    title: '《长安幻世录》连载漫剧 第1-3卷套装',
    category: 'comic',
    platforms: ['taobao', 'jd'],
    price: 88,
    originalPrice: 132,
    stock: 300,
    sales: 920,
    image: 'https://images.unsplash.com/photo-1518998083334-4ab90c0aadc6?w=400',
    description: '国风奇幻漫剧，讲述盛唐长安妖灵与人共存的故事，全彩印刷，附限量明信片。',
    status: 'listed',
    author: '墨白工作室',
    format: 'physical',
    createdAt: now - day * 22,
    updatedAt: now - day * 2,
  },
  {
    id: 'dp009',
    title: '《星际拾荒者》原创漫画连载 全12话',
    category: 'comic',
    platforms: ['taobao', 'pinduoduo'],
    price: 59,
    originalPrice: 98,
    stock: 500,
    sales: 1240,
    image: 'https://images.unsplash.com/photo-1535905555832-88f6ae2a9a5e?w=400',
    description: '科幻冒险漫画，废弃星舰中的拾荒故事，数字版全12话，附作者幕后手稿。',
    status: 'listed',
    author: '星轨动漫',
    format: 'digital',
    createdAt: now - day * 18,
    updatedAt: now - day * 1,
  },
  {
    id: 'dp010',
    title: '《猫咖日常》治愈系四格漫剧集',
    category: 'comic',
    platforms: ['taobao'],
    price: 39,
    originalPrice: 59,
    stock: 800,
    sales: 2100,
    image: 'https://images.unsplash.com/photo-1574226517073-9e4e1c0e8c8a?w=400',
    description: '猫咪咖啡馆日常四格漫画，治愈系画风，实体绘本+数字番外篇，全年龄向。',
    status: 'listed',
    author: '橘猫社',
    format: 'physical',
    createdAt: now - day * 12,
    updatedAt: now - day * 6,
  },

  // ---- 短剧 (short_drama) ----
  {
    id: 'dp011',
    title: '《逆袭天后》微短剧 80集全集',
    category: 'short_drama',
    platforms: ['taobao', 'pinduoduo'],
    price: 69,
    originalPrice: 129,
    stock: 9999,
    sales: 3450,
    image: 'https://images.unsplash.com/photo-1485846252172-784d60bce9b8?w=400',
    description: '都市女性逆袭短剧，80集完整版，单集3-5分钟，附幕后花絮和演员采访。',
    status: 'listed',
    author: '光影传媒',
    episodes: 80,
    format: 'digital',
    createdAt: now - day * 10,
    updatedAt: now - day * 1,
  },
  {
    id: 'dp012',
    title: '《古宅迷局》悬疑短剧 24集',
    category: 'short_drama',
    platforms: ['jd', 'taobao'],
    price: 49,
    originalPrice: 89,
    stock: 9999,
    sales: 1680,
    image: 'https://images.unsplash.com/photo-1518910037300-9e81e7a0c6e2?w=400',
    description: '民国悬疑推理短剧，古宅连环谜案，24集完结，附剧本原稿和分镜图。',
    status: 'listed',
    author: '迷雾剧场',
    episodes: 24,
    format: 'digital',
    createdAt: now - day * 8,
    updatedAt: now - day * 2,
  },
  {
    id: 'dp013',
    title: '《甜蜜公式》甜宠短剧 60集',
    category: 'short_drama',
    platforms: ['pinduoduo', 'taobao'],
    price: 59,
    originalPrice: 99,
    stock: 9999,
    sales: 2890,
    image: 'https://images.unsplash.com/photo-1575973686300-aa5c2c0b76e5?w=400',
    description: '校园甜宠短剧，数学天才×文科少女的恋爱故事，60集，4K画质，附OST原声。',
    status: 'listed',
    author: '糖度工作室',
    episodes: 60,
    format: 'digital',
    createdAt: now - day * 5,
    updatedAt: now - day * 1,
  },
]

// ========= Mock 订单 =========

const buyers = [
  { name: '张*明', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zm' },
  { name: '李*红', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=lh' },
  { name: '王*强', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=wq' },
  { name: '刘*芳', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=lf' },
  { name: '陈*伟', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=cw' },
  { name: '赵*静', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zj' },
  { name: '孙*丽', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sl' },
  { name: '周*军', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zj2' },
]

const addresses = [
  '广东省深圳市南山区科技园南区',
  '北京市朝阳区望京SOHO T1',
  '上海市浦东新区张江高科技园区',
  '浙江省杭州市余杭区未来科技城',
  '江苏省南京市鼓楼区紫东国际创意园',
  '四川省成都市高新区天府软件园',
]

function genOrders(): DomesticOrder[] {
  const orders: DomesticOrder[] = []
  const statuses: DomesticOrder['status'][] = [
    'pending', 'pending', 'confirmed', 'confirmed', 'shipped', 'shipped', 'completed', 'completed', 'completed', 'refunded',
  ]
  let seq = 1

  for (const p of MOCK_DOMESTIC_PRODUCTS) {
    // 每个商品生成 2-5 个订单
    const count = 2 + Math.floor(Math.random() * 4)
    for (let i = 0; i < count; i++) {
      const buyer = buyers[Math.floor(Math.random() * buyers.length)]
      const platform = p.platforms[Math.floor(Math.random() * p.platforms.length)]
      const status = statuses[Math.floor(Math.random() * statuses.length)]
      const qty = 1 + Math.floor(Math.random() * 3)
      const createdAgo = Math.floor(Math.random() * day * 7)
      const order: DomesticOrder = {
        id: `do${String(seq).padStart(4, '0')}`,
        platform,
        orderNo: `${platform === 'taobao' ? 'TB' : platform === 'jd' ? 'JD' : 'PDD'}${20260819000 + seq}`,
        productId: p.id,
        productTitle: p.title,
        productImage: p.image,
        category: p.category,
        qty,
        amount: p.price * qty,
        buyer: buyer.name,
        buyerAvatar: buyer.avatar,
        buyerPhone: `1${3 + Math.floor(Math.random() * 7)}${String(Math.floor(Math.random() * 100000000)).padStart(9, '0')}`,
        address: addresses[Math.floor(Math.random() * addresses.length)],
        remark: Math.random() > 0.7 ? '请尽快发货，急用' : undefined,
        status,
        createdAt: now - createdAgo,
        confirmedAt: status !== 'pending' && status !== 'cancelled' ? now - createdAgo + 3600000 : undefined,
        shippedAt: status === 'shipped' || status === 'completed' ? now - createdAgo + 7200000 : undefined,
        completedAt: status === 'completed' ? now - createdAgo + day : undefined,
        trackingNo: status === 'shipped' || status === 'completed' ? `SF${Math.floor(Math.random() * 9e14 + 1e15)}` : undefined,
        carrier: status === 'shipped' || status === 'completed' ? '顺丰速运' : undefined,
      }
      orders.push(order)
      seq++
    }
  }
  // 按时间倒序
  return orders.sort((a, b) => b.createdAt - a.createdAt)
}

export const MOCK_DOMESTIC_ORDERS: DomesticOrder[] = genOrders()

// ========= 模拟新订单生成 =========

export function generateRandomOrder(productId?: string): DomesticOrder {
  const products = productId
    ? MOCK_DOMESTIC_PRODUCTS.filter((p) => p.id === productId)
    : MOCK_DOMESTIC_PRODUCTS
  const product = products[Math.floor(Math.random() * products.length)]
  const buyer = buyers[Math.floor(Math.random() * buyers.length)]
  const platform = product.platforms[Math.floor(Math.random() * product.platforms.length)]
  const qty = 1 + Math.floor(Math.random() * 3)
  const seq = Math.floor(Math.random() * 9000 + 1000)
  return {
    id: `do_new_${Date.now()}`,
    platform,
    orderNo: `${platform === 'taobao' ? 'TB' : platform === 'jd' ? 'JD' : 'PDD'}${Date.now().toString().slice(-10)}`,
    productId: product.id,
    productTitle: product.title,
    productImage: product.image,
    category: product.category,
    qty,
    amount: product.price * qty,
    buyer: buyer.name,
    buyerAvatar: buyer.avatar,
    buyerPhone: `1${3 + Math.floor(Math.random() * 7)}${String(Math.floor(Math.random() * 100000000)).padStart(9, '0')}`,
    address: addresses[Math.floor(Math.random() * addresses.length)],
    remark: Math.random() > 0.7 ? '请尽快发货，急用' : undefined,
    status: 'pending',
    createdAt: Date.now(),
  }
}
