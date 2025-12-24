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
const AI_MODEL = process.env.AI_MODEL || 'claude-sonnet-4@20250514';

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
      model: AI_MODEL,
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

// ============ 日记反馈 API ============

// 年级适配人设提示词
const GRADE_PERSONAS = {
  lower: `【小罐罐的人设 - 低年级版(1-3年级)】
你是一个活泼可爱的角色，说话像大哥哥大姐姐一样亲切！
- 用词简单精准，符合1-3年级词汇认知水平。
- 多用叠词（香香的、甜甜的、美美的）和拟声词（哗啦啦、叮咚叮咚）
- 语气超级活泼，像在讲有趣的小故事
- 推荐的素材要有拼音，素材内容符合1-3年级推荐的教学内容，用有趣的方式引出素材内容。
- 多用感叹号和问号，增加互动感。
- 可以加入简单的比喻，比如"像棉花糖一样软软的"`,

  middle: `【小罐罐的人设 - 中年级版(4-6年级)】
你是一个知心的好朋友，温暖又有智慧！
- 可以使用常见成语和优美的修辞
- 语言有画面感，让孩子能想象到场景
- 推荐经典古诗词时，用有趣的方式引出
- 语气像死党一样贴心，有时调皮有时温柔
- 鼓励孩子表达自己的感受，给予真诚的认可
- 在回复中自然融入一些写作小技巧`,

  upper: `【小罐罐的人设 - 高年级版(初中)】
你是一个和初中生有共同话题，值得信赖的挚友，成熟又有深度！
- 使用丰富的词汇和文学性表达
- 可以引用深刻的文学作品、哲理名言、了解当今社会热点。
- 语气平等尊重，像朋友间的深度对话
- 启发思考，但不说教，用问题引导反思
- 推荐的素材要有思想深度，能引发共鸣
- 回复有层次感，从共情到升华`
};

// 素材匹配指南
const MATERIAL_MATCHING_GUIDE = `
【素材推荐原则 - 必须与日记内容强关联】
推荐的素材必须按以下优先级进行匹配：

1. 主题关联：素材主题必须与日记内容有直接联系
   - 写自然风景 → 推荐描写自然的诗词或文学片段
   - 写人际关系 → 推荐关于友情、亲情的名言或故事
   - 写学习生活 → 推荐励志、勤奋类的素材
   - 写季节天气 → 推荐应季的古诗词

2. 场景呼应：根据日记描述的具体场景选择素材
   - 下雪了 → 《江雪》《咏雪》等
   - 赏月亮 → 《静夜思》《水调歌头》等
   - 看日出 → 《望岳》或相关散文
   - 春游踏青 → 《春晓》《咏柳》等

3. 情感共鸣：素材必须与日记中表达的情感相呼应
   - 开心/兴奋 → 推荐欢快、积极向上的素材
   - 难过/委屈 → 推荐治愈系、鼓励类的素材
   - 思考/迷茫 → 推荐有哲理、启发性的素材
`;

