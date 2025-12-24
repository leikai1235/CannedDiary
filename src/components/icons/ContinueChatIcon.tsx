/**
 * 继续聊天图标 - 多邻国风格对话气泡 💬
 */

import React from 'react';

export const ContinueChatIcon = ({ size = 24 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    {/* 后面的气泡 */}
    <path
      d="M8 6C8 4.5 9.5 3 12 3H18C20.5 3 22 4.5 22 6V11C22 12.5 20.5 14 18 14H17V17L13 14H12C9.5 14 8 12.5 8 11V6Z"
      fill="#4CAF00"
      stroke="#1F2937"
      strokeWidth="2"
      strokeLinejoin="round"
    />
    {/* 前面的气泡 */}
    <path
      d="M2 10C2 8.5 3.5 7 6 7H12C14.5 7 16 8.5 16 10V15C16 16.5 14.5 18 12 18H8L4 21V18H6C3.5 18 2 16.5 2 15V10Z"
      fill="white"
      stroke="#1F2937"
      strokeWidth="2"
      strokeLinejoin="round"
    />
    {/* 前面气泡的点点 */}
    <circle cx="6" cy="12.5" r="1.2" fill="#1F2937" />
    <circle cx="9" cy="12.5" r="1.2" fill="#1F2937" />
    <circle cx="12" cy="12.5" r="1.2" fill="#1F2937" />
  </svg>
);
