import type { PartialLocaleText } from '@/i18n'

/**
 * 素衡OS · 电商展示（运营端）
 * 产品分类：五金/建材、家电、手机（边缘产品）、箱包、中医养生（中药茶包、中医养生产品）
 * 产品图由类别与品名同步生成（SVG 矢量图，离线可用，图-类-文三者强一致）；
 * 品名/简介/深度说明为多语言文案（zh/en/ar，其余语言回退英文）。
 */

export type ShowcaseCategoryId = 'hardware' | 'appliance' | 'phone' | 'bags' | 'tcm'
export type ShowcaseSubId = 'tea' | 'wellness'

export interface ShowcaseCategory {
  id: ShowcaseCategoryId
  icon: string
  colorA: string
  colorB: string
  /** i18n key：portal.showcase.cats.xxx */
  nameKey: string
  /** 中医养生分类下的子分类 */
  subs?: Array<{ id: ShowcaseSubId; nameKey: string }>
}

export interface ShowcaseProduct {
  id: string
  category: ShowcaseCategoryId
  sub?: ShowcaseSubId
  price: number
  originalPrice?: number
  stock: number
  sales: number
  rating: number
  /** 边缘产品（如手机）标记 */
  edge?: boolean
  /** 与类别、品名同步生成的产品图 */
  image: string
  name: PartialLocaleText
  description: PartialLocaleText
  detail: PartialLocaleText
}

/** 按类别与品名生成同步产品图（SVG 矢量，无需外部网络） */
function svgImage(icon: string, c1: string, c2: string, label: string, labelEn: string): string {
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400">` +
    `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">` +
    `<stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/>` +
    `</linearGradient></defs>` +
    `<rect width="400" height="400" fill="url(#g)"/>` +
    `<circle cx="200" cy="168" r="88" fill="rgba(255,255,255,0.16)"/>` +
    `<text x="200" y="204" font-size="92" text-anchor="middle">${icon}</text>` +
    `<text x="200" y="312" font-size="30" font-weight="700" fill="#ffffff" text-anchor="middle" font-family="sans-serif">${label}</text>` +
    `<text x="200" y="346" font-size="16" fill="rgba(255,255,255,0.78)" text-anchor="middle" font-family="sans-serif">${labelEn}</text>` +
    `<text x="24" y="376" font-size="13" fill="rgba(255,255,255,0.6)" font-family="sans-serif">SUHENG OS</text>` +
    `</svg>`
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}

export const SHOWCASE_CATEGORIES: ShowcaseCategory[] = [
  {
    id: 'hardware',
    icon: '🔧',
    colorA: '#5b6b7a',
    colorB: '#37474f',
    nameKey: 'portal.showcase.cats.hardware',
  },
  {
    id: 'appliance',
    icon: '🔌',
    colorA: '#3a7ca5',
    colorB: '#2b5f80',
    nameKey: 'portal.showcase.cats.appliance',
  },
  {
    id: 'phone',
    icon: '📱',
    colorA: '#7a5fb0',
    colorB: '#58418a',
    nameKey: 'portal.showcase.cats.phone',
  },
  {
    id: 'bags',
    icon: '🧳',
    colorA: '#a8742a',
    colorB: '#8a5a1d',
    nameKey: 'portal.showcase.cats.bags',
  },
  {
    id: 'tcm',
    icon: '🌿',
    colorA: '#1a6b5c',
    colorB: '#124d42',
    nameKey: 'portal.showcase.cats.tcm',
    subs: [
      { id: 'tea', nameKey: 'portal.showcase.subs.tea' },
      { id: 'wellness', nameKey: 'portal.showcase.subs.wellness' },
    ],
  },
]

const CAT = Object.fromEntries(SHOWCASE_CATEGORIES.map((c) => [c.id, c])) as Record<
  ShowcaseCategoryId,
  ShowcaseCategory
>

function img(category: ShowcaseCategoryId, label: string, labelEn: string): string {
  const c = CAT[category]
  return svgImage(c.icon, c.colorA, c.colorB, label, labelEn)
}

/** 供新增/编辑产品使用：按类别自动生成同步产品图 */
export function showcaseImage(category: ShowcaseCategoryId, label: string, labelEn: string): string {
  return img(category, label || labelEn || 'Product', labelEn || label || 'Product')
}