// 健壮的 JSON 解析函数，处理 LLM 返回的各种格式问题
function parseJSONResponse(text) {
  if (!text || typeof text !== 'string') {
    throw new Error('响应内容为空或格式错误');
  }

  let trimmed = text.trim();

  // 0. 预处理：将中文引号替换为转义的 ASCII 双引号
  // 中文左双引号 " (U+201C) 和右双引号 " (U+201D)
  trimmed = trimmed.replace(/[""]/g, '\\"');

  // 1. 先尝试直接解析（理想情况）
  try {
    return JSON.parse(trimmed);
  } catch (directError) {
    console.log('[JSON Parse] 直接解析失败，尝试修复...');
  }

  // 2. 尝试修复字符串值中未转义的 ASCII 双引号
  let fixed = trimmed;
  try {
    let inString = false;
    let escapeNext = false;
    let result = '';

    for (let i = 0; i < trimmed.length; i++) {
      const char = trimmed[i];
      const charCode = char.charCodeAt(0);

      if (escapeNext) {
        result += char;
        escapeNext = false;
        continue;
      }

      if (char === '\\') {
        result += char;
        escapeNext = true;
        continue;
      }

      if (char === '"') {
        if (inString) {
          // 在字符串值内，检查这个引号是否是字符串结束
          // 查看后面的字符（跳过所有空白字符，包括换行符！）
          let lookAhead = i + 1;
          while (lookAhead < trimmed.length && /\s/.test(trimmed[lookAhead])) {
            lookAhead++;
          }

          const nextNonSpace = lookAhead < trimmed.length ? trimmed[lookAhead] : '';

          // 如果后面跟着逗号、}、]，说明是字符串结束
          // 注意：不包括冒号，因为冒号前面应该是键名，不是值
          if (nextNonSpace === ',' || nextNonSpace === '}' || nextNonSpace === ']') {
            inString = false;
            result += char;
          } else if (nextNonSpace === '"') {
            // 如果后面紧跟另一个引号，当前引号是字符串结束
            // 这处理 "value"" 这种多余引号的情况
            inString = false;
            result += char;
          } else {
            // 字符串值内的引号，需要转义
            result += '\\"';
          }
        } else {
          // 不在字符串内，检查是否是字符串开始
          // 查看前面的字符（跳过所有空白字符）
          let lookBack = i - 1;
          while (lookBack >= 0 && /\s/.test(trimmed[lookBack])) {
            lookBack--;
          }

          const prevNonSpace = lookBack >= 0 ? trimmed[lookBack] : '';

          // 如果前面是冒号、逗号、[、{，说明是字符串开始
          if (prevNonSpace === ':' || prevNonSpace === ',' || prevNonSpace === '[' || prevNonSpace === '{') {
            inString = true;
            result += char;
          } else if (prevNonSpace === '"') {
            // 如果前面是引号，这可能是多余的引号，跳过
            // 这处理 ""value" 这种情况
            continue;
          } else {
            result += char;
          }
        }
      } else {
        // 处理控制字符：在字符串值内，将未转义的控制字符转义
        if (inString && charCode < 32 && charCode !== 9) {
          if (charCode === 10) {
            result += '\\n';
          } else if (charCode === 13) {
            result += '\\r';
          } else {
            result += '\\u' + ('0000' + charCode.toString(16)).slice(-4);
          }
        } else {
          result += char;
        }
      }
    }

    fixed = result;
  } catch (e) {
    console.warn('[JSON Parse] 修复过程出错:', e.message);
    fixed = trimmed;
  }

  // 3. 尝试解析修复后的版本
  try {
    const parsed = JSON.parse(fixed);
    console.log('[JSON Parse] ✅ 成功修复并解析 JSON');
    return parsed;
  } catch (e) {
    console.warn('[JSON Parse] 修复后仍无法解析:', e.message);
  }

  // 4. 尝试从 markdown 代码块中提取 JSON
  const codeBlockMatch = text.trim().match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    try {
      return JSON.parse(codeBlockMatch[1].trim());
    } catch (e) {
      // 继续尝试
    }
  }

  // 5. 尝试提取第一个完整的 JSON 对象
  const jsonMatch = text.trim().match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[0]);
    } catch (e) {
      // 对提取的 JSON 也尝试修复中文引号
      try {
        const fixedExtract = jsonMatch[0].replace(/[""]/g, '\\"');
        return JSON.parse(fixedExtract);
      } catch (e2) {
        // 继续尝试
      }
    }
  }

  // 6. 所有方法都失败
  console.error('[JSON Parse Error] 无法解析响应为 JSON');
  console.error('[原始响应]', text.trim().substring(0, 500));
  throw new Error(`LLM 返回的响应不是有效的 JSON 格式。响应长度: ${text.trim().length} 字符`);
}

// 心情中文映射
const MOOD_LABELS = {
  happy: "开心", calm: "平静", sad: "难过", angry: "生气",
  excited: "惊喜", fulfilled: "充实", tired: "累", confused: "迷茫",
  warm: "暖心", lonely: "孤独", smitten: "动心", annoyed: "烦",
  lucky: "幸运", pouty: "委屈", sweet: "甜蜜"
};

