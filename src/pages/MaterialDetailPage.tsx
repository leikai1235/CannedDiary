import React from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { MATERIAL_CATEGORIES } from "../constants";
import cannedIpUrl from "../assets/canned-ip.svg";
import { useDiary } from "../contexts/DiaryContext";
import { normalizeCategory } from "../types";

const MaterialDetailPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const from = searchParams.get("from");
  const diaryId = searchParams.get("diaryId");
  const surpriseDate = searchParams.get("surpriseDate");

  const { categoryMaterials, diaries, surprises } = useDiary();

  // 尝试从不同来源获取素材
  let material = categoryMaterials.find((m) => m.id === id);

  // 如果是从日记来的，尝试从日记的 feedback 中获取素材
  if (!material && diaryId) {
    const diary = diaries.find((d) => d.id === diaryId);
    if (diary?.feedback?.material?.id === id) {
      material = diary.feedback.material;
    }
  }

  // 如果是从惊喜来的，尝试从惊喜的 material 中获取素材
  if (!material && surpriseDate) {
    const surprise = surprises[surpriseDate];
    if (surprise?.material?.id === id) {
      material = surprise.material;
    }
  }

  const handleBack = () => {
    if (from === "diary" && diaryId) {
      navigate(`/diary/${diaryId}`);
    } else if (from === "surprise" && surpriseDate) {
      navigate(`/surprise/${surpriseDate}`);
    } else {
      navigate("/library");
    }
  };

  if (!material) {
    return (
      <div className="absolute inset-0 bg-[#FFFDF5] z-[70] flex flex-col items-center justify-center max-w-md mx-auto">
        <img src={cannedIpUrl} width={100} height={114} alt="" />
        <p className="text-gray-400 font-bold mt-4">找不到这个素材...</p>
        <button
          onClick={handleBack}
          className="mt-4 text-[#58CC02] font-black text-sm border-2 border-[#58CC02] px-6 py-2 rounded-full"
        >
          返回
        </button>
      </div>
    );
  }

  const categoryInfo = MATERIAL_CATEGORIES.find((c) => c.id === normalizeCategory(material!.type));

  return (
    <div className="absolute inset-0 bg-[#FFFDF5] z-[70] flex flex-col animate-in slide-in-from-right duration-300 max-w-md mx-auto overflow-hidden">
      <header className="px-5 py-5 flex justify-between items-center bg-white border-b-2 border-[#E8E4D8] shrink-0">
        <button
          onClick={handleBack}
          className="w-10 h-10 flex items-center justify-center rounded-2xl bg-gray-50 hover:bg-gray-100 transition-colors"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#666"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        </button>
        <h1 className="text-base font-black text-gray-800 truncate max-w-[200px]">
          {material?.title || "素材详情"}
        </h1>
        <div className="w-10"></div>
      </header>
      <div className="flex-1 overflow-y-auto no-scrollbar pb-10">
        {/* 顶部装饰区 */}
        <div
          className="relative h-44 flex items-center justify-center overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${
              categoryInfo?.color || "#FFF8E7"
            } 0%, #FFFFFF 100%)`,
          }}
        >
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-4 right-8 w-24 h-24 rounded-full bg-white/50"></div>
            <div className="absolute bottom-8 left-8 w-16 h-16 rounded-full bg-white/30"></div>
          </div>
          {from === "diary" ? (
            <div className="animate-float">
              <img src={cannedIpUrl} width={90} height={103} alt="" />
            </div>
          ) : (
            <div className="relative z-10 text-center p-6">
              <p className="text-gray-700 font-bold text-lg leading-relaxed line-clamp-4">
                {material.content.slice(0, 60)}...
              </p>
            </div>
          )}
          <div className="washi-tape"></div>
        </div>

        {/* 内容区 */}
        <div className="p-8 space-y-8 relative -mt-8 bg-[#FFFDF5] rounded-t-[2.5rem] shadow-2xl">
          {/* 标题区 */}
          <div className="text-center space-y-2">
            <span className="text-[10px] font-black text-[#FFC800] bg-[#FFF8E1] px-4 py-1 rounded-full uppercase tracking-widest">
              {categoryInfo?.name || material.type}
            </span>
            <h1 className="text-2xl font-extrabold text-gray-800">
              《{material.title}》
            </h1>
            {material.author && (
              <p className="text-gray-400 font-bold text-sm">
                {material.author}
                {material.dynasty && ` · ${material.dynasty}`}
              </p>
            )}
          </div>

          {/* 原文展示 */}
          <div className="relative p-8 scrapbook-card border-none bg-white overflow-hidden shadow-sm">
            <p className="text-center text-xl font-extrabold text-gray-800 leading-relaxed">
              {material.content}
            </p>
            {material.pinyin && (
              <p className="text-center text-sm text-gray-400 mt-3">
                {material.pinyin}
              </p>
            )}
          </div>

          {/* 详细内容 */}
          <div className="space-y-8">
            <section className="space-y-3">
              <h3 className="flex items-center gap-2 font-extrabold text-gray-800 text-sm">
                <span className="w-1.5 h-5 bg-[#58CC02] rounded-full"></span>
                素材详情
              </h3>
              <div className="space-y-4 text-gray-600 font-bold leading-relaxed bg-white p-5 rounded-2xl border border-dashed border-[#E8E4D8]">
                <p>{material.interpretation}</p>
                <p>{material.background}</p>
              </div>
            </section>

            <section className="bg-[#E5F6FF] p-6 rounded-[2rem] border-b-4 border-[#1CB0F6]">
              <h3 className="text-[#1899D6] font-extrabold text-xs mb-3 flex items-center gap-2">
                素材应用
              </h3>
              <p className="text-gray-800 font-bold text-[15px] leading-relaxed">
                {material.usage}
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MaterialDetailPage;
