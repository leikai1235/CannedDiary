/**
 * 工具结果展示卡片组件
 * 根据不同工具类型渲染不同的卡片
 */

import React from 'react';
import {
  MaterialCard,
  DiarySearchCard,
  DiaryDetailCard,
  ToolLoadingCard,
  ExplainConceptCard
} from './tools';

interface ToolResultCardProps {
  toolName: string;
  result?: any;
  isLoading?: boolean;
}

const ToolResultCard: React.FC<ToolResultCardProps> = ({
  toolName,
  result,
  isLoading
}) => {
  // 加载中状态
  if (isLoading) {
    return <ToolLoadingCard toolName={toolName} />;
  }

  // 无结果
  if (!result) return null;

  // 错误结果
  if (result.error) {
    return (
      <div className="bg-[#FF6B6B]/10 border-2 border-[#FF6B6B]/30 rounded-xl px-4 py-3 max-w-[280px]">
        <div className="flex items-center gap-2">
          <span className="text-base">抱歉</span>
          <span className="text-xs font-bold text-[#FF6B6B]">{result.error}</span>
        </div>
      </div>
    );
  }

  // 根据工具类型渲染对应卡片
  switch (toolName) {
    case 'getMaterial':
      if (result.title) {
        return <MaterialCard result={result} />;
      }
      return null;

    case 'searchDiaries':
      if (Array.isArray(result)) {
        return <DiarySearchCard results={result} />;
      }
      return null;

    case 'getDiaryDetail':
      if (result.content || result.date) {
        return <DiaryDetailCard result={result} />;
      }
      return null;

    case 'explainConcept':
      if (result.explanation) {
        return <ExplainConceptCard result={result} />;
      }
      return null;

    // 静默工具不渲染
    case 'saveMemory':
    case 'getMemories':
      return null;

    default:
      // 未知工具类型，显示 JSON
      return (
        <div className="bg-gray-100 border-2 border-gray-200 rounded-xl p-3 max-w-[280px]">
          <p className="text-xs text-gray-500 mb-1">工具: {toolName}</p>
          <pre className="text-xs text-gray-700 overflow-auto max-h-32">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      );
  }
};

export default ToolResultCard;
