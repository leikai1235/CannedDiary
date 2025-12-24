# 罐头日记 (Canned Diary)

一款专为中小学生设计的 AI 驱动日记应用，整合日记记录、语文素材库、AI 对话等功能，激发孩子的写作灵感。

## 项目简介

罐头日记通过 AI 能力为孩子提供智能的日记反馈和写作素材推荐，帮助孩子养成写日记的好习惯，同时扩展语文知识面。

### 核心特性

- **智能日记反馈** - AI 根据日记内容生成个性化回信，给予情感回应和写作建议
- **分级素材库** - 5 大分类素材（文学常识、诗词成语、名人名言、热点时事、人文百科），按年级分层
- **AI 对话助手** - 与"小罐罐"实时对话，支持搜索日记、查询素材、解答疑问
- **惊喜罐头** - 未写日记的日期可打开惊喜，获取写作挑战或知识趣味内容
- **连续打卡** - 记录连续写日记天数，培养写作习惯

## 技术栈

### 前端
- React 19 + TypeScript
- Vite 构建工具
- React Router v7 路由
- Vercel AI SDK 集成
- IndexedDB 本地存储

### 后端
- Node.js + Express
- LiteLLM 代理（Claude Sonnet 4）
- Zod 数据验证

## 快速开始

### 环境要求
- Node.js >= 18
- pnpm 包管理器

### 安装依赖

```bash
# 前端依赖
pnpm install

# 后端依赖
cd server && pnpm install
```

### 配置环境变量

创建 `.env` 文件：

```env
VITE_LITELLM_API_KEY=your_api_key
VITE_LITELLM_PROXY_URL=your_proxy_url
VITE_API_URL=http://localhost:3001
```

### 启动开发服务器

```bash
# 启动前端（端口 3000）
pnpm dev

# 启动后端（端口 3001）
cd server && pnpm start
```

访问 http://localhost:3000 即可使用。

## 项目结构

```
child/
├── src/                    # 前端源代码
│   ├── pages/             # 页面组件
│   ├── components/        # UI 组件
│   ├── services/          # 业务服务
│   ├── contexts/          # React Context
│   ├── hooks/             # 自定义 Hooks
│   └── types.ts           # 类型定义
├── server/                 # 后端服务
│   └── src/index.js       # Express 服务器
├── data/                   # 静态素材数据
│   └── materials/         # 分级素材 JSON
└── doc/                    # 项目文档
    ├── product.md         # 产品文档
    └── technical.md       # 技术文档
```

## 文档

- [产品文档](./doc/product.md) - 功能介绍、用户指南
- [技术文档](./doc/technical.md) - 架构设计、API 接口、开发指南

## 许可证

私有项目，保留所有权利。
