/**
 * IndexedDB 存储服务 - 聊天会话和用户记忆
 */

import { DiaryEntry, Mood } from '../types';

const DB_NAME = 'canned-diary-chat';
const DB_VERSION = 2; // 升级版本以添加日记存储
const STORE_SESSIONS = 'sessions';
const STORE_MESSAGES = 'messages';
const STORE_MEMORIES = 'memories';
const STORE_DIARIES = 'diaries';

// 类型定义
export interface ChatSession {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
}

export interface ChatMessage {
  id: string;
  sessionId: string;
  role: 'user' | 'assistant';
  content: string;
  parts?: any[];
  toolInvocations?: any[]; // AI SDK 工具调用
  createdAt: string;
}

export interface UserMemory {
  id: string;
  type: 'preference' | 'habit' | 'event' | 'emotion';
  content: string;
  tags: string[];
  createdAt: string;
}

class ChatDatabase {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<void> | null = null;

  async init(): Promise<void> {
    if (this.db) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // 会话表
        if (!db.objectStoreNames.contains(STORE_SESSIONS)) {
          const sessionsStore = db.createObjectStore(STORE_SESSIONS, { keyPath: 'id' });
          sessionsStore.createIndex('updatedAt', 'updatedAt', { unique: false });
        }

        // 消息表
        if (!db.objectStoreNames.contains(STORE_MESSAGES)) {
          const messagesStore = db.createObjectStore(STORE_MESSAGES, { keyPath: 'id' });
          messagesStore.createIndex('sessionId', 'sessionId', { unique: false });
          messagesStore.createIndex('createdAt', 'createdAt', { unique: false });
        }

        // 记忆表
        if (!db.objectStoreNames.contains(STORE_MEMORIES)) {
          const memoriesStore = db.createObjectStore(STORE_MEMORIES, { keyPath: 'id' });
          memoriesStore.createIndex('type', 'type', { unique: false });
          memoriesStore.createIndex('createdAt', 'createdAt', { unique: false });
        }

        // 日记表
        if (!db.objectStoreNames.contains(STORE_DIARIES)) {
          const diariesStore = db.createObjectStore(STORE_DIARIES, { keyPath: 'id' });
          diariesStore.createIndex('date', 'date', { unique: true }); // 每天只能有一篇日记
          diariesStore.createIndex('mood', 'mood', { unique: false });
          diariesStore.createIndex('createdAt', 'createdAt', { unique: false });
        }
      };
    });

    return this.initPromise;
  }

  private async ensureDb(): Promise<IDBDatabase> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');
    return this.db;
  }

  // ============ 会话相关 ============

  async createSession(title?: string): Promise<ChatSession> {
    const db = await this.ensureDb();
    const session: ChatSession = {
      id: `session-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      title: title || '新对话',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messageCount: 0
    };

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_SESSIONS, 'readwrite');
      const store = tx.objectStore(STORE_SESSIONS);
      const request = store.add(session);
      request.onsuccess = () => resolve(session);
      request.onerror = () => reject(request.error);
    });
  }

  async getSession(sessionId: string): Promise<ChatSession | null> {
    const db = await this.ensureDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_SESSIONS, 'readonly');
      const store = tx.objectStore(STORE_SESSIONS);
      const request = store.get(sessionId);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  async getAllSessions(): Promise<ChatSession[]> {
    const db = await this.ensureDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_SESSIONS, 'readonly');
      const store = tx.objectStore(STORE_SESSIONS);
      const index = store.index('updatedAt');
      const request = index.getAll();
      request.onsuccess = () => resolve(request.result.reverse()); // 最新的在前
      request.onerror = () => reject(request.error);
    });
  }

  async updateSession(sessionId: string, updates: Partial<ChatSession>): Promise<void> {
    const db = await this.ensureDb();
    const session = await this.getSession(sessionId);
    if (!session) return;

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_SESSIONS, 'readwrite');
      const store = tx.objectStore(STORE_SESSIONS);
      const request = store.put({ ...session, ...updates, updatedAt: new Date().toISOString() });
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async deleteSession(sessionId: string): Promise<void> {
    const db = await this.ensureDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORE_SESSIONS, STORE_MESSAGES], 'readwrite');

      // 删除会话
      tx.objectStore(STORE_SESSIONS).delete(sessionId);

      // 删除相关消息
      const messagesStore = tx.objectStore(STORE_MESSAGES);
      const index = messagesStore.index('sessionId');
      const request = index.openCursor(IDBKeyRange.only(sessionId));

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        }
      };

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  // ============ 消息相关 ============

  async saveMessage(sessionId: string, message: Omit<ChatMessage, 'sessionId'>): Promise<void> {
    const db = await this.ensureDb();
    const fullMessage: ChatMessage = { ...message, sessionId };

    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORE_MESSAGES, STORE_SESSIONS], 'readwrite');
      const messagesStore = tx.objectStore(STORE_MESSAGES);

      // 先检查消息是否已存在
      const checkRequest = messagesStore.get(message.id);

      checkRequest.onsuccess = () => {
        const existingMessage = checkRequest.result;
        const isNewMessage = !existingMessage;

        // 保存消息（使用 put 支持更新）
        messagesStore.put(fullMessage);

        // 更新会话
        const sessionsStore = tx.objectStore(STORE_SESSIONS);
        const getRequest = sessionsStore.get(sessionId);

        getRequest.onsuccess = () => {
          const session = getRequest.result;
          if (session) {
            session.updatedAt = new Date().toISOString();
            // 只有新消息才增加计数
            if (isNewMessage) {
              session.messageCount++;
              // 用第一条用户消息作为标题
              if (session.messageCount === 1 && message.role === 'user') {
                session.title = message.content.slice(0, 30) + (message.content.length > 30 ? '...' : '');
              }
            }
            sessionsStore.put(session);
          }
        };
      };

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async getSessionMessages(sessionId: string): Promise<ChatMessage[]> {
    const db = await this.ensureDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_MESSAGES, 'readonly');
      const store = tx.objectStore(STORE_MESSAGES);
      const index = store.index('sessionId');
      const request = index.getAll(IDBKeyRange.only(sessionId));
      request.onsuccess = () => {
        // 按创建时间排序
        const messages = request.result.sort((a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
        resolve(messages);
      };
      request.onerror = () => reject(request.error);
    });
  }

  // ============ 记忆相关 ============

  async saveMemory(memory: UserMemory): Promise<void> {
    const db = await this.ensureDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_MEMORIES, 'readwrite');
      const store = tx.objectStore(STORE_MEMORIES);
      const request = store.add(memory);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getMemories(query?: string, limit: number = 10): Promise<UserMemory[]> {
    const db = await this.ensureDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_MEMORIES, 'readonly');
      const store = tx.objectStore(STORE_MEMORIES);
      const request = store.getAll();

      request.onsuccess = () => {
        let memories = request.result as UserMemory[];

        // 按时间倒序
        memories.sort((a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        // 搜索过滤
        if (query) {
          const lowerQuery = query.toLowerCase();
          memories = memories.filter(m =>
            m.content.toLowerCase().includes(lowerQuery) ||
            m.tags.some(t => t.toLowerCase().includes(lowerQuery))
          );
        }

        resolve(memories.slice(0, limit));
      };
      request.onerror = () => reject(request.error);
    });
  }

  async getMemoriesByType(type: UserMemory['type'], limit: number = 10): Promise<UserMemory[]> {
    const db = await this.ensureDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_MEMORIES, 'readonly');
      const store = tx.objectStore(STORE_MEMORIES);
      const index = store.index('type');
      const request = index.getAll(IDBKeyRange.only(type));

      request.onsuccess = () => {
        const memories = request.result as UserMemory[];
        memories.sort((a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        resolve(memories.slice(0, limit));
      };
      request.onerror = () => reject(request.error);
    });
  }

  async clearAllMemories(): Promise<void> {
    const db = await this.ensureDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_MEMORIES, 'readwrite');
      const store = tx.objectStore(STORE_MEMORIES);
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // ============ 日记相关 ============

  async saveDiary(diary: DiaryEntry): Promise<void> {
    const db = await this.ensureDb();
    const diaryWithTimestamp = {
      ...diary,
      createdAt: (diary as any).createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_DIARIES, 'readwrite');
      const store = tx.objectStore(STORE_DIARIES);

      // 先检查该日期是否已有日记
      const dateIndex = store.index('date');
      const checkRequest = dateIndex.get(diary.date);

      checkRequest.onsuccess = () => {
        const existing = checkRequest.result;
        if (existing && existing.id !== diary.id) {
          // 如果同一日期有不同 id 的日记，先删除旧的
          store.delete(existing.id);
        }
        // 保存新日记
        store.put(diaryWithTimestamp);
      };

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async getDiaryByDate(date: string): Promise<DiaryEntry | null> {
    const db = await this.ensureDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_DIARIES, 'readonly');
      const store = tx.objectStore(STORE_DIARIES);
      const index = store.index('date');
      const request = index.get(date);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  async getDiaryById(id: string): Promise<DiaryEntry | null> {
    const db = await this.ensureDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_DIARIES, 'readonly');
      const store = tx.objectStore(STORE_DIARIES);
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  async getAllDiaries(): Promise<DiaryEntry[]> {
    const db = await this.ensureDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_DIARIES, 'readonly');
      const store = tx.objectStore(STORE_DIARIES);
      const request = store.getAll();
      request.onsuccess = () => {
        // 按日期倒序排列
        const diaries = (request.result as DiaryEntry[]).sort((a, b) =>
          b.date.localeCompare(a.date)
        );
        resolve(diaries);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async searchDiaries(keyword?: string, mood?: Mood): Promise<DiaryEntry[]> {
    const db = await this.ensureDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_DIARIES, 'readonly');
      const store = tx.objectStore(STORE_DIARIES);
      const request = store.getAll();

      request.onsuccess = () => {
        let diaries = request.result as DiaryEntry[];

        // 按心情过滤
        if (mood) {
          diaries = diaries.filter(d => d.mood === mood);
        }

        // 按关键词搜索
        if (keyword) {
          const lowerKeyword = keyword.toLowerCase();
          diaries = diaries.filter(d =>
            d.content.toLowerCase().includes(lowerKeyword) ||
            d.feedback?.summary?.toLowerCase().includes(lowerKeyword)
          );
        }

        // 按日期倒序
        diaries.sort((a, b) => b.date.localeCompare(a.date));
        resolve(diaries);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async deleteDiary(id: string): Promise<void> {
    const db = await this.ensureDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_DIARIES, 'readwrite');
      const store = tx.objectStore(STORE_DIARIES);
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // 从 localStorage 迁移日记到 IndexedDB
  async migrateDiariesFromLocalStorage(): Promise<void> {
    const saved = localStorage.getItem('canned_diaries');
    if (!saved) return;

    try {
      const diaries = JSON.parse(saved) as DiaryEntry[];
      for (const diary of diaries) {
        await this.saveDiary(diary);
      }
      // 迁移成功后可以选择清除 localStorage
      // localStorage.removeItem('canned_diaries');
      console.log(`Migrated ${diaries.length} diaries to IndexedDB`);
    } catch (error) {
      console.error('Failed to migrate diaries:', error);
    }
  }
}

// 导出单例
export const chatDb = new ChatDatabase();
