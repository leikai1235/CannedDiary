import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import OpenAI from 'openai';
import { streamText, tool } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { z } from 'zod';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// 中间件
app.use(cors());
app.use(express.json());

// LiteLLM 代理配置（用于素材生成）
const openai = new OpenAI({
  apiKey: process.env.LITELLM_API_KEY,
  baseURL: process.env.LITELLM_PROXY_URL
});

// AI SDK OpenAI 客户端（用于聊天）
const aiOpenai = createOpenAI({
  apiKey: process.env.LITELLM_API_KEY,
  baseURL: process.env.LITELLM_PROXY_URL,
  compatibility: 'compatible'
});

// 年级适配提示词
const GRADE_PROMPTS = {
  lower: `
    【年级适配要求 - 低年级(1-3年级)】
    - 使用简单词汇，避免复杂成语和生僻字
    - 句子简短，每句不超过15字
    - 内容要有趣味性，像讲故事一样
    - 语气更加活泼可爱，多用叠词和拟声词
    - 必须包含拼音标注(pinyin字段)
  `,
  middle: `
    【年级适配要求 - 中年级(4-6年级)】
    - 可以使用常见成语和修辞手法
    - 句子可适当复杂，展现语言美
    - 推荐经典古诗词和名人名言
    - 鼓励独立思考，适当引导
    - 语气像知心朋友，温暖有力量
  `,
  upper: `
    【年级适配要求 - 高年级(初中)】
    - 使用更丰富的词汇和修辞手法
    - 可引用深层次的文学作品和哲理
    - 推荐时事热点和百科知识，培养思辨能力
    - 启发批判性思维，鼓励深度思考
    - 语气成熟稳重，像值得信赖的朋友
  `
};

// 素材分类提示词
const CATEGORY_PROMPTS = {
  literature: '经典文学作品片段（童话、寓言、小说、散文等），要有文学性和可读性',
  poetry: '古诗词或现代诗，要意境优美、朗朗上口',
  quote: '名人名言或格言警句，要有启发性和力量感',
  news: '适合学生了解的时事热点或社会现象，要有教育意义',
  encyclopedia: '有趣的百科知识或科学常识，要能激发好奇心'
};

// 素材分类中文名
const CATEGORY_NAMES = {
  literature: '文学',
  poetry: '诗词',
  quote: '名言',
  news: '时事',
  encyclopedia: '百科'
};

// 缓存（简单内存缓存）
const materialsCache = new Map();

// 签到数据存储（userId -> checkin data）
// 简化版：使用设备ID或固定ID，实际应用中应该有用户系统
const checkinData = new Map();

// 获取素材列表 API
app.get('/api/materials', async (req, res) => {
  try {
    const {
      category = 'literature',
      gradeLevel = 'middle',
      page = 1,
      pageSize = 10
    } = req.query;

    const cacheKey = `${category}-${gradeLevel}-${page}`;

    // 检查缓存
    if (materialsCache.has(cacheKey)) {
      console.log(`[Cache Hit] ${cacheKey}`);
      return res.json(materialsCache.get(cacheKey));
    }

    console.log(`[API] Fetching materials: category=${category}, grade=${gradeLevel}, page=${page}`);

    const materials = await generateMaterials(category, gradeLevel, parseInt(pageSize));

    const response = {
      success: true,
      data: {
        materials,
        pagination: {
          page: parseInt(page),
          pageSize: parseInt(pageSize),
          hasMore: true // AI生成模式下总是可以生成更多
        }
      }
    };

    // 缓存结果（5分钟过期）
    materialsCache.set(cacheKey, response);
    setTimeout(() => materialsCache.delete(cacheKey), 5 * 60 * 1000);

    res.json(response);
  } catch (error) {
    console.error('[API Error]', error);
    res.status(500).json({
      success: false,
      error: error.message || '获取素材失败'
    });
  }
});

