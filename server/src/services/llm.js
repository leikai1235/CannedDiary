import OpenAI from 'openai';
import { createOpenAI } from '@ai-sdk/openai';
import { GRADE_PROMPTS, CATEGORY_PROMPTS, CATEGORY_NAMES } from '../config/prompts.js';
import { parseJSONResponse } from '../utils/parseJSON.js';

// 惰性初始化的客户端实例
let _openai = null;
let _aiOpenai = null;

// 环境变量 getter
export const getAIModel = () => process.env.AI_MODEL || 'claude-sonnet-4@20250514';
export const getUseJsonSchema = () => process.env.USE_JSON_SCHEMA !== 'false';

// LiteLLM 代理配置（惰性初始化）
export function getOpenAI() {
  if (!_openai) {
    _openai = new OpenAI({
      apiKey: process.env.LITELLM_API_KEY,
      baseURL: process.env.LITELLM_PROXY_URL
    });
  }
  return _openai;
}

// AI SDK OpenAI 客户端（惰性初始化）
export function getAiOpenai() {
  if (!_aiOpenai) {
    _aiOpenai = createOpenAI({
      apiKey: process.env.LITELLM_API_KEY,
      baseURL: process.env.LITELLM_PROXY_URL,
      compatibility: 'compatible'
    });
  }
  return _aiOpenai;
}

// AI 生成素材
export async function generateMaterials(category, gradeLevel, count = 6) {
  const AI_MODEL = getAIModel();
  const USE_JSON_SCHEMA = getUseJsonSchema();
  const openai = getOpenAI();

  const gradePrompt = GRADE_PROMPTS[gradeLevel] || GRADE_PROMPTS.middle;
  const categoryPrompt = CATEGORY_PROMPTS[category] || CATEGORY_PROMPTS.literature;
  const categoryName = CATEGORY_NAMES[category] || '文学';

  // JSON 格式要求（用于不支持 response_format 的 LLM）- 放在 system prompt 最开头
  const materialsJsonSystemPrefix = USE_JSON_SCHEMA ? '' : `【最重要的规则 - 必须严格遵守】
你是一个 JSON API，只能返回 JSON 格式的响应，绝对不能返回任何其他格式的文本。
你的每一次回复都必须是一个有效的 JSON 对象，不能有任何额外的文字、问候语或解释。

你必须返回的 JSON 格式：
{
  "materials": [
    {
      "title": "标题",
      "content": "内容",
      "pinyin": "拼音",
      "author": "作者",
      "dynasty": "朝代",
      "interpretation": "释义",
      "background": "背景",
      "usage": "用法"
    }
  ]
}

【格式注意事项】
- 只返回 JSON，不要有任何开场白或结束语
- 字符串内如需使用双引号，请用中文引号「」或『』代替
- 确保 JSON 格式正确，所有字段都必须存在

---

`;

  try {
    const requestParams = {
      model: AI_MODEL,
      messages: [
        {
          role: 'system',
          content: `${materialsJsonSystemPrefix}你是一个专业的语文教育专家。

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
- usage: 写作应用/用法提示（实用具体）${USE_JSON_SCHEMA ? '' : '\n\n【再次提醒】只返回 JSON 格式，不要有任何其他文字。直接以 { 开头。'}`
        }
      ]
    };

    // 只有支持 JSON Schema 的 LLM 才添加 response_format
    if (USE_JSON_SCHEMA) {
      requestParams.response_format = {
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
      };
    }

    const response = await openai.chat.completions.create(requestParams);

    const textOutput = response.choices[0].message.content;
    if (!textOutput) {
      throw new Error('LLM 返回空响应');
    }
    const parsed = parseJSONResponse(textOutput);

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

// 打印启动配置
export function printConfig() {
  console.log('[配置] AI_MODEL:', getAIModel());
  console.log('[配置] USE_JSON_SCHEMA:', getUseJsonSchema());
  console.log('[配置] LITELLM_PROXY_URL:', process.env.LITELLM_PROXY_URL || '未设置');
}
