// 素材缓存（简单内存缓存）
export const materialsCache = new Map();

// 签到数据存储（userId -> checkin data）
// 简化版：使用设备ID或固定ID，实际应用中应该有用户系统
export const checkinData = new Map();

// 设置缓存（带过期时间）
export function setCache(key, value, ttlMs = 5 * 60 * 1000) {
  materialsCache.set(key, value);
  setTimeout(() => materialsCache.delete(key), ttlMs);
}

// 获取缓存
export function getCache(key) {
  return materialsCache.get(key);
}

// 检查缓存是否存在
export function hasCache(key) {
  return materialsCache.has(key);
}
