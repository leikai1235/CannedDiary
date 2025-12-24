/**
 * 知识解释卡片组件
 * 展示 explainConcept 工具的结果 - 多邻国风格
 */

import React from 'react';

interface ExplainConceptCardProps {
  result: {
    explanation: string;
  };
}

// 多邻国风格灯泡图标
const LightBulbIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    {/* 灯泡主体 */}
    <path
      d="M12 2C8 2 5 5 5 9C5 11.5 6.5 13.5 8 15V17C8 18 9 19 10 19H14C15 19 16 18 16 17V15C17.5 13.5 19 11.5 19 9C19 5 16 2 12 2Z"
      fill="#FFC800"
      stroke="#E5A500"
      strokeWidth="2"
      strokeLinejoin="round"
    />
    {/* 灯泡底座 */}
    <path
      d="M9 21H15"
      stroke="#E5A500"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <path
      d="M10 19V21"
      stroke="#E5A500"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <path
      d="M14 19V21"
      stroke="#E5A500"
      strokeWidth="2"
      strokeLinecap="round"
    />
    {/* 发光线条 */}
    <path
      d="M12 0V1M4 4L5 5M20 4L19 5M2 9H3M21 9H22"
      stroke="#FFC800"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

const ExplainConceptCard: React.FC<ExplainConceptCardProps> = ({ result }) => {
  if (!result.explanation) return null;

  return (
    <div className="bg-white border-2 border-b-4 border-[#E8E4D8] rounded-2xl p-4 max-w-[300px]">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 bg-[#FFF8E1] rounded-xl flex items-center justify-center">
          <LightBulbIcon />
        </div>
        <span className="text-sm font-black text-[#FFC800]">知识小课堂</span>
      </div>
      <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap font-bold">
        {result.explanation}
      </p>
    </div>
  );
};

export default ExplainConceptCard;
