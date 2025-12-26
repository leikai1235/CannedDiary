/**
 * 小喇叭图标 - 多邻国风格
 * 用于语音播放功能
 */

import React from 'react';

interface SpeakerIconProps {
  size?: number;
  isPlaying?: boolean;
  color?: 'green' | 'blue' | 'orange';
}

export const SpeakerIcon = ({
  size = 24,
  isPlaying = false,
  color = 'green'
}: SpeakerIconProps) => {
  // 多邻国风格配色
  const colors = {
    green: {
      main: '#58CC02',
      dark: '#46A302',
      light: '#89E219',
      wave: '#58CC02'
    },
    blue: {
      main: '#1CB0F6',
      dark: '#1899D6',
      light: '#4FC3F7',
      wave: '#1CB0F6'
    },
    orange: {
      main: '#FF9600',
      dark: '#E68600',
      light: '#FFB84D',
      wave: '#FF9600'
    }
  };

  const c = colors[color];

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      style={{
        cursor: 'pointer',
        transition: 'transform 0.2s ease'
      }}
    >
      {/* 喇叭底座阴影 */}
      <ellipse
        cx="16"
        cy="28"
        rx="8"
        ry="2"
        fill="rgba(0,0,0,0.1)"
      />

      {/* 喇叭主体 - 圆角矩形 */}
      <path
        d="M8 12C8 10.8954 8.89543 10 10 10H12L18 5C18.5523 4.5 19.5 4.5 19.5 5.5V26.5C19.5 27.5 18.5523 27.5 18 27L12 22H10C8.89543 22 8 21.1046 8 20V12Z"
        fill={c.main}
        stroke={c.dark}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />

      {/* 喇叭高光 */}
      <path
        d="M9 12.5C9 11.6716 9.67157 11 10.5 11H11.5L16.5 7V25L11.5 21H10.5C9.67157 21 9 20.3284 9 19.5V12.5Z"
        fill={c.light}
        opacity="0.4"
      />

      {/* 声波 - 根据播放状态显示动画 */}
      <g opacity={isPlaying ? 1 : 0.5}>
        {/* 第一层声波 */}
        <path
          d="M22 12C23.5 13.5 24 15 24 16C24 17 23.5 18.5 22 20"
          stroke={c.wave}
          strokeWidth="2"
          strokeLinecap="round"
          opacity={isPlaying ? 1 : 0.6}
        >
          {isPlaying && (
            <animate
              attributeName="opacity"
              values="1;0.4;1"
              dur="0.8s"
              repeatCount="indefinite"
            />
          )}
        </path>

        {/* 第二层声波 */}
        <path
          d="M24 9C26.5 11.5 28 13.5 28 16C28 18.5 26.5 20.5 24 23"
          stroke={c.wave}
          strokeWidth="2"
          strokeLinecap="round"
          opacity={isPlaying ? 0.7 : 0.3}
        >
          {isPlaying && (
            <animate
              attributeName="opacity"
              values="0.7;0.2;0.7"
              dur="0.8s"
              begin="0.2s"
              repeatCount="indefinite"
            />
          )}
        </path>
      </g>

      {/* 可爱的小高光点 */}
      <circle
        cx="11"
        cy="13"
        r="1.5"
        fill="white"
        opacity="0.6"
      />
    </svg>
  );
};

/**
 * 迷你喇叭图标 - 用于内联文本旁边
 */
export const SpeakerMiniIcon = ({
  size = 18,
  isPlaying = false,
  onClick
}: {
  size?: number;
  isPlaying?: boolean;
  onClick?: () => void;
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    onClick={onClick}
    style={{
      cursor: 'pointer',
      display: 'inline-block',
      verticalAlign: 'middle',
      marginLeft: '4px',
      transition: 'transform 0.15s ease'
    }}
  >
    {/* 喇叭主体 */}
    <path
      d="M5 9C5 8.44772 5.44772 8 6 8H7.5L12 4.5C12.3 4.2 13 4.3 13 5V19C13 19.7 12.3 19.8 12 19.5L7.5 16H6C5.44772 16 5 15.5523 5 15V9Z"
      fill="#58CC02"
      stroke="#46A302"
      strokeWidth="1"
      strokeLinejoin="round"
    />

    {/* 高光 */}
    <path
      d="M6 9.5C6 9.22386 6.22386 9 6.5 9H7L11 6V18L7 15H6.5C6.22386 15 6 14.7761 6 14.5V9.5Z"
      fill="#89E219"
      opacity="0.4"
    />

    {/* 声波 */}
    <path
      d="M15 10C15.8 10.8 16 11.5 16 12C16 12.5 15.8 13.2 15 14"
      stroke="#58CC02"
      strokeWidth="1.5"
      strokeLinecap="round"
      opacity={isPlaying ? 1 : 0.5}
    >
      {isPlaying && (
        <animate
          attributeName="opacity"
          values="1;0.3;1"
          dur="0.6s"
          repeatCount="indefinite"
        />
      )}
    </path>

    <path
      d="M17 8C18.2 9.2 19 10.5 19 12C19 13.5 18.2 14.8 17 16"
      stroke="#58CC02"
      strokeWidth="1.5"
      strokeLinecap="round"
      opacity={isPlaying ? 0.6 : 0.3}
    >
      {isPlaying && (
        <animate
          attributeName="opacity"
          values="0.6;0.1;0.6"
          dur="0.6s"
          begin="0.15s"
          repeatCount="indefinite"
        />
      )}
    </path>

    {/* 高光点 */}
    <circle cx="7" cy="10" r="1" fill="white" opacity="0.5" />
  </svg>
);

export default SpeakerIcon;
