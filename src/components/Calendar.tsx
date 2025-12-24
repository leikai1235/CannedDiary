import React, { useState, useMemo } from "react";
import {
  format,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameDay,
  isToday,
  startOfMonth,
  endOfMonth,
  subMonths,
  addMonths,
} from "date-fns";
import { zhCN } from "date-fns/locale";
import { Icons } from "../constants";

interface CalendarProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  onEntryClick?: (dateStr: string) => void;
  entries: string[];
  surpriseDates?: string[];
}

const Calendar: React.FC<CalendarProps> = ({
  selectedDate,
  onDateSelect,
  onEntryClick,
  entries,
  surpriseDates = [],
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [viewDate, setViewDate] = useState(selectedDate);

  // 计算当前周的 7 天
  const weekDays = useMemo(() => {
    const start = startOfWeek(selectedDate, { weekStartsOn: 1 });
    const end = endOfWeek(selectedDate, { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [selectedDate]);

  // 计算当前月的完整日期
  const monthDays = useMemo(() => {
    const start = startOfMonth(viewDate);
    const end = endOfMonth(viewDate);
    return eachDayOfInterval({ start, end });
  }, [viewDate]);

  // 计算前置空白天数（为了对齐星期）
  const emptyDaysPrefix = useMemo(() => {
    const start = startOfMonth(viewDate);
    const dayOfWeek = (start.getDay() + 6) % 7; // 让周一作为第一天
    return Array.from({ length: dayOfWeek });
  }, [viewDate]);

  return (
    <div
      className={`bg-[#FFFDF5] rounded-[1.5rem] p-4 border-2 border-[#E8E4D8] border-b-8 shadow-sm transition-all duration-500 ease-in-out relative ${
        isExpanded ? "h-auto z-50" : "h-40 overflow-hidden"
      }`}
    >
      <div className="flex justify-between items-center mb-3 px-1">
        <div className="flex items-center gap-2">
          <button
            onClick={() => isExpanded && setViewDate(subMonths(viewDate, 1))}
            className={`${
              isExpanded ? "visible" : "invisible"
            } p-1 hover:bg-gray-100 rounded-full`}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#666"
              strokeWidth="2.5"
            >
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
          </button>
          <h2 className="text-sm font-black text-gray-800 flex items-center gap-2">
            {format(isExpanded ? viewDate : selectedDate, "yyyy年 M月")}
          </h2>
          <button
            onClick={() => isExpanded && setViewDate(addMonths(viewDate, 1))}
            className={`${
              isExpanded ? "visible" : "invisible"
            } p-1 hover:bg-gray-100 rounded-full`}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#666"
              strokeWidth="2.5"
            >
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </button>
        </div>

        <button
          onClick={() => {
            setIsExpanded(!isExpanded);
            setViewDate(selectedDate);
          }}
          className="flex items-center gap-1.5 text-[10px] font-black text-[#8C6B4D] uppercase tracking-wider bg-[#E7D5B6]/40 px-3 py-1.5 rounded-full hover:bg-[#E7D5B6]/60 active:scale-95 transition-all"
        >
          {/* <Icons.SearchCan size={16} /> */}
          {isExpanded ? "收起日历" : "翻找旧罐头"}
        </button>
      </div>

      {!isExpanded ? (
        <div className="flex justify-between gap-1 mt-2">
          {weekDays.map((day, i) => {
            const dateStr = format(day, "yyyy-MM-dd");
            const isSel = isSameDay(day, selectedDate);
            const hasEntry = entries.includes(dateStr);
            const hasSurprise = surpriseDates.includes(dateStr);
            const isT = isToday(day);
            const dayName = format(day, "eee", { locale: zhCN }).replace(
              "周",
              ""
            );

            return (
              <button
                key={i}
                onClick={() => onDateSelect(day)}
                className={`
                  flex-1 flex flex-col items-center justify-center py-3 rounded-[1rem] transition-all duration-300 relative
                  ${
                    isSel
                      ? "bg-[#58CC02] text-white border-b-[6px] border-[#4CAF00] translate-y-[-2px] shadow-lg scale-105 z-10"
                      : "bg-white border-2 border-[#E8E4D8] border-b-4 hover:border-[#58CC02]"
                  }
                `}
              >
                <span
                  className={`text-[8px] font-black mb-0.5 ${
                    isSel ? "text-white/80" : "text-gray-400"
                  }`}
                >
                  {dayName}
                </span>

                <span className="text-sm font-black leading-tight">
                  {format(day, "d")}
                </span>

                {/* 有日记时在右上角显示罐头+对号标记，点击进入详情 */}
                {hasEntry && (
                  <div
                    className="absolute -top-2 -right-2 cursor-pointer hover:scale-110 transition-transform z-20"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEntryClick?.(dateStr);
                    }}
                  >
                    <Icons.DiaryMark size={22} />
                  </div>
                )}

                {hasSurprise && !hasEntry && (
                  <div className="absolute -top-2 -left-1">
                    <Icons.SurpriseStar />
                  </div>
                )}

                {/* 当天红点标记 - 始终显示 */}
                {isT && (
                  <div
                    className={`absolute bottom-1 w-1.5 h-1.5 rounded-full ${
                      isSel ? "bg-white" : "bg-[#FF4B4B]"
                    }`}
                  ></div>
                )}
              </button>
            );
          })}
        </div>
      ) : (
        <div className="mt-2 animate-in fade-in slide-in-from-top-2">
          <div className="grid grid-cols-7 gap-1 mb-2">
            {["一", "二", "三", "四", "五", "六", "日"].map((d) => (
              <div
                key={d}
                className="text-center text-[10px] font-black text-gray-400 py-1"
              >
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {emptyDaysPrefix.map((_, i) => (
              <div key={`empty-${i}`} className="h-10" />
            ))}
            {monthDays.map((day, i) => {
              const dateStr = format(day, "yyyy-MM-dd");
              const isSel = isSameDay(day, selectedDate);
              const hasEntry = entries.includes(dateStr);
              const hasSurprise = surpriseDates.includes(dateStr);
              const isT = isToday(day);

              return (
                <button
                  key={i}
                  onClick={() => {
                    onDateSelect(day);
                    setIsExpanded(false);
                  }}
                  className={`
                    h-10 rounded-xl flex flex-col items-center justify-center relative transition-all
                    ${
                      isSel
                        ? "bg-[#58CC02] text-white border-b-4 border-[#4CAF00] z-10"
                        : "hover:bg-[#E8E4D8]/30 border border-transparent"
                    }
                  `}
                >
                  <span
                    className={`text-xs font-black ${
                      isSel ? "text-white" : "text-gray-700"
                    }`}
                  >
                    {format(day, "d")}
                  </span>
                  {/* 有日记时在右上角显示罐头+对号标记，点击进入详情 */}
                  {hasEntry && (
                    <div
                      className="absolute -top-1 -right-1 cursor-pointer hover:scale-110 transition-transform z-20"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEntryClick?.(dateStr);
                        setIsExpanded(false);
                      }}
                    >
                      <Icons.DiaryMark size={16} />
                    </div>
                  )}
                  {hasSurprise && !hasEntry && !isSel && (
                    <div className="absolute top-0 left-0 scale-50">
                      <Icons.SurpriseStar />
                    </div>
                  )}
                  {/* 当天红点标记 - 始终显示 */}
                  {isT && (
                    <div
                      className={`absolute bottom-0.5 w-1 h-1 rounded-full ${
                        isSel ? "bg-white" : "bg-[#FF4B4B]"
                      }`}
                    ></div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {isExpanded && (
        <div
          className="fixed inset-0 bg-black/10 z-[-1]"
          onClick={() => setIsExpanded(false)}
        />
      )}
    </div>
  );
};

export default Calendar;
