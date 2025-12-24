/**
 * 打卡火焰图标 - emoji 风格
 */

import React from 'react';

export const CheckinSparkIcon = ({
  size = 20,
  active = true,
}: {
  size?: number;
  active?: boolean;
}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    {/* 外层火焰 - 橙红色，多个尖头 */}
    <path
      d="M12 1C12 1 14 4 14 6C14 6 16 4 17 6C18 8 17 10 17 10C17 10 19 9 19 12C19 16 16 20 12 20C8 20 5 16 5 12C5 9 7 10 7 10C7 10 6 8 7 6C8 4 10 6 10 6C10 4 12 1 12 1Z"
      fill={active ? "#FF6B00" : "#CCCCCC"}
    />
    {/* 中层火焰 - 橙色 */}
    <path
      d="M12 5C12 5 13.5 7 13.5 9C13.5 9 15 8 15.5 10C16 12 15 14 15 14C15 14 16 13 16 15C16 17 14 19 12 19C10 19 8 17 8 15C8 13 9 14 9 14C9 14 8 12 8.5 10C9 8 10.5 9 10.5 9C10.5 7 12 5 12 5Z"
      fill={active ? "#FF9500" : "#D5D5D5"}
    />
    {/* 内层火焰 - 黄色 */}
    <path
      d="M12 9C12 9 10 12 10 15C10 17 11 18 12 18C13 18 14 17 14 15C14 12 12 9 12 9Z"
      fill={active ? "#FFCC00" : "#E5E5E5"}
    />
    {/* 火焰芯 - 亮黄色 */}
    <path
      d="M12 13C12 13 11 15 11 16C11 17 11.5 17.5 12 17.5C12.5 17.5 13 17 13 16C13 15 12 13 12 13Z"
      fill={active ? "#FFEE58" : "#F0F0F0"}
    />
  </svg>
);
