/**
 * Loading 组件 - 可爱黄色罐头
 */

import React from 'react';

// 导入加载图片
import creatingImg from '../../assets/loading/creating.png';
import searchingImg from '../../assets/loading/searching.png';
import surpriseOpeningImg from '../../assets/loading/surprise-opening.png';

// 加载图片类型映射
export const LoadingImages = {
  creating: creatingImg,
  searching: searchingImg,
  'surprise-opening': surpriseOpeningImg,
} as const;

export type LoadingImageType = keyof typeof LoadingImages;

export const SpinningCan = ({ size = 80 }: { size?: number }) => (
  <div className="relative inline-block">
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      className="animate-bounce-gentle"
    >
      {/* 阴影 */}
      <ellipse cx="32" cy="58" rx="16" ry="4" fill="#E5A500" opacity="0.2" />

      {/* 罐头盖子 */}
      <rect x="12" y="8" width="40" height="10" rx="5" fill="#E5A500" />
      <rect x="16" y="10" width="12" height="4" rx="2" fill="#FFE066" opacity="0.6" />

      {/* 罐头身体 */}
      <rect x="10" y="16" width="44" height="38" rx="8" fill="#FFC800" />
      <rect x="10" y="16" width="44" height="38" rx="8" stroke="#E5A500" strokeWidth="2" fill="none" />

      {/* 身体高光 */}
      <rect x="14" y="20" width="10" height="30" rx="5" fill="white" opacity="0.3" />

      {/* 眼睛 */}
      <ellipse cx="24" cy="32" rx="4" ry="5" fill="white" />
      <ellipse cx="40" cy="32" rx="4" ry="5" fill="white" />
      <ellipse cx="25" cy="33" rx="2.5" ry="3" fill="#4A3728" />
      <ellipse cx="41" cy="33" rx="2.5" ry="3" fill="#4A3728" />
      {/* 眼睛高光 */}
      <circle cx="26" cy="31" r="1.2" fill="white" />
      <circle cx="42" cy="31" r="1.2" fill="white" />

      {/* 腮红 */}
      <ellipse cx="17" cy="40" rx="4" ry="2.5" fill="#FFAA80" opacity="0.5" />
      <ellipse cx="47" cy="40" rx="4" ry="2.5" fill="#FFAA80" opacity="0.5" />

      {/* 微笑 */}
      <path
        d="M26 44C28 48 36 48 38 44"
        stroke="#4A3728"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />

      {/* 装饰星星 */}
      <g className="animate-twinkle">
        <path d="M6 12L7 14L9 14L7.5 15.5L8 18L6 16.5L4 18L4.5 15.5L3 14L5 14Z" fill="#58CC02" />
        <path d="M56 20L57 22L59 22L57.5 23.5L58 26L56 24.5L54 26L54.5 23.5L53 22L55 22Z" fill="#1CB0F6" />
      </g>
    </svg>

    <style>{`
      @keyframes bounce-gentle {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-6px); }
      }
      @keyframes twinkle {
        0%, 100% { opacity: 1; transform: scale(1); }
        50% { opacity: 0.5; transform: scale(0.8); }
      }
      .animate-bounce-gentle { animation: bounce-gentle 1.5s ease-in-out infinite; }
      .animate-twinkle { animation: twinkle 1.2s ease-in-out infinite; }
    `}</style>
  </div>
);

// 动态星星组件
const AnimatedStars = () => (
  <>
    {/* 左上星星 */}
    <svg className="absolute -top-2 -left-2 animate-twinkle" width="24" height="24" viewBox="0 0 24 24">
      <path d="M12 2L13.5 8.5L20 10L13.5 11.5L12 18L10.5 11.5L4 10L10.5 8.5Z" fill="#FFC800" />
    </svg>
    {/* 右上星星 */}
    <svg className="absolute -top-4 right-4 animate-twinkle [animation-delay:0.3s]" width="20" height="20" viewBox="0 0 24 24">
      <path d="M12 2L13.5 8.5L20 10L13.5 11.5L12 18L10.5 11.5L4 10L10.5 8.5Z" fill="#58CC02" />
    </svg>
    {/* 右下星星 */}
    <svg className="absolute bottom-4 -right-2 animate-twinkle [animation-delay:0.6s]" width="18" height="18" viewBox="0 0 24 24">
      <path d="M12 2L13.5 8.5L20 10L13.5 11.5L12 18L10.5 11.5L4 10L10.5 8.5Z" fill="#1CB0F6" />
    </svg>
    {/* 左下星星 */}
    <svg className="absolute bottom-0 left-0 animate-twinkle [animation-delay:0.9s]" width="16" height="16" viewBox="0 0 24 24">
      <path d="M12 2L13.5 8.5L20 10L13.5 11.5L12 18L10.5 11.5L4 10L10.5 8.5Z" fill="#FF9500" />
    </svg>
    {/* 顶部小星星 */}
    <svg className="absolute -top-6 left-1/2 -translate-x-1/2 animate-twinkle [animation-delay:0.15s]" width="14" height="14" viewBox="0 0 24 24">
      <path d="M12 2L13.5 8.5L20 10L13.5 11.5L12 18L10.5 11.5L4 10L10.5 8.5Z" fill="#FF6B6B" />
    </svg>
  </>
);

export const LoadingScreen = ({
  message = "加载中",
  showDots = true,
  imageType,
}: {
  message?: string;
  showDots?: boolean;
  imageType?: LoadingImageType;
}) => (
  <div className="flex flex-col items-center justify-center gap-6">
    {imageType ? (
      <div className="relative animate-bounce-gentle">
        <img
          src={LoadingImages[imageType]}
          alt={message}
          className="w-40 h-40 object-contain"
        />
        <AnimatedStars />
      </div>
    ) : (
      <SpinningCan size={100} />
    )}
    <div className="flex flex-col items-center gap-3">
      <h2 className="text-xl font-extrabold text-gray-800 tracking-tight">
        {message}
      </h2>
      {showDots && (
        <div className="flex gap-2">
          <div className="w-3 h-3 bg-[#58CC02] rounded-full animate-bounce" />
          <div className="w-3 h-3 bg-[#FFC800] rounded-full animate-bounce [animation-delay:0.15s]" />
          <div className="w-3 h-3 bg-[#1CB0F6] rounded-full animate-bounce [animation-delay:0.3s]" />
        </div>
      )}
    </div>
  </div>
);
