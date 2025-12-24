import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
  ReactNode,
} from "react";
import {
  DiaryEntry,
  Mood,
  Weather,
  Material,
  SurpriseContent,
  GradeLevel,
  MaterialCategory,
} from "../types";
import {
  format,
  subDays,
  startOfToday,
  startOfMonth,
  eachDayOfInterval,
  isBefore,
  subDays as subDaysHelper,
} from "date-fns";
import { getDiaryFeedback, getDailySurprise } from "../services/llmService";
import {
  fetchMaterials,
  getDefaultMaterialsSync,
} from "../services/materialsApi";
import {
  getCheckinStatus,
  performCheckin,
  CheckinStatus,
} from "../services/checkinService";
import { chatDb } from "../services/chatDb";

interface DiaryContextType {
  // 日记相关
  diaries: DiaryEntry[];
  setDiaries: React.Dispatch<React.SetStateAction<DiaryEntry[]>>;
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
  newDiaryContent: string;
  setNewDiaryContent: (content: string) => void;
  selectedMood: Mood | null;
  setSelectedMood: (mood: Mood | null) => void;
  selectedWeather: Weather | null;
  setSelectedWeather: (weather: Weather | null) => void;
  streakCount: number;

  // 惊喜相关
  surprises: Record<string, SurpriseContent>;
  setSurprises: React.Dispatch<
    React.SetStateAction<Record<string, SurpriseContent>>
  >;
  viewedSurprises: string[];
  setViewedSurprises: React.Dispatch<React.SetStateAction<string[]>>;
  missedDiaryDates: string[];

  // 年级相关
  gradeLevel: GradeLevel;
  setGradeLevel: (level: GradeLevel) => void;

  // 素材相关
  selectedCategory: MaterialCategory;
  setSelectedCategory: (cat: MaterialCategory) => void;
  categoryMaterials: Material[];
  setCategoryMaterials: React.Dispatch<React.SetStateAction<Material[]>>;
  loadingMaterials: boolean;
  hasMoreMaterials: boolean;
  loadMaterials: (page: number, reset?: boolean) => Promise<void>;
  handleScroll: () => void;
  materialsContainerRef: React.RefObject<HTMLDivElement>;

  // 加载状态
  isSealing: boolean;
  setIsSealing: (v: boolean) => void;
  isGeneratingSurprise: boolean;
  setIsGeneratingSurprise: (v: boolean) => void;

  // 签到相关
  checkinStatus: CheckinStatus | null;
  loadingCheckin: boolean;
  handleCheckin: () => Promise<void>;
  refreshCheckinStatus: () => Promise<void>;

  // 操作方法
  handleSealCan: () => Promise<string | null>;
  handleOpenSurprise: () => Promise<SurpriseContent | null>;
}

const DiaryContext = createContext<DiaryContextType | null>(null);

export const useDiary = () => {
  const context = useContext(DiaryContext);
  if (!context) {
    throw new Error("useDiary must be used within DiaryProvider");
  }
  return context;
};

