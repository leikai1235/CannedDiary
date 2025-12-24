# 罐头日记 - 技术文档

## 架构概览

罐头日记采用前后端分离架构，前端使用 React + TypeScript，后端使用 Node.js + Express，通过 LiteLLM 代理调用 Claude AI 模型。

```
┌─────────────────────────────────────────────────────────┐
│                      前端应用                            │
│  React 19 + TypeScript + Vite                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐              │
│  │  Pages   │  │Components│  │ Services │              │
│  └──────────┘  └──────────┘  └──────────┘              │
│        ↓              ↓              ↓                  │
│  ┌──────────────────────────────────────┐              │
│  │         DiaryContext (状态管理)       │              │
│  └──────────────────────────────────────┘              │
│                       ↓                                 │
│  ┌──────────────────────────────────────┐              │
│  │         IndexedDB (本地存储)          │              │
│  └──────────────────────────────────────┘              │
└─────────────────────────────────────────────────────────┘
                        │
                        ↓ HTTP API
┌─────────────────────────────────────────────────────────┐
│                      后端服务                            │
│  Node.js + Express                                     │
│  ┌──────────────────────────────────────┐              │
│  │         API Routes                    │              │
│  │   /api/materials  /api/chat          │              │
│  └──────────────────────────────────────┘              │
│                       ↓                                 │
│  ┌──────────────────────────────────────┐              │
│  │         LiteLLM Proxy                 │              │
│  │         Claude Sonnet 4               │              │
│  └──────────────────────────────────────┘              │
└─────────────────────────────────────────────────────────┘
```

---

## 技术栈详情

### 前端技术

| 类别 | 技术 | 版本 | 用途 |
|------|------|------|------|
| 框架 | React | 19.2.3 | UI 组件库 |
| 语言 | TypeScript | 5.8.2 | 类型安全 |
| 构建 | Vite | 6.2.0 | 开发服务器和构建 |
| 路由 | react-router-dom | 7.11.0 | 页面路由 |
| AI 集成 | @ai-sdk/react | 1.0.0 | AI 对话 Hook |
| API 客户端 | openai | 6.15.0 | OpenAI 兼容 API |
| Markdown | react-markdown | 9.0.1 | Markdown 渲染 |
| 日期处理 | date-fns | 4.1.0 | 日期格式化 |
| SVG 处理 | vite-plugin-svgr | 4.5.0 | SVG 作为组件导入 |

### 后端技术

| 类别 | 技术 | 用途 |
|------|------|------|
| 运行时 | Node.js | JavaScript 运行环境 |
| 框架 | Express | HTTP 服务器 |
| AI SDK | @ai-sdk/openai | AI 模型调用 |
| 验证 | Zod | 数据结构验证 |
| 跨域 | cors | CORS 支持 |
| 环境变量 | dotenv | 环境配置 |

---

## 目录结构

```
child/
├── src/
│   ├── pages/                    # 页面组件
│   │   ├── HomePage.tsx          # 首页（日历+日记编写）
│   │   ├── DiaryDetailPage.tsx   # 日记详情
│   │   ├── LibraryPage.tsx       # 素材库
│   │   ├── MaterialDetailPage.tsx # 素材详情
│   │   ├── ChatPage.tsx          # AI 聊天
│   │   └── SurpriseDetailPage.tsx # 惊喜详情
│   │
│   ├── components/
│   │   ├── Layout.tsx            # 整体布局
│   │   ├── BottomNav.tsx         # 底部导航
│   │   ├── Calendar.tsx          # 日历组件
│   │   ├── chat/                 # 聊天相关组件
│   │   │   ├── ChatBubble.tsx    # 聊天气泡
│   │   │   ├── ChatInput.tsx     # 输入框
│   │   │   ├── MarkdownBlock.tsx # Markdown 渲染
│   │   │   └── tools/            # 工具结果卡片
│   │   ├── icons/                # 图标组件
│   │   └── shared/               # 共享组件
│   │
│   ├── services/
│   │   ├── llmService.ts         # AI 服务（日记反馈等）
│   │   ├── chatDb.ts             # IndexedDB 数据库
│   │   ├── materialsApi.ts       # 素材 API
│   │   ├── checkinService.ts     # 签到服务
│   │   └── speechService.ts      # 语音服务
│   │
│   ├── contexts/
│   │   └── DiaryContext.tsx      # 全局状态管理
│   │
│   ├── hooks/
│   │   ├── useAgentChat.ts       # AI 聊天 Hook
│   │   └── useChatHistory.ts     # 聊天历史 Hook
│   │
│   ├── config/
│   │   └── agentTools.ts         # AI 工具配置
│   │
│   ├── types.ts                  # 类型定义
│   ├── constants.tsx             # 常量定义
│   ├── App.tsx                   # 应用入口
│   └── index.tsx                 # 渲染入口
│
├── server/
│   ├── src/
│   │   └── index.js              # Express 服务器
│   └── scripts/
│       └── fetch-all-materials.js # 素材数据脚本
│
├── data/
│   └── materials/                # 静态素材 JSON
│       ├── literature-*.json     # 文学常识
│       ├── poetry-*.json         # 诗词成语
│       ├── quote-*.json          # 名人名言
│       ├── news-*.json           # 热点时事
│       └── encyclopedia-*.json   # 人文百科
│
├── package.json
├── vite.config.ts
└── tsconfig.json
```

