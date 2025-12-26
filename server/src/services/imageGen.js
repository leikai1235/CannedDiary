/**
 * 图片生成服务
 * 使用 TAL Gemini 3 Pro Image API
 */

// 获取图像生成模型
const getImageModel = () => process.env.IMAGE_MODEL || 'gemini-3-pro-image';

// 检查是否启用图片生成
const isImageGenEnabled = () => process.env.ENABLE_IMAGE_GEN !== 'false';

/**
 * 调用 TAL Gemini 3 Pro Image API 生成图片
 */
async function generateWithTALAPI(prompt) {
  const apiKey = process.env.TAL_API_KEY;
  const apiUrl = process.env.IMAGE_API_URL || 'http://ai-service.tal.com/openai-compatible/v1/chat/completions';
  const model = getImageModel();

  if (!apiKey) {
    throw new Error('未配置 TAL_API_KEY');
  }

  console.log('[ImageGen] 使用 TAL Gemini 3 Pro Image API 生成图片');

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'api-key': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: model,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      modalities: ['text', 'image']
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[ImageGen] TAL API 错误:', errorText);
    throw new Error(`TAL API 错误: ${response.status}`);
  }

  const data = await response.json();

  // 提取图片数据 - OpenAI 兼容格式
  const choice = data.choices?.[0];
  if (choice?.message?.content) {
    // 检查是否是数组格式
    if (Array.isArray(choice.message.content)) {
      for (const part of choice.message.content) {
        if (part.type === 'image_url' && part.image_url?.url) {
          return part.image_url.url;
        }
        if (part.type === 'image' && part.image?.data) {
          const mimeType = part.image.mime_type || 'image/png';
          return `data:${mimeType};base64,${part.image.data}`;
        }
      }
    }
    // 检查是否直接返回 base64
    if (typeof choice.message.content === 'string' && choice.message.content.startsWith('data:image')) {
      return choice.message.content;
    }
  }

  // 检查其他可能的位置
  if (data.data?.[0]?.url) {
    return data.data[0].url;
  }
  if (data.data?.[0]?.b64_json) {
    return `data:image/png;base64,${data.data[0].b64_json}`;
  }

  throw new Error('API 未返回图片数据');
}

/**
 * 生成适合儿童的图片
 */
export async function generateChildFriendlyImage(context, type = 'diary', gradeLevel = 'middle') {
  // 检查是否启用
  if (!isImageGenEnabled()) {
    console.log('[ImageGen] 图片生成已禁用');
    return { imageUrl: null, prompt: '' };
  }

  // 根据年级调整风格
  const styleByGrade = {
    lower: '可爱卡通风格，色彩鲜艳明亮，像儿童绘本插图，圆润的线条，简单可爱',
    middle: '温馨插画风格，色彩温暖柔和，像童话故事书的插图，细节适中',
    upper: '精美插画风格，富有想象力，像少年文学书籍的配图，有一定的艺术感'
  };

  const style = styleByGrade[gradeLevel] || styleByGrade.middle;

  // 根据类型调整场景
  const scenePrefix = type === 'diary'
    ? '一个孩子的日常生活场景'
    : '一个充满奇迹和惊喜的温馨场景';

  // 构建安全的图像提示
  const safetyPrompt = `创作一幅${style}的插图。

场景：${scenePrefix}
内容：${context.slice(0, 300)}

要求：
- 画面温暖、阳光、积极向上
- 适合儿童，色彩明亮（暖色调）
- 人物可爱友善，氛围温馨治愈
- 不要任何文字`;

  try {
    console.log('[ImageGen] 开始生成图片');
    console.log('[ImageGen] 模型:', getImageModel());
    console.log('[ImageGen] 提示词:', safetyPrompt.slice(0, 100) + '...');

    const imageUrl = await generateWithTALAPI(safetyPrompt);

    if (!imageUrl) {
      throw new Error('图片生成返回空结果');
    }

    console.log('[ImageGen] 图片生成成功');

    return {
      imageUrl,
      prompt: safetyPrompt
    };
  } catch (error) {
    console.error('[ImageGen Error]', error.message);
    return {
      imageUrl: null,
      prompt: safetyPrompt,
      error: error.message
    };
  }
}

/**
 * 根据日记内容生成配图
 */
export async function generateDiaryImage(diaryContent, mood, weather, gradeLevel) {
  const moodLabels = {
    happy: '开心', calm: '平静', sad: '难过', angry: '生气',
    excited: '兴奋', fulfilled: '满足', tired: '疲惫',
    confused: '困惑', warm: '温暖', lonely: '孤独'
  };

  const weatherLabels = {
    sunny: '阳光明媚', cloudy: '多云', overcast: '阴天',
    lightRain: '小雨', heavyRain: '大雨', snowy: '下雪',
    windy: '刮风', foggy: '有雾'
  };

  const context = `${diaryContent}。心情${moodLabels[mood] || ''}，天气${weatherLabels[weather] || ''}`;

  return generateChildFriendlyImage(context, 'diary', gradeLevel);
}

/**
 * 根据惊喜内容生成配图
 */
export async function generateSurpriseImage(surpriseContent, material, gradeLevel) {
  const context = `${surpriseContent.title || ''}：${surpriseContent.fullContent?.slice(0, 150) || ''}`;
  return generateChildFriendlyImage(context, 'surprise', gradeLevel);
}

export default {
  generateChildFriendlyImage,
  generateDiaryImage,
  generateSurpriseImage
};
