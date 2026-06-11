# vue5.7

This template should help get you started developing with Vue 3 in Vite.

## Recommended IDE Setup

[VS Code](https://code.visualstudio.com/) + [Vue (Official)](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur).

## Recommended Browser Setup

- Chromium-based browsers (Chrome, Edge, Brave, etc.):
  - [Vue.js devtools](https://chromewebstore.google.com/detail/vuejs-devtools/nhdogjmejiglipccpnnnanhbledajbpd)
  - [Turn on Custom Object Formatter in Chrome DevTools](http://bit.ly/object-formatters)
- Firefox:
  - [Vue.js devtools](https://addons.mozilla.org/en-US/firefox/addon/vue-js-devtools/)
  - [Turn on Custom Object Formatter in Firefox DevTools](https://fxdx.dev/firefox-devtools-custom-object-formatters/)

## Customize configuration

See [Vite Configuration Reference](https://vite.dev/config/).

## Project Setup

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
	├── sql/                 # 数据库初始化脚本
	├── .env.example         # 配置示例文件
	├── package.json         # 依赖与脚本
└── README.md             # 项目说明
```


