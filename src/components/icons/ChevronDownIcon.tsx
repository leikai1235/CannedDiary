/**
 * 下拉箭头图标
 */

import React from 'react';

export const ChevronDownIcon = ({
  size = 16,
  color = "#C47F17",
}: {
  size?: number;
  color?: string;
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M6 9L12 15L18 9" />
  </svg>
);
