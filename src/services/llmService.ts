import OpenAI from "openai";
import {
  AIFeedback,
  SurpriseContent,
  GradeLevel,
  MaterialCategory,
  Material,
  Mood,
  Weather,
} from "../types";

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_LITELLM_API_KEY,
  baseURL: import.meta.env.VITE_LITELLM_PROXY_URL,
  dangerouslyAllowBrowser: true,
});

// 年级适配提示词 - 更详细的人设和语言风格
const GRADE_PERSONAS: Record<GradeLevel, string> = {
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
- 回复有层次感，从共情到升华`,
};

// 素材类型与日记内容的匹配指南
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

// Mood 类型映射（API返回值 → 完整Mood类型）
const MOOD_MAP: Record<string, Mood> = {
  happy: "happy",
  calm: "calm",
  sad: "sad",
  angry: "angry",
  excited: "excited",
  fulfilled: "fulfilled",
  tired: "tired",
  confused: "confused",
  warm: "warm",
  lonely: "lonely",
};

// Weather 类型映射
const WEATHER_MAP: Record<string, Weather> = {
  sunny: "sunny",
  cloudy: "cloudy",
  overcast: "overcast",
  lightRain: "lightRain",
  heavyRain: "heavyRain",
  snowy: "snowy",
  windy: "windy",
  foggy: "foggy",
};

// 心情中文映射
const MOOD_LABELS: Record<string, string> = {
  happy: "开心",
  calm: "平静",
  sad: "难过",
  angry: "生气",
  excited: "惊喜",
  fulfilled: "充实",
  tired: "累",
  confused: "迷茫",
  warm: "暖心",
  lonely: "孤独",
  smitten: "动心",
  annoyed: "烦",
  lucky: "幸运",
  pouty: "委屈",
  sweet: "甜蜜",
};

// 天气中文映射
const WEATHER_LABELS: Record<string, string> = {
  sunny: "晴天",
  cloudy: "多云",
  overcast: "阴天",
  lightRain: "小雨",
  heavyRain: "大雨",
  thunderstorm: "雷雨",
  snowy: "下雪",
  windy: "有风",
  foggy: "有雾",
};

export async function getDiaryFeedback(
  content: string,
  gradeLevel: GradeLevel = "middle",
  mood?: Mood,
  weather?: Weather
): Promise<AIFeedback> {
  try {
    const gradePersona = GRADE_PERSONAS[gradeLevel];

    // 构建用户上下文信息
    const moodLabel = mood ? MOOD_LABELS[mood] || mood : "";
    const weatherLabel = weather ? WEATHER_LABELS[weather] || weather : "";

    const userContext = [
      mood ? `孩子选择的心情是：${moodLabel}` : "",
      weather ? `孩子选择的天气是：${weatherLabel}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    const response = await openai.chat.completions.create({
      model: "claude-sonnet-4@20250514",
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
- 回信要有温度，让孩子感受到被理解和关爱`,
        },
        {
          role: "user",
          content: `${userContext ? userContext + "\n\n" : ""}小朋友的日记内容：
"${content}"

请仔细阅读这篇日记，结合孩子的主题和内容，理解孩子想表达的情感和经历，然后写一封贴心的回信。记住：推荐的素材必须与日记主题内容强关联、心情和天气简单关联！`,
        },
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
                description: "完整的回信内容，包含三个段落，用换行符分隔",
              },
              material: {
                type: "object",
                description: "与日记内容强相关的素材",
                properties: {
                  type: {
                    type: "string",
                    enum: [
                      "literature",
                      "poetry",
                      "quote",
                      "news",
                      "encyclopedia",
                    ],
                    description:
                      "素材类型：literature文学常识、poetry诗词成语、quote名人名言、news时事热点、encyclopedia人文百科",
                  },
                  title: {
                    type: "string",
                    description:
                      "素材标题，与回信中「《》」内的标题一致（不含书名号）",
                  },
                  content: { type: "string", description: "素材原文/完整内容" },
                  pinyin: {
                    type: "string",
                    description: "拼音标注（低年级必须有，其他情况按需提供）",
                  },
                  author: { type: "string", description: "作者/出处" },
                  dynasty: {
                    type: "string",
                    description: "朝代/时期（诗词成语和古代文学常识必须提供）",
                  },
                  interpretation: {
                    type: "string",
                    description: "现代白话文解释/赏析",
                  },
                  background: {
                    type: "string",
                    description: "创作背景/来源故事（要有趣味性和知识性）",
                  },
                  usage: {
                    type: "string",
                    description: "写作中如何使用这个素材的具体建议",
                  },
                },
                required: [
                  "type",
                  "title",
                  "content",
                  "pinyin",
                  "author",
                  "dynasty",
                  "interpretation",
                  "background",
                  "usage",
                ],
                additionalProperties: false,
              },
              summary: {
                type: "string",
                description: "用一句话总结这篇日记的核心情感",
              },
              predicted_mood: {
                type: "string",
                enum: [
                  "happy",
                  "calm",
                  "sad",
                  "angry",
                  "excited",
                  "fulfilled",
                  "tired",
                  "confused",
                  "warm",
                  "lonely",
                ],
                description: "根据日记内容推测的心情",
              },
              predicted_weather: {
                type: "string",
                enum: [
                  "sunny",
                  "cloudy",
                  "overcast",
                  "lightRain",
                  "heavyRain",
                  "snowy",
                  "windy",
                  "foggy",
                ],
                description: "根据日记内容推测的天气",
              },
            },
            required: [
              "emotion_response",
              "material",
              "summary",
              "predicted_mood",
              "predicted_weather",
            ],
            additionalProperties: false,
          },
        },
      },
    });

    const textOutput = response.choices[0].message.content;
    const result = JSON.parse(textOutput?.trim() || "{}");

    // 为素材添加ID（处理material可能是字符串的情况）
    if (result.material) {
      if (typeof result.material === "string") {
        try {
          result.material = JSON.parse(result.material);
        } catch {
          // 如果解析失败，忽略
        }
      }
      if (typeof result.material === "object" && result.material !== null) {
        result.material.id = `ai-${Date.now()}`;
      }
    }

    // 确保mood和weather类型正确
    result.predicted_mood = MOOD_MAP[result.predicted_mood] || "calm";
    result.predicted_weather = WEATHER_MAP[result.predicted_weather] || "sunny";

    return result as AIFeedback;
  } catch (error) {
    console.error("OpenAI API Error:", error);
    throw error;
  }
}

export async function getDailySurprise(
  gradeLevel: GradeLevel = "middle"
): Promise<SurpriseContent> {
  try {
    const gradePersona = GRADE_PERSONAS[gradeLevel];

    // 根据年级选择合适的惊喜类型
    const surpriseTypes = {
      lower: "创意写作小挑战、有趣的动物百科、简单的古诗儿歌",
      middle: "写作灵感挑战、经典古诗词赏析、有趣的科学知识、名人小故事",
      upper: "深度写作话题、哲理诗词品鉴、时事热点思考、文学名著片段",
    };

    const response = await openai.chat.completions.create({
      model: "claude-sonnet-4@20250514",
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
- 教学部分要具体，比如教写作技巧、修辞手法、好词好句等`,
        },
        {
          role: "user",
          content:
            "请为今天没有写日记的小朋友准备一个充满惊喜的互动内容！要有创意，要好玩，还要能启发写作灵感！记住：内容必须直接引用和讲解素材！",
        },
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
              teaser: {
                type: "string",
                description: "神秘诱人的预告语（15-25字）",
              },
              fullContent: {
                type: "string",
                description:
                  "完整的惊喜内容，包含互动元素和写作挑战（100-200字）",
              },
              type: {
                type: "string",
                enum: ["challenge", "fun-fact", "creative-prompt"],
                description:
                  "惊喜类型：challenge挑战、fun-fact趣味知识、creative-prompt创意写作",
              },
              material: {
                type: "object",
                description: "与惊喜主题相关的素材",
                properties: {
                  type: {
                    type: "string",
                    enum: [
                      "literature",
                      "poetry",
                      "quote",
                      "news",
                      "encyclopedia",
                    ],
                  },
                  title: { type: "string" },
                  content: { type: "string" },
                  pinyin: { type: "string" },
                  author: { type: "string" },
                  dynasty: { type: "string" },
                  interpretation: { type: "string" },
                  background: { type: "string" },
                  usage: { type: "string" },
                },
                required: [
                  "type",
                  "title",
                  "content",
                  "pinyin",
                  "author",
                  "dynasty",
                  "interpretation",
                  "background",
                  "usage",
                ],
                additionalProperties: false,
              },
            },
            required: ["title", "teaser", "fullContent", "type", "material"],
            additionalProperties: false,
          },
        },
      },
    });

    const result = JSON.parse(
      response.choices[0].message.content?.trim() || "{}"
    );

    // 为素材添加ID
    if (result.material) {
      result.material.id = `surprise-material-${Date.now()}`;
    }

    return { ...result, id: Date.now().toString() } as SurpriseContent;
  } catch (error) {
    console.error("OpenAI Surprise API Error:", error);
    throw error;
  }
}