export const DiaryProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [diaries, setDiaries] = useState<DiaryEntry[]>([]);
  const [surprises, setSurprises] = useState<Record<string, SurpriseContent>>(
    {}
  );
  const [viewedSurprises, setViewedSurprises] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [newDiaryContent, setNewDiaryContent] = useState("");
  const [selectedMood, setSelectedMood] = useState<Mood | null>(null);
  const [selectedWeather, setSelectedWeather] = useState<Weather | null>(null);
  const [isSealing, setIsSealing] = useState(false);
  const [isGeneratingSurprise, setIsGeneratingSurprise] = useState(false);

  const [checkinStatus, setCheckinStatus] = useState<CheckinStatus | null>(
    null
  );
  const [loadingCheckin, setLoadingCheckin] = useState(false);

  const [gradeLevel, setGradeLevel] = useState<GradeLevel>(
    () => (localStorage.getItem("grade_level") as GradeLevel) || "middle"
  );
  const [selectedCategory, setSelectedCategory] =
    useState<MaterialCategory>("literature");
  // 初始化时直接使用默认数据，秒开
  const [categoryMaterials, setCategoryMaterials] = useState<Material[]>(() =>
    getDefaultMaterialsSync(
      "literature",
      (localStorage.getItem("grade_level") as GradeLevel) || "middle",
      10
    )
  );
  const [materialsPage, setMaterialsPage] = useState(1);
  const [loadingMaterials, setLoadingMaterials] = useState(false);
  const [hasMoreMaterials, setHasMoreMaterials] = useState(true);
  const materialsContainerRef = useRef<HTMLDivElement>(null);

  // 刷新签到状态
  const refreshCheckinStatus = useCallback(async () => {
    try {
      const status = await getCheckinStatus();
      setCheckinStatus(status);
    } catch (error) {
      console.error("Failed to load checkin status:", error);
    }
  }, []);

  // 加载本地存储
  useEffect(() => {
    // 从 IndexedDB 加载日记
    const loadDiaries = async () => {
      try {
        // 先尝试从 localStorage 迁移
        await chatDb.migrateDiariesFromLocalStorage();
        // 然后从 IndexedDB 加载
        const dbDiaries = await chatDb.getAllDiaries();
        setDiaries(dbDiaries);
      } catch (error) {
        console.error("Failed to load diaries from IndexedDB:", error);
        // 降级：从 localStorage 加载
        const saved = localStorage.getItem("canned_diaries");
        if (saved) setDiaries(JSON.parse(saved));
      }
    };
    loadDiaries();

    const savedSurprises = localStorage.getItem("canned_surprises");
    if (savedSurprises) setSurprises(JSON.parse(savedSurprises));
    const savedViewedSurprises = localStorage.getItem(
      "canned_viewed_surprises"
    );
    if (savedViewedSurprises)
      setViewedSurprises(JSON.parse(savedViewedSurprises));

    // 加载签到状态
    refreshCheckinStatus();
  }, [refreshCheckinStatus]);

  // 保存日记到 IndexedDB（保留 localStorage 作为备份）
  const saveDiaryToDb = useCallback(
    async (diary: DiaryEntry) => {
      try {
        await chatDb.saveDiary(diary);
      } catch (error) {
        console.error("Failed to save diary to IndexedDB:", error);
      }
      // 同时保存到 localStorage 作为备份
      localStorage.setItem("canned_diaries", JSON.stringify(diaries));
    },
    [diaries]
  );

  useEffect(() => {
    localStorage.setItem("canned_surprises", JSON.stringify(surprises));
  }, [surprises]);

  useEffect(() => {
    localStorage.setItem(
      "canned_viewed_surprises",
      JSON.stringify(viewedSurprises)
    );
  }, [viewedSurprises]);

  useEffect(() => {
    localStorage.setItem("grade_level", gradeLevel);
  }, [gradeLevel]);

  // 计算未写日记的日期
  const missedDiaryDates = useMemo(() => {
    const today = startOfToday();
    const monthStart = startOfMonth(today);
    const diaryDates = diaries.map((d) => d.date);
    const openedSurpriseDates = Object.keys(surprises);

    const yesterday = subDaysHelper(today, 1);
    if (isBefore(yesterday, monthStart)) return [];

    const daysInRange = eachDayOfInterval({
      start: monthStart,
      end: yesterday,
    });

    return daysInRange
      .filter((day) => {
        const dateStr = format(day, "yyyy-MM-dd");
        return (
          !diaryDates.includes(dateStr) &&
          !openedSurpriseDates.includes(dateStr)
        );
      })
      .map((day) => format(day, "yyyy-MM-dd"));
  }, [diaries, surprises]);

  // 连续打卡天数
  const streakCount = useMemo(() => {
    if (diaries.length === 0) return 0;
    const dates = Array.from(new Set(diaries.map((d) => d.date))).sort(
      (a: string, b: string) => b.localeCompare(a)
    );
    let streak = 0;
    let checkDate = new Date();
    const hasToday = dates.includes(format(checkDate, "yyyy-MM-dd"));
    const hasYesterday = dates.includes(
      format(subDays(checkDate, 1), "yyyy-MM-dd")
    );
    if (!hasToday && !hasYesterday) return 0;
    if (!hasToday) checkDate = subDays(checkDate, 1);
    for (let i = 0; i < dates.length; i++) {
      if (dates.includes(format(checkDate, "yyyy-MM-dd"))) {
        streak++;
        checkDate = subDays(checkDate, 1);
      } else break;
    }
    return streak;
  }, [diaries]);

  // 更新当前日记内容
  useEffect(() => {
    const activeDiary = diaries.find(
      (d) => d.date === format(selectedDate, "yyyy-MM-dd")
    );
    if (activeDiary) {
      setNewDiaryContent(activeDiary.content);
      setSelectedMood(activeDiary.mood);
      setSelectedWeather(activeDiary.weather);
    } else {
      setNewDiaryContent("");
      setSelectedMood(null);
      setSelectedWeather(null);
    }
  }, [selectedDate, diaries]);

  // 加载素材
  const loadMaterials = useCallback(
    async (page: number, reset: boolean = false) => {
      if (loadingMaterials) return;

      setLoadingMaterials(true);
      try {
        const response = await fetchMaterials(
          selectedCategory,
          gradeLevel,
          page,
          6
        );
        if (response.success) {
          if (reset) {
            setCategoryMaterials(response.data.materials);
          } else {
            setCategoryMaterials((prev) => [
              ...prev,
              ...response.data.materials,
            ]);
          }
          setHasMoreMaterials(response.data.pagination.hasMore);
          setMaterialsPage(page);
        }
      } catch (error) {
        console.error("Failed to load materials:", error);
      } finally {
        setLoadingMaterials(false);
      }
    },
    [selectedCategory, gradeLevel, loadingMaterials]
  );

  // 分类变化时直接使用默认数据，秒开
  useEffect(() => {
    const defaultData = getDefaultMaterialsSync(
      selectedCategory,
      gradeLevel,
      10
    );
    setCategoryMaterials(defaultData);
    setMaterialsPage(1);
    setHasMoreMaterials(true);
  }, [selectedCategory, gradeLevel]);

  // 无限滚动
  const handleScroll = useCallback(() => {
    const container = materialsContainerRef.current;
    if (!container || loadingMaterials || !hasMoreMaterials) return;

    const { scrollTop, scrollHeight, clientHeight } = container;
    if (scrollTop + clientHeight >= scrollHeight - 100) {
      loadMaterials(materialsPage + 1, false);
    }
  }, [loadingMaterials, hasMoreMaterials, materialsPage, loadMaterials]);

  // 封存日记
  const handleSealCan = async (): Promise<string | null> => {
    if (!newDiaryContent.trim()) {
      alert("先写点什么再封存吧！");
      return null;
    }
    setIsSealing(true);
    try {
      const feedback = await getDiaryFeedback(
        newDiaryContent,
        gradeLevel,
        selectedMood || undefined,
        selectedWeather || undefined
      );
      const dateStr = format(selectedDate, "yyyy-MM-dd");
      const finalMood = selectedMood || feedback.predicted_mood;
      const finalWeather = selectedWeather || feedback.predicted_weather;
      const newEntry: DiaryEntry = {
        id: Date.now().toString(),
        date: dateStr,
        content: newDiaryContent,
        mood: finalMood,
        weather: finalWeather,
        feedback,
      };
      setDiaries((prev) => [
        ...prev.filter((d) => d.date !== dateStr),
        newEntry,
      ]);

      // 保存到 IndexedDB
      await saveDiaryToDb(newEntry);

      // 自动签到
      try {
        await performCheckin();
        await refreshCheckinStatus();
      } catch (error) {
        console.error("Auto checkin failed:", error);
        // 签到失败不影响日记封存
      }

      return newEntry.id;
    } catch (e) {
      alert("罐头封存失败，再试一次吧！");
      return null;
    } finally {
      setIsSealing(false);
    }
  };

  // 打开惊喜
  const handleOpenSurprise = async (): Promise<SurpriseContent | null> => {
    const dateStr = format(selectedDate, "yyyy-MM-dd");

    if (!viewedSurprises.includes(dateStr)) {
      setViewedSurprises((prev) => [...prev, dateStr]);
    }

    if (surprises[dateStr]) {
      return surprises[dateStr];
    }

    setIsGeneratingSurprise(true);
    try {
      const content = await getDailySurprise(gradeLevel);
      setSurprises((prev) => ({ ...prev, [dateStr]: content }));
      return content;
    } catch (e) {
      alert("惊喜罐头还没准备好，再等等吧！");
      return null;
    } finally {
      setIsGeneratingSurprise(false);
    }
  };

  // 执行签到
  const handleCheckin = useCallback(async () => {
    if (loadingCheckin) return;

    setLoadingCheckin(true);
    try {
      await performCheckin();
      await refreshCheckinStatus();
    } catch (error) {
      console.error("Checkin failed:", error);
      alert("签到失败，请稍后再试");
    } finally {
      setLoadingCheckin(false);
    }
  }, [loadingCheckin, refreshCheckinStatus]);

  return (
    <DiaryContext.Provider
      value={{
        diaries,
        setDiaries,
        selectedDate,
        setSelectedDate,
        newDiaryContent,
        setNewDiaryContent,
        selectedMood,
        setSelectedMood,
        selectedWeather,
        setSelectedWeather,
        streakCount,
        surprises,
        setSurprises,
        viewedSurprises,
        setViewedSurprises,
        missedDiaryDates,
        gradeLevel,
        setGradeLevel,
        selectedCategory,
        setSelectedCategory,
        categoryMaterials,
        setCategoryMaterials,
        loadingMaterials,
        hasMoreMaterials,
        loadMaterials,
        handleScroll,
        materialsContainerRef,
        isSealing,
        setIsSealing,
        isGeneratingSurprise,
        setIsGeneratingSurprise,
        checkinStatus,
        loadingCheckin,
        handleCheckin,
        refreshCheckinStatus,
        handleSealCan,
        handleOpenSurprise,
      }}
    >
      {children}
    </DiaryContext.Provider>
  );
};
