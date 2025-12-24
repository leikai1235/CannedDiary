/**
 * 日记详情卡片组件 - getDiaryDetail 工具结果展示
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';

// 心情配置
const MOOD_CONFIG: Record<string, { emoji: string; color: string; label: string }> = {
  happy: { emoji: '乐', color: '#58CC02', label: '开心' },
  excited: { emoji: '喜', color: '#FFC800', label: '兴奋' },
  calm: { emoji: '静', color: '#1CB0F6', label: '平静' },
  sad: { emoji: '伤', color: '#A0AEC0', label: '难过' },
  angry: { emoji: '怒', color: '#FF6B6B', label: '生气' },
  tired: { emoji: '困', color: '#9B59B6', label: '疲惫' },
};

// 天气配置
const WEATHER_CONFIG: Record<string, { emoji: string }> = {
  sunny: { emoji: '晴' },
  cloudy: { emoji: '云' },
  rainy: { emoji: '雨' },
  snowy: { emoji: '雪' },
  windy: { emoji: '风' },
};

interface DiaryDetailResult {
  id?: string;
  date: string;
  mood?: string;
  weather?: string;
  content: string;
  error?: string;
}

interface DiaryDetailCardProps {
  result: DiaryDetailResult;
}

const DiaryDetailCard: React.FC<DiaryDetailCardProps> = ({ result }) => {
  const navigate = useNavigate();

  // 错误状态
  if (result.error) {
    return (
      <div className="bg-white/50 border-2 border-dashed border-[#E8E4D8] rounded-xl p-4 max-w-[280px]">
        <div className="flex items-center gap-2 text-gray-400">
          <span className="text-lg">记</span>
          <span className="text-xs font-bold">{result.error}</span>
        </div>
      </div>
    );
  }

  const moodConfig = result.mood ? MOOD_CONFIG[result.mood] : null;
  const weatherConfig = result.weather ? WEATHER_CONFIG[result.weather] : null;

  return (
    <button
      onClick={() => result.id && navigate(`/diary/${result.id}`)}
      disabled={!result.id}
      className="text-left bg-white border-2 border-[#E8E4D8] rounded-xl p-4 max-w-[280px] hover:border-[#58CC02]/50 hover:shadow-md transition-all group"
    >
      {/* 头部信息 */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">记</span>
          <span className="text-xs text-gray-400 font-bold">{result.date}</span>
        </div>

        <div className="flex items-center gap-1">
          {/* 天气 */}
          {weatherConfig && (
            <span className="text-sm">{weatherConfig.emoji}</span>
          )}

          {/* 心情 */}
          {moodConfig && (
            <span
              className="text-xs px-2 py-0.5 rounded-full flex items-center gap-1"
              style={{ backgroundColor: `${moodConfig.color}20`, color: moodConfig.color }}
            >
              <span>{moodConfig.emoji}</span>
              <span className="font-bold">{moodConfig.label}</span>
            </span>
          )}
        </div>
      </div>

      {/* 分隔线 */}
      <div className="h-px bg-[#E8E4D8] mb-3"></div>

      {/* 日记内容 */}
      <p className="text-sm text-gray-700 font-bold leading-relaxed line-clamp-4">
        {result.content}
      </p>

      {/* 查看详情提示 */}
      {result.id && (
        <div className="mt-3 pt-2 border-t border-[#E8E4D8] flex items-center justify-between">
          <span className="text-xs text-gray-400">
            共 {result.content?.length || 0} 字
          </span>
          <span className="text-xs text-[#1CB0F6] font-bold group-hover:text-[#58CC02] transition-colors">
            查看完整内容 →
          </span>
        </div>
      )}
    </button>
  );
};

export default DiaryDetailCard;