// 获取指定分类的素材列表（AI生成）
export async function getMaterialsByCategory(
  category: MaterialCategory,
  gradeLevel: GradeLevel,
  count: number = 6
): Promise<Material[]> {
  try {
    const gradePersona = GRADE_PERSONAS[gradeLevel];

    const categoryDescriptions: Record<MaterialCategory, string> = {
      literature:
        "经典文学作品片段（童话、寓言、小说、散文等），要有文学性和可读性，内容真实",
      poetry: "古诗词或现代诗，要意境优美、朗朗上口，必须是真实存在的作品",
      quote: "名人名言或格言警句，要有启发性和力量感，必须是真实的名言",
      news: "适合学生了解的时事热点或社会现象，要有教育意义",
      encyclopedia: "有趣的百科知识或科学常识，要能激发好奇心，内容准确",
    };

    const categoryNames: Record<MaterialCategory, string> = {
      literature: "文学",
      poetry: "诗词",
      quote: "名言",
      news: "时事",
      encyclopedia: "百科",
    };

    const response = await openai.chat.completions.create({
      model: "claude-sonnet-4@20250514",
      messages: [
        {
          role: "system",
          content: `你是一个专业的语文教育专家，为${categoryNames[category]}类素材提供推荐。

${gradePersona}

【素材要求】
${categoryDescriptions[category]}

【质量标准】
1. 真实性：所有素材必须是真实存在的作品/名言，不可编造
2. 适龄性：内容要符合该年级学生的理解能力
3. 实用性：每个素材都要有明确的写作应用价值
4. 多样性：${count}个素材要涵盖不同主题和风格
5. 准确性：作者、朝代等信息必须准确无误`,
        },
        {
          role: "user",
          content: `请推荐${count}个高质量的【${categoryNames[category]}】类写作素材。

每个素材必须包含：
- title: 作品标题
- content: 完整原文
- pinyin: 拼音标注（低年级必须详细标注）
- author: 作者姓名
- dynasty: 朝代/时期
- interpretation: 白话文翻译/详细解释
- background: 有趣的创作背景故事
- usage: 在作文中如何使用的具体建议和例句`,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "materials_list",
          strict: true,
          schema: {
            type: "object",
            properties: {
              materials: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    title: { type: "string" },
                    content: { type: "string" },
                    pinyin: { type: "string" },
                    author: { type: "string" },
                    dynasty: { type: "string" },
                    interpretation: { type: "string" },
                    background: { type: "string" },
                    usage: { type: "string" },
                  },
                  required: [
                    "title",
                    "content",
                    "pinyin",
                    "author",
                    "dynasty",
                    "interpretation",
                    "background",
                    "usage",
                  ],
                  additionalProperties: false,
                },
              },
            },
            required: ["materials"],
            additionalProperties: false,
          },
        },
      },
    });

    const result = JSON.parse(
      response.choices[0].message.content?.trim() || "{}"
    );

    // 为每个素材添加ID和type
    const materials: Material[] = (result.materials || []).map(
      (m: any, index: number) => ({
        ...m,
        id: `${category}-${gradeLevel}-${Date.now()}-${index}`,
        type: category,
      })
    );

    return materials;
  } catch (error) {
    console.error("OpenAI Materials API Error:", error);
    throw error;
  }
}

