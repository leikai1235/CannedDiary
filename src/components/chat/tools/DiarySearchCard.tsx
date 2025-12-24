/**
 * 日记搜索结果卡片组件 - searchDiaries 工具结果展示
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';

// 心情配置
const MOOD_CONFIG: Record<string, { emoji: string; color: string }> = {
  happy: { emoji: '乐', color: '#58CC02' },
  excited: { emoji: '喜', color: '#FFC800' },
  calm: { emoji: '静', color: '#1CB0F6' },
  sad: { emoji: '伤', color: '#A0AEC0' },
  angry: { emoji: '怒', color: '#FF6B6B' },
  tired: { emoji: '困', color: '#9B59B6' },
};

interface DiaryItem {
  id?: string;
  date: string;
  mood?: string;
  content: string;
}

interface DiarySearchCardProps {
  results: DiaryItem[];
}

const DiarySearchCard: React.FC<DiarySearchCardProps> = ({ results }) => {
  const navigate = useNavigate();

  if (results.length === 0) {
    return (
      <div className="bg-white/50 border-2 border-dashed border-[#E8E4D8] rounded-xl p-4 max-w-[280px]">
        <div className="flex items-center gap-2 text-gray-400">
          <span className="text-lg">搜</span>
          <span className="text-xs font-bold">没有找到相关日记</span>
        </div>
        <p className="text-xs text-gray-400 mt-2">
          试试换个关键词搜索吧！
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2 max-w-[280px]">
      {/* 标题 */}
      <div className="flex items-center gap-2">
        <span className="text-lg">记</span>
        <span className="text-xs font-bold text-[#58CC02]">
          找到 {results.length} 篇日记
        </span>
      </div>

      {/* 日记列表 */}
      {results.slice(0, 3).map((diary, index) => {
        const moodConfig = diary.mood ? MOOD_CONFIG[diary.mood] : null;

        return (
          <button
            key={diary.id || index}
            onClick={() => diary.id && navigate(`/diary/${diary.id}`)}
            disabled={!diary.id}
            className="w-full text-left bg-white border-2 border-[#E8E4D8] rounded-xl p-3 hover:border-[#58CC02]/50 hover:shadow-sm transition-all group"
          >
            {/* 日期和心情 */}
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs text-gray-400">{diary.date}</p>
              {moodConfig && (
                <span
                  className="text-xs px-2 py-0.5 rounded-full flex items-center gap-1"
                  style={{ backgroundColor: `${moodConfig.color}20`, color: moodConfig.color }}
                >
                  <span>{moodConfig.emoji}</span>
                </span>
              )}
            </div>

            {/* 内容预览 */}
            <p className="text-sm text-gray-700 font-bold line-clamp-2">
              {diary.content?.slice(0, 50)}{diary.content && diary.content.length > 50 ? '...' : ''}
            </p>

            {/* 查看提示 */}
            {diary.id && (
              <p className="text-xs text-[#58CC02] mt-2 font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                查看详情 →
              </p>
            )}
          </button>
        );
      })}

      {/* 更多提示 */}
      {results.length > 3 && (
        <p className="text-xs text-gray-400 text-center">
          还有 {results.length - 3} 篇日记...
        </p>
      )}
    </div>
  );
};

export default DiarySearchCard;