// AI 生成素材
async function generateMaterials(category, gradeLevel, count = 6) {
  const gradePrompt = GRADE_PROMPTS[gradeLevel] || GRADE_PROMPTS.middle;
  const categoryPrompt = CATEGORY_PROMPTS[category] || CATEGORY_PROMPTS.literature;
  const categoryName = CATEGORY_NAMES[category] || '文学';

  try {
    const response = await openai.chat.completions.create({
      model: 'claude-sonnet-4@20250514',
      messages: [
        {
          role: 'system',
          content: `你是一个专业的语文教育专家。

${gradePrompt}

素材要求：${categoryPrompt}

请确保素材：
1. 与年级水平相匹配
2. 内容健康向上
3. 有实际的写作参考价值
4. 每个素材都不同，不要重复
5. 内容准确，不要编造名人名言或诗词`
        },
        {
          role: 'user',
          content: `请为学生推荐${count}个【${categoryName}】类型的写作素材。

每个素材要包含：
- title: 标题（简洁有吸引力）
- content: 原文/内容（完整呈现）
- pinyin: 拼音标注（低年级必须有，中高年级可选）
- author: 作者（如适用）
- dynasty: 朝代（如适用，诗词类必须有）
- interpretation: 现代译文/释义（通俗易懂）
- background: 创作背景/来源故事（有趣生动）
- usage: 写作应用/用法提示（实用具体）`
        }
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'materials_list',
          strict: true,
          schema: {
            type: 'object',
            properties: {
              materials: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    title: { type: 'string' },
                    content: { type: 'string' },
                    pinyin: { type: 'string' },
                    author: { type: 'string' },
                    dynasty: { type: 'string' },
                    interpretation: { type: 'string' },
                    background: { type: 'string' },
                    usage: { type: 'string' }
                  },
                  required: ['title', 'content', 'pinyin', 'author', 'dynasty', 'interpretation', 'background', 'usage'],
                  additionalProperties: false
                }
              }
            },
            required: ['materials'],
            additionalProperties: false
          }
        }
      }
    });

    const parsed = JSON.parse(response.choices[0].message.content?.trim() || '{}');

    // 为每个素材添加ID和type
    const materials = (parsed.materials || []).map((m, index) => ({
      ...m,
      id: `${category}-${gradeLevel}-${Date.now()}-${index}`,
      type: category
    }));

    return materials;
  } catch (error) {
    console.error('[AI Error]', error);
    throw new Error('AI生成素材失败');
  }
}

// 获取签到状态 API
app.get('/api/checkin/status', (req, res) => {
  try {
    const { userId = 'default-user' } = req.query;

    const userCheckin = checkinData.get(userId) || {
      checkins: [], // 签到日期数组 ['2024-12-20', '2024-12-21']
      streak: 0     // 连续签到天数
    };

    // 计算连续签到天数
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    const hasCheckedInToday = userCheckin.checkins.includes(today);
    const hasCheckedInYesterday = userCheckin.checkins.includes(yesterday);

    // 重新计算连续天数（从最新日期倒推）
    let streak = 0;
    const sortedCheckins = [...userCheckin.checkins].sort((a, b) => b.localeCompare(a));

    if (sortedCheckins.length > 0) {
      let checkDate = new Date();

      // 如果今天没签到，从昨天开始检查
      if (!hasCheckedInToday) {
        checkDate = new Date(Date.now() - 86400000);
      }

      for (let i = 0; i < sortedCheckins.length; i++) {
        const dateStr = checkDate.toISOString().split('T')[0];
        if (sortedCheckins.includes(dateStr)) {
          streak++;
          checkDate = new Date(checkDate.getTime() - 86400000);
        } else {
          break;
        }
      }
    }

    res.json({
      success: true,
      data: {
        hasCheckedInToday,
        streak,
        totalCheckins: userCheckin.checkins.length,
        lastCheckinDate: sortedCheckins[0] || null
      }
    });
  } catch (error) {
    console.error('[Checkin Status Error]', error);
    res.status(500).json({
      success: false,
      error: error.message || '获取签到状态失败'
    });
  }
});

