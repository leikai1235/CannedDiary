import React from "react";
import { GradeLevel, MaterialCategory } from "./types";

// 导入图标资源
import chatAvatarIcon from "./assets/chat-avatar.png";

// 从图标组件文件导入
import {
  SpinningCan,
  LoadingScreen,
  DiaryIcon,
  LibraryIcon,
  ChatIcon,
  SurpriseStarIcon,
  CheckinSparkIcon,
  DiaryMarkIcon,
  ChevronDownIcon,
  BookIcon,
  ContinueChatIcon,
  LiteratureIcon,
  PoetryIcon,
  QuoteIcon,
  NewsIcon,
  EncyclopediaIcon,
} from "./components/icons";

// 重新导出图标组件
export { SpinningCan, LoadingScreen };

// 导出图标资源
export const IconAssets = {
  chatAvatar: chatAvatarIcon,
};

export const COLORS = {
  primary: "#58CC02",
  primaryDark: "#4CAF00",
  secondary: "#FFC800",
  accent: "#1CB0F6",
  accentDark: "#1899D6",
  border: "#DED6C1",
  bg: "#F7F9F2",
  kraft: "#E7D5B6",
  canBody: "#B5E2C5",
};

// 图标集合 - 使用导入的图标组件
export const Icons = {
  Diary: DiaryIcon,
  Library: LibraryIcon,
  Chat: ChatIcon,
  SurpriseStar: SurpriseStarIcon,
  CheckinSpark: CheckinSparkIcon,
  DiaryMark: DiaryMarkIcon,
  ChevronDown: ChevronDownIcon,
  Book: BookIcon,
  ContinueChat: ContinueChatIcon,
};

// 5大素材分类配置
export const MATERIAL_CATEGORIES: Array<{
  id: MaterialCategory;
  name: string;
  icon: React.ReactNode;
  color: string;
  activeColor: string;
}> = [
  {
    id: "literature",
    name: "文学常识",
    icon: <LiteratureIcon />,
    color: "#FFF8E7",
    activeColor: "#FFC800",
  },
  {
    id: "poetry",
    name: "诗词成语",
    icon: <PoetryIcon />,
    color: "#F0FFF0",
    activeColor: "#58CC02",
  },
  {
    id: "quote",
    name: "名人名言",
    icon: <QuoteIcon />,
    color: "#FFF0F0",
    activeColor: "#FF6B6B",
  },
  {
    id: "news",
    name: "热点时事",
    icon: <NewsIcon />,
    color: "#E8F7FF",
    activeColor: "#1CB0F6",
  },
  {
    id: "encyclopedia",
    name: "人文百科",
    icon: <EncyclopediaIcon />,
    color: "#F5EFFF",
    activeColor: "#9B59B6",
  },
];

// 年级配置
export const GRADE_LEVELS: Array<{
  id: GradeLevel;
  name: string;
  range: string;
  description: string;
  color: string;
}> = [
  {
    id: "lower",
    name: "低年级",
    range: "1-3年级",
    description: "适合小学1-3年级的小罐头",
    color: "#58CC02",
  },
  {
    id: "middle",
    name: "中年级",
    range: "4-6年级",
    description: "适合小学4-6年级的中罐头",
    color: "#FFC800",
  },
  {
    id: "upper",
    name: "高年级",
    range: "初中",
    description: "适合初一-初三的大罐头",
    color: "#1CB0F6",
  },
];
