import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { MATERIAL_CATEGORIES, Icons } from "../constants";
import { LightbulbIcon } from "../components/icons";
import cannedIpUrl from "../assets/canned-ip.svg";
import { useDiary } from "../contexts/DiaryContext";
import { Material, normalizeCategory } from "../types";

const DiaryDetailPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { diaries } = useDiary();

  const diary = diaries.find((d) => d.id === id);

  if (!diary) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <img src={cannedIpUrl} width={100} height={114} alt="" />
        <p className="text-gray-400 font-bold mt-4">找不到这篇日记...</p>
        <button
          onClick={() => navigate("/")}
          className="mt-4 text-[#58CC02] font-black text-sm border-2 border-[#58CC02] px-6 py-2 rounded-full"
        >
          返回首页
        </button>
      </div>
    );
  }

  const parseResponse = (text: string, material: Material | undefined) => {
    if (!text) return null;
    return text
      .split("\n")
      .filter((p) => p.trim())
      .map((paragraph, pIdx) => {
        // 匹配 [[标题]]、【《标题》】、「《标题》」 三种格式
        const parts = paragraph.split(/(\[\[.*?\]\]|【《[^》]+》】|「《[^》]+》」)/g);
        return (
          <p
            key={pIdx}
            className="mb-4 text-[16px] text-gray-800 font-extrabold leading-[1.8] tracking-tight"
            style={{ textIndent: '2em' }}
          >
            {parts.map((part, index) => {
              // 匹配 [[标题]] 格式
              if (part.startsWith("[[") && part.endsWith("]]")) {
                const title = part.slice(2, -2);
                return (
                  <button
                    key={index}
                    onClick={() => {
                      if (material) {
                        navigate(`/material/${material.id}?from=diary&diaryId=${diary.id}`);
                      }
                    }}
                    className="inline-flex items-center gap-1 text-[#1CB0F6] font-extrabold underline decoration-[2.5px] underline-offset-4 hover:text-[#1899D6] transition-colors"
                  >
                    <Icons.Book size={16} />
                    <span>《{title}》</span>
                  </button>
                );
              }
              // 匹配 【《标题》】 格式
              if (part.startsWith("【《") && part.endsWith("》】")) {
                const title = part.slice(2, -2);
                return (
                  <button
                    key={index}
                    onClick={() => {
                      if (material) {
                        navigate(`/material/${material.id}?from=diary&diaryId=${diary.id}`);
                      }
                    }}
                    className="inline-flex items-center gap-1 text-[#1CB0F6] font-extrabold underline decoration-[2.5px] underline-offset-4 hover:text-[#1899D6] transition-colors"
                  >
                    <Icons.Book size={16} />
                    <span>{title}</span>
                  </button>
                );
              }
              // 匹配 「《标题》」 格式
              if (part.startsWith("「《") && part.endsWith("》」")) {
                const title = part.slice(2, -2);
                return (
                  <button
                    key={index}
                    onClick={() => {
                      if (material) {
                        navigate(`/material/${material.id}?from=diary&diaryId=${diary.id}`);
                      }
                    }}
                    className="inline-flex items-center gap-1 text-[#1CB0F6] font-extrabold underline decoration-[2.5px] underline-offset-4 hover:text-[#1899D6] transition-colors"
                  >
                    <Icons.Book size={16} />
                    <span>{title}</span>
                  </button>
                );
              }
              return <span key={index}>{part}</span>;
            })}
          </p>
        );
      });
  };

  return (
    <div className="absolute inset-0 bg-[#F0EDE5] z-[60] flex flex-col animate-in slide-in-from-right duration-300 max-w-md mx-auto overflow-hidden">
      <header className="px-5 py-5 flex justify-between items-center bg-white border-b-2 border-[#E8E4D8] shrink-0">
        <button
          onClick={() => navigate("/")}
          className="w-10 h-10 flex items-center justify-center rounded-2xl hover:bg-gray-100 transition-colors"
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
<img src={cannedIpUrl} width={36} height={41} alt="" />
        <div className="w-10"></div>
      </header>
      <div className="flex-1 p-5 overflow-y-auto no-scrollbar space-y-5">
        <div className="bg-white rounded-[2.5rem] border-2 border-b-8 border-[#E8E4D8] overflow-hidden shadow-xl flex flex-col min-h-[480px]">
          <section className="p-8 pb-4 border-b border-dashed border-gray-100 relative bg-[#FFFDF5]">
            <div className="flex items-center gap-2 mb-4">
              <span className="w-1 h-3 bg-gray-200 rounded-full"></span>
              <h3 className="text-[11px] font-black text-gray-300 uppercase tracking-widest">
                我的日记
              </h3>
            </div>
            <p className="text-[16px] text-gray-400 font-bold leading-[1.8] italic">
              {diary.content}
            </p>
          </section>
          <section className="p-8 pt-10 flex-1 relative bg-white">
            <div className="absolute -top-10 right-8">
              <img src={cannedIpUrl} width={64} height={73} alt="" />
            </div>
            <div className="flex items-center gap-2 mb-4">
              <span className="w-1.5 h-4 bg-[#58CC02] rounded-full"></span>
              <h3 className="text-[11px] font-black text-[#58CC02] uppercase tracking-widest">
                惊喜加料
              </h3>
            </div>
            <div className="text-justify">
              {diary.feedback
                ? parseResponse(
                    diary.feedback.emotion_response,
                    diary.feedback.material
                  )
                : "正在整理思绪..."}
            </div>
          </section>
        </div>

        {/* 素材卡片 */}
        {diary.feedback?.material && (
          <div className="bg-white rounded-2xl border-2 border-b-4 border-[#E8E4D8] overflow-hidden shadow-lg">
            <div className="px-5 py-3 bg-gradient-to-r from-[#FFF8E1] to-[#E5F6FF] border-b border-[#E8E4D8]">
              <div className="flex items-center gap-2">
                <LightbulbIcon size={20} />
                <h4 className="text-xs font-black text-gray-600 uppercase tracking-wider">
                  素材小锦囊
                </h4>
              </div>
            </div>
            <button
              onClick={() =>
                navigate(`/material/${diary.feedback!.material.id}?from=diary&diaryId=${diary.id}`)
              }
              className="w-full p-4 text-left hover:bg-gray-50 transition-colors group"
            >
              <div className="flex items-start gap-4">
                {(() => {
                  const normalizedType = normalizeCategory(diary.feedback!.material.type);
                  const categoryInfo = MATERIAL_CATEGORIES.find(c => c.id === normalizedType);
                  return (
                    <div
                      className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0 shadow-md"
                      style={{ backgroundColor: categoryInfo?.activeColor || '#FFC800' }}
                    >
                      {categoryInfo?.icon}
                    </div>
                  );
                })()}
                <div className="flex-1 min-w-0">
                  <h5 className="font-extrabold text-gray-800 group-hover:text-[#1CB0F6] transition-colors">
                    《{diary.feedback.material.title}》
                  </h5>
                  <p className="text-xs text-gray-400 font-bold mt-1">
                    {diary.feedback.material.author}
                    {diary.feedback.material.dynasty &&
                      ` · ${diary.feedback.material.dynasty}`}
                  </p>
                  <p className="text-sm text-gray-500 font-bold mt-2 line-clamp-2 leading-relaxed">
                    {diary.feedback.material.content.length > 60
                      ? diary.feedback.material.content.slice(0, 60) + "..."
                      : diary.feedback.material.content}
                  </p>
                </div>
                <div className="shrink-0 self-center">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#CCC"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="group-hover:stroke-[#1CB0F6] transition-colors"
                  >
                    <polyline points="9 18 15 12 9 6"></polyline>
                  </svg>
                </div>
              </div>
            </button>
          </div>
        )}

        {/* 继续聊天按钮 */}
        <button
          onClick={() =>
            navigate("/chat", {
              state: {
                diaryContext: {
                  diaryId: diary.id,
                  diaryContent: diary.content,
                  feedback: diary.feedback?.emotion_response,
                  materialTitle: diary.feedback?.material?.title,
                  materialAuthor: diary.feedback?.material?.author,
                  date: diary.date
                }
              }
            })
          }
          className="w-full py-4 bg-gradient-to-r from-[#58CC02] to-[#4CAF00] border-2 border-b-4 border-[#3D9700] rounded-2xl text-white font-black text-sm flex items-center justify-center gap-2 active:border-b-2 active:translate-y-0.5 transition-all shadow-lg"
        >
          <Icons.ContinueChat size={24} />
          <span>继续和小精灵聊天</span>
        </button>

        <button
          onClick={() => navigate("/")}
          className="w-full py-4 bg-white/40 border-2 border-dashed border-[#E8E4D8] rounded-2xl text-[12px] font-black text-[#AFAFAF] uppercase tracking-widest active:bg-white transition-all mb-10"
        >
          返回首页
        </button>
      </div>
    </div>
  );
};

export default DiaryDetailPage;
