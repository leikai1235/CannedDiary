import { Material, GradeLevel, MaterialCategory } from '../types';

// 导入静态默认数据
import literatureLower from '../../data/materials/literature-lower.json';
import literatureMiddle from '../../data/materials/literature-middle.json';
import literatureUpper from '../../data/materials/literature-upper.json';
import poetryLower from '../../data/materials/poetry-lower.json';
import poetryMiddle from '../../data/materials/poetry-middle.json';
import poetryUpper from '../../data/materials/poetry-upper.json';
import quoteLower from '../../data/materials/quote-lower.json';
import quoteMiddle from '../../data/materials/quote-middle.json';
import quoteUpper from '../../data/materials/quote-upper.json';
import newsLower from '../../data/materials/news-lower.json';
import newsMiddle from '../../data/materials/news-middle.json';
import newsUpper from '../../data/materials/news-upper.json';
import encyclopediaLower from '../../data/materials/encyclopedia-lower.json';
import encyclopediaMiddle from '../../data/materials/encyclopedia-middle.json';
import encyclopediaUpper from '../../data/materials/encyclopedia-upper.json';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:7001';
const CACHE_PREFIX = 'materials_cache_';
const CACHE_EXPIRY = 5 * 60 * 1000; // 5分钟过期

// 默认数据映射
const DEFAULT_DATA: Record<MaterialCategory, Record<GradeLevel, Material[]>> = {
  literature: {
    lower: literatureLower as Material[],
    middle: literatureMiddle as Material[],
    upper: literatureUpper as Material[]
  },
  poetry: {
    lower: poetryLower as Material[],
    middle: poetryMiddle as Material[],
    upper: poetryUpper as Material[]
  },
  quote: {
    lower: quoteLower as Material[],
    middle: quoteMiddle as Material[],
    upper: quoteUpper as Material[]
  },
  news: {
    lower: newsLower as Material[],
    middle: newsMiddle as Material[],
    upper: newsUpper as Material[]
  },
  encyclopedia: {
    lower: encyclopediaLower as Material[],
    middle: encyclopediaMiddle as Material[],
    upper: encyclopediaUpper as Material[]
  }
};

export interface MaterialsResponse {
  success: boolean;
  data: {
    materials: Material[];
    pagination: {
      page: number;
      pageSize: number;
      hasMore: boolean;
    };
  };
  error?: string;
}

interface CacheEntry {
  data: MaterialsResponse;
  timestamp: number;
}

// 获取缓存
function getCache(key: string): MaterialsResponse | null {
  try {
    const cached = localStorage.getItem(CACHE_PREFIX + key);
    if (!cached) return null;

    const entry: CacheEntry = JSON.parse(cached);
    const now = Date.now();

    // 检查是否过期
    if (now - entry.timestamp > CACHE_EXPIRY) {
      localStorage.removeItem(CACHE_PREFIX + key);
      return null;
    }

    return entry.data;
  } catch {
    return null;
  }
}

// 设置缓存
function setCache(key: string, data: MaterialsResponse): void {
  try {
    const entry: CacheEntry = {
      data,
      timestamp: Date.now()
    };
    localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(entry));
  } catch (e) {
    console.warn('缓存写入失败:', e);
  }
}

// 同步获取默认数据（用于初始化，不分页）
export function getDefaultMaterialsSync(
  category: MaterialCategory,
  gradeLevel: GradeLevel,
  limit: number = 10
): Material[] {
  const allMaterials = DEFAULT_DATA[category]?.[gradeLevel] || [];
  return allMaterials.slice(0, limit);
}

// 获取默认数据（分页）
function getDefaultMaterials(
  category: MaterialCategory,
  gradeLevel: GradeLevel,
  page: number,
  pageSize: number
): MaterialsResponse {
  const allMaterials = DEFAULT_DATA[category]?.[gradeLevel] || [];
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  const materials = allMaterials.slice(start, end);

  return {
    success: true,
    data: {
      materials,
      pagination: {
        page,
        pageSize,
        hasMore: end < allMaterials.length
      }
    }
  };
}

// 获取素材列表
export async function fetchMaterials(
  category: MaterialCategory,
  gradeLevel: GradeLevel,
  page: number = 1,
  pageSize: number = 10
): Promise<MaterialsResponse> {
  // 第一页直接使用静态默认数据，秒开
  if (page === 1) {
    console.log(`[Default Data] ${category}-${gradeLevel} page 1`);
    return getDefaultMaterials(category, gradeLevel, page, pageSize);
  }

  const cacheKey = `${category}-${gradeLevel}-${page}-${pageSize}`;

  // 先检查缓存
  const cached = getCache(cacheKey);
  if (cached) {
    console.log(`[Cache Hit] ${cacheKey}`);
    return cached;
  }

  // 第二页开始才请求 API
  try {
    const url = `${API_BASE_URL}/api/materials?category=${category}&gradeLevel=${gradeLevel}&page=${page}&pageSize=${pageSize}`;
    console.log(`[API Request] ${url}`);

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: MaterialsResponse = await response.json();

    // 缓存成功响应
    if (data.success) {
      setCache(cacheKey, data);
    }

    return data;
  } catch (error) {
    console.warn('[API Error] 使用默认数据:', error);
    // API 失败时使用默认数据
    const fallback = getDefaultMaterials(category, gradeLevel, page, pageSize);
    return fallback;
  }
}

// 清除过期缓存
export function clearExpiredCache(): void {
  const now = Date.now();
  const keysToRemove: string[] = [];

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(CACHE_PREFIX)) {
      try {
        const cached = localStorage.getItem(key);
        if (cached) {
          const entry: CacheEntry = JSON.parse(cached);
          if (now - entry.timestamp > CACHE_EXPIRY) {
            keysToRemove.push(key);
          }
        }
      } catch {
        keysToRemove.push(key!);
      }
    }
  }

  keysToRemove.forEach(key => localStorage.removeItem(key));
  console.log(`[Cache Cleanup] 清除了 ${keysToRemove.length} 个过期缓存`);
}

// 清除所有素材缓存
export function clearAllMaterialsCache(): void {
  const keysToRemove: string[] = [];

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(CACHE_PREFIX)) {
      keysToRemove.push(key);
    }
  }

  keysToRemove.forEach(key => localStorage.removeItem(key));
  console.log(`[Cache Clear] 清除了 ${keysToRemove.length} 个缓存`);
}

// 获取缓存统计
export function getCacheStats() {
  let count = 0;
  let totalSize = 0;
  const entries: { key: string; size: number; age: number }[] = [];
  const now = Date.now();

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(CACHE_PREFIX)) {
      const value = localStorage.getItem(key);
      if (value) {
        count++;
        const size = value.length * 2; // UTF-16
        totalSize += size;

        try {
          const entry: CacheEntry = JSON.parse(value);
          entries.push({
            key: key.replace(CACHE_PREFIX, ''),
            size,
            age: Math.round((now - entry.timestamp) / 1000)
          });
        } catch {
          entries.push({ key: key.replace(CACHE_PREFIX, ''), size, age: -1 });
        }
      }
    }
  }

  return { count, totalSize, entries };
}

// 检查 API 健康状态
export async function checkApiHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/health`);
    const data = await response.json();
    return data.status === 'ok';
  } catch {
    return false;
  }
}
