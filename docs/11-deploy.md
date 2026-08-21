# 11. 构建与部署

## Web 构建

```bash
pnpm run build
```

执行 `vue-tsc -b`（类型检查）+ `vite build`，产物输出到 `dist/`。

### 产物结构
```
dist/
├── index.html
└── assets/
    ├── index-[hash].js       # 主包（Vue + Pinia + Router + i18n）
    ├── index-[hash].css
    ├── AlertsPage-[hash].js  # 各页面按需分包
    ├── WatchPage-[hash].js
    └── ...
```

## 部署

### 静态服务器
`dist/` 是纯静态文件，可部署到：
- Nginx / Apache
- Vercel / Netlify / Cloudflare Pages
- AWS S3 + CloudFront
- 阿里云 OSS + CDN

### Nginx 配置示例
```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /var/www/suheng/dist;
    index index.html;

    # History 模式路由回退
    location / {
        try_files $uri $uri/ /index.html;
    }

    # 静态资源缓存
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### 环境变量
| 变量 | 说明 | 默认 |
|------|------|------|
| `DEPLOY_RUN_PORT` | 开发服务器端口 | 5000 |
| `ELECTRON_BUILD` | Electron 构建时设为 1，切换 base 路径 | — |
| `COZE_PROJECT_DOMAIN_DEFAULT` | 对外访问域名（沙箱） | — |

## 桌面端打包
详见 [桌面端文档](./10-desktop.md)。

## 沙箱开发
项目使用 Coze CLI：
```bash
coze dev      # 启动开发环境（HMR）
coze build    # 构建生产版本
coze start    # 启动生产环境
```

`.coze` 文件定义了 build 和 run 命令，端口由 `DEPLOY_RUN_PORT` 环境变量决定。

## 版本号
在 `package.json` 的 `version` 字段维护。桌面打包产物文件名自动包含版本号。
