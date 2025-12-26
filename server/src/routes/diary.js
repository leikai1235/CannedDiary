import { Router } from 'express';
import { getOpenAI, getAIModel, getUseJsonSchema } from '../services/llm.js';
import { generateDiaryImage } from '../services/imageGen.js';
import { GRADE_PERSONAS, MATERIAL_MATCHING_GUIDE } from '../config/prompts.js';
import { MOOD_LABELS, WEATHER_LABELS } from '../config/constants.js';
import { parseJSONResponse } from '../utils/parseJSON.js';

const router = Router();

// 日记反馈 API
router.post('/', async (req, res) => {
  try {
    const { content, gradeLevel = 'middle', mood, weather } = req.body;

    if (!content) {
      return res.status(400).json({ success: false, error: '日记内容不能为空' });
    }

    const AI_MODEL = getAIModel();
    const USE_JSON_SCHEMA = getUseJsonSchema();
    const openai = getOpenAI();

    console.log('[Diary Feedback] gradeLevel:', gradeLevel, 'mood:', mood, 'weather:', weather);
    console.log('[Diary Feedback] USE_JSON_SCHEMA:', USE_JSON_SCHEMA);
    console.log('[Diary Feedback] AI_MODEL:', AI_MODEL);

    const gradePersona = GRADE_PERSONAS[gradeLevel] || GRADE_PERSONAS.middle;
    const moodLabel = mood ? MOOD_LABELS[mood] || mood : "";
    const weatherLabel = weather ? WEATHER_LABELS[weather] || weather : "";

    const userContext = [
      mood ? `孩子选择的心情是：${moodLabel}` : "",
      weather ? `孩子选择的天气是：${weatherLabel}` : ""
    ].filter(Boolean).join("\n");

    // JSON 格式要求（用于不支持 response_format 的 LLM）- 放在 system prompt 最开头
    const diaryJsonSystemPrefix = USE_JSON_SCHEMA ? '' : `【最重要的规则 - 必须严格遵守】
你是一个 JSON API，只能返回 JSON 格式的响应，绝对不能返回任何其他格式的文本。
你的每一次回复都必须是一个有效的 JSON 对象，不能有任何额外的文字、问候语或解释。

你必须返回的 JSON 格式：
{
  "emotion_response": "回信内容（三段，用\\n分隔）",
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
  },
  "summary": "一句话总结",
  "predicted_mood": "happy 或 calm 或 sad 或其他心情",
  "predicted_weather": "sunny 或 cloudy 或其他天气"
}

【格式注意事项】
- 只返回 JSON，不要有任何开场白或结束语
- 字符串内如需使用双引号，请用中文引号「」或『』代替
- 确保 JSON 格式正确，所有字段都必须存在

---

`;

    const diaryRequestParams = {
      model: AI_MODEL,
      messages: [
        {
          role: "system",
          content: `${diaryJsonSystemPrefix}你是"小罐罐"，一个住在五彩罐头里的神奇小精灵！你最喜欢听小朋友讲故事，每次读完日记都会写一封特别的回信。

${gradePersona}

${MATERIAL_MATCHING_GUIDE}

【核心要求：素材必须与日记内容、心情、天气三者强关联】
推荐的素材必须按以下优先级进行匹配：

1.第一优先级：日记核心内容提取
  a.核心逻辑：首先，必须深度理解日记文本本身，提取其核心主题、关键意象与情感倾向。
  b.操作：分析日记中描述的具体事件、物体、人物关系或直接抒发的感想，将其作为匹配的首要和决定性依据。
  c.示例：日记写"种下一颗向日葵种子，期待它发芽"，核心主题是"生长与希望"，而非一个笼统的"开心"心情标签。

2.第二优先级：内容与经典素材直接关联
  a.核心逻辑：优先寻找与日记核心内容直接相关的素材（如相同事物、相似经历、共同哲理）。
  b.示例：上述"种向日葵"日记，直接匹配包含"向阳"、"新生"、"成长"意象的诗词或名言（如"葵藿倾太阳，物性固莫夺"）。

3.第三优先级（补充）：心情与天气的辅助校验
  a.核心逻辑：仅在无法从日记内容中提取有效关键词，或内容非常简略时，才将预设的"心情"和"天气"标签作为辅助线索。
  b.作用：此时，心情和天气主要起到缩小素材范围、调整语气基调的辅助作用，而非主要匹配依据。

【回信结构要求】
你的回信必须包含以下三个部分，用换行符分隔：

第一段：基于内容的深度共情 (约40字)
用第一人称回应日记中的具体内容和情感焦点：
- 完全从日记文本细节出发进行回应，让孩子感受到你真的在认真读。
- 写法："你提到[引用日记中的原话或概括独特细节]这部分描述真生动/让我印象深刻。"
- 避免直接复述"看到你选了'开心'心情"这类话，而是通过解读文本来隐含情感。

第二段：素材引荐与内容联结 (约100字)
焦点：解释素材与日记内容本身的关联，自然地引出一个与日记内容相关的素材。
- 用「《素材标题》」的格式标记素材名称（注意：外层用「」包裹，内层用书名号《》），这会变成可点击的超链接，点击可跳转到素材详情页
- 写法："你记录的这段经历，让我联想到「《江雪》」这首诗。作者在文中也描绘了类似的[场景/情感/思考]，比如他写道……[提及素材中相关点]……。"
- 如果动用了心情/天气辅助，可轻描淡写地补充："而今天的[天气]，更让这份[情感]多了几分身临其境的意味。"

第三段：鼓励与延伸启发 (约30字)
焦点：将鼓励落在记录行为与观察力本身。
- 写法："你观察/思考/记录的角度非常独特。保持这份细腻的感受力，它会让你的世界和笔下的文字都更加丰富。期待你的下一次分享。"

【重要提醒】
- 推荐的素材必须是真实存在的作品，不要编造
- 全文不能有错别字和病句，且必须符合标点符号的使用规范
- 素材内容必须与日记主题内容强关联、心情和天气简单关联
- 回信要有温度，让孩子感受到被理解和关爱`
        },
        {
          role: "user",
          content: `${userContext ? userContext + "\n\n" : ""}小朋友的日记内容：
"${content}"

请仔细阅读这篇日记，结合孩子的主题和内容，理解孩子想表达的情感和经历，然后写一封贴心的回信。记住：推荐的素材必须与日记主题内容强关联、心情和天气简单关联！${USE_JSON_SCHEMA ? '' : '\n\n【再次提醒】只返回 JSON 格式，不要有任何其他文字。直接以 { 开头。'}`
        }
      ]
    };

    // 只有支持 JSON Schema 的 LLM 才添加 response_format
    if (USE_JSON_SCHEMA) {
      diaryRequestParams.response_format = {
        type: "json_schema",
        json_schema: {
          name: "diary_feedback",
          strict: true,
          schema: {
            type: "object",
            properties: {
              emotion_response: {
                type: "string",
                description: "完整的回信内容，包含三个段落，用换行符分隔"
              },
              material: {
                type: "object",
                description: "与日记内容强相关的素材",
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
              },
              summary: { type: "string", description: "用一句话总结这篇日记的核心情感" },
              predicted_mood: {
                type: "string",
                enum: ["happy", "calm", "sad", "angry", "excited", "fulfilled", "tired", "confused", "warm", "lonely"]
              },
              predicted_weather: {
                type: "string",
                enum: ["sunny", "cloudy", "overcast", "lightRain", "heavyRain", "snowy", "windy", "foggy"]
              }
            },
            required: ["emotion_response", "material", "summary", "predicted_mood", "predicted_weather"],
            additionalProperties: false
          }
        }
      };
    }

    // 调试：打印请求参数
    console.log('[Diary Feedback] 请求参数 response_format:', diaryRequestParams.response_format ? 'YES (使用 JSON Schema)' : 'NO (纯 prompt 约束)');

    const response = await openai.chat.completions.create(diaryRequestParams);

    const textOutput = response.choices[0].message.content;
    if (!textOutput) {
      throw new Error('LLM 返回空响应');
    }
    console.log('[Diary Feedback] 原始响应长度:', textOutput.length, '字符');
    console.log('[Diary Feedback] 原始响应前200字符:', textOutput.substring(0, 200));
    const result = parseJSONResponse(textOutput);

    // 为素材添加ID
    if (result.material) {
      if (typeof result.material === "string") {
        try { result.material = JSON.parse(result.material); } catch {}
      }
      if (typeof result.material === "object" && result.material !== null) {
        result.material.id = `ai-${Date.now()}`;
      }
    }

    // 异步生成配图（不阻塞主流程）
    let generatedImage = null;
    try {
      console.log('[Diary Feedback] 开始生成配图...');
      const imageResult = await generateDiaryImage(
        content,
        mood || result.predicted_mood,
        weather || result.predicted_weather,
        gradeLevel
      );
      generatedImage = imageResult.imageUrl;
      console.log('[Diary Feedback] 配图生成完成');
    } catch (imageError) {
      console.error('[Diary Feedback] 配图生成失败:', imageError.message);
      // 图片生成失败不影响主流程
    }

    console.log('[Diary Feedback] Success');
    res.json({
      success: true,
      data: {
        ...result,
        generatedImage // 添加生成的图片 URL
      }
    });
  } catch (error) {
    console.error('[Diary Feedback Error]', error);
    res.status(500).json({ success: false, error: error.message || '获取日记反馈失败' });
  }
});

export default router;
