/**
 * 聊天输入框组件
 * 支持文字输入和语音输入
 * 语音输入复用 VoiceInputSheet 组件
 */

import React, { FormEvent, useRef, useEffect, useCallback, useState } from 'react';
import { VoiceInputSheet } from '../shared/Sheets';
import { speechService } from '../../services/speechService';

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (e: FormEvent) => void;
  isLoading: boolean;
  placeholder?: string;
}

const ChatInput: React.FC<ChatInputProps> = ({
  value,
  onChange,
  onSubmit,
  isLoading,
  placeholder = '和小罐罐说点什么...'
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 语音输入状态
  const [isVoiceSheetOpen, setIsVoiceSheetOpen] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);

  // 自动调整高度
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
    }
  }, [value]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (value.trim() && !isLoading) {
        onSubmit(e as any);
      }
    }
  };

  // 打开语音输入
  const handleOpenVoice = useCallback(async () => {
    setIsVoiceSheetOpen(true);
    setTranscription('');
    setVoiceError(null);

    // 开始语音识别
    const started = await speechService.start({
      lang: 'zh-CN',
      continuous: true,
      interimResults: true,
      onResult: (text, isFinal) => {
        setTranscription(prev => {
          if (isFinal) {
            return prev + text;
          }
          // 临时结果直接显示
          const parts = prev.split(' ');
          parts[parts.length - 1] = text;
          return parts.join(' ');
        });
      },
      onStart: () => {
        setIsListening(true);
      },
      onEnd: () => {
        setIsListening(false);
      },
      onError: (error) => {
        setVoiceError(error);
        setIsListening(false);
      }
    });

    if (!started) {
      setIsListening(false);
    }
  }, []);

  // 关闭语音输入
  const handleCloseVoice = useCallback(() => {
    speechService.stop();
    setIsVoiceSheetOpen(false);
    setTranscription('');
    setVoiceError(null);
    setIsListening(false);
  }, []);

  // 完成语音输入
  const handleFinishVoice = useCallback(() => {
    speechService.stop();

    if (transcription.trim()) {
      // 追加到现有文本
      onChange(value ? `${value} ${transcription.trim()}` : transcription.trim());
      // 聚焦输入框
      textareaRef.current?.focus();
    }

    setIsVoiceSheetOpen(false);
    setTranscription('');
    setVoiceError(null);
    setIsListening(false);
  }, [transcription, value, onChange]);

  return (
    <>
      <form
        onSubmit={onSubmit}
        className="p-4 bg-white border-t-2 border-[#E8E4D8] flex gap-2 items-center"
      >
        {/* 语音输入按钮 */}
        <button
          type="button"
          onClick={handleOpenVoice}
          disabled={isLoading}
          className={`w-12 h-12 rounded-xl border-b-4 flex items-center justify-center transition-all active:translate-y-1 active:border-b-0 shrink-0 ${
            isLoading
              ? 'bg-gray-200 border-gray-300 cursor-not-allowed'
              : 'bg-[#FFC800] border-[#E5B000] hover:bg-[#FFD000]'
          }`}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
            <line x1="12" y1="19" x2="12" y2="23" />
            <line x1="8" y1="23" x2="16" y2="23" />
          </svg>
        </button>

        {/* 输入框 */}
        <div className="flex-1 min-h-12 bg-[#F5F3EE] rounded-xl border-2 border-[#E8E4D8] overflow-hidden transition-all focus-within:border-[#FFC800]/50 flex items-center">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            rows={1}
            disabled={isLoading}
            className="w-full px-4 py-2 bg-transparent text-sm font-bold text-gray-700 outline-none resize-none placeholder:text-gray-300 disabled:opacity-50"
            style={{ maxHeight: '120px' }}
          />
        </div>

        {/* 发送按钮 */}
        <button
          type="submit"
          disabled={!value.trim() || isLoading}
          className={`w-12 h-12 rounded-xl border-b-4 flex items-center justify-center transition-all active:translate-y-1 active:border-b-0 shrink-0 ${
            value.trim() && !isLoading
              ? 'bg-[#FFC800] border-[#E6B400] hover:bg-[#FFD000]'
              : 'bg-gray-200 border-gray-300 cursor-not-allowed'
          }`}
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="white"
              className={value.trim() ? '' : 'opacity-50'}
            >
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
          )}
        </button>
      </form>

      {/* 语音输入 Sheet */}
      <VoiceInputSheet
        isOpen={isVoiceSheetOpen}
        onClose={handleCloseVoice}
        onFinish={handleFinishVoice}
        transcription={transcription}
        isListening={isListening}
        error={voiceError}
      />
    </>
  );
};

export default ChatInput;
