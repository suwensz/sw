# 认证与账户模块

## 文件位置
- `src/views/auth/LoginPage.vue`
- `src/views/auth/RegisterPage.vue`
- `src/views/auth/ForgotPasswordPage.vue`
- `src/views/account/AccountPage.vue`
- `src/stores/auth.ts`
- `src/layouts/AuthLayout.vue`

## 功能
- 邮箱/手机号 + 密码登录
- 验证码登录（60 秒倒计时，任意 6 位数字通过）
- 分步注册（账号 → 健康档案 → 完成）
- 忘记密码（邮箱 → 验证码 → 重置）
- 第三方登录（Google/Facebook/Apple/微信，Mock）
- 个人资料编辑、健康档案（身高/体重/BMI）

## Store 关键 API

```ts
const auth = useAuthStore()

// 登录
await auth.login({ account: 'dev_user@coze.dev', password: 'dev123456' })

// 验证码登录
await auth.loginWithCode({ account: 'user@example.com', code: '123456' })

// 注册（分两步）
await auth.register({ account, code, password, nickname })           // 步骤1
await auth.completeHealthProfile({ gender, birthday, height, weight, constitution }) // 步骤2

// 状态
auth.isLoggedIn       // boolean
auth.user              // UserInfo | null
auth.bmi               // computed: { value, status, level }
auth.logout()
```

## 持久化
- `qh_auth_user` / `qh_auth_token` 存 localStorage
- 注册信息持久化，下次可用相同密码登录

## 测试账号
| 账号 | 密码 |
|------|------|
| dev_user@coze.dev | dev123456 |

## 路由守卫
`router/index.ts` 中 `requiresAuth` meta 的路由（/chat, /account, /cart, /checkout, /health/*, /ops/*）未登录自动跳转 `/login?redirect=原路径`。
