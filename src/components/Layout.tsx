import React, { useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import BottomNav from "./BottomNav";
import { Icons, GRADE_LEVELS, LoadingScreen } from "../constants";
import cannedIpUrl from "../assets/canned-ip.svg";
import { useDiary } from "../contexts/DiaryContext";
import { StreakSheet, GradeSelectionSheet } from "./shared";

const Layout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    streakCount,
    diaries,
    gradeLevel,
    setGradeLevel,
    isSealing,
    checkinStatus,
    loadingCheckin,
    handleCheckin,
  } = useDiary();

  const [openSheet, setOpenSheet] = useState<"streak" | "grade" | null>(null);

  // 根据当前路由确定 activeTab
  const getActiveTab = (): "home" | "library" | "chat" => {
    if (location.pathname.startsWith("/library")) return "library";
    if (location.pathname.startsWith("/chat")) return "chat";
    return "home";
  };
  const activeTab = getActiveTab();

  // 判断是否显示底部导航（详情页不显示）
  const isDetailPage =
    location.pathname.startsWith("/diary/") ||
    location.pathname.startsWith("/material/") ||
    location.pathname.startsWith("/surprise/");

  // 判断是否是聊天页面（聊天页面有特殊布局）
  const isChatPage = location.pathname.startsWith("/chat");

  const handleTabChange = (tab: "home" | "library" | "chat") => {
    switch (tab) {
      case "home":
        navigate("/");
        break;
      case "library":
        navigate("/library");
        break;
      case "chat":
        navigate("/chat");
        break;
    }
  };

  // 获取 header 右侧按钮
  const renderHeaderAction = () => {
    switch (activeTab) {
      case "home":
        return (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setOpenSheet("grade")}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-full border-b-4 font-black text-sm transition-all active:translate-y-1 active:border-b-0 bg-white border-[#E8E4D8] text-[#8B7355]"
            >
              <span>{GRADE_LEVELS.find((g) => g.id === gradeLevel)?.name}</span>
              <Icons.ChevronDown size={14} color="#8B7355" />
            </button>
            <button
              onClick={() => setOpenSheet("streak")}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full border-b-4 font-black text-sm transition-all active:translate-y-1 active:border-b-0 ${
                streakCount > 0
                  ? "bg-[#FF9500] border-[#E07800] text-white"
                  : "bg-white border-[#E8E4D8] text-gray-300"
              }`}
            >
              <Icons.CheckinSpark size={18} active={streakCount > 0} />
              <span>{streakCount}</span>
            </button>
          </div>
        );
      case "library":
        return (
          <button
            onClick={() => setOpenSheet("grade")}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-full border-b-4 font-black text-sm transition-all active:translate-y-1 active:border-b-0 bg-white border-[#E8E4D8] text-[#8B7355]"
          >
            <span>{GRADE_LEVELS.find((g) => g.id === gradeLevel)?.name}</span>
            <Icons.ChevronDown size={14} color="#8B7355" />
          </button>
        );
      case "chat":
        return (
          <button
            onClick={() => setOpenSheet("grade")}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-full border-b-4 font-black text-sm transition-all active:translate-y-1 active:border-b-0 bg-white border-[#E8E4D8] text-[#8B7355]"
          >
            <span>{GRADE_LEVELS.find((g) => g.id === gradeLevel)?.name}</span>
            <Icons.ChevronDown size={14} color="#8B7355" />
          </button>
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-md mx-auto h-[100dvh] bg-[#F0EDE5] overflow-hidden flex flex-col relative">
      <StreakSheet
        isOpen={openSheet === "streak"}
        onClose={() => setOpenSheet(null)}
        streakCount={streakCount}
        totalEntries={diaries.length}
        recentDates={diaries.map((d) => d.date)}
        hasCheckedInToday={checkinStatus?.hasCheckedInToday}
        checkinStreak={checkinStatus?.streak}
        onCheckin={handleCheckin}
        loadingCheckin={loadingCheckin}
      />
      <GradeSelectionSheet
        isOpen={openSheet === "grade"}
        onClose={() => setOpenSheet(null)}
        selectedGrade={gradeLevel}
        onSelect={setGradeLevel}
      />

      {isSealing && (
        <div className="fixed inset-0 z-[100] bg-[#FFFDF5] flex items-center justify-center p-10 animate-in fade-in duration-500 max-w-md mx-auto">
          <LoadingScreen message="罐头制作中……" imageType="creating" />
        </div>
      )}

      {/* Header - 详情页和聊天页不显示 */}
      {!isDetailPage && !isChatPage && (
        <header className="px-5 py-5 flex justify-between items-center bg-white border-b-2 border-[#E8E4D8] shrink-0 z-20">
          <div className="flex items-center gap-3">
            <img src={cannedIpUrl} width={40} height={46} alt="" />
            <h1 className="text-xl font-extrabold text-[#58CC02] tracking-tighter">
              罐头日记
            </h1>
          </div>
          {renderHeaderAction()}
        </header>
      )}

      {/* Main Content */}
      <main
        className={`flex-1 flex flex-col min-h-0 overflow-hidden relative ${
          isDetailPage || isChatPage ? "p-0" : "p-6 pt-4 gap-4 pb-[100px]"
        }`}
      >
        <Outlet />
      </main>

      {/* Bottom Navigation - 详情页不显示 */}
      {!isDetailPage && (
        <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto z-50">
          <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />
        </div>
      )}
    </div>
  );
};

export default Layout;
