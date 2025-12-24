import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Icons } from "../constants";
import cannedIpUrl from "../assets/canned-ip.svg";
import { useDiary } from "../contexts/DiaryContext";

const SurpriseDetailPage: React.FC = () => {
  const navigate = useNavigate();
  const { date } = useParams<{ date: string }>();
  const { surprises } = useDiary();

  const surprise = date ? surprises[date] : null;

  if (!surprise) {
    return (
      <div className="absolute inset-0 bg-[#FFFDF5] z-[70] flex flex-col items-center justify-center max-w-md mx-auto">
        <img src={cannedIpUrl} width={100} height={114} alt="" />
        <p className="text-gray-400 font-bold mt-4">找不到这个惊喜...</p>
        <button
          onClick={() => navigate("/")}
          className="mt-4 text-[#58CC02] font-black text-sm border-2 border-[#58CC02] px-6 py-2 rounded-full"
        >
          返回首页
        </button>
      </div>
    );
  }

  const renderContentWithMaterialLink = (
    content: string,
    material: typeof surprise.material
  ) => {
    if (!material) return content;

    const materialLinkPattern = /【《([^》]+)》】/g;
    const parts: (string | React.ReactNode)[] = [];
    let lastIndex = 0;
    let match;
    let keyIndex = 0;

    while ((match = materialLinkPattern.exec(content)) !== null) {
      if (match.index > lastIndex) {
        parts.push(content.slice(lastIndex, match.index));
      }

      const materialTitle = match[1];
      parts.push(
        <button
          key={`material-link-${keyIndex++}`}
          onClick={() => {
            navigate(
              `/material/${material.id}?from=surprise&surpriseDate=${date}`
            );
          }}
          className="inline-flex items-center gap-1 text-[#1CB0F6] font-extrabold underline decoration-2 underline-offset-2 hover:text-[#0D8ED9] transition-colors"
        >
          <Icons.Book size={16} />
          <span>《{materialTitle}》</span>
        </button>
      );

      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < content.length) {
      parts.push(content.slice(lastIndex));
    }

    return parts.length > 0 ? parts : content;
  };

  return (
    <div className="absolute inset-0 bg-[#FFFDF5] z-[70] flex flex-col animate-in slide-in-from-right duration-300 max-w-md mx-auto overflow-hidden">
      <header className="px-5 py-5 flex justify-between items-center bg-white border-b-2 border-[#E8E4D8] shrink-0">
        <button
          onClick={() => navigate("/")}
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
        <h1 className="text-lg font-extrabold text-gray-800 truncate max-w-[200px]">
          {surprise.title}
        </h1>
        <div className="w-10"></div>
      </header>
      <div className="flex-1 overflow-y-auto no-scrollbar">
        <div className="p-8 flex flex-col items-center space-y-6 pt-16">
          {/* 惊喜内容卡片 */}
          <div className="scrapbook-card w-full p-8 space-y-6 relative bg-white border-[#FFC800] border-b-8 shadow-2xl">
            <div className="absolute -top-10 left-1/2 -translate-x-1/2">
              <img src={cannedIpUrl} width={80} height={91} alt="" />
            </div>
            <div className="text-center pt-4">
              <span className="text-[10px] font-black text-[#FFC800] bg-[#FFF8E1] px-4 py-1 rounded-full uppercase tracking-widest mb-2 inline-block">
                DAILY SURPRISE
              </span>
              <h3 className="text-2xl font-extrabold text-gray-800">
                {surprise.title}
              </h3>
            </div>
            <div className="text-[16px] text-gray-600 font-bold leading-relaxed text-center whitespace-pre-line">
              {renderContentWithMaterialLink(
                surprise.fullContent,
                surprise.material
              )}
            </div>
          </div>

          <button
            onClick={() => navigate("/")}
            className="px-10 py-4 bg-[#FFC800] border-b-[6px] border-[#E5A500] text-white font-extrabold rounded-2xl active:translate-y-1 active:border-b-0 transition-all text-lg shadow-xl"
          >
            装进罐头
          </button>
        </div>
      </div>
    </div>
  );
};

export default SurpriseDetailPage;
