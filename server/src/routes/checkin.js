import { Router } from 'express';
import { checkinData } from '../services/cache.js';

const router = Router();

// 获取签到状态 API
router.get('/status', (req, res) => {
  try {
    const { userId = 'default-user' } = req.query;

    const userCheckin = checkinData.get(userId) || {
      checkins: [], // 签到日期数组 ['2024-12-20', '2024-12-21']
      streak: 0     // 连续签到天数
    };

    // 计算连续签到天数
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    const hasCheckedInToday = userCheckin.checkins.includes(today);
    const hasCheckedInYesterday = userCheckin.checkins.includes(yesterday);

    // 重新计算连续天数（从最新日期倒推）
    let streak = 0;
    const sortedCheckins = [...userCheckin.checkins].sort((a, b) => b.localeCompare(a));

    if (sortedCheckins.length > 0) {
      let checkDate = new Date();

      // 如果今天没签到，从昨天开始检查
      if (!hasCheckedInToday) {
        checkDate = new Date(Date.now() - 86400000);
      }

      for (let i = 0; i < sortedCheckins.length; i++) {
        const dateStr = checkDate.toISOString().split('T')[0];
        if (sortedCheckins.includes(dateStr)) {
          streak++;
          checkDate = new Date(checkDate.getTime() - 86400000);
        } else {
          break;
        }
      }
    }

    res.json({
      success: true,
      data: {
        hasCheckedInToday,
        streak,
        totalCheckins: userCheckin.checkins.length,
        lastCheckinDate: sortedCheckins[0] || null
      }
    });
  } catch (error) {
    console.error('[Checkin Status Error]', error);
    res.status(500).json({
      success: false,
      error: error.message || '获取签到状态失败'
    });
  }
});

// 签到 API
router.post('/', (req, res) => {
  try {
    const { userId = 'default-user' } = req.body;

    const today = new Date().toISOString().split('T')[0];

    // 获取用户签到数据
    const userCheckin = checkinData.get(userId) || {
      checkins: [],
      streak: 0
    };

    // 检查今天是否已签到
    if (userCheckin.checkins.includes(today)) {
      return res.json({
        success: true,
        data: {
          alreadyCheckedIn: true,
          message: '今天已经签到过了',
          streak: userCheckin.streak
        }
      });
    }

    // 添加今天的签到
    userCheckin.checkins.push(today);
    userCheckin.checkins.sort((a, b) => b.localeCompare(a));

    // 重新计算连续签到天数
    let streak = 0;
    let checkDate = new Date();

    for (let i = 0; i < userCheckin.checkins.length; i++) {
      const dateStr = checkDate.toISOString().split('T')[0];
      if (userCheckin.checkins.includes(dateStr)) {
        streak++;
        checkDate = new Date(checkDate.getTime() - 86400000);
      } else {
        break;
      }
    }

    userCheckin.streak = streak;
    checkinData.set(userId, userCheckin);

    console.log(`[Checkin] User ${userId} checked in. Streak: ${streak}`);

    res.json({
      success: true,
      data: {
        alreadyCheckedIn: false,
        message: '签到成功',
        streak,
        checkinDate: today
      }
    });
  } catch (error) {
    console.error('[Checkin Error]', error);
    res.status(500).json({
      success: false,
      error: error.message || '签到失败'
    });
  }
});

export default router;
