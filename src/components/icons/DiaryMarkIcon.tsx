/**
 * 日记标记图标 - 简洁对号
 */

import React from 'react';

export const DiaryMarkIcon = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    {/* 圆形背景 */}
    <circle cx="12" cy="12" r="10" fill="#58CC02" stroke="#4CAF00" strokeWidth="2" />
    {/* 对号 */}
    <path
      d="M7 12L10.5 15.5L17 9"
      stroke="white"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
