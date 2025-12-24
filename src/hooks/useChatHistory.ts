/**
 * 聊天会话历史管理 Hook
 */

import { useState, useEffect, useCallback } from 'react';
import { chatDb, ChatSession, ChatMessage, UserMemory } from '../services/chatDb';

export function useChatHistory() {
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [isReady, setIsReady] = useState(false);

  // 初始化数据库
  useEffect(() => {
    chatDb.init().then(() => {
      setIsReady(true);
      loadSessions();
    });
  }, []);

  // 加载所有会话
  const loadSessions = async () => {
    try {
      const allSessions = await chatDb.getAllSessions();
      setSessions(allSessions);
    } catch (error) {
      console.error('Failed to load sessions:', error);
    }
  };

  // 创建新会话
  const createNewSession = useCallback(async (title?: string) => {
    try {
      const session = await chatDb.createSession(title);
      setCurrentSessionId(session.id);
      await loadSessions();
      return session;
    } catch (error) {
      console.error('Failed to create session:', error);
      return null;
    }
  }, []);

  // 加载会话消息
  const loadMessages = useCallback(async (): Promise<ChatMessage[]> => {
    if (!currentSessionId) return [];
    try {
      return await chatDb.getSessionMessages(currentSessionId);
    } catch (error) {
      console.error('Failed to load messages:', error);
      return [];
    }
  }, [currentSessionId]);

  // 保存消息
  const saveMessage = useCallback(async (message: Omit<ChatMessage, 'sessionId'>) => {
    if (!currentSessionId) return;
    try {
      await chatDb.saveMessage(currentSessionId, message);
      await loadSessions(); // 刷新会话列表（更新时间和标题）
    } catch (error) {
      console.error('Failed to save message:', error);
    }
  }, [currentSessionId]);

  // 删除会话
  const deleteSession = useCallback(async (sessionId: string) => {
    try {
      await chatDb.deleteSession(sessionId);
      await loadSessions();
      if (currentSessionId === sessionId) {
        setCurrentSessionId(null);
      }
    } catch (error) {
      console.error('Failed to delete session:', error);
    }
  }, [currentSessionId]);

  // 切换会话
  const switchSession = useCallback((sessionId: string | null) => {
    setCurrentSessionId(sessionId);
  }, []);

  // ============ 记忆相关 ============

  // 保存记忆
  const saveMemory = useCallback(async (memory: Omit<UserMemory, 'id' | 'createdAt'>) => {
    try {
      await chatDb.saveMemory({
        ...memory,
        id: `mem-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        createdAt: new Date().toISOString()
      });
      return { success: true };
    } catch (error) {
      console.error('Failed to save memory:', error);
      return { success: false };
    }
  }, []);

  // 获取记忆
  const getMemories = useCallback(async (query?: string, limit?: number) => {
    try {
      return await chatDb.getMemories(query, limit);
    } catch (error) {
      console.error('Failed to get memories:', error);
      return [];
    }
  }, []);

  return {
    // 状态
    isReady,
    sessions,
    currentSessionId,

    // 会话操作
    createNewSession,
    switchSession,
    deleteSession,
    loadMessages,
    saveMessage,

    // 记忆操作
    saveMemory,
    getMemories
  };
}
