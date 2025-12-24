/**
 * Agent 聊天 Hook
 * 封装所有聊天逻辑，支持流式输出
 */

import { useRef, useEffect, useCallback, useState, FormEvent } from 'react';
import { useChat, Message } from '@ai-sdk/react';
import { useDiary } from '../contexts/DiaryContext';
import { useChatHistory } from './useChatHistory';
import { chatDb } from '../services/chatDb';
import {
  createToolCallHandler,
  CHAT_API_URL,
  ToolHandlers
} from '../config/agentTools';

// 日记上下文接口
export interface DiaryContext {
  diaryId: string;
  diaryContent: string;
  feedback?: string;
  materialTitle?: string;
  materialAuthor?: string;
  date: string;
}

export interface UseAgentChatReturn {
  // 消息相关
  messages: Message[];
  input: string;
  setInput: (value: string) => void;
  handleSubmit: (e: FormEvent) => Promise<void>;
  sendMessage: (text: string) => Promise<void>;
  isLoading: boolean;

  // 会话相关
  isReady: boolean;
  sessions: any[];
  currentSessionId: string | null;
  showHistory: boolean;
  setShowHistory: (show: boolean) => void;

  // 操作方法
  handleNewChat: () => Promise<void>;
  handleLoadSession: (sessionId: string) => Promise<void>;

  // Refs
  messagesEndRef: React.RefObject<HTMLDivElement>;
}

export interface UseAgentChatOptions {
  diaryContext?: DiaryContext;
}

