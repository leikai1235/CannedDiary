/**
 * 语音合成 API 路由
 * 使用 Gemini 生成语音
 */

import express from 'express';
import { textToSpeech, getAvailableVoices } from '../services/tts.js';

const router = express.Router();

/**
 * POST /api/tts
 * 将文本转换为语音
 *
 * Body:
 * - text: string (必需) - 要转换的文本
 *
 * Response: { audioData: base64, format: string } 或 audio/mpeg 流
 */
router.post('/', async (req, res) => {
  try {
    const { text, returnBase64 } = req.body;

    if (!text || typeof text !== 'string') {
      return res.status(400).json({
        error: '文本不能为空'
      });
    }

    // 文本长度限制
    if (text.length > 2000) {
      return res.status(400).json({
        error: '文本过长，最多支持2000个字符'
      });
    }

    console.log('[TTS API] 请求语音合成');
    console.log('[TTS API] 文本长度:', text.length);

    const result = await textToSpeech(text);

    // 返回 base64 数据（前端可直接使用）
    if (returnBase64 !== false) {
      return res.json({
        success: true,
        audioData: result.audioData,
        format: result.format,
        textLength: result.textLength
      });
    }

    // 返回二进制流（可选）
    const audioBuffer = Buffer.from(result.audioData, 'base64');
    res.set({
      'Content-Type': `audio/${result.format}`,
      'Content-Length': audioBuffer.length,
      'Cache-Control': 'public, max-age=86400'
    });
    res.send(audioBuffer);

  } catch (error) {
    console.error('[TTS API Error]', error);

    res.status(500).json({
      error: '语音合成失败',
      message: error.message,
      // 提示前端使用 Web Speech API 作为备选
      fallbackToWebSpeech: true
    });
  }
});

/**
 * GET /api/tts/voices
 * 获取可用的音色列表
 */
router.get('/voices', (req, res) => {
  const voices = getAvailableVoices();
  res.json({
    voices,
    total: voices.length
  });
});

export default router;
