/**
 * Markdown 渲染组件
 * 简化版，适合儿童日记应用风格
 */

import React, { memo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkBreaks from 'remark-breaks';
import remarkGfm from 'remark-gfm';

export interface MarkdownBlockProps {
  markdown?: string;
  className?: string;
  isStreaming?: boolean;
}

const MarkdownBlock = memo(({ markdown, className = '', isStreaming }: MarkdownBlockProps) => {
  const safeMarkdown = markdown ?? '';

  if (!safeMarkdown.trim()) {
    return isStreaming ? (
      <span className="inline-flex gap-1">
        <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce" />
        <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce [animation-delay:0.1s]" />
        <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce [animation-delay:0.2s]" />
      </span>
    ) : null;
  }

  return (
    <div className={`markdown-content ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
        components={{
          // 代码块处理
          code({ className, children, ...rest }) {
            const match = /language-(\w+)/.exec(className || '');
            const isBlockCode = !!className && !!match;
            const codeContent = String(children).replace(/\n$/, '');

            if (isBlockCode) {
              return (
                <div className="my-2 rounded-xl bg-gray-800 overflow-hidden">
                  <div className="px-3 py-1 bg-gray-700 text-xs text-gray-300 font-mono">
                    {match?.[1] || 'code'}
                  </div>
                  <pre className="p-3 overflow-x-auto">
                    <code className="text-xs text-gray-100 font-mono">
                      {codeContent}
                    </code>
                  </pre>
                </div>
              );
            }

            // 行内代码
            return (
              <code
                className="bg-[#FFC800]/20 text-[#C47F17] px-1.5 py-0.5 rounded-md text-sm font-bold"
                {...rest}
              >
                {codeContent}
              </code>
            );
          },

          // Pre 标签
          pre({ children }) {
            return <div className="overflow-x-auto">{children}</div>;
          },

          // 链接
          a({ href, children, ...rest }) {
            return (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#1CB0F6] font-bold hover:underline"
                {...rest}
              >
                {children}
              </a>
            );
          },

          // 表格
          table({ children, ...rest }) {
            return (
              <div className="my-2 overflow-x-auto rounded-xl border-2 border-[#E8E4D8]">
                <table className="min-w-full" {...rest}>
                  {children}
                </table>
              </div>
            );
          },

          thead({ children, ...rest }) {
            return (
              <thead className="bg-[#F5F3EE]" {...rest}>
                {children}
              </thead>
            );
          },

          th({ children, ...rest }) {
            return (
              <th className="px-3 py-2 text-left text-xs font-black text-gray-600 border-b border-[#E8E4D8]" {...rest}>
                {children}
              </th>
            );
          },

          td({ children, ...rest }) {
            return (
              <td className="px-3 py-2 text-sm text-gray-700 border-b border-[#E8E4D8]" {...rest}>
                {children}
              </td>
            );
          },

          // 引用块
          blockquote({ children, ...rest }) {
            return (
              <blockquote
                className="my-2 pl-3 border-l-4 border-[#58CC02] bg-[#58CC02]/5 py-2 pr-2 rounded-r-lg italic text-gray-600"
                {...rest}
              >
                {children}
              </blockquote>
            );
          },

          // 无序列表
          ul({ children, ...rest }) {
            return (
              <ul className="my-2 ml-4 space-y-1 list-disc marker:text-[#58CC02]" {...rest}>
                {children}
              </ul>
            );
          },

          // 有序列表
          ol({ children, ...rest }) {
            return (
              <ol className="my-2 ml-4 space-y-1 list-decimal marker:text-[#1CB0F6] marker:font-bold" {...rest}>
                {children}
              </ol>
            );
          },

          // 列表项
          li({ children, ...rest }) {
            return (
              <li className="text-sm text-gray-700" {...rest}>
                {children}
              </li>
            );
          },

          // 段落
          p({ children, ...rest }) {
            return (
              <p className="my-1 leading-relaxed" {...rest}>
                {children}
              </p>
            );
          },

          // 标题
          h1({ children, ...rest }) {
            return (
              <h1 className="text-lg font-black text-gray-800 mt-3 mb-2" {...rest}>
                {children}
              </h1>
            );
          },

          h2({ children, ...rest }) {
            return (
              <h2 className="text-base font-black text-gray-800 mt-3 mb-1" {...rest}>
                {children}
              </h2>
            );
          },

          h3({ children, ...rest }) {
            return (
              <h3 className="text-sm font-black text-gray-700 mt-2 mb-1" {...rest}>
                {children}
              </h3>
            );
          },

          // 分隔线
          hr() {
            return <hr className="my-3 border-[#E8E4D8] border-dashed" />;
          },

          // 加粗
          strong({ children, ...rest }) {
            return (
              <strong className="font-black text-gray-800" {...rest}>
                {children}
              </strong>
            );
          },

          // 斜体
          em({ children, ...rest }) {
            return (
              <em className="italic text-gray-600" {...rest}>
                {children}
              </em>
            );
          },
        }}
      >
        {safeMarkdown}
      </ReactMarkdown>
    </div>
  );
});

MarkdownBlock.displayName = 'MarkdownBlock';

export default MarkdownBlock;
