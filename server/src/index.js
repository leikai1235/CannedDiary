// 必须最先加载环境变量
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import routes from './routes/index.js';
import { printConfig } from './services/llm.js';

const app = express();
const PORT = process.env.PORT || 3001;

// 打印启动配置
printConfig();

// 中间件
app.use(cors());
app.use(express.json());

// 挂载 API 路由
app.use('/api', routes);

// 启动服务器
app.listen(PORT, () => {
  console.log(`[启动] 罐头日记后端服务已启动: http://localhost:${PORT}`);
  console.log(`[素材] 素材API: GET /api/materials?category=literature&gradeLevel=middle&page=1&pageSize=10`);
});
