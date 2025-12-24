import React from "react";
import { IconAssets } from "../../constants";
import ToolResultCard from "./ToolResultCard";
import MarkdownBlock from "./MarkdownBlock";

// AI SDK Message Part 类型
interface TextPart {
  type: "text";
  text: string;
}

interface ToolCallPart {
  type: "tool-call";
  toolCallId: string;
  toolName: string;
  args: any;
}

interface ToolResultPart {
  type: "tool-result";
  toolCallId: string;
  toolName: string;
  result: any;
}

type MessagePart =
  | TextPart
  | ToolCallPart
  | ToolResultPart
  | { type: string; [key: string]: any };

// AI SDK 的工具调用类型（用于 toolInvocations）
interface ToolInvocation {
  toolCallId: string;
  toolName: string;
  args: any;
  state: "partial-call" | "call" | "result";
  result?: any;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  parts?: MessagePart[];
  toolInvocations?: ToolInvocation[];
}

interface ChatBubbleProps {
  message: Message;
  silentTools?: string[];
  isStreaming?: boolean;
}

const ChatBubble: React.FC<ChatBubbleProps> = ({
  message,
  silentTools = ["saveMemory", "getMemories"],
  isStreaming = false,
}) => {
  const isUser = message.role === "user";

  // 根据 toolCallId 查找 toolInvocation 的状态
  const getToolInvocationState = (toolCallId: string) => {
    return message.toolInvocations?.find((t) => t.toolCallId === toolCallId);
  };

  // 渲染工具卡片
  const renderToolPart = (
    part: ToolCallPart | ToolResultPart,
    index: number
  ) => {
    const toolName = part.toolName;
    const toolCallId = part.toolCallId;

    // 跳过静默工具
    if (silentTools.includes(toolName)) {
      return null;
    }

    // 查找最新状态
    const invocation = getToolInvocationState(toolCallId);
    const state = invocation?.state;
    const result =
      invocation?.result ??
      (part.type === "tool-result" ? part.result : undefined);

    // 显示 loading
    if (
      state === "call" ||
      state === "partial-call" ||
      (part.type === "tool-call" && !result)
    ) {
      return (
        <div key={`tool-${toolCallId}-${index}`} className="my-3">
          <ToolResultCard toolName={toolName} isLoading={true} />
        </div>
      );
    }

    // 显示结果
    if (result !== undefined) {
      return (
        <div key={`tool-${toolCallId}-${index}`} className="my-3">
          <ToolResultCard toolName={toolName} result={result} />
        </div>
      );
    }

    return null;
  };

  // 按 parts 顺序渲染（AI SDK 官方推荐方式）
  const renderByParts = () => {
    if (!message.parts || message.parts.length === 0) {
      return null;
    }

    const elements: React.ReactNode[] = [];
    const renderedToolIds = new Set<string>();

    message.parts.forEach((part, index) => {
      switch (part.type) {
        case "text":
          if (part.text) {
            elements.push(
              <MarkdownBlock
                key={`text-${index}`}
                markdown={part.text}
                isStreaming={isStreaming && index === message.parts!.length - 1}
              />
            );
          }
          break;

        case "tool-call":
          // 记录已渲染的工具
          renderedToolIds.add(part.toolCallId);
          const toolCard = renderToolPart(part as ToolCallPart, index);
          if (toolCard) {
            elements.push(toolCard);
          }
          break;

        case "tool-invocation":
          // AI SDK 的 tool-invocation 类型，数据在 toolInvocation 属性中
          const invPart = (part as any).toolInvocation || part;
          const invToolCallId = invPart.toolCallId;
          if (invToolCallId && !renderedToolIds.has(invToolCallId)) {
            renderedToolIds.add(invToolCallId);
            const toolName = invPart.toolName;

            // 跳过静默工具
            if (toolName && !silentTools.includes(toolName)) {
              const state = invPart.state;
              const result = invPart.result;

              if (state === "result" && result !== undefined) {
                // 有结果，显示结果卡片
                elements.push(
                  <div key={`tool-${invToolCallId}-${index}`} className="my-3">
                    <ToolResultCard toolName={toolName} result={result} />
                  </div>
                );
              } else {
                // 正在调用，显示 loading
                elements.push(
                  <div key={`tool-${invToolCallId}-${index}`} className="my-3">
                    <ToolResultCard toolName={toolName} isLoading={true} />
                  </div>
                );
              }
            }
          }
          break;

        case "tool-result":
          // 如果 tool-call 或 tool-invocation 已渲染，跳过 tool-result（避免重复）
          if (!renderedToolIds.has(part.toolCallId)) {
            renderedToolIds.add(part.toolCallId);
            const resultCard = renderToolPart(part as ToolResultPart, index);
            if (resultCard) {
              elements.push(resultCard);
            }
          }
          break;
      }
    });

    // 如果正在流式输出，添加 loading 指示
    if (isStreaming && elements.length > 0) {
      // 检查最后一个 part 是否是已完成的 tool（后面可能还有文字要来）
      const lastPart = message.parts![message.parts!.length - 1];
      const isToolCompleted =
        lastPart.type === "tool-invocation" &&
        ((lastPart as any).toolInvocation?.state === "result" ||
          (lastPart as any).state === "result");

      if (isToolCompleted) {
        elements.push(
          <div key="streaming-indicator" className="flex gap-1.5 mt-2">
            <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" />
            <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce [animation-delay:0.1s]" />
            <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce [animation-delay:0.2s]" />
          </div>
        );
      }
    }

    return elements.length > 0 ? elements : null;
  };

  // 回退方式：使用 content + toolInvocations（当 parts 不可用时）
  const renderFallback = () => {
    const elements: React.ReactNode[] = [];

    if (message.content) {
      elements.push(
        <MarkdownBlock
          key="content"
          markdown={message.content}
          isStreaming={isStreaming}
        />
      );
    }

    if (message.toolInvocations) {
      message.toolInvocations.forEach((tool, index) => {
        if (silentTools.includes(tool.toolName)) return;

        if (tool.state === "call" || tool.state === "partial-call") {
          elements.push(
            <div key={`tool-${tool.toolCallId}`} className="my-3">
              <ToolResultCard toolName={tool.toolName} isLoading={true} />
            </div>
          );
        } else if (tool.result !== undefined) {
          elements.push(
            <div key={`tool-${tool.toolCallId}`} className="my-3">
              <ToolResultCard toolName={tool.toolName} result={tool.result} />
            </div>
          );
        }
      });
    }

    return elements.length > 0 ? elements : null;
  };

  // 渲染 AI 消息内容
  const renderAssistantContent = () => {
    // 调试日志
    console.log("[ChatBubble] Message structure:", {
      id: message.id,
      hasParts: !!message.parts,
      partsLength: message.parts?.length,
      partsTypes: message.parts?.map((p) => p.type),
      hasToolInvocations: !!message.toolInvocations,
      toolInvocationsLength: message.toolInvocations?.length,
      toolStates: message.toolInvocations?.map((t) => ({
        name: t.toolName,
        state: t.state,
      })),
      contentPreview: message.content?.slice(0, 50),
    });

    // 优先使用 parts-based 渲染（已经由 mergeAssistantMessages 处理好顺序）
    if (message.parts && message.parts.length > 0) {
      const partsContent = renderByParts();
      if (partsContent) {
        return partsContent;
      }
    }

    // 回退：使用 content + toolInvocations（当 parts 为空时）
    const elements: React.ReactNode[] = [];

    // 渲染文本内容
    if (message.content) {
      elements.push(
        <MarkdownBlock
          key="content"
          markdown={message.content}
          isStreaming={isStreaming && !message.toolInvocations?.length}
        />
      );
    }

    // 渲染 toolInvocations（作为回退）
    if (message.toolInvocations && message.toolInvocations.length > 0) {
      message.toolInvocations.forEach((tool) => {
        if (silentTools.includes(tool.toolName)) return;

        console.log("[ChatBubble] Rendering tool (fallback):", {
          name: tool.toolName,
          state: tool.state,
          hasResult: tool.result !== undefined,
        });

        // 如果有结果，显示结果卡片
        if (tool.result !== undefined) {
          elements.push(
            <div key={`tool-${tool.toolCallId}`} className="my-3">
              <ToolResultCard toolName={tool.toolName} result={tool.result} />
            </div>
          );
        }
        // 如果正在调用（没有结果），显示 loading
        else if (tool.state === "call" || tool.state === "partial-call") {
          elements.push(
            <div key={`tool-${tool.toolCallId}`} className="my-3">
              <ToolResultCard toolName={tool.toolName} isLoading={true} />
            </div>
          );
        }
      });
    }

    if (elements.length > 0) {
      return elements;
    }

    // 正在加载（没有任何内容时显示）
    if (isStreaming) {
      return (
        <div className="flex gap-1.5">
          <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" />
          <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce [animation-delay:0.1s]" />
          <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce [animation-delay:0.2s]" />
        </div>
      );
    }

    return null;
  };

  // 用户消息
  if (isUser) {
    return (
      <div className="flex gap-3 flex-row-reverse animate-in fade-in slide-in-from-bottom-2 duration-300">
        <div className="max-w-[80%]">
          <div className="px-4 py-3 rounded-2xl rounded-tr-sm text-sm leading-relaxed bg-[#58CC02] text-white font-bold">
            {message.content}
          </div>
        </div>
      </div>
    );
  }

  // AI 消息
  return (
    <div className="flex gap-3 flex-row animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="shrink-0 mt-1">
        <img
          src={IconAssets.chatAvatar}
          alt="罐头小精灵"
          className="w-14 h-14 object-contain mix-blend-multiply"
        />
      </div>
      <div className="max-w-[80%]">
        <div className="px-4 py-3 rounded-2xl rounded-tl-sm text-sm leading-relaxed bg-white border-2 border-[#E8E4D8] text-gray-700 shadow-sm">
          {renderAssistantContent()}
        </div>
      </div>
    </div>
  );
};

export default ChatBubble;
