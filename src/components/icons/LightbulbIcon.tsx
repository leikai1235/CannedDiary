import React from "react";

interface LightbulbIconProps {
  size?: number;
}

const LightbulbIcon: React.FC<LightbulbIconProps> = ({ size = 24 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
  >
    {/* 灯泡光芒 */}
    <path
      d="M12 1V3"
      stroke="#FFC800"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <path
      d="M4.22 4.22L5.64 5.64"
      stroke="#FFC800"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <path
      d="M19.78 4.22L18.36 5.64"
      stroke="#FFC800"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <path
      d="M1 12H3"
      stroke="#FFC800"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <path
      d="M21 12H23"
      stroke="#FFC800"
      strokeWidth="2"
      strokeLinecap="round"
    />
    {/* 灯泡主体 */}
    <path
      d="M9 21H15"
      stroke="#1F2937"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <path
      d="M10 21V19C10 18 8 16.5 8 14C8 11.5 9.5 9 12 9C14.5 9 16 11.5 16 14C16 16.5 14 18 14 19V21"
      fill="#FFC800"
      stroke="#1F2937"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    {/* 灯泡底座 */}
    <path
      d="M10 19H14"
      stroke="#1F2937"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

export default LightbulbIcon;
