import { Router } from 'express';

const router = Router();

// 健康检查
router.get('/', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default router;
