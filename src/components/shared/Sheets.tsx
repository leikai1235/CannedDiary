import React from "react";
import { Mood, Weather, GradeLevel } from "../../types";
import { format, subDays } from "date-fns";
import { zhCN } from "date-fns/locale";
import { GRADE_LEVELS } from "../../constants";
import MoodCircle from "./MoodCircle";
import WeatherIcon from "./WeatherIcon";
import { isSpeechRecognitionSupported } from "../../services/speechService";

export const MOOD_OPTIONS: {
  value: Mood;
  label: string;
  color: string;
  face: string;
}[] = [
  { value: "happy", label: "开心", color: "#FFD700", face: "m-happy" },
  { value: "fulfilled", label: "充实", color: "#FFD700", face: "m-laugh" },
  { value: "smitten", label: "满足", color: "#7CCBFF", face: "m-love" },
  { value: "angry", label: "生气", color: "#FF5C5C", face: "m-angry" },
  { value: "sad", label: "难过", color: "#B5E2FF", face: "m-cry" },
  { value: "excited", label: "惊喜", color: "#A9DF51", face: "m-surprise" },
  { value: "tired", label: "累", color: "#B5E2FF", face: "m-sleep" },
  { value: "annoyed", label: "烦", color: "#A9DF51", face: "m-annoyed" },
  { value: "confused", label: "迷茫", color: "#FFD700", face: "m-confused" },
  { value: "warm", label: "暖心", color: "#FFD700", face: "m-blush" },
  { value: "lucky", label: "幸运", color: "#FFAFAF", face: "m-cool" },
  { value: "pouty", label: "委屈", color: "#A9DF51", face: "m-pouty" },
  { value: "calm", label: "平静", color: "#B5E2FF", face: "m-calm" },
  { value: "sweet", label: "甜蜜", color: "#FFAFAF", face: "m-sweet" },
  { value: "lonely", label: "孤独", color: "#D0D9DE", face: "m-lonely" },
];

export const WEATHER_OPTIONS: {
  value: Weather;
  label: string;
  color: string;
  type: string;
}[] = [
  { value: "sunny", label: "晴", color: "#FFD700", type: "sunny" },
  { value: "cloudy", label: "多云", color: "#FFF", type: "cloudy" },
  { value: "overcast", label: "阴", color: "#DDD", type: "overcast" },
  { value: "lightRain", label: "小雨", color: "#7CCBFF", type: "lightRain" },
  { value: "heavyRain", label: "大雨", color: "#7CCBFF", type: "heavyRain" },
  {
    value: "thunderstorm",
    label: "雷雨",
    color: "#7CCBFF",
    type: "thunderstorm",
  },
  { value: "snowy", label: "雪", color: "#E3F6FF", type: "snowy" },
  { value: "windy", label: "风", color: "#C9E1A5", type: "windy" },
  { value: "foggy", label: "雾", color: "#D0D9DE", type: "foggy" },
];

// 选择触发器
export const SelectionTrigger = ({
  label,
  value,
  onClick,
  isPlaceholder,
  type,
  iconData,
}: {
  label: string;
  value: string;
  onClick: () => void;
  isPlaceholder: boolean;
  type: "mood" | "weather";
  iconData?: any;
}) => (
  <button
    onClick={onClick}
    className={`flex-1 bg-white border-2 border-b-4 rounded-2xl px-4 py-2 flex items-center justify-between active:translate-y-1 active:border-b-0 transition-all text-left group ${
      isPlaceholder
        ? "border-[#E8E4D8] border-b-[#DED6C1]"
        : "border-[#58CC02] border-b-[#4CAF00]"
    }`}
  >
    <div className="flex flex-col">
      <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">
        {label}
      </span>
      <div className="flex items-center gap-2">
        <span
          className={`text-sm font-extrabold truncate max-w-[60px] leading-9 ${
            isPlaceholder ? "text-gray-300" : "text-gray-800"
          }`}
        >
          {value}
        </span>
        {!isPlaceholder && iconData && (
          <div className="shrink-0 flex items-center justify-center w-9 h-9">
            {type === "mood" ? (
              <MoodCircle
                color={iconData.color}
                face={iconData.face}
                size={36}
              />
            ) : (
              <WeatherIcon type={iconData.type} size={36} />
            )}
          </div>
        )}
      </div>
    </div>
    <span className="text-[#AFAFAF] text-[10px] font-black group-hover:text-[#58CC02]">
      ▼
    </span>
  </button>
);