export const SHOWCASE_PRODUCTS: ShowcaseProduct[] = [
  // ---- 五金/建材 ----
  {
    id: 'sc-hw-01',
    category: 'hardware',
    price: 89.0,
    originalPrice: 119.0,
    stock: 3200,
    sales: 540,
    rating: 4.7,
    image: img('hardware', '精工家用工具套装', 'Tool Set'),
    name: { zh: '精工家用工具套装 108 件', en: 'Precision Home Tool Set (108 pcs)', ar: 'مجموعة أدوات منزلية دقيقة (108 قطعة)' },
    description: {
      zh: '铬钒钢精铸，家庭维修一盒搞定，出口级防锈处理',
      en: 'Chrome-vanadium steel, all-in-one home repair kit with export-grade anti-rust finish',
      ar: 'فولاذ كروم فاناديوم، مجموعة إصلاح منزلية شاملة مع معالجة مضادة للصدأ بدرجة التصدير',
    },
    detail: {
      zh: '108 件套涵盖螺丝刀、扳手、卷尺、试电笔等常用工具，铬钒钢锻造，硬度 HRC52-58，握手包胶防滑，通过 CE/EMC 认证，支持 B2B 批量定制 LOGO。',
      en: 'The 108-piece kit covers screwdrivers, wrenches, tape measure, voltage tester and other common tools. Forged chrome-vanadium steel, hardness HRC52-58, non-slip rubberized grips, CE/EMC certified, B2B custom LOGO supported.',
      ar: 'تغطي المجموعة ذات 108 قطعة المفكات والمفاتيح وشريط القياس ومختبر الجهد وغيرها. فولاذ كروم فاناديوم مطاوع، صلابة HRC52-58، مقابض مطاطية مانعة للانزلاق، معتمدة CE/EMC، ودعم شعار مخصص للجملة.',
    },
  },
  {
    id: 'sc-hw-02',
    category: 'hardware',
    price: 45.5,
    stock: 2100,
    sales: 380,
    rating: 4.6,
    image: img('hardware', '智能门锁五金件', 'Smart Lock'),
    name: { zh: '智能门锁全铜锁体五金件', en: 'Smart Lock Solid Brass Lock Body', ar: 'قفل ذكي بهيكل نحاسي بالكامل' },
    description: {
      zh: '全铜锁体，适配主流智能锁芯，家装工装通用',
      en: 'Solid brass lock body, fits mainstream smart lock cylinders, for home and commercial use',
      ar: 'هيكل قفل نحاسي بالكامل، متوافق مع أسطوانات الأقفال الذكية، للاستخدام المنزلي والتجاري',
    },
    detail: {
      zh: 'H59 全铜锁体，304 不锈钢锁舌，防撬防锯双重结构，开孔距离 60/70mm 可选，附安装模板与膨胀螺丝，10 万次开合寿命测试。',
      en: 'H59 solid brass body, 304 stainless steel bolt, dual anti-pry and anti-saw structure, 60/70mm backset options, installation template and expansion screws included, 100,000-cycle durability tested.',
      ar: 'هيكل نحاس H59 صلب، مزلاج فولاذي مقاوم للصدأ 304، هيكل مزدوج مقاوم للكسر والقطع، خيار مسافة 60/70 مم، مع قالب التثبيت والبراغي، مختبر لـ 100,000 دورة.',
    },
  },
  // ---- 家电 ----
  {
    id: 'sc-ap-01',
    category: 'appliance',
    price: 129.0,
    originalPrice: 169.0,
    stock: 1500,
    sales: 720,
    rating: 4.8,
    image: img('appliance', '负离子空气净化器', 'Air Purifier'),
    name: { zh: '负离子空气净化器 H13 滤网', en: 'Anion Air Purifier with H13 Filter', ar: 'منقي هواء بأيونات سالبة بفلتر H13' },
    description: {
      zh: 'CADR 350m³/h，H13 HEPA 滤网，卧室客厅两用静音设计',
      en: 'CADR 350m³/h, H13 HEPA filter, quiet design for bedroom and living room',
      ar: 'CADR 350م³/س، فلتر HEPA H13، تصميم هادئ لغرفة النوم والمعيشة',
    },
    detail: {
      zh: '三层复合滤网（初效+H13 HEPA+活性炭），PM2.5 去除率 99.97%，睡眠模式 24dB，适用面积 25-40㎡，支持多国电压 100-240V，含 CE/CB/ETL 认证，外贸批发可选配欧规/英规插头。',
      en: 'Three-layer composite filter (pre-filter + H13 HEPA + activated carbon), 99.97% PM2.5 removal, 24dB sleep mode, covers 25-40㎡, 100-240V multi-voltage, CE/CB/ETL certified, EU/UK plug options for wholesale.',
      ar: 'فلتر مركب ثلاثي الطبقات، إزالة 99.97% من PM2.5، وضع نوم 24 ديسيبل، يغطي 25-40م²، جهد متعدد 100-240 فولت، معتمد CE/CB/ETL، خيارات قابس أوروبي/بريطاني للجملة.',
    },
  },
  {
    id: 'sc-ap-02',
    category: 'appliance',
    price: 79.0,
    stock: 980,
    sales: 460,
    rating: 4.7,
    image: img('appliance', '低噪空气炸锅', 'Air Fryer'),
    name: { zh: '低噪空气炸锅 5.5L 双旋钮', en: 'Low-Noise Air Fryer 5.5L Dual Knob', ar: 'قلاية هوائية هادئة 5.5 لتر' },
    description: {
      zh: '360° 热风循环，5.5L 大容量家庭装，不粘易清洗',
      en: '360° hot air circulation, 5.5L family size, non-stick and easy to clean',
      ar: 'دورة هواء ساخن 360°، سعة عائلية 5.5 لتر، غير لاصقة وسهلة التنظيف',
    },
    detail: {
      zh: '1500W 大功率，80-200℃ 广域控温，抽篮断电记忆，食品级不粘涂层内胆通过 LFGB/FDA 检测，外观支持 OEM/ODM 定制色，中东电压 220-240V 专版可选。',
      en: '1500W high power, 80-200°C wide temperature control, basket auto shutoff with memory, food-grade non-stick coating LFGB/FDA tested, OEM/ODM colors available, 220-240V Middle East version optional.',
      ar: 'قوة 1500 واط، تحكم بدرجة الحرارة 80-200°م، إيقاف تلقائي مع الذاكرة، طلاء غير لاصق صالح غذائياً مختبَر LFGB/FDA، ألوان OEM/ODM، نسخة الشرق الأوسط 220-240 فولت.',
    },
  },
  // ---- 手机（边缘产品） ----
  {
    id: 'sc-ph-01',
    category: 'phone',
    price: 149.0,
    originalPrice: 199.0,
    stock: 2600,
    sales: 310,
    rating: 4.5,
    edge: true,
    image: img('phone', '智能手机 Edge X3', 'Smartphone'),
    name: { zh: '智能手机 Edge X3（边缘产品）', en: 'Smartphone Edge X3 (Edge Product)', ar: 'هاتف ذكي Edge X3 (منتج هامشي)' },
    description: {
      zh: '6.6 英寸全面屏，5000mAh，海外版双卡双待',
      en: '6.6-inch full screen, 5000mAh, overseas dual SIM dual standby',
      ar: 'شاشة كاملة 6.6 بوصة، بطارية 5000 مللي أمبير، شريحتان دوليتان',
    },
    detail: {
      zh: '边缘产品线：6.6" HD+ 全面屏，8 核处理器，4GB+128GB，5000mAh 大电池，1300 万 AI 双摄，支持 4G 全网通与多语言系统（含阿拉伯语 RTL），适合东南亚/中东运营商渠道铺货，整批出厂含 12 个月保修。',
      en: 'Edge product line: 6.6" HD+ display, octa-core CPU, 4GB+128GB, 5000mAh battery, 13MP AI dual camera, global 4G LTE with multi-language OS (incl. Arabic RTL), ideal for SEA/Middle East carrier channels, 12-month factory warranty included.',
      ar: 'خط المنتجات الهامشية: شاشة 6.6 بوصة، معالج ثماني النواة، 4GB+128GB، بطارية 5000 مللي أمبير، كاميرا مزدوجة 13 ميجابكسل، شبكة 4G عالمية بنظام متعدد اللغات (بما فيها العربية RTL)، مناسب لأسواق جنوب شرق آسيا والشرق الأوسط، ضمان مصنعي 12 شهراً.',
    },
  },
  {
    id: 'sc-ph-02',
    category: 'phone',
    price: 199.0,
    stock: 1200,
    sales: 150,
    rating: 4.4,
    edge: true,
    image: img('phone', '三防功能机', 'Rugged Phone'),
    name: { zh: '三防老人功能机 King（边缘产品）', en: 'Rugged Feature Phone King (Edge Product)', ar: 'هاتف وظيفي مقاوم King (منتج هامشي)' },
    description: {
      zh: '防摔防水防尘，超长待机 30 天，大音量大按键',
      en: 'Drop-proof, water & dust resistant, 30-day standby, loud speaker with big keys',
      ar: 'مقاوم للسقوط والماء والغبار، استعداد 30 يوماً، صوت عالٍ وأزرار كبيرة',
    },
    detail: {
      zh: '边缘产品线：IP67 三防机身，4000mAh 可拆电池待机约 30 天，SOS 一键呼救，手电筒与 FM 收音外放，支持阿拉伯语/越南语/印尼语菜单，主攻中东及东南亚礼品与海外务工市场。',
      en: 'Edge product line: IP67 rugged body, removable 4000mAh battery with ~30 days standby, SOS button, flashlight and FM radio loudspeaker, Arabic/Vietnamese/Indonesian menus, targeting Middle East & SEA gift and overseas worker markets.',
      ar: 'خط المنتجات الهامشية: هيكل مقاوم IP67، بطارية قابلة للإزالة 4000 مللي أمبير باستعداد 30 يوماً تقريباً، زر استغاثة SOS، مصباح وراديو FM، قوائم عربية/فيتنامية/إندونيسية، موجه لأسواق الهدايا والعمالة في الشرق الأوسط وجنوب شرق آسيا.',
    },
  },
  // ---- 箱包 ----
  {
    id: 'sc-bg-01',
    category: 'bags',
    price: 65.0,
    originalPrice: 89.0,
    stock: 1800,
    sales: 620,
    rating: 4.7,
    image: img('bags', '铝框拉杆行李箱', 'Luggage'),
    name: { zh: '铝框拉杆行李箱 24/28 寸', en: 'Aluminum-Frame Trolley Luggage 24/28"', ar: 'حقيبة سفر بإطار ألمنيوم 24/28 بوصة' },
    description: {
      zh: '铝合金框架，TSA 海关锁，静音万向轮',
      en: 'Aluminum alloy frame, TSA lock, silent spinner wheels',
      ar: 'إطار ألمنيوم، قفل TSA، عجلات دوارة هادئة',
    },
    detail: {
      zh: '德国拜耳 PC 箱壳 + 铝合金边框，TSA 双密码锁，8 轮静音飞机轮，铝合金拉杆三档调节，24/28 寸可组合批发，支持定制箱贴与礼盒包装。',
      en: 'Bayer PC shell + aluminum alloy frame, dual TSA locks, 8-wheel silent aircraft wheels, 3-stage aluminum trolley, 24/28" combo wholesale, custom stickers and gift box packaging supported.',
      ar: 'هيكل PC باير + إطار ألمنيوم، قفلان TSA، 8 عجلات طائرة هادئة، مقبض ألمنيوم بثلاث درجات، بيع بالجملة 24/28 بوصة، دعم ملصقات مخصصة وتغليف هدايا.',
    },
  },
  {
    id: 'sc-bg-02',
    category: 'bags',
    price: 32.0,
    stock: 3200,
    sales: 890,
    rating: 4.6,
    image: img('bags', '防泼水商务背包', 'Backpack'),
    name: { zh: '防泼水商务背包 15.6 英寸', en: 'Water-Repellent Business Backpack 15.6"', ar: 'حقيبة ظهر تجارية مقاومة للماء 15.6 بوصة' },
    description: {
      zh: '防泼水面料，笔记本电脑仓，USB 充电口',
      en: 'Water-repellent fabric, laptop compartment, USB charging port',
      ar: 'قماش مقاوم للماء، جيب حاسوب محمول، منفذ شحن USB',
    },
    detail: {
      zh: '高密度防泼水尼龙，独立 15.6" 电脑仓加绒保护，隐藏防盗袋，侧边 USB 外接充电口，人体工学减压背带，可印制企业 LOGO 作商务礼品批量采购。',
      en: 'High-density water-repellent nylon, padded 15.6" laptop compartment, hidden anti-theft pocket, side USB charging port, ergonomic load-relief straps, corporate LOGO printing for bulk business gifting.',
      ar: 'نايلون كثيف مقاوم للماء، جيب حاسوب مبطن 15.6 بوصة، جيب مخفي مضاد للسرقة، منفذ شحن USB جانبي، أحزمة مريحة، طباعة شعار الشركات للهدايا بالجملة.',
    },
  },
  // ---- 中医养生 · 中药茶包 ----
  {
    id: 'sc-tc-t01',
    category: 'tcm',
    sub: 'tea',
    price: 18.9,
    originalPrice: 25.0,
    stock: 5600,
    sales: 1350,
    rating: 4.9,
    image: img('tcm', '安神助眠茶包', 'Herbal Tea'),
    name: { zh: '酸枣仁安神助眠茶包（30 包）', en: 'Sour Jujube Seed Sleep-Aid Herbal Tea (30 bags)', ar: 'شاي أعشاب مساعد على النوم ببذور العناب (30 كيس)' },
    description: {
      zh: '酸枣仁+百合+茯苓经典配伍，独立三角包',
      en: 'Classic blend of sour jujube seed, lily bulb and poria, individual triangle bags',
      ar: 'مزيج كلاسيكي من بذور العناب والزنبق والبوريا في أكياس مثلثة منفردة',
    },
    detail: {
      zh: '道地药材配伍：酸枣仁、百合、茯苓、桂圆、红枣，低温烘焙锁香，独立氮气三角茶包，每包 5g，每日 1-2 包睡前温饮，出口版提供英文/阿拉伯文标签与 HALAL 认证支持。',
      en: 'Authentic herbal blend: sour jujube seed, lily bulb, poria, longan and red date, low-temperature roasted for aroma, individual nitrogen-flushed triangle bags, 5g each, 1-2 bags daily before bed. Export version with EN/AR labels and HALAL certification support.',
      ar: 'مزيج أعشاب أصلي: بذور العناب والزنبق والبوريا والليتشي والتمر، تحميص منخفض الحرارة، أكياس مثلثة معبأة بالنيتروجين، 5 غرام لكل كيس، كيس إلى كيسين يومياً قبل النوم. نسخة التصدير بملصقات إنجليزية/عربية ودعم شهادة حلال.',
    },
  },
  {
    id: 'sc-tc-t02',
    category: 'tcm',
    sub: 'tea',
    price: 15.9,
    stock: 4800,
    sales: 980,
    rating: 4.8,
    image: img('tcm', '暖宫红糖姜茶', 'Ginger Tea'),
    name: { zh: '暖宫红糖姜枣茶包（20 包）', en: 'Warming Ginger-Jujube Brown Sugar Tea (20 bags)', ar: 'شاي الزنجبيل والتمر بالسكر البني الدافئ (20 كيس)' },
    description: {
      zh: '老姜+红枣+古法红糖，驱寒暖宫独立小包',
      en: 'Aged ginger, red date and traditional brown sugar, warming single-serve bags',
      ar: 'زنجبيل مسن وتمر وسكر بني تقليدي، أكياس فردية دافئة',
    },
    detail: {
      zh: '云南小黄姜汁 + 新疆若羌红枣 + 古法甘蔗红糖，无添加蔗糖香精，独立方块包冲泡即饮，经期/畏寒人群温养饮品，跨境爆款，支持 OEM 贴牌小起订量。',
      en: 'Yunnan baby ginger juice + Xinjiang Ruoqiang red dates + traditional cane brown sugar, no added sucrose or flavoring, instant square bags, a warming drink for menstrual/cold-sensitive users, cross-border bestseller with low OEM MOQ.',
      ar: 'عصير زنجبيل يوننان + تمر روتشيانغ شينجيانغ + سكر قصب تقليدي، بدون إضافات، أكياس فورية، مشروب دافئ للنساء ومن يخافون البرد، الأكثر مبيعاً عبر الحدود مع حد أدنى منخفض لـ OEM.',
    },
  },
  // ---- 中医养生 · 中医养生产品 ----
  {
    id: 'sc-tc-w01',
    category: 'tcm',
    sub: 'wellness',
    price: 42.0,
    originalPrice: 58.0,
    stock: 2200,
    sales: 760,
    rating: 4.9,
    image: img('tcm', '艾灸养生礼盒', 'Moxibustion'),
    name: { zh: '陈艾艾灸养生礼盒（54 柱）', en: 'Aged Moxa Wellness Gift Set (54 sticks)', ar: 'طقم هدايا الحجامة بالشيح المسنّ (54 قطعة)' },
    description: {
      zh: '五年陈艾，温经通络，附穴位图使用手册',
      en: 'Five-year aged moxa, warms meridians, with acupoint chart manual',
      ar: 'شيح مسنّ خمس سنوات، يدفئ القنوات، مع دليل نقاط الوخز',
    },
    detail: {
      zh: '南阳五年陈艾绒（艾绒比 30:1），54 柱分盒装，附中英文穴位图与熄烟座，无烟型可选，礼盒包装适合节日送礼，海外仓现货可发。',
      en: 'Nanyang five-year aged moxa wool (30:1 ratio), 54 sticks in divided boxes, with bilingual acupoint chart and extinguisher, smoke-free option available, festival gift box packaging, ready to ship from overseas warehouses.',
      ar: 'خيمة شيح نانيانغ المسنّة خمس سنوات (30:1)، 54 قطعة في علبة مقسمة، مع خريطة نقاط بالصينية والإنجليزية ومطفأة، خيار بلا دخان، تغليف هدايا، جاهزة للشحن من المستودعات الدولية.',
    },
  },
  {
    id: 'sc-tc-w02',
    category: 'tcm',
    sub: 'wellness',
    price: 36.0,
    stock: 1900,
    sales: 540,
    rating: 4.8,
    image: img('tcm', '拔罐理疗套装', 'Cupping Set'),
    name: { zh: '真空拔罐理疗套装 24 罐', en: 'Vacuum Cupping Therapy Set (24 cups)', ar: 'طقم الحجامة بالتفريغ (24 كأس)' },
    description: {
      zh: '医用级 PC 罐体，手抽负压，家用理疗',
      en: 'Medical-grade PC cups, manual vacuum pump, home therapy',
      ar: 'أكواب PC بدرجة طبية، مضخة تفريغ يدوية، علاج منزلي',
    },
    detail: {
      zh: '医用级透明 PC 罐体，24 罐六种口径，人体工学手柄抽气枪，负压可视化，附中英阿三语使用图解，CE 认证，理疗店与家庭双渠道热销。',
      en: 'Medical-grade transparent PC cups, 24 cups in six diameters, ergonomic vacuum pump gun, visible negative pressure, trilingual (CN/EN/AR) illustrated manual, CE certified, popular for both therapy clinics and home use.',
      ar: 'أكواب PC شفافة بدرجة طبية، 24 كأس بستة أقطار، مسدس تفريغ مريح، ضغط سلبي مرئي، دليل مصور بثلاث لغات، معتمد CE، رواج في العيادات والمنازل.',
    },
  },
  {
    id: 'sc-tc-w03',
    category: 'tcm',
    sub: 'wellness',
    price: 22.0,
    stock: 3600,
    sales: 830,
    rating: 4.7,
    image: img('tcm', '草本足浴包', 'Foot Bath'),
    name: { zh: '草本泡脚足浴包（30 袋）', en: 'Herbal Foot Bath Sachets (30 packs)', ar: 'أكياس نقع القدم بالأعشاب (30 كيس)' },
    description: {
      zh: '艾叶+红花+生姜，睡前泡脚温养',
      en: 'Mugwort, safflower and ginger blend, bedtime foot soak',
      ar: 'شيح وقرطم وزنجبيل، نقع القدم قبل النوم',
    },
    detail: {
      zh: '艾叶、红花、生姜、益母草科学配比打粉分装，高温灭菌无硫熏，每次 1-2 袋沸水焖泡 5 分钟，40℃ 左右水温泡 15-20 分钟，长期久站与手脚冰凉人群适用。',
      en: 'Scientifically proportioned and powdered mugwort, safflower, ginger and motherwort, high-temperature sterilized and sulfur-free, 1-2 bags per soak steeped 5 minutes in boiling water, soak 15-20 minutes at ~40°C, ideal for people who stand long hours or have cold extremities.',
      ar: 'نسب علمية من الشيح والقرطم والزنجبيل وعشبة الأم، معقمة بالحرارة العالية بدون كبريت، كيس إلى كيسين منقوعة 5 دقائق في ماء مغلي، نقع 15-20 دقيقة عند 40°م، مناسب لمن يقفون طويلاً وذوي الأطراف الباردة.',
    },
  },
]

export function showcaseProductsByCategory(cat: ShowcaseCategoryId | 'all'): ShowcaseProduct[] {
  if (cat === 'all') return SHOWCASE_PRODUCTS
  return SHOWCASE_PRODUCTS.filter((p) => p.category === cat)
}
