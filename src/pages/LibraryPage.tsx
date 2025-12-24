import React from "react";
import { useNavigate } from "react-router-dom";
import { MATERIAL_CATEGORIES } from "../constants";
import cannedIpUrl from "../assets/canned-ip.svg";
import { useDiary } from "../contexts/DiaryContext";

const LibraryPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    selectedCategory,
    setSelectedCategory,
    categoryMaterials,
    loadingMaterials,
    hasMoreMaterials,
    handleScroll,
    materialsContainerRef,
  } = useDiary();

  return (
    <div className="flex-1 flex flex-col animate-in fade-in duration-300 overflow-hidden">
      {/* 顶部分类 Tabs */}
      <div className="shrink-0 mb-4 pt-2">
        <div className="flex justify-between pb-3 overflow-visible">
          {MATERIAL_CATEGORIES.map((cat) => {
            const isActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className="flex flex-col items-center gap-1.5 transition-all flex-1"
              >
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
                    isActive ? "scale-110 shadow-md" : ""
                  }`}
                  style={{
                    backgroundColor: isActive ? cat.color : "#F5F5F5",
                    border: isActive ? `2px solid ${cat.activeColor}` : "2px solid transparent",
                  }}
                >
                  {cat.icon}
                </div>
                <span
                  className={`text-[11px] font-bold transition-colors ${
                    isActive ? "text-gray-800" : "text-gray-400"
                  }`}
                >
                  {cat.name}
                </span>
              </button>
            );
          })}
        </div>
        {/* 分割线 */}
        <div className="h-[2px] bg-[#E8E4D8] rounded-full" />
      </div>

      {/* 素材卡片网格 */}
      <div
        ref={materialsContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto no-scrollbar pb-6"
      >
        <div className="grid grid-cols-2 gap-4">
          {categoryMaterials.map((material) => {
            const categoryInfo = MATERIAL_CATEGORIES.find(
              (c) => c.id === selectedCategory
            );
            return (
              <button
                key={material.id}
                onClick={() => navigate(`/material/${material.id}`)}
                className="bg-white rounded-2xl overflow-hidden border-2 border-b-4 border-[#E8E4D8] hover:translate-y-[-2px] transition-all text-left group"
              >
                {/* 卡片封面 */}
                <div
                  className="aspect-[4/3] flex items-center justify-center relative overflow-hidden"
                  style={{
                    background: `linear-gradient(135deg, ${
                      categoryInfo?.color || "#F5F5F5"
                    } 0%, #FFFFFF 100%)`,
                  }}
                >
                  <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-2 right-2 w-16 h-16 rounded-full bg-white/50"></div>
                    <div className="absolute bottom-4 left-4 w-8 h-8 rounded-full bg-white/30"></div>
                  </div>
                  <div className="text-center p-4 relative z-10">
                    <p className="text-gray-700 font-bold text-sm leading-relaxed line-clamp-3">
                      {material.content.slice(0, 40)}...
                    </p>
                  </div>
                </div>
                {/* 卡片信息 */}
                <div className="p-3">
                  <h4 className="font-extrabold text-gray-800 text-sm truncate group-hover:text-[#58CC02] transition-colors">
                    {material.title}
                  </h4>
                  <p className="text-[10px] font-bold text-gray-400 mt-0.5">
                    {categoryInfo?.name}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* 加载中状态 */}
        {loadingMaterials && (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="animate-float">
              <img src={cannedIpUrl} width={60} height={68} alt="" />
            </div>
            <p className="text-gray-400 font-bold text-sm mt-3">
              正在翻找罐头……
            </p>
          </div>
        )}

        {/* 空状态 */}
        {!loadingMaterials && categoryMaterials.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="opacity-30 mb-4">
              <img src={cannedIpUrl} width={80} height={91} alt="" />
            </div>
            <p className="text-gray-400 font-bold">暂无素材</p>
            <p className="text-gray-300 text-xs mt-1">请稍后再试...</p>
          </div>
        )}

        {/* 加载更多提示 */}
        {!loadingMaterials &&
          categoryMaterials.length > 0 &&
          hasMoreMaterials && (
            <div className="text-center py-4">
              <p className="text-gray-300 text-xs font-bold">
                向下滚动加载更多
              </p>
            </div>
          )}
      </div>
    </div>
  );
};

export default LibraryPage;
