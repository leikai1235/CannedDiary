/**
 * 聊天页面 - 和小罐罐对话
 * 支持流式输出，工具调用
 */

import React from "react";
import { useLocation } from "react-router-dom";
import { useAgentChat, DiaryContext } from "../hooks/useAgentChat";
import { SILENT_TOOLS, QUICK_PROMPTS } from "../config/agentTools";
import { ChatBubble, ChatInput } from "../components/chat";
import { SpinningCan } from "../constants";
import cannedIpUrl from "../assets/canned-ip.svg";

// 子组件：顶部操作栏
const ChatHeader: React.FC<{
  showHistory: boolean;
  onToggleHistory: () => void;
  onNewChat: () => void;
}> = ({ showHistory, onToggleHistory, onNewChat }) => (
  <div className="shrink-0 px-4 py-3 flex items-center justify-between bg-white/80 backdrop-blur-sm border-b-2 border-[#E8E4D8]">
    <button
      onClick={onToggleHistory}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border-b-[3px] font-black text-xs transition-all active:translate-y-0.5 active:border-b-0 bg-white border-[#E8E4D8] text-[#8B7355]"
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
      >
        <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      历史记录
    </button>

    <button
      onClick={onNewChat}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border-b-[3px] font-black text-xs transition-all active:translate-y-0.5 active:border-b-0 bg-[#FFC800] border-[#E6B400] text-white"
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
      >
        <path d="M12 4v16m8-8H4" />
      </svg>
      新对话
    </button>
  </div>
);

// 子组件：历史记录面板
const HistoryPanel: React.FC<{
  sessions: any[];
  currentSessionId: string | null;
  onClose: () => void;
  onLoadSession: (sessionId: string) => void;
}> = ({ sessions, currentSessionId, onClose, onLoadSession }) => (
  <div className="absolute inset-0 z-20 bg-[#F0EDE5] animate-in slide-in-from-left duration-200">
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-black text-gray-800">历史对话</h3>
        <button
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="space-y-2 max-h-[70vh] overflow-y-auto">
        {sessions.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">
            还没有历史对话
          </p>
        ) : (
          sessions.map((session) => (
            <button
              key={session.id}
              onClick={() => onLoadSession(session.id)}
              className={`w-full text-left p-3 rounded-xl border-2 transition-all ${
                currentSessionId === session.id
                  ? "border-[#FFC800] bg-[#FFC800]/5"
                  : "border-[#E8E4D8] bg-white hover:border-[#FFC800]/30"
              }`}
            >
              <p className="font-bold text-sm text-gray-800 line-clamp-1">
                {session.title}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {new Date(session.updatedAt).toLocaleDateString("zh-CN")} ·{" "}
                {session.messageCount || 0} 条消息
              </p>
            </button>
          ))
        )}
      </div>
    </div>
  </div>
);

// 子组件：空状态欢迎页
const WelcomeView: React.FC<{
  onSelectPrompt: (prompt: string) => void;
}> = ({ onSelectPrompt }) => (
  <div className="flex flex-col items-center justify-center h-full text-center py-8">
    <div className="relative mb-6">
      <div className="absolute inset-0 bg-[#FFC800] rounded-full blur-[40px] opacity-20"></div>
      <img src={cannedIpUrl} width={100} height={114} alt="" />
    </div>
    <h2 className="text-xl font-extrabold text-gray-700 mb-2">
      嗨！我是小罐罐
    </h2>
    <p className="text-gray-400 font-bold text-sm max-w-[250px] leading-relaxed">
      有什么想聊的？我可以陪你聊天、帮你复习日记、推荐写作素材哦！
    </p>

    {/* 快捷提问 */}
    <div className="mt-6 flex flex-wrap gap-2 justify-center max-w-[320px]">
      {QUICK_PROMPTS.map((prompt, index) => (
        <button
          key={index}
          onClick={() => onSelectPrompt(prompt)}
          className="text-xs font-black text-[#8B7355] bg-white border-b-[3px] border-[#E8E4D8] px-4 py-2 rounded-full transition-all active:translate-y-0.5 active:border-b-0 hover:border-[#FFC800] hover:text-[#D4A600]"
        >
          {prompt}
        </button>
      ))}
    </div>
  </div>
);

// 子组件：加载中指示器 - 使用全局扁罐头转动样式
const LoadingIndicator: React.FC = () => (
  <div className="flex gap-3">
    <div className="shrink-0">
      <SpinningCan size={40} />
    </div>
    <div className="bg-white border-2 border-[#E8E4D8] rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm flex items-center">
      <div className="flex gap-1.5">
        <div className="w-2 h-2 bg-[#58CC02] rounded-full animate-bounce" />
        <div className="w-2 h-2 bg-[#FFC800] rounded-full animate-bounce [animation-delay:0.1s]" />
        <div className="w-2 h-2 bg-[#1CB0F6] rounded-full animate-bounce [animation-delay:0.2s]" />
      </div>
    </div>
  </div>
);

// 合并连续的 assistant 消息，保持正确顺序
// AI SDK 的 parts 顺序可能不对（text 可能在 tool-result 之前），需要重新排序
const mergeAssistantMessages = (messages: any[]) => {
  const merged: any[] = [];

  // 重新排序 parts：确保 tool-invocation 之后的 text 在工具卡片之后显示
  const reorderParts = (parts: any[]) => {
    if (!parts || parts.length === 0) return parts;

    const result: any[] = [];
    const pendingTexts: any[] = []; // tool-invocation 之后的 text
    let foundToolInvocation = false;

    for (const part of parts) {
      // 跳过 step-start
      if (part.type === "step-start") continue;

      if (part.type === "tool-invocation" || part.type === "tool-call") {
        // 在 tool 之前的 text 直接添加
        result.push(...pendingTexts);
        pendingTexts.length = 0;
        result.push(part);
        foundToolInvocation = true;
      } else if (part.type === "tool-result") {
        // tool-result 直接添加
        result.push(part);
      } else if (part.type === "text") {
        if (foundToolInvocation) {
          // tool-invocation 之后的 text，暂存到最后
          pendingTexts.push(part);
        } else {
          // tool-invocation 之前的 text 直接添加
          result.push(part);
        }
      } else {
        result.push(part);
      }
    }

    // 把剩余的 text 加到最后
    result.push(...pendingTexts);

    return result;
  };

  // 辅助函数：从 toolInvocations 创建 tool parts
  const createToolParts = (toolInvocations: any[]) => {
    return toolInvocations.map((tool: any) => {
      if (tool.result !== undefined) {
        return {
          type: "tool-result",
          toolCallId: tool.toolCallId,
          toolName: tool.toolName,
          result: tool.result,
        };
      } else {
        return {
          type: "tool-call",
          toolCallId: tool.toolCallId,
          toolName: tool.toolName,
          args: tool.args,
        };
      }
    });
  };

  // 辅助函数：确保消息有 parts
  const ensureParts = (msg: any) => {
    if (msg.parts && msg.parts.length > 0) {
      // 重新排序 parts
      const reordered = reorderParts(msg.parts);

      // 检查是否有 tool parts
      const hasToolParts = reordered.some(
        (p: any) =>
          p.type === "tool-call" ||
          p.type === "tool-result" ||
          p.type === "tool-invocation"
      );

      // 如果没有 tool parts 但有 toolInvocations，追加到末尾
      if (
        !hasToolParts &&
        msg.toolInvocations &&
        msg.toolInvocations.length > 0
      ) {
        return [...reordered, ...createToolParts(msg.toolInvocations)];
      }

      return reordered;
    }

    // 没有 parts，需要创建
    const parts: any[] = [];

    if (msg.content) {
      parts.push({ type: "text", text: msg.content });
    }

    if (msg.toolInvocations && msg.toolInvocations.length > 0) {
      parts.push(...createToolParts(msg.toolInvocations));
    }

    return parts;
  };

  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];

    if (msg.role === "user") {
      merged.push(msg);
      continue;
    }

    const lastMerged = merged[merged.length - 1];

    if (lastMerged && lastMerged.role === "assistant") {
      lastMerged.parts = ensureParts(lastMerged);
      const currentParts = ensureParts(msg);

      if (currentParts.length > 0) {
        // 合并后再次重新排序
        lastMerged.parts = reorderParts([...lastMerged.parts, ...currentParts]);
      }

      lastMerged.content = (lastMerged.content || "") + (msg.content || "");

      if (msg.toolInvocations) {
        lastMerged.toolInvocations = [
          ...(lastMerged.toolInvocations || []),
          ...msg.toolInvocations,
        ];
      }
    } else {
      const newMsg = { ...msg };
      newMsg.parts = ensureParts(newMsg);
      merged.push(newMsg);
    }
  }

  return merged;
};

