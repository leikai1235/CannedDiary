import {
  AIFeedback,
  SurpriseContent,
  GradeLevel,
  MaterialCategory,
  Material,
  Mood,
  Weather,
} from "../types";

// 后端 API 地址
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:7001";

// Mood 类型映射（API返回值 → 完整Mood类型）
const MOOD_MAP: Record<string, Mood> = {
  happy: "happy",
  calm: "calm",
  sad: "sad",
  angry: "angry",
  excited: "excited",
  fulfilled: "fulfilled",
  tired: "tired",
  confused: "confused",
  warm: "warm",
  lonely: "lonely",
};

// Weather 类型映射
const WEATHER_MAP: Record<string, Weather> = {
  sunny: "sunny",
  cloudy: "cloudy",
  overcast: "overcast",
  lightRain: "lightRain",
  heavyRain: "heavyRain",
  snowy: "snowy",
  windy: "windy",
  foggy: "foggy",
};

export async function getDiaryFeedback(
  content: string,
  gradeLevel: GradeLevel = "middle",
  mood?: Mood,
  weather?: Weather
): Promise<AIFeedback> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/diary-feedback`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        content,
        gradeLevel,
        mood,
        weather,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const json = await response.json();

    if (!json.success) {
      throw new Error(json.error || "获取日记反馈失败");
    }

    const result = json.data;

    // 确保mood和weather类型正确
    result.predicted_mood = MOOD_MAP[result.predicted_mood] || "calm";
    result.predicted_weather = WEATHER_MAP[result.predicted_weather] || "sunny";

    return result as AIFeedback;
  } catch (error) {
    console.error("Diary Feedback API Error:", error);
    throw error;
  }
}

export async function getDailySurprise(
  gradeLevel: GradeLevel = "middle"
): Promise<SurpriseContent> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/daily-surprise`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        gradeLevel,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const json = await response.json();

    if (!json.success) {
      throw new Error(json.error || "获取每日惊喜失败");
    }

    return json.data as SurpriseContent;
  } catch (error) {
    console.error("Daily Surprise API Error:", error);
    throw error;
  }
}

// 获取指定分类的素材列表
export async function getMaterialsByCategory(
  category: MaterialCategory,
  gradeLevel: GradeLevel,
  count: number = 6
): Promise<Material[]> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/materials?category=${category}&gradeLevel=${gradeLevel}&pageSize=${count}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const json = await response.json();

    if (!json.success) {
      throw new Error(json.error || "获取素材失败");
    }

    return json.data.materials as Material[];
  } catch (error) {
    console.error("Materials API Error:", error);
    throw error;
  }
}
