/**
 * 工具加载中卡片组件 - 多邻国风格
 */

import React from 'react';
import { SpinningCan } from '../../../constants';

interface ToolLoadingCardProps {
  toolName: string;
}

// 工具加载提示配置
const LOADING_MESSAGES: Record<string, string> = {
  getMaterial: '查找素材中',
  searchDiaries: '搜索日记中',
  getDiaryDetail: '获取日记中',
  explainConcept: '思考中',
  default: '处理中',
};

const ToolLoadingCard: React.FC<ToolLoadingCardProps> = ({ toolName }) => {
  const message = LOADING_MESSAGES[toolName] || LOADING_MESSAGES.default;

  return (
    <div className="inline-flex items-center gap-3 bg-white border-2 border-b-4 border-[#E8E4D8] rounded-2xl px-4 py-2.5">
      <SpinningCan size={28} />
      <span className="text-sm font-black text-[#8B7355]">{message}</span>
      {/* 三个跳动的点 */}
      <div className="flex gap-1">
        <div className="w-1.5 h-1.5 bg-[#58CC02] rounded-full animate-bounce" />
        <div className="w-1.5 h-1.5 bg-[#FFC800] rounded-full animate-bounce [animation-delay:0.1s]" />
        <div className="w-1.5 h-1.5 bg-[#1CB0F6] rounded-full animate-bounce [animation-delay:0.2s]" />
      </div>
    </div>
  );
};

export default ToolLoadingCard;