// 子组件：消息列表
const MessageList: React.FC<{
  messages: any[];
  isLoading: boolean;
  messagesEndRef: React.RefObject<HTMLDivElement>;
}> = ({ messages, isLoading, messagesEndRef }) => {
  // 合并连续的 assistant 消息
  const mergedMessages = mergeAssistantMessages(messages);

  // 判断是否需要显示加载指示器
  const lastMessage = mergedMessages[mergedMessages.length - 1];
  const showLoading =
    isLoading && mergedMessages.length > 0 && lastMessage?.role === "user";

  return (
    <>
      {mergedMessages.map((message, index) => (
        <ChatBubble
          key={message.id}
          message={message}
          silentTools={SILENT_TOOLS}
          isStreaming={
            isLoading &&
            index === mergedMessages.length - 1 &&
            message.role === "assistant"
          }
        />
      ))}

      {/* 加载中指示器 - 仅在等待 AI 响应时显示 */}
      {showLoading && <LoadingIndicator />}

      <div ref={messagesEndRef} />
    </>
  );
};

// 主组件
const ChatPage: React.FC = () => {
  const location = useLocation();
  const diaryContext = (location.state as { diaryContext?: DiaryContext })
    ?.diaryContext;

  const {
    // 消息相关
    messages,
    input,
    setInput,
    handleSubmit,
    sendMessage,
    isLoading,

    // 会话相关
    sessions,
    currentSessionId,
    showHistory,
    setShowHistory,

    // 操作方法
    handleNewChat,
    handleLoadSession,

    // Refs
    messagesEndRef,
  } = useAgentChat({ diaryContext });

  return (
    <div className="flex-1 flex flex-col h-full bg-[#F0EDE5] relative overflow-hidden">
      {/* 顶部操作栏 */}
      <ChatHeader
        showHistory={showHistory}
        onToggleHistory={() => setShowHistory(!showHistory)}
        onNewChat={handleNewChat}
      />

      {/* 历史记录面板 */}
      {showHistory && (
        <HistoryPanel
          sessions={sessions}
          currentSessionId={currentSessionId}
          onClose={() => setShowHistory(false)}
          onLoadSession={handleLoadSession}
        />
      )}

      {/* 聊天消息区域 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <WelcomeView onSelectPrompt={sendMessage} />
        ) : (
          <MessageList
            messages={messages}
            isLoading={isLoading}
            messagesEndRef={messagesEndRef}
          />
        )}
      </div>

      {/* 输入区域 - 固定在底部导航上方 */}
      <div className="shrink-0 mb-[100px]">
        <ChatInput
          value={input}
          onChange={setInput}
          onSubmit={handleSubmit}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
};

export default ChatPage;
