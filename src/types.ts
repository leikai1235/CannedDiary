
export type Mood =
  | 'happy' | 'calm' | 'sad' | 'angry' | 'excited'
  | 'fulfilled' | 'smitten' | 'annoyed' | 'lonely'
  | 'confused' | 'warm' | 'sweet' | 'pouty' | 'lucky' | 'tired';

export type Weather =
  | 'sunny' | 'cloudy' | 'overcast' | 'lightRain'
  | 'heavyRain' | 'thunderstorm' | 'snowy' | 'windy' | 'foggy';

// 年级类型
export type GradeLevel = 'lower' | 'middle' | 'upper';
// lower: 1-3年级（低年级）
// middle: 4-6年级（中年级）
// upper: 初中（高年级）

// 素材分类类型（5种）
export type MaterialCategory = 'literature' | 'poetry' | 'quote' | 'news' | 'encyclopedia';
// literature: 文学
// poetry: 诗词
// quote: 名言
// news: 时事
// encyclopedia: 百科

// 旧类型映射（向后兼容）
export type LegacyMaterialType = 'poem' | 'idiom' | 'quote' | 'fact';

// 将旧类型值转换为新类型值
export const normalizeCategory = (type: string): MaterialCategory => {
  const mapping: Record<string, MaterialCategory> = {
    // 旧英文格式
    'Literature Fundamentals': 'literature',
    'Poetry & Idioms': 'poetry',
    'quotes': 'quote',
    'Current Affairs': 'news',
    'Humanities & More': 'encyclopedia',
    // 旧中文格式
    '文学常识': 'literature',
    '诗词成语': 'poetry',
    '名人名言': 'quote',
    '时事热点': 'news',
    '人文百科': 'encyclopedia',
    // 旧简写格式
    'poem': 'poetry',
    'idiom': 'poetry',
    'fact': 'encyclopedia',
  };
  return mapping[type] || (type as MaterialCategory);
};

export interface Material {
  id: string;
  type: MaterialCategory | LegacyMaterialType;
  title: string;
  content: string; // 原文
  pinyin?: string; // 拼音标注
  author?: string; // 作者
  dynasty?: string; // 朝代
  interpretation: string; // 现代译文/释义
  background: string; // 创作背景/来源故事
  usage: string; // 写作应用/用法提示
}

export interface SurpriseContent {
  id: string;
  title: string;
  teaser: string;
  fullContent: string;
  type: 'challenge' | 'fun-fact' | 'creative-prompt';
  material?: Material;
  generatedImage?: string; // AI 生成的配图 URL
}

export interface AIFeedback {
  emotion_response: string;
  material: Material;
  summary: string;
  predicted_mood: Mood;
  predicted_weather: Weather;
  generatedImage?: string; // AI 生成的配图 URL
}

export interface DiaryEntry {
  id: string;
  date: string;
  content: string;
  mood: Mood;
  weather: Weather;
  feedback?: AIFeedback;
}

export interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  hasEntry: boolean;
}
