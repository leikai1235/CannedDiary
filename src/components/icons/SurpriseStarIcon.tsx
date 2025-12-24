/**
 * 惊喜礼物图标 - 多邻国风格礼物盒
 */

import React from 'react';

export const SurpriseStarIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    {/* 礼物盒主体 */}
    <rect x="3" y="10" width="18" height="12" rx="2" fill="#FF6B6B" stroke="#E55555" strokeWidth="2" />
    {/* 盒盖 */}
    <rect x="2" y="7" width="20" height="5" rx="1.5" fill="#FF8888" stroke="#E55555" strokeWidth="2" />
    {/* 竖向丝带 */}
    <rect x="10" y="7" width="4" height="15" fill="#FFC800" />
    {/* 横向丝带 */}
    <rect x="3" y="11" width="18" height="3" fill="#FFC800" />
    {/* 蝴蝶结左 */}
    <ellipse cx="9" cy="5" rx="3" ry="2.5" fill="#FFC800" stroke="#E5A500" strokeWidth="1.5" />
    {/* 蝴蝶结右 */}
    <ellipse cx="15" cy="5" rx="3" ry="2.5" fill="#FFC800" stroke="#E5A500" strokeWidth="1.5" />
    {/* 蝴蝶结中心 */}
    <circle cx="12" cy="5.5" r="2" fill="#FFE066" stroke="#E5A500" strokeWidth="1.5" />
    {/* 高光 */}
    <path d="M5 13C5.5 12.5 6 12.5 6.5 13" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
  </svg>
);
