/**
 * 语音合成服务 (Text-to-Speech)
 * 优先使用后端 Google Gemini TTS，失败时回退到浏览器 Web Speech API
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:7001';

// 音色信息
export interface Voice {
  id: string;
  name: string;
  description: string;
  lang?: string;
}

// 当前播放的音频元素
let currentAudio: HTMLAudioElement | null = null;
// 当前播放的 utterance（Web Speech API 备选）
let currentUtterance: SpeechSynthesisUtterance | null = null;

/**
 * 检查浏览器是否支持 Web Speech API
 */
function isWebSpeechSupported(): boolean {
  return 'speechSynthesis' in window;
}

/**
 * 清理文本：移除特殊标记
 */
function cleanText(text: string): string {
  return text
    .replace(/【《([^》]+)》】/g, '$1')
    .replace(/\[\[([^\]]+)\]\]/g, '$1')
    .replace(/「《([^》]+)》」/g, '$1')
    .replace(/[#*_`~]/g, '')
    .trim();
}

/**
 * 获取随机中文音色（Web Speech API）
 */
function getRandomChineseVoice(): SpeechSynthesisVoice | null {
  if (!isWebSpeechSupported()) return null;

  const voices = window.speechSynthesis.getVoices();
  const chineseVoices = voices.filter(
    (v) => v.lang.includes('zh') || v.lang.includes('cmn')
  );

  if (chineseVoices.length === 0) {
    return voices[0] || null;
  }

  const randomIndex = Math.floor(Math.random() * chineseVoices.length);
  return chineseVoices[randomIndex];
}

/**
 * 使用后端 Google Gemini API 生成语音
 */
async function playWithGeminiTTS(
  text: string,
  onStart?: () => void,
  onEnd?: () => void,
  onError?: (error: Error) => void
): Promise<{
  stop: () => void;
  pause: () => void;
  resume: () => void;
}> {
  const response = await fetch(`${API_URL}/api/tts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ text }),
  });

  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.message || data.error || 'TTS API 请求失败');
  }

  // 创建音频元素播放 base64 音频
  const mimeType = data.format === 'wav' ? 'audio/wav' : 'audio/mp3';
  const audio = new Audio(`data:${mimeType};base64,${data.audioData}`);
  currentAudio = audio;

  return new Promise((resolve, reject) => {
    audio.onplay = () => {
      onStart?.();
    };

    audio.onended = () => {
      currentAudio = null;
      onEnd?.();
    };

    audio.onerror = () => {
      currentAudio = null;
      const error = new Error('音频播放失败');
      onError?.(error);
      reject(error);
    };

    // 开始播放
    audio.play().catch((err) => {
      currentAudio = null;
      onError?.(err);
      reject(err);
    });

    resolve({
      stop: () => {
        audio.pause();
        audio.currentTime = 0;
        currentAudio = null;
        onEnd?.();
      },
      pause: () => {
        audio.pause();
      },
      resume: () => {
        audio.play();
      },
    });
  });
}

/**
 * 使用 Web Speech API 播放语音（备选方案）
 */
function playWithWebSpeech(
  text: string,
  onStart?: () => void,
  onEnd?: () => void,
  onError?: (error: Error) => void
): Promise<{
  stop: () => void;
  pause: () => void;
  resume: () => void;
}> {
  return new Promise((resolve, reject) => {
    if (!isWebSpeechSupported()) {
      const error = new Error('浏览器不支持语音合成');
      onError?.(error);
      reject(error);
      return;
    }

    // 停止当前播放
    if (currentUtterance) {
      window.speechSynthesis.cancel();
    }

    const cleanedText = cleanText(text);
    if (!cleanedText) {
      const error = new Error('文本为空');
      onError?.(error);
      reject(error);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(cleanedText);
    currentUtterance = utterance;

    // 设置音色（随机选择中文音色）
    const voice = getRandomChineseVoice();
    if (voice) {
      utterance.voice = voice;
    }

    utterance.lang = 'zh-CN';
    utterance.rate = 0.9;
    utterance.pitch = 1.1;
    utterance.volume = 1;

    utterance.onstart = () => {
      onStart?.();
    };

    utterance.onend = () => {
      currentUtterance = null;
      onEnd?.();
    };

    utterance.onerror = (event) => {
      currentUtterance = null;
      const error = new Error(`语音播放失败: ${event.error}`);
      onError?.(error);
      reject(error);
    };

    window.speechSynthesis.speak(utterance);

    resolve({
      stop: () => {
        window.speechSynthesis.cancel();
        currentUtterance = null;
        onEnd?.();
      },
      pause: () => {
        window.speechSynthesis.pause();
      },
      resume: () => {
        window.speechSynthesis.resume();
      },
    });
  });
}

/**
 * 播放文本语音
 * 优先使用 Google Gemini TTS，失败时自动回退到 Web Speech API
 */
export async function playTextAudio(
  text: string,
  options: {
    voice?: string;
    speed?: number;
    onStart?: () => void;
    onEnd?: () => void;
    onError?: (error: Error) => void;
  } = {}
): Promise<{
  stop: () => void;
  pause: () => void;
  resume: () => void;
}> {
  const { onStart, onEnd, onError } = options;

  const cleanedText = cleanText(text);
  if (!cleanedText) {
    const error = new Error('文本为空');
    onError?.(error);
    throw error;
  }

  try {
    // 优先尝试 Google Gemini TTS
    console.log('[TTS] 尝试使用 Google Gemini TTS...');
    return await playWithGeminiTTS(cleanedText, onStart, onEnd, onError);
  } catch (geminiError) {
    console.warn('[TTS] Gemini TTS 失败，回退到 Web Speech API:', geminiError);

    // 回退到 Web Speech API
    try {
      return await playWithWebSpeech(cleanedText, onStart, onEnd, onError);
    } catch (webSpeechError) {
      console.error('[TTS] Web Speech API 也失败:', webSpeechError);
      const error = new Error('语音合成服务不可用');
      onError?.(error);
      throw error;
    }
  }
}

/**
 * 停止当前播放
 */
export function stopCurrentAudio(): void {
  // 停止 HTML5 Audio
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio = null;
  }

  // 停止 Web Speech
  if (isWebSpeechSupported()) {
    window.speechSynthesis.cancel();
    currentUtterance = null;
  }
}

/**
 * 检查 TTS 是否可用
 */
export function isTTSSupported(): boolean {
  return true; // 有后端 API 和 Web Speech 双重保障
}

/**
 * 获取可用的音色列表
 */
export function getAvailableVoices(): Voice[] {
  return [
    { id: 'Aoede', name: '小艾', description: '温暖友好的女声' },
    { id: 'Charon', name: '小稳', description: '稳重的男声' },
    { id: 'Fenrir', name: '小明', description: '明亮的男声' },
    { id: 'Kore', name: '小甜', description: '甜美清晰的女声' },
    { id: 'Puck', name: '小乐', description: '活泼开朗的声音' },
  ];
}

/**
 * 预加载音色（Web Speech API 备选需要）
 */
export function preloadVoices(): void {
  if (isWebSpeechSupported()) {
    window.speechSynthesis.getVoices();
    window.speechSynthesis.onvoiceschanged = () => {
      window.speechSynthesis.getVoices();
    };
  }
}

// 页面加载时预加载音色
if (typeof window !== 'undefined') {
  preloadVoices();
}

export default {
  isTTSSupported,
  getAvailableVoices,
  playTextAudio,
  stopCurrentAudio,
  preloadVoices,
};
