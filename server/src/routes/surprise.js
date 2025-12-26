import { Router } from 'express';
import { getOpenAI, getAIModel, getUseJsonSchema } from '../services/llm.js';
import { generateSurpriseImage } from '../services/imageGen.js';
import { GRADE_PERSONAS, SURPRISE_TYPES } from '../config/prompts.js';
import { parseJSONResponse } from '../utils/parseJSON.js';

const router = Router();

// 每日惊喜 API
router.post('/', async (req, res) => {
  try {
    const { gradeLevel = 'middle' } = req.body;

    const AI_MODEL = getAIModel();
    const USE_JSON_SCHEMA = getUseJsonSchema();
    const openai = getOpenAI();

    console.log('[Daily Surprise] gradeLevel:', gradeLevel);

    const gradePersona = GRADE_PERSONAS[gradeLevel] || GRADE_PERSONAS.middle;

    // JSON 格式要求（用于不支持 response_format 的 LLM）- 放在 system prompt 最开头
    const surpriseJsonSystemPrefix = USE_JSON_SCHEMA ? '' : `【最重要的规则 - 必须严格遵守】
你是一个 JSON API，只能返回 JSON 格式的响应，绝对不能返回任何其他格式的文本。
你的每一次回复都必须是一个有效的 JSON 对象，不能有任何额外的文字、问候语或解释。

你必须返回的 JSON 格式：
{
  "title": "惊喜标题（5-8字）",
  "teaser": "神秘诱人的预告语（15-25字）",
  "fullContent": "完整的惊喜内容（100-200字）",
  "type": "challenge 或 fun-fact 或 creative-prompt",
  "material": {
    "type": "literature 或 poetry 或 quote 或 news 或 encyclopedia",
    "title": "素材标题",
    "content": "素材内容",
    "pinyin": "拼音",
    "author": "作者",
    "dynasty": "朝代",
    "interpretation": "释义",
    "background": "背景",
    "usage": "用法"
  }
}

【格式注意事项】
- 只返回 JSON，不要有任何开场白或结束语
- 字符串内如需使用双引号，请用中文引号「」或『』代替
- 确保 JSON 格式正确，所有字段都必须存在

---

`;

    const surpriseRequestParams = {
      model: AI_MODEL,
      messages: [
        {
          role: "system",
          content: `${surpriseJsonSystemPrefix}你是"小罐罐"，今天要给没有写日记的小朋友准备一个特别的"惊喜罐头"！

${gradePersona}

【适合的惊喜类型】
${SURPRISE_TYPES[gradeLevel]}

【核心要求：内容必须与素材强关联】
你生成的 fullContent 必须直接引用和讲解 material 中的素材内容！不能是两个独立的部分。

【惊喜内容结构 - fullContent 必须包含两部分】

第一部分 - 温暖开场（约20-40字）：
- 用亲切的语气和孩子打招呼
- 引出今天的惊喜主题
- 激发孩子的好奇心和兴趣

第二部分 - 素材教学（约80-120字）：
- 直接引用素材内容，用「素材标题」的格式标记，这个标记会变成可点击的链接
- 讲解素材的含义、背景故事或有趣知识点
- 教孩子如何在写作中运用这个素材
- 可以给出一个小练习或思考题

【示例格式】
"小朋友你好呀！今天小罐罐要给你讲一个特别有趣的故事哦！

你知道「小蝌蚪找妈妈」吗？这个故事讲的是一群可爱的小蝌蚪，它们有着大大的脑袋和长长的尾巴，在池塘里快活地游来游去。它们一直在寻找自己的妈妈，最后发现妈妈原来是一只大青蛙！这个故事告诉我们，成长的过程中我们会不断变化。你能试着用'大大的''长长的'这样的叠词来描写一个小动物吗？"

【重要提醒】
- fullContent 中必须用「素材标题」的格式引用素材，让用户可以点击查看详情
- 素材必须是真实存在的作品，不要编造
- 内容要有实际的教学价值，不能只是空洞的鼓励
- 教学部分要具体，比如教写作技巧、修辞手法、好词好句等`
        },
        {
          role: "user",
          content: `请为今天没有写日记的小朋友准备一个充满惊喜的互动内容！要有创意，要好玩，还要能启发写作灵感！记住：内容必须直接引用和讲解素材！${USE_JSON_SCHEMA ? '' : '\n\n【再次提醒】只返回 JSON 格式，不要有任何其他文字。直接以 { 开头。'}`
        }
      ]
    };

    // 只有支持 JSON Schema 的 LLM 才添加 response_format
    if (USE_JSON_SCHEMA) {
      surpriseRequestParams.response_format = {
        type: "json_schema",
        json_schema: {
          name: "daily_surprise",
          strict: true,
          schema: {
            type: "object",
            properties: {
              title: { type: "string", description: "惊喜标题（5-8字）" },
              teaser: { type: "string", description: "神秘诱人的预告语（15-25字）" },
              fullContent: { type: "string", description: "完整的惊喜内容（100-200字）" },
              type: { type: "string", enum: ["challenge", "fun-fact", "creative-prompt"] },
              material: {
                type: "object",
                properties: {
                  type: { type: "string", enum: ["literature", "poetry", "quote", "news", "encyclopedia"] },
                  title: { type: "string" },
                  content: { type: "string" },
                  pinyin: { type: "string" },
                  author: { type: "string" },
                  dynasty: { type: "string" },
                  interpretation: { type: "string" },
                  background: { type: "string" },
                  usage: { type: "string" }
                },
                required: ["type", "title", "content", "pinyin", "author", "dynasty", "interpretation", "background", "usage"],
                additionalProperties: false
              }
            },
            required: ["title", "teaser", "fullContent", "type", "material"],
            additionalProperties: false
          }
        }
      };
    }

    const response = await openai.chat.completions.create(surpriseRequestParams);

    const textOutput = response.choices[0].message.content;
    if (!textOutput) {
      throw new Error('LLM 返回空响应');
    }
    console.log('[Daily Surprise] 原始响应长度:', textOutput.length, '字符');
    const result = parseJSONResponse(textOutput);

    // 为素材添加ID
    if (result.material) {
      result.material.id = `surprise-material-${Date.now()}`;
    }

    // 异步生成配图（不阻塞主流程）
    let generatedImage = null;
    try {
      console.log('[Daily Surprise] 开始生成配图...');
      const imageResult = await generateSurpriseImage(
        result,
        result.material,
        gradeLevel
      );
      generatedImage = imageResult.imageUrl;
      console.log('[Daily Surprise] 配图生成完成');
    } catch (imageError) {
      console.error('[Daily Surprise] 配图生成失败:', imageError.message);
      // 图片生成失败不影响主流程
    }

    const surprise = {
      ...result,
      id: Date.now().toString(),
      generatedImage // 添加生成的图片 URL
    };

    console.log('[Daily Surprise] Success');
    res.json({ success: true, data: surprise });
  } catch (error) {
    console.error('[Daily Surprise Error]', error);
    res.status(500).json({ success: false, error: error.message || '获取每日惊喜失败' });
  }
});

export default router;
