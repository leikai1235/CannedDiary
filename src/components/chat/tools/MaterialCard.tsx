/**
 * 素材卡片组件 - getMaterial 工具结果展示
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';

interface MaterialResult {
  id?: string;
  title: string;
  author?: string;
  dynasty?: string;
  content: string;
  interpretation?: string;
  category?: string;
  type?: string; // 服务端可能返回 type 而不是 category
}

interface MaterialCardProps {
  result: MaterialResult;
}

// 根据分类获取图标和颜色
const getCategoryStyle = (category?: string) => {
  switch (category) {
    case 'poetry':
      return { icon: '诗', color: '#58CC02', bgFrom: '#F0FFF0', label: '诗词成语' };
    case 'quote':
      return { icon: '言', color: '#FF6B6B', bgFrom: '#FFF0F0', label: '名人名言' };
    case 'literature':
      return { icon: '文', color: '#FFC800', bgFrom: '#FFF9E6', label: '文学常识' };
    case 'news':
      return { icon: '闻', color: '#1CB0F6', bgFrom: '#E8F7FF', label: '热点时事' };
    case 'encyclopedia':
      return { icon: '识', color: '#9B59B6', bgFrom: '#F5EFFF', label: '人文百科' };
    default:
      return { icon: '材', color: '#FFC800', bgFrom: '#FFF9E6', label: '推荐素材' };
  }
};

const MaterialCard: React.FC<MaterialCardProps> = ({ result }) => {
  const navigate = useNavigate();
  // 支持 category 或 type 字段
  const style = getCategoryStyle(result.category || result.type);

  const handleClick = () => {
    if (result.id) {
      navigate(`/material/${result.id}`);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={!result.id}
      className={`text-left bg-gradient-to-br from-[${style.bgFrom}] to-[#FFFDF5] border-2 rounded-xl p-4 max-w-[280px] shadow-sm transition-all ${
        result.id ? 'hover:shadow-md hover:scale-[1.02] cursor-pointer' : ''
      }`}
      style={{ borderColor: `${style.color}30` }}
    >
      {/* 标签 */}
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">{style.icon}</span>
        <span
          className="text-xs font-bold px-2 py-0.5 rounded-full"
          style={{ backgroundColor: `${style.color}20`, color: style.color }}
        >
          {style.label}
        </span>
      </div>

      {/* 标题 */}
      <h4 className="font-black text-gray-800 text-sm mb-1">
        《{result.title}》
      </h4>

      {/* 作者信息 */}
      {result.author && (
        <p className="text-xs text-gray-500 mb-2">
          {result.dynasty ? `${result.dynasty} · ` : ''}{result.author}
        </p>
      )}

      {/* 内容 */}
      <p className="text-xs text-gray-600 leading-relaxed line-clamp-3">
        {result.content}
      </p>

      {/* 解释/赏析 */}
      {result.interpretation && (
        <p className="text-xs text-gray-400 mt-2 italic line-clamp-2 border-t border-gray-100 pt-2">
          {result.interpretation}
        </p>
      )}

      {/* 查看详情提示 */}
      {result.id && (
        <p className="text-xs mt-2 font-bold" style={{ color: style.color }}>
          点击查看详情 →
        </p>
      )}
    </button>
  );
};

export default MaterialCard;
