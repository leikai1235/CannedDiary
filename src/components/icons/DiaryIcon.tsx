/**
 * 首页图标 - 多邻国风格小房子
 */

import React from 'react';

const COLORS = {
  primary: "#58CC02",
};

export const DiaryIcon = ({ active }: { active?: boolean }) => (
  <div className={`relative transition-all duration-300 ${active ? "scale-110" : "scale-100"}`}>
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
      {/* 房子主体 */}
      <path
        d="M3 10.5L12 3L21 10.5V20C21 20.5 20.5 21 20 21H4C3.5 21 3 20.5 3 20V10.5Z"
        fill={active ? COLORS.primary : "#E5E5E5"}
        stroke={active ? "#4CAF00" : "#AFAFAF"}
        strokeWidth="2"
        strokeLinejoin="round"
      />
      {/* 门 */}
      <rect
        x="9"
        y="13"
        width="6"
        height="8"
        rx="1"
        fill={active ? "#4CAF00" : "#AFAFAF"}
      />
      {/* 屋顶高光 */}
      <path
        d="M6 12L12 7L14 8.5"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={active ? "0.5" : "0.3"}
      />
    </svg>
  </div>
);
