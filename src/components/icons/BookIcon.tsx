/**
 * 书本图标 - 用于文章链接
 */

import React from 'react';

export const BookIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    {/* 书本主体 */}
    <path
      d="M4 4C4 4 6 3 9 3C12 3 12 4 12 4V19C12 19 11 18 9 18C7 18 4 19 4 19V4Z"
      fill="#1CB0F6"
      stroke="#1899D6"
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
    <path
      d="M20 4C20 4 18 3 15 3C12 3 12 4 12 4V19C12 19 13 18 15 18C17 18 20 19 20 19V4Z"
      fill="#4FC3F7"
      stroke="#1899D6"
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
    {/* 书页线条 */}
    <path d="M7 7H10M7 10H9" stroke="white" strokeWidth="1" strokeLinecap="round" opacity="0.7" />
  </svg>
);
