// 签到服务

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

export interface CheckinStatus {
  hasCheckedInToday: boolean;
  streak: number;
  totalCheckins: number;
  lastCheckinDate: string | null;
}

export interface CheckinResponse {
  alreadyCheckedIn: boolean;
  message: string;
  streak: number;
  checkinDate?: string;
}

// 获取设备ID（简单版本，使用localStorage）
function getDeviceId(): string {
  let deviceId = localStorage.getItem('device_id');
  if (!deviceId) {
    deviceId = `device-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('device_id', deviceId);
  }
  return deviceId;
}

/**
 * 获取签到状态
 */
export async function getCheckinStatus(): Promise<CheckinStatus> {
  try {
    const userId = getDeviceId();
    const response = await fetch(`${API_BASE_URL}/api/checkin/status?userId=${userId}`);

    if (!response.ok) {
      throw new Error('获取签到状态失败');
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || '获取签到状态失败');
    }

    return result.data;
  } catch (error) {
    console.error('Checkin status error:', error);
    throw error;
  }
}

/**
 * 执行签到
 */
export async function performCheckin(): Promise<CheckinResponse> {
  try {
    const userId = getDeviceId();
    const response = await fetch(`${API_BASE_URL}/api/checkin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId }),
    });

    if (!response.ok) {
      throw new Error('签到失败');
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || '签到失败');
    }

    return result.data;
  } catch (error) {
    console.error('Checkin error:', error);
    throw error;
  }
}
