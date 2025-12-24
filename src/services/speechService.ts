// 语音识别服务 - 使用 Web Speech API

// 扩展 Window 类型以支持 webkit 前缀
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
  isFinal: boolean;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

// 获取 SpeechRecognition 构造函数（处理浏览器兼容性）
const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

export interface SpeechRecognitionOptions {
  lang?: string;
  continuous?: boolean;
  interimResults?: boolean;
  onResult?: (transcript: string, isFinal: boolean) => void;
  onError?: (error: string) => void;
  onStart?: () => void;
  onEnd?: () => void;
}

class SpeechService {
  private recognition: any = null;
  private isListening: boolean = false;
  private options: SpeechRecognitionOptions = {};

  // 检查浏览器是否支持语音识别
  isSupported(): boolean {
    return !!SpeechRecognition;
  }

  // 请求麦克风权限
  async requestMicrophonePermission(): Promise<boolean> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // 立即停止流，我们只是检查权限
      stream.getTracks().forEach(track => track.stop());
      return true;
    } catch (error) {
      console.error('[Speech] 麦克风权限被拒绝:', error);
      return false;
    }
  }

  // 开始语音识别
  async start(options: SpeechRecognitionOptions = {}): Promise<boolean> {
    if (!this.isSupported()) {
      console.error('[Speech] 浏览器不支持语音识别');
      options.onError?.('您的浏览器不支持语音识别功能');
      return false;
    }

    // 请求麦克风权限
    const hasPermission = await this.requestMicrophonePermission();
    if (!hasPermission) {
      options.onError?.('请允许使用麦克风');
      return false;
    }

    this.options = options;
    this.recognition = new SpeechRecognition();

    // 配置语音识别
    this.recognition.lang = options.lang || 'zh-CN'; // 默认中文
    this.recognition.continuous = options.continuous ?? true; // 持续识别
    this.recognition.interimResults = options.interimResults ?? true; // 显示临时结果
    this.recognition.maxAlternatives = 1;

    // 识别结果回调
    this.recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result[0].transcript;

        if (result.isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      // 回调结果
      if (finalTranscript) {
        this.options.onResult?.(finalTranscript, true);
      } else if (interimTranscript) {
        this.options.onResult?.(interimTranscript, false);
      }
    };

    // 错误处理
    this.recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('[Speech] 识别错误:', event.error);

      let errorMessage = '语音识别出错';
      switch (event.error) {
        case 'no-speech':
          errorMessage = '没有检测到语音';
          break;
        case 'audio-capture':
          errorMessage = '无法访问麦克风';
          break;
        case 'not-allowed':
          errorMessage = '麦克风权限被拒绝';
          break;
        case 'network':
          errorMessage = '网络错误，请检查网络连接';
          break;
        case 'aborted':
          errorMessage = '语音识别被中断';
          break;
        default:
          errorMessage = `语音识别错误: ${event.error}`;
      }

      this.options.onError?.(errorMessage);
    };

    // 开始回调
    this.recognition.onstart = () => {
      this.isListening = true;
      console.log('[Speech] 开始监听');
      this.options.onStart?.();
    };

    // 结束回调
    this.recognition.onend = () => {
      this.isListening = false;
      console.log('[Speech] 停止监听');
      this.options.onEnd?.();

      // 如果设置了连续模式，自动重启（除非手动停止）
      if (this.options.continuous && this.recognition) {
        try {
          this.recognition.start();
        } catch (e) {
          // 忽略重启错误
        }
      }
    };

    // 开始识别
    try {
      this.recognition.start();
      return true;
    } catch (error) {
      console.error('[Speech] 启动失败:', error);
      this.options.onError?.('启动语音识别失败');
      return false;
    }
  }

  // 停止语音识别
  stop(): void {
    if (this.recognition) {
      this.options.continuous = false; // 防止自动重启
      try {
        this.recognition.stop();
      } catch (e) {
        // 忽略停止错误
      }
      this.recognition = null;
    }
    this.isListening = false;
  }

  // 检查是否正在监听
  getIsListening(): boolean {
    return this.isListening;
  }
}

// 导出单例
export const speechService = new SpeechService();

// 检查是否支持语音识别
export function isSpeechRecognitionSupported(): boolean {
  return speechService.isSupported();
}
