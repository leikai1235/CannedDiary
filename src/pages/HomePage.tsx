import React, { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { format, isToday, isAfter, startOfToday } from "date-fns";
import Calendar from "../components/Calendar";
import { Icons, LoadingScreen } from "../constants";
import cannedIpUrl from "../assets/canned-ip.svg";
import { useDiary } from "../contexts/DiaryContext";
import {
  SelectionTrigger,
  SelectionSheet,
  VoiceInputSheet,
  SmallCanIcon,
  MOOD_OPTIONS,
  WEATHER_OPTIONS,
} from "../components/shared";
import { speechService } from "../services/speechService";

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const {
    diaries,
    selectedDate,
    setSelectedDate,
    newDiaryContent,
    setNewDiaryContent,
    selectedMood,
    setSelectedMood,
    selectedWeather,
    setSelectedWeather,
    surprises,
    missedDiaryDates,
    isSealing,
    handleSealCan,
    handleOpenSurprise,
    isGeneratingSurprise,
  } = useDiary();

  const [openSheet, setOpenSheet] = useState<"mood" | "weather" | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [voiceTranscription, setVoiceTranscription] = useState("");
  const [isVoiceListening, setIsVoiceListening] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);

  const activeDiary = diaries.find(
    (d) => d.date === format(selectedDate, "yyyy-MM-dd")
  );

  const currentMoodOpt = MOOD_OPTIONS.find((o) => o.value === selectedMood);
  const currentWeatherOpt = WEATHER_OPTIONS.find(
    (o) => o.value === selectedWeather
  );
  const canSeal = newDiaryContent.trim().length > 0;

  // 语音识别相关
  const startRecording = async () => {
    setVoiceTranscription("");
    setVoiceError(null);
    setIsRecording(true);

    const started = await speechService.start({
      lang: "zh-CN",
      continuous: true,
      interimResults: true,
      onResult: (transcript, isFinal) => {
        setVoiceTranscription(transcript);
        if (isFinal) {
          setVoiceTranscription((prev) => prev + transcript);
        }
      },
      onError: (error) => {
        setVoiceError(error);
        setIsVoiceListening(false);
      },
      onStart: () => {
        setIsVoiceListening(true);
      },
      onEnd: () => {
        setIsVoiceListening(false);
      },
    });

    if (!started) {
      setIsRecording(false);
    }
  };

  const cancelRecording = () => {
    speechService.stop();
    setIsRecording(false);
    setVoiceTranscription("");
    setVoiceError(null);
    setIsVoiceListening(false);
  };

  const finishRecording = () => {
    speechService.stop();
    if (voiceTranscription.trim()) {
      const newContent = newDiaryContent
        ? newDiaryContent + voiceTranscription.trim()
        : voiceTranscription.trim();
      setNewDiaryContent(newContent);
    }
    setIsRecording(false);
    setVoiceTranscription("");
    setVoiceError(null);
    setIsVoiceListening(false);
  };

  const toggleRecording = () => {
    if (isRecording) {
      cancelRecording();
    } else {
      startRecording();
    }
  };

  const onSealCan = async () => {
    const diaryId = await handleSealCan();
    if (diaryId) {
      navigate(`/diary/${diaryId}`);
    }
  };

  const onOpenSurprise = async () => {
    const surprise = await handleOpenSurprise();
    if (surprise) {
      navigate(`/surprise/${format(selectedDate, "yyyy-MM-dd")}`);
    }
  };

  const currentSurprise = surprises[format(selectedDate, "yyyy-MM-dd")];

  return (
    <div className="flex-1 flex flex-col gap-4 min-h-0 animate-in fade-in duration-300 overflow-hidden">
      <SelectionSheet
        isOpen={openSheet === "mood"}
        onClose={() => setOpenSheet(null)}
        title="今天的心情如何？"
        type="mood"
        selectedValue={selectedMood}
        onSelect={setSelectedMood}
      />
      <SelectionSheet
        isOpen={openSheet === "weather"}
        onClose={() => setOpenSheet(null)}
        title="外面的天气如何？"
        type="weather"
        selectedValue={selectedWeather}
        onSelect={setSelectedWeather}
      />
      <VoiceInputSheet
        isOpen={isRecording}
        onClose={cancelRecording}
        onFinish={finishRecording}
        transcription={voiceTranscription}
        isListening={isVoiceListening}
        error={voiceError}
      />

      <div className="shrink-0">
        <Calendar
          selectedDate={selectedDate}
          onDateSelect={setSelectedDate}
          onEntryClick={(dateStr) => {
            const diary = diaries.find((d) => d.date === dateStr);
            if (diary) {
              navigate(`/diary/${diary.id}`);
            }
          }}
          entries={diaries.map((d) => d.date)}
          surpriseDates={missedDiaryDates}
        />
      </div>

      <div className="flex-1 flex flex-col min-h-0 overflow-hidden mt-2">
        {isAfter(selectedDate, startOfToday()) && !isToday(selectedDate) ? (
          // 未来日期
          <div className="flex-1 flex flex-col items-center justify-center space-y-6">
            <div className="opacity-20 grayscale scale-75">
              <img src={cannedIpUrl} width={100} height={114} alt="" />
            </div>
            <p className="text-gray-400 font-black text-lg">
              时光还没到这里哦...
            </p>
            <button
              onClick={() => setSelectedDate(new Date())}
              className="text-[#58CC02] font-black text-sm border-2 border-[#58CC02] px-6 py-2 rounded-full active:scale-95 transition-all"
            >
              回到今天
            </button>
          </div>
        ) : isToday(selectedDate) ? (
          // 今天：始终显示编辑界面
          <div className="flex-1 flex flex-col gap-4 min-h-0 animate-in slide-in-from-top-2 duration-300">
            <div className="flex gap-3 shrink-0">
              <SelectionTrigger
                label="心情"
                value={currentMoodOpt?.label || "心情如何"}
                onClick={() => setOpenSheet("mood")}
                isPlaceholder={!selectedMood}
                type="mood"
                iconData={currentMoodOpt}
              />
              <SelectionTrigger
                label="天气"
                value={currentWeatherOpt?.label || "天气如何"}
                onClick={() => setOpenSheet("weather")}
                isPlaceholder={!selectedWeather}
                type="weather"
                iconData={currentWeatherOpt}
              />
            </div>
            <div className="flex-1 scrapbook-card border-none flex flex-col overflow-hidden bg-white relative">
              <div className="h-6 bg-[#F0EDE5]/10 w-full flex gap-4 px-8 items-center border-b border-[#F0EDE5]/20">
                <span className="w-2.5 h-2.5 rounded-full bg-[#E8E4D8]"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-[#E8E4D8]"></span>
              </div>
              <div className="flex-1 relative">
                <textarea
                  value={newDiaryContent}
                  onChange={(e) => setNewDiaryContent(e.target.value)}
                  placeholder="说过的话会出现在这里喔"
                  className="w-full h-full bg-transparent p-8 grid-paper text-[18px] font-extrabold text-gray-700 leading-[2.4rem] outline-none resize-none placeholder:text-gray-300 placeholder:text-[18px] placeholder:font-extrabold"
                />
              </div>

              <div className="p-4 flex items-center justify-between z-10 bg-white border-t border-[#F0EDE5]/30 shrink-0">
                <button
                  onClick={toggleRecording}
                  className={`w-12 h-12 rounded-[1.2rem] flex items-center justify-center border-b-4 transition-all active:translate-y-1 active:border-b-0 ${
                    isRecording
                      ? "bg-gray-100 border-transparent shadow-inner"
                      : "bg-[#58CC02] border-[#4CAF00] shadow-md"
                  }`}
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="white"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                  </svg>
                </button>
                <button
                  onClick={onSealCan}
                  disabled={isSealing || !canSeal || isRecording}
                  className={`relative flex items-center gap-3 pl-5 pr-4 py-2.5 rounded-[1.2rem] border-b-[5px] transition-all active:translate-y-1 active:border-b-0 ${
                    canSeal && !isRecording
                      ? "bg-[#58CC02] border-[#4CAF00] text-white"
                      : "bg-gray-100 border-gray-200 border-b-gray-300 text-gray-400 cursor-not-allowed"
                  }`}
                >
                  <span className="text-xs font-extrabold uppercase tracking-widest">
                    提交日记
                  </span>
                  <SmallCanIcon active={canSeal && !isRecording} />
                </button>
              </div>
            </div>
          </div>
        ) : activeDiary ? (
          // 历史日期已有日记
          <div className="flex-1 flex flex-col items-center justify-center space-y-6 py-4 animate-in zoom-in-95 duration-500">
            <div
              className="relative group cursor-pointer"
              onClick={() => navigate(`/diary/${activeDiary.id}`)}
            >
              <div className="absolute inset-0 bg-[#FFC800] rounded-full blur-[35px] opacity-10 group-hover:opacity-20 transition-opacity"></div>
              <img src={cannedIpUrl} width={140} height={160} alt="" />
              <div className="absolute top-2 right-1 bg-[#58CC02] text-white px-2.5 py-1 rounded-full font-black text-[9px] tracking-widest shadow-lg border-2 border-white">
                已封存
              </div>
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-lg font-extrabold text-gray-800">
                罐头里的秘密已锁好
              </h3>
              <p className="text-gray-400 font-bold text-xs">
                小精灵的回信在这里...
              </p>
            </div>
            <button
              onClick={() => navigate(`/diary/${activeDiary.id}`)}
              className="w-full max-w-[200px] py-3.5 bg-[#58CC02] border-b-[5px] border-[#4CAF00] text-white font-extrabold rounded-[1.5rem] active:translate-y-1 active:border-b-0 transition-all text-md shadow-lg"
            >
              开启惊喜回信
            </button>
          </div>
        ) : currentSurprise ? (
          // 历史日期未写日记但已查看惊喜
          <div className="flex-1 flex flex-col items-center justify-center animate-in zoom-in-95 duration-500 py-4">
            <button
              onClick={() =>
                navigate(`/surprise/${format(selectedDate, "yyyy-MM-dd")}`)
              }
              className="bg-[#FFFDF5] w-full max-w-[280px] p-6 rounded-[2rem] border-2 border-b-[8px] border-[#FFC800] relative shadow-xl flex flex-col items-center text-center space-y-4 hover:translate-y-[-4px] transition-all group"
            >
              <div className="washi-tape !w-16 !h-5 !-top-2.5"></div>
              <div className="absolute top-3 right-3 bg-[#58CC02] text-white px-2 py-0.5 rounded-full text-[8px] font-black">
                已揭晓
              </div>
              <div className="bg-gradient-to-br from-[#FFC800]/20 to-[#FFE066]/30 p-3 rounded-2xl w-full">
                <h3 className="text-base font-black text-gray-800 mb-2">
                  {currentSurprise.title}
                </h3>
                <p className="text-gray-500 font-bold text-xs leading-relaxed line-clamp-3">
                  {currentSurprise.fullContent.slice(0, 80)}...
                </p>
              </div>
              <div className="w-full py-2 bg-[#FFC800]/80 rounded-xl text-white font-black text-xs tracking-widest">
                再看一遍
              </div>
            </button>
          </div>
        ) : (
          // 历史日期未写日记且未查看惊喜
          <div className="flex-1 flex flex-col items-center justify-center animate-in zoom-in-95 duration-500 py-4">
            <button
              onClick={onOpenSurprise}
              className="bg-[#FFFDF5] w-full max-w-[260px] p-8 rounded-[2rem] border-2 border-b-[8px] border-[#FFC800] relative shadow-xl flex flex-col items-center text-center space-y-5 hover:translate-y-[-4px] transition-all group active:scale-[0.98]"
            >
              <div className="washi-tape !w-16 !h-5 !-top-2.5"></div>
              <div className="bg-white p-4 rounded-full shadow-inner group-hover:rotate-12 transition-transform">
                <Icons.SurpriseStar />
              </div>
              <div>
                <h3 className="text-lg font-black text-gray-800 mb-1">
                  那日惊喜罐头
                </h3>
                <p className="text-gray-400 font-bold text-[11px] leading-relaxed px-2">
                  那天的想法忘记记录啦，没关系，已为你随机生成「那日惊喜罐头」
                </p>
              </div>
              <div className="w-full py-2.5 bg-[#FFC800] rounded-xl text-white font-black text-xs tracking-widest shadow-md">
                打开罐头
              </div>
            </button>
          </div>
        )}
      </div>

      {isGeneratingSurprise && (
        <div className="fixed inset-0 z-[100] bg-[#FFFDF5] flex items-center justify-center p-10 animate-in fade-in duration-500 max-w-md mx-auto">
          <LoadingScreen message="惊喜罐头打开中……" />
        </div>
      )}
    </div>
  );
};

export default HomePage;
