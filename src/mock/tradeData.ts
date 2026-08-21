import { lt } from '@/utils/locale'
import type {
  Shipment, ReturnRequest, ProcureLead, PlatformOrder,
} from '@/types'

/** 物流渠道与报价系数 */
export const FREIGHT_CHANNELS = [
  { id: 'dhl', name: lt('DHL 国际快递', 'DHL Express'), base: 6.5, perKg: 4.2, days: '3-6' },
  { id: 'fedex', name: lt('FedEx 国际快递', 'FedEx Express'), base: 6.0, perKg: 4.5, days: '3-7' },
  { id: 'ems', name: lt('EMS 国际小包', 'EMS'), base: 3.0, perKg: 2.2, days: '7-20' },
  { id: 'yunexpress', name: lt('云途专线（中东）', 'YunExpress ME Line'), base: 4.0, perKg: 2.8, days: '8-15' },
  { id: 'sea', name: lt('海运整柜（大货）', 'Sea Freight'), base: 120, perKg: 0.35, days: '30-45' },
]

/** 目的地区域附加费系数 */
export const ZONE_FACTORS = [
  { code: 'SEA', label: lt('东南亚', 'Southeast Asia'), factor: 0.85 },
  { code: 'ME', label: lt('中东', 'Middle East'), factor: 1.1 },
  { code: 'EU', label: lt('欧洲', 'Europe'), factor: 1.25 },
  { code: 'NA', label: lt('北美', 'North America'), factor: 1.3 },
  { code: 'EA', label: lt('东亚', 'East Asia'), factor: 0.9 },
]

export const MOCK_SHIPMENTS: Shipment[] = [
  {
    id: 'sh001', trackingNo: 'DHL8839021145', orderNo: 'QH20240315001', platform: 'Shop', carrier: 'DHL', channel: 'dhl',
    destination: 'AE', weightKg: 2.4, freight: 18.6, status: 'transit', updatedAt: '2026-08-18 20:15',
    events: [
      { time: '08-17 09:12', text: lt('深圳转运中心已发出', 'Departed Shenzhen hub') },
      { time: '08-17 22:40', text: lt('抵达迪拜口岸，清关中', 'Arrived Dubai, customs clearing') },
      { time: '08-18 20:15', text: lt('清关完成，派送途中', 'Customs released, out for delivery') },
    ],
  },
  {
    id: 'sh002', trackingNo: 'YX7720198834', orderNo: 'PDD24081200X', platform: '拼多多', carrier: '云途', channel: 'yunexpress',
    destination: 'VN', weightKg: 1.1, freight: 6.8, status: 'shipped', updatedAt: '2026-08-18 11:02',
    events: [
      { time: '08-18 09:30', text: lt('包裹已揽收（广州）', 'Picked up (Guangzhou)') },
      { time: '08-18 11:02', text: lt('离开处理中心，发往河内', 'Left facility, to Hanoi') },
    ],
  },
  {
    id: 'sh003', trackingNo: 'EMS9912038471', orderNo: 'QH20240220002', platform: 'Shop', carrier: 'EMS', channel: 'ems',
    destination: 'TH', weightKg: 0.6, freight: 4.2, status: 'delivered', updatedAt: '2026-08-16 15:44',
    events: [{ time: '08-16 15:44', text: lt('已签收（曼谷）', 'Delivered (Bangkok)') }],
  },
  {
    id: 'sh004', trackingNo: 'FX4410229987', orderNo: 'JD240815007', platform: 'JD', carrier: 'FedEx', channel: 'fedex',
    destination: 'US', weightKg: 3.8, freight: 29.4, status: 'pending', updatedAt: '2026-08-18 08:20',
    events: [{ time: '08-18 08:20', text: lt('订单待发货（等待物流下单）', 'Pending shipment (awaiting booking)') }],
  },
  {
    id: 'sh005', trackingNo: 'DHL8839000112', orderNo: 'TB240809331', platform: '淘宝', carrier: 'DHL', channel: 'dhl',
    destination: 'SA', weightKg: 5.2, freight: 36.2, status: 'exception', updatedAt: '2026-08-17 17:05',
    events: [{ time: '08-17 17:05', text: lt('地址不完整，待买家补充（利雅得）', 'Incomplete address, awaiting buyer (Riyadh)') }],
  },
]