// 选择弹出层
export const SelectionSheet = ({
  isOpen,
  onClose,
  title,
  type,
  selectedValue,
  onSelect,
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  type: "mood" | "weather";
  selectedValue: any;
  onSelect: (val: any) => void;
}) => {
  if (!isOpen) return null;
  const options = type === "mood" ? MOOD_OPTIONS : WEATHER_OPTIONS;
  return (
    <>
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-[4px] z-[80] animate-in fade-in"
        onClick={onClose}
      />
      <div className="fixed bottom-0 left-0 right-0 z-[90] bg-white rounded-t-[2.5rem] p-8 pb-14 shadow-2xl animate-in slide-in-from-bottom duration-500 max-w-md mx-auto scrapbook-card border-none">
        <div className="w-16 h-1.5 bg-gray-200 rounded-full mx-auto mb-8" />
        <div className="flex items-center gap-3 mb-10 px-2">
          <span className="w-1.5 h-7 bg-[#58CC02] rounded-full"></span>
          <h3 className="text-xl font-extrabold text-gray-800">{title}</h3>
        </div>
        <div className="grid grid-cols-4 gap-y-8 gap-x-2 max-h-[50vh] overflow-y-auto no-scrollbar pb-6 px-1">
          {options.map((opt) => (
            <button
              key={opt.value}
              onClick={() => {
                onSelect(opt.value);
                onClose();
              }}
              className="flex flex-col items-center gap-2 group"
            >
              <div className="w-12 h-12 flex items-center justify-center">
                {type === "mood" ? (
                  <MoodCircle
                    color={opt.color}
                    face={(opt as any).face}
                    size={48}
                    selected={selectedValue === opt.value}
                  />
                ) : (
                  <WeatherIcon
                    type={(opt as any).type}
                    size={48}
                    selected={selectedValue === opt.value}
                  />
                )}
              </div>
              <span
                className={`text-[12px] font-bold transition-colors ${
                  selectedValue === opt.value
                    ? "text-[#58CC02]"
                    : "text-gray-500"
                }`}
              >
                {opt.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </>
  );
};

// 年级选择 Sheet
export const GradeSelectionSheet = ({
  isOpen,
  onClose,
  selectedGrade,
  onSelect,
}: {
  isOpen: boolean;
  onClose: () => void;
  selectedGrade: GradeLevel;
  onSelect: (grade: GradeLevel) => void;
}) => {
  if (!isOpen) return null;
  return (
    <>
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-[4px] z-[80] animate-in fade-in"
        onClick={onClose}
      />
      <div className="fixed bottom-0 left-0 right-0 z-[90] bg-white rounded-t-[2.5rem] p-8 pb-14 shadow-2xl animate-in slide-in-from-bottom duration-500 max-w-md mx-auto">
        <div className="w-16 h-1.5 bg-gray-200 rounded-full mx-auto mb-8" />
        <div className="flex items-center gap-3 mb-8 px-2">
          <span className="w-1.5 h-7 bg-[#FFC800] rounded-full"></span>
          <h3 className="text-xl font-extrabold text-gray-800">选择年级</h3>
        </div>
        <div className="space-y-4">
          {GRADE_LEVELS.map((grade) => (
            <button
              key={grade.id}
              onClick={() => {
                onSelect(grade.id);
                onClose();
              }}
              className={`w-full p-5 rounded-2xl border-2 border-b-4 flex items-center gap-4 transition-all active:translate-y-1 active:border-b-2 ${
                selectedGrade === grade.id
                  ? "border-[#58CC02] bg-[#E5F6D9]"
                  : "border-[#E8E4D8] bg-white hover:bg-gray-50"
              }`}
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-black text-lg"
                style={{ backgroundColor: grade.color }}
              >
                {grade.id === "lower"
                  ? "低"
                  : grade.id === "middle"
                  ? "中"
                  : "高"}
              </div>
              <div className="flex-1 text-left">
                <h4 className="font-extrabold text-gray-800">{grade.name}</h4>
                <p className="text-xs font-bold text-gray-400">
                  {grade.description}
                </p>
              </div>
              {selectedGrade === grade.id && (
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#58CC02"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              )}
            </button>
          ))}
        </div>
      </div>
    </>
  );
};

// 打卡统计 Sheet
export const StreakSheet = ({
  isOpen,
  onClose,
  streakCount,
  totalEntries,
  recentDates,
  hasCheckedInToday,
  checkinStreak,
  onCheckin,
  loadingCheckin,
}: {
  isOpen: boolean;
  onClose: () => void;
  streakCount: number;
  totalEntries: number;
  recentDates: string[];
  hasCheckedInToday?: boolean;
  checkinStreak?: number;
  onCheckin?: () => Promise<void>;
  loadingCheckin?: boolean;
}) => {
  if (!isOpen) return null;

  // 使用签到系统的连续天数，如果没有则使用日记连续天数
  const displayStreak =
    checkinStreak !== undefined ? checkinStreak : streakCount;

  const getMotivationalMessage = () => {
    if (displayStreak === 0) {
      return { title: "今天还没写日记哦", subtitle: "快来记录今天的故事吧！" };
    } else if (displayStreak === 1) {
      return {
        title: "迈出第一步！",
        subtitle: "坚持就是胜利，明天继续加油！",
      };
    } else if (displayStreak < 7) {
      return {
        title: "小罐罐好开心！",
        subtitle: `已连续打卡 ${displayStreak} 天，继续保持！`,
      };
    } else if (displayStreak < 30) {
      return {
        title: "太厉害了！",
        subtitle: `${displayStreak} 天连续打卡，你是小罐罐的超级好朋友！`,
      };
    } else {
      return {
        title: "传奇打卡王！",
        subtitle: `${displayStreak} 天！小罐罐要给你颁发金罐头勋章！`,
      };
    }
  };

  const handleButtonClick = async () => {
    if (hasCheckedInToday || !onCheckin) {
      onClose();
    } else {
      await onCheckin();
    }
  };

  const message = getMotivationalMessage();

  const getLast7Days = () => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const date = subDays(new Date(), i);
      days.push({
        date: format(date, "yyyy-MM-dd"),
        dayName: format(date, "EEE", { locale: zhCN }),
        dayNum: format(date, "d"),
        isToday: i === 0,
        hasEntry: recentDates.includes(format(date, "yyyy-MM-dd")),
      });
    }
    return days;
  };

  const last7Days = getLast7Days();

  return (
    <>
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-[4px] z-[80] animate-in fade-in"
        onClick={onClose}
      />
      <div className="fixed bottom-0 left-0 right-0 z-[90] bg-white rounded-t-[2.5rem] p-8 pb-14 shadow-2xl animate-in slide-in-from-bottom duration-500 max-w-md mx-auto">
        <div className="w-16 h-1.5 bg-gray-200 rounded-full mx-auto mb-8" />

        <div className="text-center mb-8">
          <div className="relative inline-block mb-4">
            {/* 🔥 emoji 风格火焰图标（多尖头） */}
            <div className={`${displayStreak > 0 ? "animate-bounce" : ""}`}>
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
                {/* 外层火焰 - 橙红色，多个尖头 */}
                <path
                  d="M12 1C12 1 14 4 14 6C14 6 16 4 17 6C18 8 17 10 17 10C17 10 19 9 19 12C19 16 16 20 12 20C8 20 5 16 5 12C5 9 7 10 7 10C7 10 6 8 7 6C8 4 10 6 10 6C10 4 12 1 12 1Z"
                  fill={displayStreak > 0 ? "#FF6B00" : "#CCCCCC"}
                />
                {/* 中层火焰 - 橙色 */}
                <path
                  d="M12 5C12 5 13.5 7 13.5 9C13.5 9 15 8 15.5 10C16 12 15 14 15 14C15 14 16 13 16 15C16 17 14 19 12 19C10 19 8 17 8 15C8 13 9 14 9 14C9 14 8 12 8.5 10C9 8 10.5 9 10.5 9C10.5 7 12 5 12 5Z"
                  fill={displayStreak > 0 ? "#FF9500" : "#D5D5D5"}
                />
                {/* 内层火焰 - 黄色 */}
                <path
                  d="M12 9C12 9 10 12 10 15C10 17 11 18 12 18C13 18 14 17 14 15C14 12 12 9 12 9Z"
                  fill={displayStreak > 0 ? "#FFCC00" : "#E5E5E5"}
                />
                {/* 火焰芯 - 亮黄色 */}
                <path
                  d="M12 13C12 13 11 15 11 16C11 17 11.5 17.5 12 17.5C12.5 17.5 13 17 13 16C13 15 12 13 12 13Z"
                  fill={displayStreak > 0 ? "#FFEE58" : "#F0F0F0"}
                />
              </svg>
            </div>
            {displayStreak >= 7 && (
              <div className="absolute -top-1 -right-1 animate-pulse">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  {/* 星星徽章 */}
                  <path
                    d="M12 2L14.5 9H22L16 13.5L18.5 21L12 16.5L5.5 21L8 13.5L2 9H9.5L12 2Z"
                    fill="#58CC02"
                    stroke="#4CAF00"
                    strokeWidth="2"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            )}
          </div>
          <h2 className="text-4xl font-black text-[#58CC02] mb-2">
            {displayStreak}
          </h2>
          <p className="text-gray-400 font-bold text-sm">连续打卡天数</p>
        </div>

        <div className="bg-[#FFF8E1] rounded-2xl p-5 mb-6 text-center">
          <h3 className="font-extrabold text-gray-800 text-lg mb-1">
            {message.title}
          </h3>
          <p className="text-gray-500 font-bold text-sm">{message.subtitle}</p>
        </div>

        <div className="mb-6">
          <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">
            最近 7 天
          </h4>
          <div className="flex justify-between">
            {last7Days.map((day) => (
              <div key={day.date} className="flex flex-col items-center gap-2">
                <span className="text-[10px] font-bold text-gray-400">
                  {day.dayName}
                </span>
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                    day.hasEntry
                      ? "bg-[#58CC02] text-white shadow-md"
                      : day.isToday
                      ? "bg-white border-2 border-dashed border-[#58CC02] text-[#58CC02]"
                      : "bg-gray-100 text-gray-300"
                  }`}
                >
                  {day.hasEntry ? "✓" : day.dayNum}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-4">
          <div className="flex-1 bg-[#E5F6D9] rounded-2xl p-4 text-center">
            <span className="text-2xl font-black text-[#58CC02]">
              {totalEntries}
            </span>
            <p className="text-xs font-bold text-gray-500 mt-1">总日记数</p>
          </div>
          <div className="flex-1 bg-[#E5F6FF] rounded-2xl p-4 text-center">
            <span className="text-2xl font-black text-[#1CB0F6]">
              {displayStreak}
            </span>
            <p className="text-xs font-bold text-gray-500 mt-1">当前连续</p>
          </div>
        </div>

        <button
          onClick={handleButtonClick}
          disabled={loadingCheckin}
          className={`w-full mt-6 py-4 border-b-[6px] text-white font-extrabold rounded-2xl active:translate-y-1 active:border-b-0 transition-all text-lg shadow-xl ${
            loadingCheckin
              ? "bg-gray-400 border-gray-500 cursor-not-allowed"
              : hasCheckedInToday
              ? "bg-[#4CAF00] border-[#4A9A9D]"
              : "bg-[#58CC02] border-[#4CAF00]"
          }`}
        >
          {loadingCheckin
            ? "签到中..."
            : hasCheckedInToday
            ? "继续加油！"
            : "签到"}
        </button>
      </div>
    </>
  );
};

// 语音输入 Sheet
export const VoiceInputSheet = ({
  isOpen,
  onClose,
  onFinish,
  transcription,
  isListening,
  error,
}: {
  isOpen: boolean;
  onClose: () => void;
  onFinish: () => void;
  transcription: string;
  isListening: boolean;
  error: string | null;
}) => {
  if (!isOpen) return null;

  const isSupported = isSpeechRecognitionSupported();

  return (
    <>
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-[100] animate-in fade-in duration-300"
        onClick={onClose}
      />
      <div className="fixed bottom-0 left-0 right-0 z-[110] bg-white rounded-t-[3rem] p-8 pb-14 shadow-2xl animate-in slide-in-from-bottom duration-500 max-w-md mx-auto flex flex-col items-center">
        <div className="w-12 h-1 bg-gray-200 rounded-full mb-6" />

        {!isSupported ? (
          <div className="text-center mb-8">
            <h3 className="text-lg font-black text-red-500 mb-2">
              不支持语音识别
            </h3>
            <p className="text-sm text-gray-500">
              请使用 Chrome 或 Safari 浏览器
            </p>
          </div>
        ) : error ? (
          <div className="text-center mb-8">
            <h3 className="text-lg font-black text-red-500 mb-2">出错了</h3>
            <p className="text-sm text-gray-500">{error}</p>
          </div>
        ) : (
          <h3 className="text-lg font-black text-gray-800 mb-4 tracking-tighter">
            {isListening ? "大声说出你的想法吧" : "准备中..."}
          </h3>
        )}

        {isListening && (
          <div className="flex items-center justify-center gap-1.5 h-10 mb-6">
            {[0.2, 0.4, 0.1, 0.5, 0.3, 0.6, 0.2].map((delay, i) => (
              <div
                key={i}
                className="w-1.5 bg-[#FFC800] rounded-full voice-bar-anim"
                style={{ animationDelay: `${delay}s`, height: "16px" }}
              />
            ))}
          </div>
        )}

        <div className="w-full bg-gray-50 rounded-2xl p-5 mb-8 min-h-[80px] max-h-[150px] overflow-y-auto">
          <p className="text-gray-700 font-bold text-center leading-relaxed break-words">
            {transcription || (
              <span className="text-gray-300">等待你的声音...</span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-8">
          <button
            onClick={onClose}
            className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center transition-all active:scale-90"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#FF5C5C"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>

          <div className="relative">
            <div
              className={`absolute inset-0 bg-[#FFC800] rounded-full blur-xl opacity-20 scale-150 ${
                isListening ? "animate-pulse" : ""
              }`}
            ></div>
            <div
              className={`w-20 h-20 rounded-full shadow-xl flex items-center justify-center border-4 border-white relative z-10 transition-all ${
                isListening ? "bg-[#FFC800]" : "bg-gray-300"
              }`}
            >
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                <line x1="12" y1="19" x2="12" y2="23"></line>
                <line x1="8" y1="23" x2="16" y2="23"></line>
              </svg>
            </div>
          </div>

          <button
            onClick={onFinish}
            disabled={!transcription}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-all active:scale-90 ${
              transcription ? "bg-green-50" : "bg-gray-100 opacity-50"
            }`}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke={transcription ? "#58CC02" : "#CCC"}
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </button>
        </div>
      </div>
    </>
  );
};

// 提交图标 - 多邻国风格纸飞机
export const SmallCanIcon = ({ active }: { active: boolean }) => (
  <div
    className={`transition-all duration-300 ${
      active ? "-rotate-45 scale-110" : "opacity-40"
    }`}
  >
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      {/* 纸飞机 */}
      <path
        d="M2 21L23 12L2 3V10L17 12L2 14V21Z"
        fill={active ? "white" : "#AAA"}
        stroke={active ? "white" : "#999"}
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  </div>
);