/*
【素材智能匹配与推荐原则（多标签内容优先版）】

核心逻辑：以日记文本内容为唯一分析对象，提取核心要素（主题、事件、意象、疑问），然后按以下层级和类别匹配最适宜的素材。

第一层级：核心要素匹配（决定"推荐什么方向"）
首先，精准识别日记内容的本质，归入以下最相关的类别，这将决定素材的大方向：
1.状物写景：日记核心是描述自然景物、天气现象、动植物或具体物体。
2.叙事写人：日记核心是记录事件、活动，或描写人物、人际关系。
3.感怀抒情：日记核心是抒发个人情绪、感慨或心境变化。
4.求知思考：日记核心是提出疑问、记录新知、或进行哲理思考。

第二层级：标签类型适配（决定"用哪类素材推荐"）
根据第一层级的判定，结合日记内容的具体特质，从以下五类标签中选择最贴切的一类或两类进行推荐：

素材标签        | 最佳适配场景
---------------|----------------------------------------------------------
诗词成语        | 营造意境、表达凝练情感、描述经典场景（尤其适配状物写景、感怀抒情）。
               | 示例：写"春雨" → 推荐"天街小雨润如酥"。
名人名言        | 提炼观点、佐证感悟、获得激励（尤其适配叙事写人后的感悟、求知思考）。
               | 示例：写"坚持跑步" → 推荐"锲而不舍，金石可镂"。
文学常识        | 拓展经典文本认知、建立文学联系（当日记内容与著名作品、人物、典故有明显关联时）。
               | 示例：写"读《西游记》有感" → 推荐介绍"吴承恩"或"神魔小说"特点的常识。
人文百科        | 解答疑问、丰富知识背景（当日记包含明确知识性内容或疑问时，适配求知思考）。
               | 示例：写"观察蚂蚁搬家" → 推荐蚂蚁社群分工的科普知识。
热点时事        | 连接社会与生活、培养现实关怀（需内容高度相关，且确保事件正面、适宜）。
               | 示例：写"社区垃圾分类" → 推荐相关环保政策或科技创新的正面报道。

第三层级：具体素材精选（决定"推荐哪一个"）
在选定标签库中，根据以下细则挑选唯一最匹配的素材：
- 具体优于笼统：优先选择与日记中具体意象（如"柳树"、"蝉鸣"）直接对应的素材，而非大类（如"春天"、"夏天"）。
- 情感基调一致：素材的情感色彩（昂扬、静谧、深邃等）需与日记行文的隐含情感自然契合。
- 理解难度适宜：优先选择易于理解、能引发共鸣的素材，避免过于晦涩。
*/