export const MOCK_RETURNS: ReturnRequest[] = [
  { id: 'rt001', orderNo: 'QH20240315001', buyer: 'Khalid', country: 'AE', product: lt('香云纱非遗连衣裙', 'Xiangyunsha Silk Dress'), qty: 1, amount: 189, reason: 'wrong', status: 'pending', appliedAt: '2026-08-18 09:22' },
  { id: 'rt002', orderNo: 'QH20240220002', buyer: 'Nguyễn Văn Hùng', country: 'VN', product: lt('磁吸充电宝 10000mAh', 'Magnetic Power Bank'), qty: 2, amount: 36.4, reason: 'damaged', status: 'approved', appliedAt: '2026-08-16 14:10' },
  { id: 'rt003', orderNo: 'PDD24081200X', buyer: '陈女士', country: 'CN', product: lt('有机枸杞 500g', 'Organic Goji 500g'), qty: 1, amount: 12.5, reason: 'quality', status: 'refunding', appliedAt: '2026-08-15 19:35' },
  { id: 'rt004', orderNo: 'TB240809331', buyer: 'Mohammed', country: 'SA', product: lt('磁悬浮按摩仪', 'Magnetic Massage Device'), qty: 1, amount: 89, reason: 'not_as_described', status: 'completed', appliedAt: '2026-08-10 10:05' },
  { id: 'rt005', orderNo: 'JD240815007', buyer: 'Emily', country: 'US', product: lt('行李箱 24寸', 'Luggage 24in'), qty: 1, amount: 65, reason: 'no_reason', status: 'rejected', appliedAt: '2026-08-08 22:18' },
]

/** 采购需求（B端海外批发商 / C端）——由海关HS编码 + Google/Facebook/社交平台抓取运算 */
export const MOCK_PROCURE_LEADS: ProcureLead[] = [
  { id: 'pl001', hsCode: '1211.90', keyword: lt('枸杞 / 干制草本', 'Goji berry / dried herbs'), side: 'B2B', buyerType: '海外批发商', country: 'SA', sources: ['customs', 'google', 'facebook'], demandQty: 18000, unit: 'kg', priceRangeUsd: [6, 12], heat: 92, trend: 18.5, capturedAt: '2026-08-18 22:00' },
  { id: 'pl002', hsCode: '6204.43', keyword: lt('真丝连衣裙', 'Silk dresses'), side: 'B2B', buyerType: '海外批发商', country: 'AE', sources: ['customs', 'facebook', 'google'], demandQty: 5200, unit: '件', priceRangeUsd: [22, 68], heat: 88, trend: 12.2, capturedAt: '2026-08-18 22:00' },
  { id: 'pl003', hsCode: '8507.60', keyword: lt('锂离子充电宝', 'Li-ion power banks'), side: 'B2B', buyerType: '海外批发商', country: 'ID', sources: ['google', 'facebook'], demandQty: 30000, unit: '个', priceRangeUsd: [5, 15], heat: 85, trend: -3.8, capturedAt: '2026-08-18 22:00' },
  { id: 'pl004', hsCode: '0910.30', keyword: lt('艾灸条 / 艾草制品', 'Moxa sticks'), side: 'B2C', buyerType: '个人买家', country: 'JP', sources: ['google', 'social_sea'], demandQty: 4200, unit: '盒', priceRangeUsd: [8, 25], heat: 76, trend: 9.4, capturedAt: '2026-08-18 22:00' },
  { id: 'pl005', hsCode: '3304.99', keyword: lt('草本护肤面霜', 'Herbal face cream'), side: 'B2C', buyerType: '零售卖家', country: 'VN', sources: ['facebook', 'social_sea'], demandQty: 9800, unit: '瓶', priceRangeUsd: [4, 18], heat: 81, trend: 22.6, capturedAt: '2026-08-18 22:00' },
  { id: 'pl006', hsCode: '9405.40', keyword: lt('LED 户外灯具', 'LED outdoor lights'), side: 'B2B', buyerType: '海外批发商', country: 'TR', sources: ['customs', 'google'], demandQty: 15000, unit: '套', priceRangeUsd: [3, 14], heat: 70, trend: 5.1, capturedAt: '2026-08-18 22:00' },
  { id: 'pl007', hsCode: '4202.92', keyword: lt('运动背包 / 箱包', 'Sport backpacks'), side: 'B2B', buyerType: '海外批发商', country: 'MY', sources: ['facebook', 'social_sea', 'google'], demandQty: 22000, unit: '个', priceRangeUsd: [4, 20], heat: 77, trend: -1.2, capturedAt: '2026-08-18 22:00' },
  { id: 'pl008', hsCode: '3003.90', keyword: lt('中药养生茶包', 'TCM wellness tea'), side: 'B2C', buyerType: '个人买家', country: 'US', sources: ['google', 'social_me'], demandQty: 6800, unit: '盒', priceRangeUsd: [9, 35], heat: 74, trend: 15.8, capturedAt: '2026-08-18 22:00' },
]

