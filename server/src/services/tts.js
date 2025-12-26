/**
 * 语音合成服务 (Text-to-Speech)
 * 使用 TAL Audio 1.0 API
 */

// 获取 TTS 模型
const getTTSModel = () => process.env.AUDIO_MODEL || 'audio1.0';

// 检查是否启用 TTS
const isTTSEnabled = () => process.env.ENABLE_TTS !== 'false';

/**
 * 清理文本：移除特殊标记
 */
function cleanText(text) {
  return text
    .replace(/【《([^》]+)》】/g, '$1')
    .replace(/\[\[([^\]]+)\]\]/g, '$1')
    .replace(/「《([^》]+)》」/g, '$1')
    .replace(/[#*_`~]/g, '')
    .trim();
}

/**
 * 调用 TAL Audio API 生成语音
 * 注意：这是异步 API，需要轮询获取结果
 */
async function generateWithTALAudio(text) {
  const apiKey = process.env.TAL_API_KEY;
  const apiUrl = process.env.AUDIO_API_URL || 'http://apx-api.tal.com/v1/async/chat';
  const model = getTTSModel();

  if (!apiKey) {
    throw new Error('未配置 TAL_API_KEY');
  }

  console.log('[TTS] 使用 TAL Audio API 生成语音');

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'api-key': apiKey,
      'X-APX-Model': model,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: model,
      prompt: text,
      duration: Math.min(Math.ceil(text.length / 5), 30),
      extra_body: {}
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[TTS] TAL API 错误:', errorText);
    throw new Error(`TAL API 错误: ${response.status}`);
  }

  const data = await response.json();

  // 异步 API 返回任务 ID，需要轮询获取结果
  if (data.task_id) {
    const result = await pollForResult(data.task_id, apiKey);
    return result;
  }

  // 如果直接返回音频数据
  if (data.audio_url) {
    return { audioUrl: data.audio_url, format: 'mp3' };
  }

  if (data.audio_base64 || data.audio) {
    return { audioData: data.audio_base64 || data.audio, format: 'mp3' };
  }

  throw new Error('TAL API 未返回音频数据');
}

/**
 * 轮询获取异步任务结果
 */
async function pollForResult(taskId, apiKey, maxAttempts = 30) {
  const statusUrl = `http://apx-api.tal.com/v1/async/status/${taskId}`;

  for (let i = 0; i < maxAttempts; i++) {
    await new Promise(resolve => setTimeout(resolve, 1000));

    const response = await fetch(statusUrl, {
      headers: { 'api-key': apiKey }
    });

    if (!response.ok) continue;

    const data = await response.json();

    if (data.status === 'completed' || data.status === 'success') {
      if (data.audio_url) {
        const audioResponse = await fetch(data.audio_url);
        const audioBuffer = await audioResponse.arrayBuffer();
        const base64 = Buffer.from(audioBuffer).toString('base64');
        return { audioData: base64, format: 'mp3' };
      }
      if (data.audio_base64 || data.audio) {
        return { audioData: data.audio_base64 || data.audio, format: 'mp3' };
      }
    }

    if (data.status === 'failed' || data.status === 'error') {
      throw new Error(`音频生成失败: ${data.error || '未知错误'}`);
    }
  }

  throw new Error('音频生成超时');
}

/**
 * 将文本转换为语音
 */
export async function textToSpeech(text, options = {}) {
  if (!isTTSEnabled()) {
    console.log('[TTS] 语音合成已禁用');
    throw new Error('语音合成服务已禁用');
  }

  const cleanedText = cleanText(text);
  if (!cleanedText) {
    throw new Error('文本为空');
  }

  const maxLength = 500;
  const truncatedText = cleanedText.length > maxLength
    ? cleanedText.slice(0, maxLength) + '...'
    : cleanedText;

  console.log('[TTS] 开始语音合成');
  console.log('[TTS] 模型:', getTTSModel());
  console.log('[TTS] 文本长度:', truncatedText.length);

  try {
    const result = await generateWithTALAudio(truncatedText);
    console.log('[TTS] 语音合成成功');

    return {
      audioData: result.audioData,
      audioUrl: result.audioUrl,
      format: result.format || 'mp3',
      textLength: truncatedText.length
    };
  } catch (error) {
    console.error('[TTS Error]', error.message);
    throw error;
  }
}

/**
 * 获取所有可用音色
 */
export function getAvailableVoices() {
  return [{ id: 'default', name: '默认', description: 'TAL Audio 默认音色' }];
}

export default {
  textToSpeech,
  getAvailableVoices
};
