import { Router } from 'express';
import { generateMaterials } from '../services/llm.js';
import { setCache, getCache, hasCache } from '../services/cache.js';

const router = Router();

// 获取素材列表 API
router.get('/', async (req, res) => {
  try {
    const {
      category = 'literature',
      gradeLevel = 'middle',
      page = 1,
      pageSize = 10
    } = req.query;

    const cacheKey = `${category}-${gradeLevel}-${page}`;

    // 检查缓存
    if (hasCache(cacheKey)) {
      console.log(`[Cache Hit] ${cacheKey}`);
      return res.json(getCache(cacheKey));
    }

    console.log(`[API] Fetching materials: category=${category}, grade=${gradeLevel}, page=${page}`);

    const materials = await generateMaterials(category, gradeLevel, parseInt(pageSize));

    const response = {
      success: true,
      data: {
        materials,
        pagination: {
          page: parseInt(page),
          pageSize: parseInt(pageSize),
          hasMore: true // AI生成模式下总是可以生成更多
        }
      }
    };

    // 缓存结果（5分钟过期）
    setCache(cacheKey, response, 5 * 60 * 1000);

    res.json(response);
  } catch (error) {
    console.error('[API Error]', error);
    res.status(500).json({
      success: false,
      error: error.message || '获取素材失败'
    });
  }
});

export default router;