/** 平台订单（拼多多 / JD / 淘宝） */
export const MOCK_PLATFORM_ORDERS: PlatformOrder[] = [
  { id: 'po001', platform: 'pdd', orderNo: 'PDD240818001', product: lt('有机枸杞 500g×3', 'Organic Goji 500g×3'), qty: 3, amount: 89.7, buyer: '李**', status: 'paid', createdAt: '2026-08-18 21:40' },
  { id: 'po002', platform: 'taobao', orderNo: 'TB240818332', product: lt('香云纱盘扣上衣 M', 'Xiangyunsha Top M'), qty: 1, amount: 399, buyer: '王**', status: 'shipped', createdAt: '2026-08-18 18:22' },
  { id: 'po003', platform: 'jd', orderNo: 'JD240818009', product: lt('磁吸充电宝 10000mAh', 'Power Bank 10000mAh'), qty: 2, amount: 118, buyer: '赵**', status: 'completed', createdAt: '2026-08-17 12:05' },
  { id: 'po004', platform: 'pdd', orderNo: 'PDD240817056', product: lt('家庭艾灸养生方案（月度）', 'Family Moxa Plan'), qty: 1, amount: 128, buyer: '周**', status: 'paid', createdAt: '2026-08-17 09:18' },
  { id: 'po005', platform: 'taobao', orderNo: 'TB240816221', product: lt('不锈钢保温杯 500ml', 'Thermos 500ml'), qty: 4, amount: 156, buyer: '吴**', status: 'refunding', createdAt: '2026-08-16 20:44' },
  { id: 'po006', platform: 'jd', orderNo: 'JD240816012', product: lt('薏米红豆茶 30包', 'Barley Tea 30 bags'), qty: 2, amount: 69.6, buyer: '郑**', status: 'completed', createdAt: '2026-08-15 15:30' },
  { id: 'po007', platform: 'pdd', orderNo: 'PDD240815098', product: lt('香云纱非遗连衣裙 L', 'Xiangyunsha Dress L'), qty: 1, amount: 458, buyer: '孙**', status: 'shipped', createdAt: '2026-08-15 11:02' },
  { id: 'po008', platform: 'taobao', orderNo: 'TB240814109', product: lt('手机磁吸支架', 'Magnetic Phone Stand'), qty: 6, amount: 78, buyer: '钱**', status: 'completed', createdAt: '2026-08-14 08:55' },
]
