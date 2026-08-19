# 跨境电商商城模块

## 文件位置
- `src/views/shop/ProductListPage.vue`
- `src/views/shop/ProductDetailPage.vue`
- `src/views/shop/CartPage.vue`
- `src/views/shop/CheckoutPage.vue`
- `src/components/ProductCard.vue`
- `src/stores/cart.ts`
- `src/mock/products.ts`、`shop.ts`

## 商品列表
- 左侧分类筛选（全部/茶饮/滋补/膏方/艾灸/药食同源）
- 价格区间滑块
- 搜索（匹配多语言名称）
- 5 种排序（综合/价格升降/评分/销量）
- 5 种货币切换（USD/CNY/EUR/JPY/KRW），实时汇率换算

## 商品详情
- 图片、多语言名称/描述/成分/用法
- 评分、库存、原价/现价
- 数量选择、加入购物车、立即购买
- Tabs：描述 / 成分 / 用法
- 相关推荐

## 购物车
- 全选/单选、数量增减、移除
- 小计、总计
- 满 50 美元免邮提示

## 结算
三步流程：
1. **收货地址**：10 个国家/地区、省/州、城市、地址、邮编、收件人、电话
2. **物流方式**：标准快递（7-15天）/ 加急快递（3-7天）/ 海运（30-45天）
3. **支付方式**：信用卡 / PayPal / 支付宝

- 订单确认摘要
- 提交后生成订单号

## Store 关键 API

```ts
const cart = useCartStore()
cart.addItem(product, 2)
cart.removeItem(id)
cart.updateQuantity(id, 3)
cart.toggleSelect(id)
cart.toggleSelectAll(true)
cart.totalPrice    // 已选商品总价
cart.selectedCount
cart.clear()
```

## 多语言商品
商品名/描述使用 `LocaleText` 类型（6 语言），通过 `tText(obj, locale)` 读取。

## 货币
汇率在 `mock/shop.ts` 的 `currencies` 中定义，`useAppStore().currency` 控制当前货币。