// 签到 API
app.post('/api/checkin', (req, res) => {
  try {
    const { userId = 'default-user' } = req.body;

    const today = new Date().toISOString().split('T')[0];

    // 获取用户签到数据
    const userCheckin = checkinData.get(userId) || {
      checkins: [],
      streak: 0
    };

    // 检查今天是否已签到
    if (userCheckin.checkins.includes(today)) {
      return res.json({
        success: true,
        data: {
          alreadyCheckedIn: true,
          message: '今天已经签到过了',
          streak: userCheckin.streak
        }
      });
    }

    // 添加今天的签到
    userCheckin.checkins.push(today);
    userCheckin.checkins.sort((a, b) => b.localeCompare(a));

    // 重新计算连续签到天数
    let streak = 0;
    let checkDate = new Date();

    for (let i = 0; i < userCheckin.checkins.length; i++) {
      const dateStr = checkDate.toISOString().split('T')[0];
      if (userCheckin.checkins.includes(dateStr)) {
        streak++;
        checkDate = new Date(checkDate.getTime() - 86400000);
      } else {
        break;
      }
    }

    userCheckin.streak = streak;
    checkinData.set(userId, userCheckin);

    console.log(`[Checkin] User ${userId} checked in. Streak: ${streak}`);

    res.json({
      success: true,
      data: {
        alreadyCheckedIn: false,
        message: '签到成功',
        streak,
        checkinDate: today
      }
    });
  } catch (error) {
    console.error('[Checkin Error]', error);
    res.status(500).json({
      success: false,
      error: error.message || '签到失败'
    });
  }
});

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ============ 聊天 Agent 功能 ============

// Agent 系统提示词（根据年级调整）
function getAgentSystemPrompt(gradeLevel) {
  const personas = {
    lower: `你是"小罐罐"，住在五彩罐头里的神奇小精灵！
- 说话像大哥哥大姐姐一样亲切可爱
- 用词简单精准，多用叠词（香香的、甜甜的）和拟声词（哗啦啦、叮咚）
- 语气超级活泼，像在讲有趣的小故事`,

    middle: `你是"小罐罐"，温暖有智慧的知心好友！
- 可以使用常见成语和优美的修辞
- 语言有画面感，让孩子能想象到场景
- 语气像死党一样贴心，有时调皮有时温柔`,

    upper: `你是"小罐罐"，和初中生有共同话题，值得信赖的挚友！
- 使用丰富的词汇和文学性表达
- 可以引用文学作品、哲理名言、社会热点
- 启发思考，但不说教，用问题引导反思`
  };

  return `${personas[gradeLevel] || personas.middle}

【核心能力】
1. 记忆用户的日记内容和心情变化，给予个性化回应
2. 按心情给予积极正向的反馈
3. 在回复中自然传递知识道理和教学素材（不说教）
4. 用趣味方式讲解知识点

【工具使用指南】
- saveMemory: 当用户分享重要的偏好、习惯或事件时，主动保存
- getMemories: 对话开始时或需要回忆用户信息时调用
- searchDiaries/getDiaryDetail: 当用户问及过去的日记或心情时使用
- getMaterial: 当回复需要引用诗词、名言、百科时使用，用「《标题》」格式标记
- explainConcept: 当用户问"为什么"或需要传递知识时使用

【回复风格】
- 每次回复控制在100字以内
- 要有温度，让孩子感受到被理解和关爱
- 适时给予真诚的鼓励，但不敷衍`;
}

