import type { SocialApp, SocialAppId, CountrySocialInfo } from '@/types'
import { lt } from '@/utils/locale'

/** 11 款社交软件（与导航栏选择器一致） */
export const SOCIAL_APPS: SocialApp[] = [
  { id: 'wechat', name: lt('微信', 'WeChat'), color: '#07C160' },
  { id: 'qq', name: lt('QQ', 'QQ'), color: '#12B7F5' },
  { id: 'skype', name: lt('Skype', 'Skype'), color: '#00AFF0' },
  { id: 'msn', name: lt('MSN', 'MSN'), color: '#7FBA00' },
  { id: 'yahoo', name: lt('Yahoo', 'Yahoo'), color: '#6001D2' },
  { id: 'whatsapp', name: lt('WhatsApp', 'WhatsApp'), color: '#25D366' },
  { id: 'line', name: lt('LINE', 'LINE'), color: '#06C755' },
  { id: 'zalo', name: lt('Zalo', 'Zalo'), color: '#0068FF' },
  { id: 'messenger', name: lt('Messenger', 'Messenger'), color: '#0084FF' },
  { id: 'telegram', name: lt('Telegram', 'Telegram'), color: '#2AABEE' },
  { id: 'viber', name: lt('Viber', 'Viber'), color: '#7360F2' },
]

export const SOCIAL_APP_MAP: Record<SocialAppId, SocialApp> = Object.fromEntries(
  SOCIAL_APPS.map((a) => [a.id, a]),
) as Record<SocialAppId, SocialApp>

/** 国家 → 主流社交软件（按主流程度排序） */
export const COUNTRY_SOCIAL_MAP: CountrySocialInfo[] = [
  { code: 'CN', flag: '🇨🇳', name: lt('中国', 'China'), region: 'east_asia', apps: ['wechat', 'qq'] },
  { code: 'JP', flag: '🇯🇵', name: lt('日本', 'Japan'), region: 'east_asia', apps: ['line', 'wechat', 'messenger'] },
  { code: 'KR', flag: '🇰🇷', name: lt('韩国', 'South Korea'), region: 'east_asia', apps: ['line', 'telegram', 'messenger'] },
  { code: 'VN', flag: '🇻🇳', name: lt('越南', 'Vietnam'), region: 'southeast_asia', apps: ['zalo', 'messenger', 'telegram'] },
  { code: 'TH', flag: '🇹🇭', name: lt('泰国', 'Thailand'), region: 'southeast_asia', apps: ['line', 'messenger', 'viber'] },
  { code: 'ID', flag: '🇮🇩', name: lt('印度尼西亚', 'Indonesia'), region: 'southeast_asia', apps: ['whatsapp', 'telegram', 'line'] },
  { code: 'MY', flag: '🇲🇾', name: lt('马来西亚', 'Malaysia'), region: 'southeast_asia', apps: ['whatsapp', 'messenger', 'wechat', 'telegram'] },
  { code: 'SG', flag: '🇸🇬', name: lt('新加坡', 'Singapore'), region: 'southeast_asia', apps: ['whatsapp', 'telegram', 'line'] },
  { code: 'PH', flag: '🇵🇭', name: lt('菲律宾', 'Philippines'), region: 'southeast_asia', apps: ['messenger', 'viber', 'whatsapp'] },
  { code: 'SA', flag: '🇸🇦', name: lt('沙特阿拉伯', 'Saudi Arabia'), region: 'middle_east', apps: ['whatsapp', 'telegram', 'messenger', 'skype'] },
  { code: 'AE', flag: '🇦🇪', name: lt('阿联酋', 'UAE'), region: 'middle_east', apps: ['whatsapp', 'telegram', 'skype'] },
  { code: 'EG', flag: '🇪🇬', name: lt('埃及', 'Egypt'), region: 'middle_east', apps: ['whatsapp', 'messenger', 'viber'] },
  { code: 'TR', flag: '🇹🇷', name: lt('土耳其', 'Türkiye'), region: 'middle_east', apps: ['telegram', 'whatsapp', 'viber'] },
  { code: 'US', flag: '🇺🇸', name: lt('美国', 'United States'), region: 'americas', apps: ['messenger', 'whatsapp', 'skype', 'telegram'] },
  { code: 'CA', flag: '🇨🇦', name: lt('加拿大', 'Canada'), region: 'americas', apps: ['messenger', 'whatsapp', 'skype'] },
  { code: 'MX', flag: '🇲🇽', name: lt('墨西哥', 'Mexico'), region: 'americas', apps: ['whatsapp', 'messenger', 'viber'] },
  { code: 'BR', flag: '🇧🇷', name: lt('巴西', 'Brazil'), region: 'americas', apps: ['whatsapp', 'telegram', 'messenger'] },
  { code: 'GB', flag: '🇬🇧', name: lt('英国', 'United Kingdom'), region: 'europe', apps: ['whatsapp', 'messenger', 'skype', 'viber'] },
  { code: 'DE', flag: '🇩🇪', name: lt('德国', 'Germany'), region: 'europe', apps: ['whatsapp', 'telegram', 'skype'] },
  { code: 'FR', flag: '🇫🇷', name: lt('法国', 'France'), region: 'europe', apps: ['messenger', 'whatsapp', 'viber', 'skype'] },
  { code: 'RU', flag: '🇷🇺', name: lt('俄罗斯', 'Russia'), region: 'europe', apps: ['telegram', 'viber', 'whatsapp'] },
  { code: 'ES', flag: '🇪🇸', name: lt('西班牙', 'Spain'), region: 'europe', apps: ['whatsapp', 'telegram', 'messenger'] },
  { code: 'AU', flag: '🇦🇺', name: lt('澳大利亚', 'Australia'), region: 'oceania', apps: ['messenger', 'whatsapp', 'skype'] },
]