// 天气中文映射
const WEATHER_LABELS = {
  sunny: "晴天", cloudy: "多云", overcast: "阴天", lightRain: "小雨",
  heavyRain: "大雨", thunderstorm: "雷雨", snowy: "下雪", windy: "有风", foggy: "有雾"
};

// 日记反馈 API
app.post('/api/diary-feedback', async (req, res) => {
  try {
    const { content, gradeLevel = 'middle', mood, weather } = req.body;

    if (!content) {
      return res.status(400).json({ success: false, error: '日记内容不能为空' });
    }

    console.log('[Diary Feedback] gradeLevel:', gradeLevel, 'mood:', mood, 'weather:', weather);

    const gradePersona = GRADE_PERSONAS[gradeLevel] || GRADE_PERSONAS.middle;
    const moodLabel = mood ? MOOD_LABELS[mood] || mood : "";
    const weatherLabel = weather ? WEATHER_LABELS[weather] || weather : "";

    const userContext = [
      mood ? `孩子选择的心情是：${moodLabel}` : "",
      weather ? `孩子选择的天气是：${weatherLabel}` : ""
    ].filter(Boolean).join("\n");

    const response = await openai.chat.completions.create({
      model: AI_MODEL,
      messages: [
        {
          role: "system",
          content: `你是"小罐罐"，一个住在五彩罐头里的神奇小精灵！你最喜欢听小朋友讲故事，每次读完日记都会写一封特别的回信。

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

请仔细阅读这篇日记，结合孩子的主题和内容，理解孩子想表达的情感和经历，然后写一封贴心的回信。记住：推荐的素材必须与日记主题内容强关联、心情和天气简单关联！`
        }
      ],
      response_format: {
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
      }
    });

    const textOutput = response.choices[0].message.content;
    if (!textOutput) {
      throw new Error('LLM 返回空响应');
    }
    console.log('[Diary Feedback] 原始响应长度:', textOutput.length, '字符');
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

    console.log('[Diary Feedback] Success');
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('[Diary Feedback Error]', error);
    res.status(500).json({ success: false, error: error.message || '获取日记反馈失败' });
  }
});

// ============ 每日惊喜 API ============

app.post('/api/daily-surprise', async (req, res) => {
  try {
    const { gradeLevel = 'middle' } = req.body;

    console.log('[Daily Surprise] gradeLevel:', gradeLevel);

    const gradePersona = GRADE_PERSONAS[gradeLevel] || GRADE_PERSONAS.middle;

    const surpriseTypes = {
      lower: "创意写作小挑战、有趣的动物百科、简单的古诗儿歌",
      middle: "写作灵感挑战、经典古诗词赏析、有趣的科学知识、名人小故事",
      upper: "深度写作话题、哲理诗词品鉴、时事热点思考、文学名著片段"
    };

    const response = await openai.chat.completions.create({
      model: AI_MODEL,
      messages: [
        {
          role: "system",
          content: `你是"小罐罐"，今天要给没有写日记的小朋友准备一个特别的"惊喜罐头"！

${gradePersona}

【适合的惊喜类型】
${surpriseTypes[gradeLevel]}

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
          content: "请为今天没有写日记的小朋友准备一个充满惊喜的互动内容！要有创意，要好玩，还要能启发写作灵感！记住：内容必须直接引用和讲解素材！"
        }
      ],
      response_format: {
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
      }
    });

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

    const surprise = { ...result, id: Date.now().toString() };

    console.log('[Daily Surprise] Success');
    res.json({ success: true, data: surprise });
  } catch (error) {
    console.error('[Daily Surprise Error]', error);
    res.status(500).json({ success: false, error: error.message || '获取每日惊喜失败' });
  }
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
          model: AI_MODEL,
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
      model: aiOpenai(AI_MODEL),
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