export function useAgentChat(options?: UseAgentChatOptions): UseAgentChatReturn {
  const { diaryContext } = options || {};
  const { diaries, gradeLevel } = useDiary();
  const {
    isReady,
    sessions,
    currentSessionId,
    createNewSession,
    switchSession,
    saveMemory,
    getMemories
  } = useChatHistory();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showHistory, setShowHistory] = useState(false);
  const savedMessageIds = useRef<Set<string>>(new Set());
  const contextSent = useRef(false); // 标记是否已发送上下文

  // 构建工具处理器
  const toolHandlers: ToolHandlers = {
    saveMemory: async (args) => {
      const result = await saveMemory(args);
      return result;
    },
    getMemories: async (query, limit) => {
      const memories = await getMemories(query, limit);
      return memories;
    },
    diaries
  };

  // 创建工具调用处理器
  const onToolCall = createToolCallHandler(toolHandlers);

  // 使用 AI SDK 的 useChat hook（原生支持流式输出）
  const {
    messages,
    input,
    setInput,
    handleSubmit: originalHandleSubmit,
    append,
    isLoading,
    setMessages,
    error
  } = useChat({
    api: CHAT_API_URL,
    body: { gradeLevel },
    // 使用 data 协议（默认）支持工具调用的流式输出
    streamProtocol: 'data',
    // 工具调用处理
    onToolCall,
    // 最大工具调用步数
    maxSteps: 5,
    // 流式输出完成回调
    onFinish: (message) => {
      console.log('[Chat] Message finished:', message.id);
      // 打印 parts 用于调试
      if ((message as any).parts) {
        console.log('[Chat] Message parts:', (message as any).parts);
      }
    },
    // 错误处理
    onError: (error) => {
      console.error('[Chat Error]', error);
    }
  });

  // 自动滚动到底部
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // 初始化时创建新会话
  useEffect(() => {
    if (isReady && !currentSessionId && sessions.length === 0) {
      createNewSession();
    }
  }, [isReady, currentSessionId, sessions.length, createNewSession]);

  // 当有日记上下文时，自动发送初始消息
  useEffect(() => {
    if (!diaryContext || contextSent.current || !isReady || !currentSessionId) return;
    if (messages.length > 0) return; // 已有消息，不重复发送

    contextSent.current = true;

    // 构建包含日记上下文的初始消息
    const contextMessage = `我刚刚写了一篇日记，想和你聊聊！

【我的日记】
${diaryContext.diaryContent}

${diaryContext.feedback ? `【小罐罐的惊喜加料】
${diaryContext.feedback}` : ''}

${diaryContext.materialTitle ? `【推荐的素材】
《${diaryContext.materialTitle}》${diaryContext.materialAuthor ? ` - ${diaryContext.materialAuthor}` : ''}` : ''}

你能根据我的日记内容，和我聊聊吗？可以问问我今天的感受，或者讲讲相关的有趣知识！`;

    // 延迟发送确保会话已准备好
    setTimeout(() => {
      append({ role: 'user', content: contextMessage });
    }, 100);
  }, [diaryContext, isReady, currentSessionId, messages.length, append]);

  // 保存消息到 IndexedDB
  useEffect(() => {
    if (!currentSessionId || messages.length === 0) return;

    // 遍历所有消息，保存未保存的
    messages.forEach((msg, index) => {
      // 跳过已保存的消息
      if (savedMessageIds.current.has(msg.id)) return;

      // 只保存 user 和 assistant 消息
      if (msg.role !== 'user' && msg.role !== 'assistant') return;

      // 如果是最后一条 assistant 消息且正在加载，跳过（等流式输出完成）
      const isLastMessage = index === messages.length - 1;
      if (isLastMessage && msg.role === 'assistant' && isLoading) return;

      console.log('[Chat] Saving message:', msg.id, msg.role, msg.content?.slice(0, 50));
      savedMessageIds.current.add(msg.id);

      chatDb.saveMessage(currentSessionId, {
        id: msg.id,
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
        parts: (msg as any).parts,
        toolInvocations: (msg as any).toolInvocations,
        createdAt: new Date().toISOString()
      }).then(() => {
        console.log('[Chat] Message saved successfully:', msg.id);
      }).catch((err) => {
        console.error('[Chat] Failed to save message:', err);
        // 保存失败时移除标记，以便重试
        savedMessageIds.current.delete(msg.id);
      });
    });
  }, [messages, currentSessionId, isLoading]);

  // 处理发送消息
  const handleSubmit = useCallback(async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    // 如果没有当前会话，创建一个
    if (!currentSessionId) {
      await createNewSession();
    }

    originalHandleSubmit(e);
  }, [input, isLoading, currentSessionId, createNewSession, originalHandleSubmit]);

  // 直接发送消息（用于快捷按钮等场景）
  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isLoading) return;

    // 如果没有当前会话，创建一个
    if (!currentSessionId) {
      await createNewSession();
    }

    append({ role: 'user', content: text });
  }, [isLoading, currentSessionId, createNewSession, append]);

  // 开始新对话
  const handleNewChat = useCallback(async () => {
    const session = await createNewSession();
    if (session) {
      savedMessageIds.current.clear();
      setMessages([]);
      setShowHistory(false);
    }
  }, [createNewSession, setMessages]);

  // 加载历史会话
  const handleLoadSession = useCallback(async (sessionId: string) => {
    console.log('[Chat] Loading session:', sessionId);
    switchSession(sessionId);
    const sessionMessages = await chatDb.getSessionMessages(sessionId);
    console.log('[Chat] Loaded messages:', sessionMessages.length, sessionMessages);

    // 清空已保存消息记录，然后标记加载的消息为已保存
    savedMessageIds.current.clear();
    sessionMessages.forEach(msg => savedMessageIds.current.add(msg.id));

    // 转换为 useChat 格式
    const formattedMessages: Message[] = sessionMessages.map(msg => ({
      id: msg.id,
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
      parts: msg.parts,
      toolInvocations: msg.toolInvocations
    }));

    setMessages(formattedMessages);
    setShowHistory(false);
  }, [switchSession, setMessages]);

  return {
    // 消息相关
    messages,
    input,
    setInput,
    handleSubmit,
    sendMessage,
    isLoading,

    // 会话相关
    isReady,
    sessions,
    currentSessionId,
    showHistory,
    setShowHistory,

    // 操作方法
    handleNewChat,
    handleLoadSession,

    // Refs
    messagesEndRef
  };
}