---

## 核心模块

### 1. 状态管理 - DiaryContext

**文件**: `src/contexts/DiaryContext.tsx`

全局状态管理，使用 React Context + useReducer 模式。

#### 状态结构

```typescript
interface DiaryState {
  // 日记相关
  diaries: DiaryEntry[]
  selectedDate: Date
  newDiaryContent: string
  selectedMood: Mood | null
  selectedWeather: Weather | null

  // 用户设置
  gradeLevel: GradeLevel  // 'lower' | 'middle' | 'upper'

  // 惊喜罐头
  surprises: Record<string, SurpriseContent>

  // 素材库
  categoryMaterials: Material[]
  currentCategory: MaterialCategory

  // 签到
  checkinStatus: CheckinStatus

  // UI 状态
  isLoading: boolean
  isSealing: boolean
}
```

#### 核心方法

```typescript
// 封存日记
async function handleSealCan(): Promise<void>

// 打开惊喜罐头
async function handleOpenSurprise(date: string): Promise<void>

// 加载素材（分页）
async function loadMaterials(page: number): Promise<void>

// 签到
async function handleCheckin(): Promise<void>
```

---

### 2. AI 服务 - llmService

**文件**: `src/services/llmService.ts`

封装所有 AI 相关的 API 调用。

#### 日记反馈

```typescript
interface AIFeedback {
  emotion_response: string    // AI 回信（3段结构）
  material: Material          // 推荐素材
  summary: string             // 日记摘要
  predicted_mood: Mood        // 预测心情
  predicted_weather: Weather  // 预测天气
}

async function getDiaryFeedback(
  content: string,
  gradeLevel: GradeLevel,
  mood?: Mood,
  weather?: Weather
): Promise<AIFeedback>
```

#### 惊喜生成

```typescript
interface SurpriseContent {
  type: 'writing_challenge' | 'knowledge_fun' | 'creative_writing'
  title: string
  content: string
  encouragement: string
}

async function getDailySurprise(
  gradeLevel: GradeLevel
): Promise<SurpriseContent>
```

#### 素材生成

```typescript
async function getMaterialsByCategory(
  category: MaterialCategory,
  gradeLevel: GradeLevel,
  count: number
): Promise<Material[]>
```

---

### 3. 数据库服务 - chatDb

**文件**: `src/services/chatDb.ts`

使用 IndexedDB 进行本地数据持久化。

#### 数据库结构

```typescript
// 数据库名称: CannedDiaryDB
// 版本: 1

// 对象存储
const stores = {
  sessions: { keyPath: 'id' },      // 聊天会话
  messages: { keyPath: 'id' },      // 聊天消息
  memories: { keyPath: 'id' },      // 用户记忆
  diaries: { keyPath: 'id' }        // 日记记录
}
```

#### 核心 API

```typescript
// 会话管理
async function createSession(title: string): Promise<Session>
async function getSession(sessionId: string): Promise<Session>
async function getAllSessions(): Promise<Session[]>
async function deleteSession(sessionId: string): Promise<void>

// 消息管理
async function saveMessage(sessionId: string, message: Message): Promise<void>
async function getSessionMessages(sessionId: string): Promise<Message[]>

// 日记管理
async function saveDiary(diary: DiaryEntry): Promise<void>
async function getDiaryByDate(date: string): Promise<DiaryEntry | null>
async function getAllDiaries(): Promise<DiaryEntry[]>
async function searchDiaries(keyword?: string, mood?: Mood): Promise<DiaryEntry[]>
```

