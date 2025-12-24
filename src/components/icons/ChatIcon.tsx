/**
 * 聊天图标 - 多邻国风格对话气泡
 */

import React from 'react';

const COLORS = {
  secondary: "#FFC800",
};

export const ChatIcon = ({ active }: { active?: boolean }) => (
  <div className={`relative transition-all duration-300 ${active ? "scale-110" : "scale-100"}`}>
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
      {/* 对话气泡 */}
      <path
        d="M4 4H20C21 4 22 5 22 6V15C22 16 21 17 20 17H7L3 21V6C3 5 4 4 4 4Z"
        fill={active ? COLORS.secondary : "#E5E5E5"}
        stroke={active ? "#E5A500" : "#AFAFAF"}
        strokeWidth="2"
        strokeLinejoin="round"
      />
      {/* 三个点 */}
      <circle cx="8" cy="11" r="1.5" fill={active ? "#E5A500" : "#AFAFAF"} />
      <circle cx="12" cy="11" r="1.5" fill={active ? "#E5A500" : "#AFAFAF"} />
      <circle cx="16" cy="11" r="1.5" fill={active ? "#E5A500" : "#AFAFAF"} />
    </svg>
  </div>
);
