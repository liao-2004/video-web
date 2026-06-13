# video Web

该项目模仿b站，做了个视频管理网站的C端平台
## 核心特性
- 现代化前端架构：基于 Vite 构建，开发热更新速度快，生产环境打包体积小
- 视频核心能力：支持主流视频格式播放/倍速/全屏（根据实际功能调整）
- 测试保障：集成 Vitest 单元测试 + Cypress E2E 测试，保障功能稳定性
- 工程化规范：内置 ESLint 代码校验，统一开发规范

## 环境要求
- Node.js ≥ 16.0.0（推荐 18.x LTS 版本）
- npm/yarn/pnpm（推荐 pnpm，性能更优）
- 现代浏览器（Chrome ≥ 88、Firefox ≥ 85、Safari ≥ 15）


```sh
pnpm install
```

### Compile and Hot-Reload for Development

```sh
pnpm dev
```

### Compile and Minify for Production

```sh
pnpm build
```

### Lint with [ESLint](https://eslint.org/)

```sh
pnpm lint
```
```项目结果
video-web/
├── src/                  # 源码目录
│   ├── assets/           # 静态资源（视频/图片/样式）
│   ├── components/       # 通用组件
│   ├── pages/            # 页面组件（如：播放页、列表页）
│   ├── utils/            # 工具函数（如：视频格式处理、时间格式化）
│   ├── App.vue           # 根组件
│   └── main.ts           # 入口文件
├── cypress/              # Cypress E2E 测试目录
├── vite.config.ts        # Vite 配置文件
├── package.json          # 依赖与脚本配置
├── .eslintrc.js          # ESLint 配置
├── .gitignore            # Git 忽略规则
├──video server/    #后端文件
	│    ├── src/
	│   ├── config/          # 配置文件（数据库/存储/FFmpeg）
	│   ├── controller/      # 接口控制器（视频/用户）
	│   ├── service/         # 业务逻辑层（转码/存储/鉴权）
	│   ├── utils/           # 工具函数（FFmpeg调用/文件处理）
	│   ├── middleware/      # 中间件（跨域/鉴权/日志）
	│   ├── model/           # 数据模型（数据库表结构）
	│   └── app.js           # 服务入口
	├── uploads/             # 视频上传临时目录
	├── .env.example         # 配置示例文件
	├── package.json         # 依赖与脚本
└── README.md             # 项目说明
```