---

### 4. 素材 API - materialsApi

**文件**: `src/services/materialsApi.ts`

素材数据获取，支持静态数据秒开和 API 分页加载。

#### 缓存策略

```typescript
// 缓存配置
const CACHE_TTL = 5 * 60 * 1000  // 5 分钟

// 缓存结构
const cache: Map<string, {
  data: Material[]
  timestamp: number
}> = new Map()
```

#### 加载策略

```typescript
// 第 1 页：使用打包的静态 JSON（秒开）
function getDefaultMaterialsSync(
  category: MaterialCategory,
  gradeLevel: GradeLevel
): Material[]

// 第 2 页+：API 请求
async function fetchMaterials(
  category: MaterialCategory,
  gradeLevel: GradeLevel,
  page: number,
  pageSize: number
): Promise<{ materials: Material[], hasMore: boolean }>
```

---

### 5. 聊天 Hook - useAgentChat

**文件**: `src/hooks/useAgentChat.ts`

封装 AI 对话逻辑，集成 Vercel AI SDK。

#### Hook 接口

```typescript
interface UseAgentChatReturn {
  // 消息
  messages: Message[]
  input: string
  setInput: (input: string) => void

  // 会话
  currentSessionId: string | null
  sessions: Session[]

  // 操作
  handleSubmit: (e: FormEvent) => Promise<void>
  createNewSession: () => Promise<void>
  loadSession: (sessionId: string) => Promise<void>

  // 状态
  isLoading: boolean
  error: Error | null
}
```

#### 工具配置

聊天中 AI 可调用的工具：

```typescript
const tools = {
  // 前端处理
  saveMemory: {
    description: '保存用户记忆',
    parameters: z.object({
      key: z.string(),
      value: z.string()
    })
  },
  getMemories: {
    description: '获取用户记忆',
    parameters: z.object({})
  },
  searchDiaries: {
    description: '搜索日记',
    parameters: z.object({
      keyword: z.string().optional(),
      mood: z.string().optional()
    })
  },
  getDiaryDetail: {
    description: '获取日记详情',
    parameters: z.object({
      diaryId: z.string()
    })
  },

  // 后端处理
  getMaterial: {
    description: 'AI 生成素材',
    parameters: z.object({
      topic: z.string()
    })
  },
  explainConcept: {
    description: '解释概念',
    parameters: z.object({
      concept: z.string()
    })
  }
}
```

---

## 类型定义

**文件**: `src/types.ts`

### 心情类型

```typescript
type Mood =
  | 'happy' | 'calm' | 'sad' | 'angry' | 'excited'
  | 'fulfilled' | 'smitten' | 'annoyed' | 'lonely'
  | 'confused' | 'warm' | 'sweet' | 'pouty' | 'lucky' | 'tired'
```

### 天气类型

```typescript
type Weather =
  | 'sunny' | 'cloudy' | 'overcast'
  | 'lightRain' | 'heavyRain' | 'thunderstorm'
  | 'snowy' | 'windy' | 'foggy'
```

### 年级类型

```typescript
type GradeLevel = 'lower' | 'middle' | 'upper'
```

### 素材分类

```typescript
type MaterialCategory =
  | 'literature'    // 文学常识
  | 'poetry'        // 诗词成语
  | 'quote'         // 名人名言
  | 'news'          // 热点时事
  | 'encyclopedia'  // 人文百科
```

### 核心数据结构

```typescript
interface DiaryEntry {
  id: string
  date: string           // 格式: yyyy-MM-dd
  content: string
  mood: Mood
  weather: Weather
  feedback?: AIFeedback
  createdAt: number
  updatedAt: number
}

interface Material {
  id: string
  type: MaterialCategory
  title: string
  content: string
  pinyin?: string
  author?: string
  dynasty?: string
  interpretation: string  // 白话释义
  background: string      // 创作背景
  usage: string           // 写作应用
}

interface AIFeedback {
  emotion_response: string
  material: Material
  summary: string
  predicted_mood: Mood
  predicted_weather: Weather
}

interface SurpriseContent {
  type: 'writing_challenge' | 'knowledge_fun' | 'creative_writing'
  title: string
  content: string
  encouragement: string
}
```

---

## 后端 API

**文件**: `server/src/index.js`

### GET /api/materials