export function countryInfo(code: string): CountrySocialInfo | undefined {
  return COUNTRY_SOCIAL_MAP.find((c) => c.code === code)
}

/** 跨境商品的主销市场池（不含中国，面向出口） */
const EXPORT_MARKETS = COUNTRY_SOCIAL_MAP.filter((c) => c.code !== 'CN')

function hashCode(s: string): number {
  let h = 0
  for (const ch of s) h = (h * 31 + ch.charCodeAt(0)) % 100000
  return h
}

/** 按商品 ID 确定性分配主销国家（用于把该国主流社交软件同步到商品） */
export function productMarket(productId: string): CountrySocialInfo {
  return EXPORT_MARKETS[hashCode(productId) % EXPORT_MARKETS.length]
}

/** 某社交软件覆盖的国家（按主流程度排序，即该软件的客户所在国） */
export function appCountries(appId: SocialAppId): CountrySocialInfo[] {
  return COUNTRY_SOCIAL_MAP.filter((c) => c.apps.includes(appId))
}

/** 各国客户姓名池（用于咨询弹窗模拟） */
export const COUNTRY_BUYER_NAMES: Record<string, string[]> = {
  VN: ['阮文雄', '陈氏梅', '黎文强'], TH: ['颂猜', '阿努查', '玛丽莎'],
  ID: ['Budi', 'Sari', 'Agus'], MY: ['Ahmad', 'Wei Ling', 'Nurul'],
  SA: ['Mohammed', 'Faisal', 'Abdullah'], AE: ['Khalid', 'Fatima', 'Omar'],
  EG: ['Hassan', 'Amina', 'Youssef'], TR: ['Mehmet', 'Ayşe', 'Emre'],
  US: ['John', 'Emily', 'Michael'], CA: ['Liam', 'Sophia', 'Lucas'],
  MX: ['Carlos', 'María', 'José'], BR: ['João', 'Ana', 'Pedro'],
  GB: ['David', 'Sarah', 'James'], DE: ['Hans', 'Anna', 'Stefan'],
  FR: ['Pierre', 'Claire', 'Luc'], RU: ['Ivan', 'Olga', 'Dmitri'],
  JP: ['田中太郎', '佐藤花子', '铃木一郎'], KR: ['金敏俊', '朴智妍', '李承哲'],
}
