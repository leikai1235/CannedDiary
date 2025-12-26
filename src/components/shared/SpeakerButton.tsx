/**
 * 语音播放按钮组件
 * 支持播放、暂停、继续、停止
 */

import React, { useState, useRef, useCallback } from 'react';
import { SpeakerMiniIcon } from '../icons/SpeakerIcon';
import { playTextAudio } from '../../services/ttsService';

interface SpeakerButtonProps {
  /** 要朗读的文本 */
  text: string;
  /** 内容类型，影响音色选择 */
  contentType?: 'diary_feedback' | 'surprise' | 'material' | 'story';
  /** 按钮大小 */
  size?: number;
  /** 自定义样式 */
  className?: string;
  /** 自定义内联样式 */
  style?: React.CSSProperties;
}

type PlayState = 'idle' | 'loading' | 'playing' | 'paused';

export const SpeakerButton: React.FC<SpeakerButtonProps> = ({
  text,
  size = 20,
  className = '',
  style = {},
}) => {
  const [playState, setPlayState] = useState<PlayState>('idle');
  const audioControlRef = useRef<{
    stop: () => void;
    pause: () => void;
    resume: () => void;
  } | null>(null);

  const handleClick = useCallback(async () => {
    switch (playState) {
      case 'playing':
        // 正在播放 -> 暂停
        if (audioControlRef.current) {
          audioControlRef.current.pause();
          setPlayState('paused');
        }
        break;

      case 'paused':
        // 已暂停 -> 继续播放
        if (audioControlRef.current) {
          audioControlRef.current.resume();
          setPlayState('playing');
        }
        break;

      case 'loading':
        // 正在加载，不做任何操作
        break;

      case 'idle':
      default:
        // 空闲状态 -> 开始播放
        setPlayState('loading');

        try {
          const control = await playTextAudio(text, {
            onStart: () => {
              setPlayState('playing');
            },
            onEnd: () => {
              setPlayState('idle');
              audioControlRef.current = null;
            },
            onError: (error) => {
              console.error('语音播放失败:', error);
              setPlayState('idle');
              audioControlRef.current = null;
            },
          });

          audioControlRef.current = control;
        } catch (error) {
          console.error('语音生成失败:', error);
          setPlayState('idle');
        }
        break;
    }
  }, [text, playState]);

  // 长按停止
  const handleLongPress = useCallback(() => {
    if (audioControlRef.current) {
      audioControlRef.current.stop();
      setPlayState('idle');
      audioControlRef.current = null;
    }
  }, []);

  // 获取按钮提示文字
  const getTitle = () => {
    switch (playState) {
      case 'playing': return '点击暂停';
      case 'paused': return '点击继续 (长按停止)';
      case 'loading': return '加载中...';
      default: return '点击播放语音';
    }
  };

  return (
    <button
      onClick={handleClick}
      onContextMenu={(e) => {
        e.preventDefault();
        handleLongPress();
      }}
      className={`speaker-button ${className}`}
      style={{
        background: playState === 'paused' ? 'rgba(88, 204, 2, 0.1)' : 'none',
        border: playState === 'paused' ? '2px solid #58CC02' : 'none',
        padding: '4px',
        cursor: playState === 'loading' ? 'wait' : 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '50%',
        transition: 'all 0.2s ease',
        opacity: playState === 'loading' ? 0.6 : 1,
        transform: playState === 'playing' ? 'scale(1.1)' : 'scale(1)',
        ...style,
      }}
      title={getTitle()}
      disabled={playState === 'loading'}
    >
      {playState === 'loading' ? (
        <LoadingSpinner size={size} />
      ) : playState === 'paused' ? (
        <PauseIcon size={size} />
      ) : (
        <SpeakerMiniIcon size={size} isPlaying={playState === 'playing'} />
      )}
    </button>
  );
};

// 加载动画组件
const LoadingSpinner: React.FC<{ size: number }> = ({ size }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    style={{ animation: 'spin 1s linear infinite' }}
  >
    <style>
      {`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}
    </style>
    <circle
      cx="12"
      cy="12"
      r="9"
      stroke="#58CC02"
      strokeWidth="3"
      strokeDasharray="28 14"
      strokeLinecap="round"
    />
  </svg>
);

// 暂停图标
const PauseIcon: React.FC<{ size: number }> = ({ size }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
  >
    {/* 两条竖线表示暂停 */}
    <rect x="6" y="5" width="4" height="14" rx="1" fill="#58CC02" />
    <rect x="14" y="5" width="4" height="14" rx="1" fill="#58CC02" />
  </svg>
);

/**
 * 段落语音播放按钮
 * 用于在段落文本旁边显示播放按钮
 */
interface ParagraphSpeakerProps {
  children: React.ReactNode;
  text: string;
  contentType?: 'diary_feedback' | 'surprise' | 'material' | 'story';
}

export const ParagraphWithSpeaker: React.FC<ParagraphSpeakerProps> = ({
  children,
  text,
  contentType = 'diary_feedback',
}) => {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '8px',
      }}
    >
      <div style={{ flex: 1 }}>{children}</div>
      <SpeakerButton text={text} contentType={contentType} size={18} />
    </div>
  );
};

export default SpeakerButton;