获取分类素材列表。

**请求参数**:
```
category: MaterialCategory
gradeLevel: GradeLevel
page: number (默认 1)
pageSize: number (默认 10)
```

**响应**:
```json
{
  "success": true,
  "data": {
    "materials": [...],
    "pagination": {
      "page": 1,
      "pageSize": 10,
      "hasMore": true
    }
  }
}
```

### POST /api/chat

AI 对话接口（流式响应）。

**请求体**:
```json
{
  "messages": [...],
  "gradeLevel": "middle"
}
```

**响应**: Server-Sent Events 流

---

## 配置文件

### Vite 配置

**文件**: `vite.config.ts`

```typescript
export default defineConfig({
  plugins: [
    react(),
    svgr()
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  server: {
    host: '0.0.0.0',
    port: 3000
  }
})
```

### TypeScript 配置

**文件**: `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### 环境变量

```env
# 前端 (.env)
VITE_LITELLM_API_KEY=your_api_key
VITE_LITELLM_PROXY_URL=https://your-proxy.com
VITE_API_URL=http://localhost:3001

# 后端 (server/.env)
LITELLM_API_KEY=your_api_key
LITELLM_PROXY_URL=https://your-proxy.com
PORT=3001
```

---

## 数据流

### 日记封存流程

```
用户输入日记
    ↓
DiaryContext.handleSealCan()
    ↓
llmService.getDiaryFeedback()
    ↓
LiteLLM Proxy → Claude API
    ↓
返回 AIFeedback
    ↓
chatDb.saveDiary()
    ↓
IndexedDB 存储
    ↓
导航到 DiaryDetailPage
```

### 素材加载流程

```
LibraryPage 挂载
    ↓
materialsApi.getDefaultMaterialsSync() → 秒开第 1 页
    ↓
用户滚动到底部
    ↓
DiaryContext.loadMaterials(page)
    ↓
GET /api/materials
    ↓
Claude API 生成素材
    ↓
缓存到 Map（5 分钟）
    ↓
前端渲染
```

### 聊天流程

```
用户输入消息
    ↓
useAgentChat.handleSubmit()
    ↓
POST /api/chat (流式)
    ↓
AI 处理 + 工具调用
    ↓
前端渲染消息 + 工具结果
    ↓
chatDb.saveMessage()
    ↓
IndexedDB 存储
```

---

## 年级人设系统

AI 根据年级调整输出风格：

### 低年级 (lower)

```
- 句子不超过 10 个字
- 必须包含拼音
- 使用叠词、拟声词
- 温暖亲切的语气
- 活泼可爱的风格
```

### 中年级 (middle)

```
- 可使用常见成语
- 引入修辞手法
- 知心朋友式交流
- 鼓励独立思考
- 适当知识拓展
```

### 高年级 (upper)

```
- 丰富文学词汇
- 启发批判思维
- 成熟稳重风格
- 深入知识讲解
- 文学性表达
```

---

## 开发指南

### 本地开发

```bash
# 1. 安装依赖
pnpm install
cd server && pnpm install

# 2. 配置环境变量
cp .env.example .env
# 编辑 .env 填入 API 密钥

# 3. 启动开发服务器
pnpm dev          # 前端 :3000
cd server && pnpm start  # 后端 :3001
```

### 添加新页面

1. 在 `src/pages/` 创建页面组件
2. 在 `src/App.tsx` 添加路由
3. 如需全局状态，在 `DiaryContext` 添加

### 添加新工具

1. 在 `src/config/agentTools.ts` 定义工具 schema
2. 在 `src/hooks/useAgentChat.ts` 实现工具处理
3. 在 `src/components/chat/tools/` 创建结果卡片组件

### 添加新素材分类

1. 在 `src/types.ts` 添加类型
2. 在 `data/materials/` 添加默认数据
3. 在 `src/constants.tsx` 添加分类配置
4. 更新 `llmService.ts` 的 prompt

---

## 性能优化

### 已实施优化

1. **首屏秒开** - 素材第 1 页使用静态 JSON
2. **API 缓存** - 5 分钟内存缓存
3. **IndexedDB** - 本地数据持久化
4. **流式输出** - AI 响应实时显示
5. **懒加载** - 无限滚动按需加载

### 未来优化方向

1. Service Worker 离线缓存
2. 图片懒加载
3. 虚拟列表（长列表优化）
4. 代码分割（路由级别）
