import React from "react";
import { Icons, COLORS } from "../constants";

interface BottomNavProps {
  activeTab: "home" | "library" | "chat";
  onTabChange: (tab: "home" | "library" | "chat") => void;
}

const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onTabChange }) => {
  return (
    <nav className="bg-white/90 backdrop-blur-md border-t-2 border-[#E8E4D8] px-6 pb-2 pt-4 flex justify-around items-center shadow-[0_-10px_30px_rgba(0,0,0,0.05)] rounded-t-[2.5rem]">
      {/* 聊天 Tab - 放在最左边 */}
      <button
        onClick={() => onTabChange("chat")}
        className="flex flex-col items-center gap-1.5 group w-20 outline-none relative"
      >
        {activeTab === "chat" && (
          <div className="absolute -top-1 w-12 h-1 bg-[#FFC800] rounded-full blur-sm opacity-20 transition-all"></div>
        )}
        <Icons.Chat active={activeTab === "chat"} />
        <span
          className={`text-[10px] font-black tracking-wider transition-all ${
            activeTab === "chat" ? "text-[#FFC800] scale-105" : "text-[#AFAFAF]"
          }`}
        >
          聊天
        </span>
      </button>

      {/* 首页 Tab - 中间 */}
      <button
        onClick={() => onTabChange("home")}
        className="flex flex-col items-center gap-1.5 group w-20 outline-none relative"
      >
        {activeTab === "home" && (
          <div className="absolute -top-1 w-12 h-1 bg-[#58CC02] rounded-full blur-sm opacity-20 transition-all"></div>
        )}
        <Icons.Diary active={activeTab === "home"} />
        <span
          className={`text-[10px] font-black tracking-wider transition-all ${
            activeTab === "home" ? "text-[#58CC02] scale-105" : "text-[#AFAFAF]"
          }`}
        >
          首页
        </span>
      </button>

      {/* 素材库 Tab - 最右边 */}
      <button
        onClick={() => onTabChange("library")}
        className="flex flex-col items-center gap-1.5 group w-20 outline-none relative"
      >
        {activeTab === "library" && (
          <div className="absolute -top-1 w-12 h-1 bg-[#1CB0F6] rounded-full blur-sm opacity-20 transition-all"></div>
        )}
        <Icons.Library active={activeTab === "library"} />
        <span
          className={`text-[10px] font-black tracking-wider transition-all ${
            activeTab === "library"
              ? "text-[#1CB0F6] scale-105"
              : "text-[#AFAFAF]"
          }`}
        >
          素材库
        </span>
      </button>
    </nav>
  );
};

export default BottomNav;
