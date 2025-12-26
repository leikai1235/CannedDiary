import { Router } from 'express';
import materialsRouter from './materials.js';
import checkinRouter from './checkin.js';
import diaryRouter from './diary.js';
import surpriseRouter from './surprise.js';
import chatRouter from './chat.js';
import healthRouter from './health.js';
import ttsRouter from './tts.js';

const router = Router();

// 挂载各个路由模块
router.use('/materials', materialsRouter);
router.use('/checkin', checkinRouter);
router.use('/diary-feedback', diaryRouter);
router.use('/daily-surprise', surpriseRouter);
router.use('/chat', chatRouter);
router.use('/health', healthRouter);
router.use('/tts', ttsRouter);

export default router;