// 6 个 Agent 工具定义
const agentTools = {
  // 静默工具 - 前端处理
  saveMemory: tool({
    description: '保存用户的重要记忆（偏好、习惯、重要事件、情绪状态）',
    parameters: z.object({
      type: z.enum(['preference', 'habit', 'event', 'emotion']),
      content: z.string().describe('记忆内容描述'),
      tags: z.array(z.string()).optional().describe('相关标签')
    })
    // execute 由前端 onToolCall 处理
  }),

  // 静默工具 - 前端处理
  getMemories: tool({
    description: '获取与当前对话相关的用户记忆',
    parameters: z.object({
      query: z.string().optional().describe('搜索关键词'),
      limit: z.number().default(5).describe('返回数量')
    })
    // execute 由前端 onToolCall 处理
  }),

  // 可见工具 - 前端处理
  searchDiaries: tool({
    description: '搜索用户的日记记录',
    parameters: z.object({
      keyword: z.string().optional().describe('搜索关键词'),
      mood: z.string().optional().describe('心情类型'),
      limit: z.number().default(5)
    })
    // execute 由前端 onToolCall 处理
  }),

  // 可见工具 - 前端处理
  getDiaryDetail: tool({
    description: '获取指定日期的日记详细内容',
    parameters: z.object({
      date: z.string().describe('日期 YYYY-MM-DD 格式')
    })
    // execute 由前端 onToolCall 处理
  }),

  // 可见工具 - 后端处理
  getMaterial: tool({
    description: '根据主题获取教学素材（诗词、名言、百科等）',
    parameters: z.object({
      topic: z.string().describe('素材主题或关键词'),
      category: z.enum(['literature', 'poetry', 'quote', 'news', 'encyclopedia']).optional()
    }),
    execute: async ({ topic, category }) => {
      try {
        const materials = await generateMaterials(category || 'quote', 'middle', 1);
        return materials[0] || { error: '未找到相关素材' };
      } catch (error) {
        return { error: '获取素材失败' };
      }
    }
  }),

  // 静默工具 - 后端处理
  explainConcept: tool({
    description: '用趣味方式讲解知识点，回答"为什么"类问题',
    parameters: z.object({
      question: z.string().describe('要解答的问题'),
      gradeLevel: z.enum(['lower', 'middle', 'upper']).default('middle')
    }),
    execute: async ({ question, gradeLevel }) => {
      try {
        const response = await openai.chat.completions.create({
          model: 'claude-sonnet-4@20250514',
          temperature: 0.9, // 增加随机性
          messages: [{
            role: 'system',
            content: `用${gradeLevel === 'lower' ? '最简单有趣' : '生动形象'}的方式，用50字以内解答问题。像朋友聊天一样，不要说教。每次回答都要用不同的比喻和例子。`
          }, {
            role: 'user',
            content: question
          }]
        });
        return { explanation: response.choices[0].message.content };
      } catch (error) {
        return { error: '解答失败' };
      }
    }
  })
};

// 聊天 API 路由 - 支持流式输出和工具调用
app.post('/api/chat', async (req, res) => {
  try {
    const { messages, gradeLevel = 'middle' } = req.body;

    console.log('[Chat API] Received messages:', messages.length, 'gradeLevel:', gradeLevel);

    const result = streamText({
      model: aiOpenai('claude-sonnet-4@20250514'),
      system: getAgentSystemPrompt(gradeLevel),
      messages,
      tools: agentTools,
      maxSteps: 5,
      // 增加随机性，让每次回答都不同
      temperature: 0.8,
      // 工具调用配置
      toolChoice: 'auto',
      // 流式输出时的回调
      onChunk: ({ chunk }) => {
        if (chunk.type === 'text-delta') {
          // 文本流式输出
        }
      }
    });

    // 使用 pipeDataStreamToResponse 支持工具调用的流式输出
    // 这会发送包含 text-delta, tool-call, tool-result 等事件的数据流
    result.pipeDataStreamToResponse(res, {
      // 发送工具调用和结果
      sendReasoning: true
    });
  } catch (error) {
    console.error('[Chat API Error]', error);
    res.status(500).json({ error: error.message });
  }
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`[启动] 罐头日记后端服务已启动: http://localhost:${PORT}`);
  console.log(`[素材] 素材API: GET /api/materials?category=literature&gradeLevel=middle&page=1&pageSize=10`);
});
