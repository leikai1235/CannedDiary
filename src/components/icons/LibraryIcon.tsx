/**
 * 素材库图标 - 多邻国风格书本
 */

import React from 'react';

const COLORS = {
  accent: "#1CB0F6",
};

export const LibraryIcon = ({ active }: { active?: boolean }) => (
  <div className={`relative transition-all duration-300 ${active ? "scale-110" : "scale-100"}`}>
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
      {/* 后面的书 */}
      <rect
        x="4"
        y="4"
        width="14"
        height="17"
        rx="2"
        fill={active ? "#1899D6" : "#D5D5D5"}
        stroke={active ? "#1478A6" : "#AFAFAF"}
        strokeWidth="2"
      />
      {/* 前面的书 */}
      <rect
        x="7"
        y="3"
        width="14"
        height="17"
        rx="2"
        fill={active ? COLORS.accent : "#E5E5E5"}
        stroke={active ? "#1899D6" : "#AFAFAF"}
        strokeWidth="2"
      />
      {/* 书脊线 */}
      <path
        d="M10 3V20"
        stroke={active ? "#1899D6" : "#AFAFAF"}
        strokeWidth="2"
      />
      {/* 书页横线 */}
      <path
        d="M13 8H18M13 12H17"
        stroke={active ? "white" : "#AFAFAF"}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  </div>
);
