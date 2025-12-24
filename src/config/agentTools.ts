/**
 * Agent 工具配置
 * 定义所有可用的 AI 工具及其处理逻辑
 */

import { DiaryEntry, Mood } from '../types';
import { chatDb } from '../services/chatDb';

// 工具名称常量
export const TOOL_NAMES = {
  SAVE_MEMORY: 'saveMemory',
  GET_MEMORIES: 'getMemories',
  SEARCH_DIARIES: 'searchDiaries',
  GET_DIARY_DETAIL: 'getDiaryDetail',
  GET_MATERIAL: 'getMaterial',
  EXPLAIN_CONCEPT: 'explainConcept'
} as const;

// 静默工具列表（不在 UI 显示）
export const SILENT_TOOLS = [
  TOOL_NAMES.SAVE_MEMORY,
  TOOL_NAMES.GET_MEMORIES
];

// 工具参数类型定义
export interface SaveMemoryArgs {
  type: 'preference' | 'habit' | 'event' | 'emotion';
  content: string;
  tags?: string[];
}

export interface GetMemoriesArgs {
  query?: string;
  limit?: number;
}

export interface SearchDiariesArgs {
  keyword?: string;
  mood?: string;
  limit?: number;
}

export interface GetDiaryDetailArgs {
  date: string;
}

export interface GetMaterialArgs {
  topic: string;
  category?: 'literature' | 'poetry' | 'quote' | 'news' | 'encyclopedia';
}

export interface ExplainConceptArgs {
  question: string;
  gradeLevel?: 'lower' | 'middle' | 'upper';
}

// 工具调用类型
export type ToolCallArgs =
  | { toolName: 'saveMemory'; args: SaveMemoryArgs }
  | { toolName: 'getMemories'; args: GetMemoriesArgs }
  | { toolName: 'searchDiaries'; args: SearchDiariesArgs }
  | { toolName: 'getDiaryDetail'; args: GetDiaryDetailArgs }
  | { toolName: 'getMaterial'; args: GetMaterialArgs }
  | { toolName: 'explainConcept'; args: ExplainConceptArgs };

// 工具处理器接口
export interface ToolHandlers {
  saveMemory: (args: SaveMemoryArgs) => Promise<{ success: boolean }>;
  getMemories: (query?: string, limit?: number) => Promise<any[]>;
  diaries: DiaryEntry[];
}

/**
 * 创建工具调用处理器
 */
export function createToolCallHandler(handlers: ToolHandlers) {
  return async ({ toolCall }: { toolCall: { toolName: string; args: any } }) => {
    const { toolName, args } = toolCall;

    switch (toolName) {
      // 记忆工具 - 前端处理
      case TOOL_NAMES.SAVE_MEMORY: {
        const result = await handlers.saveMemory({
          type: args.type,
          content: args.content,
          tags: args.tags || []
        });
        return result;
      }

      case TOOL_NAMES.GET_MEMORIES: {
        const memories = await handlers.getMemories(args.query, args.limit);
        return memories;
      }

      // 日记工具 - 从 IndexedDB 获取
      case TOOL_NAMES.SEARCH_DIARIES: {
        const keyword = args.keyword || '';
        const mood = args.mood as Mood | undefined;
        const limit = args.limit || 5;

        try {
          const results = await chatDb.searchDiaries(keyword, mood);
          return results.slice(0, limit).map(d => ({
            date: d.date,
            mood: d.mood,
            content: d.content.slice(0, 100) + (d.content.length > 100 ? '...' : '')
          }));
        } catch (error) {
          console.error('Failed to search diaries:', error);
          // 降级：使用传入的 diaries
          let results = [...handlers.diaries];
          if (keyword) {
            results = results.filter(d =>
              d.content.toLowerCase().includes(keyword.toLowerCase())
            );
          }
          if (mood) {
            results = results.filter(d => d.mood === mood);
          }
          return results.slice(0, limit).map(d => ({
            date: d.date,
            mood: d.mood,
            content: d.content.slice(0, 100) + (d.content.length > 100 ? '...' : '')
          }));
        }
      }

      case TOOL_NAMES.GET_DIARY_DETAIL: {
        try {
          const diary = await chatDb.getDiaryByDate(args.date);
          if (diary) {
            return {
              date: diary.date,
              mood: diary.mood,
              content: diary.content,
              weather: diary.weather
            };
          }
          return { error: '未找到该日记' };
        } catch (error) {
          console.error('Failed to get diary detail:', error);
          // 降级：使用传入的 diaries
          const diary = handlers.diaries.find(d => d.date === args.date);
          if (diary) {
            return {
              date: diary.date,
              mood: diary.mood,
              content: diary.content,
              weather: diary.weather
            };
          }
          return { error: '未找到该日记' };
        }
      }

      // getMaterial 和 explainConcept 由后端处理
      default:
        return null;
    }
  };
}

// 快捷提问选项
export const QUICK_PROMPTS = [
  '今天心情怎么样？',
  '帮我找找之前的日记',
  '推荐一个好词好句',
  '给我讲个有趣的知识'
];

// API 配置
export const CHAT_API_URL = 'http://localhost:3001/api/chat';
