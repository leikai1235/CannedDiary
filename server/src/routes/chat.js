import { Router } from 'express';
import { streamText, tool } from 'ai';
import { z } from 'zod';
import { getAiOpenai, getAIModel, generateMaterials, getOpenAI } from '../services/llm.js';
import { getAgentSystemPrompt } from '../config/prompts.js';

const router = Router();

// 创建 Agent 工具（惰性初始化）
function createAgentTools() {
  const AI_MODEL = getAIModel();
  const openai = getOpenAI();

  return {
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
            model: AI_MODEL,
            temperature: 0.9,
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
}

// 聊天 API 路由 - 支持流式输出和工具调用
router.post('/', async (req, res) => {
  try {
    const { messages, gradeLevel = 'middle' } = req.body;

    console.log('[Chat API] Received messages:', messages.length, 'gradeLevel:', gradeLevel);

    const AI_MODEL = getAIModel();
    const aiOpenai = getAiOpenai();
    const agentTools = createAgentTools();

    const result = streamText({
      model: aiOpenai(AI_MODEL),
      system: getAgentSystemPrompt(gradeLevel),
      messages,
      tools: agentTools,
      maxSteps: 5,
      temperature: 0.8,
      toolChoice: 'auto',
      onChunk: ({ chunk }) => {
        if (chunk.type === 'text-delta') {
          // 文本流式输出
        }
      }
    });

    // 使用 pipeDataStreamToResponse 支持工具调用的流式输出
    result.pipeDataStreamToResponse(res, {
      sendReasoning: true
    });
  } catch (error) {
    console.error('[Chat API Error]', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
