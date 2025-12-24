import React from "react";
import { Mood } from "../../types";

// 导入心情图标
import happyIcon from "../../assets/mood/happy.png";
import fulfilledIcon from "../../assets/mood/fulfilled.png";
import smittenIcon from "../../assets/mood/smitten.png";
import angryIcon from "../../assets/mood/angry.png";
import sadIcon from "../../assets/mood/sad.png";
import excitedIcon from "../../assets/mood/excited.png";
import tiredIcon from "../../assets/mood/tired.png";
import annoyedIcon from "../../assets/mood/annoyed.png";
import confusedIcon from "../../assets/mood/confused.png";
import warmIcon from "../../assets/mood/warm.png";
import luckyIcon from "../../assets/mood/lucky.png";
import poutyIcon from "../../assets/mood/pouty.png";
import calmIcon from "../../assets/mood/calm.png";
import sweetIcon from "../../assets/mood/sweet.png";
import lonelyIcon from "../../assets/mood/lonely.png";

const moodIconMap: Record<Mood, string> = {
  happy: happyIcon,
  fulfilled: fulfilledIcon,
  smitten: smittenIcon,
  angry: angryIcon,
  sad: sadIcon,
  excited: excitedIcon,
  tired: tiredIcon,
  annoyed: annoyedIcon,
  confused: confusedIcon,
  warm: warmIcon,
  lucky: luckyIcon,
  pouty: poutyIcon,
  calm: calmIcon,
  sweet: sweetIcon,
  lonely: lonelyIcon,
};

// face 到 mood 的映射
const faceToMood: Record<string, Mood> = {
  "m-happy": "happy",
  "m-laugh": "fulfilled",
  "m-love": "smitten",
  "m-angry": "angry",
  "m-cry": "sad",
  "m-surprise": "excited",
  "m-sleep": "tired",
  "m-annoyed": "annoyed",
  "m-confused": "confused",
  "m-blush": "warm",
  "m-cool": "lucky",
  "m-pouty": "pouty",
  "m-calm": "calm",
  "m-sweet": "sweet",
  "m-lonely": "lonely",
};

interface MoodCircleProps {
  color?: string;
  face?: string;
  mood?: Mood;
  size?: number;
  selected?: boolean;
}

const MoodCircle: React.FC<MoodCircleProps> = ({
  face,
  mood,
  size = 48,
  selected = false,
}) => {
  // 优先使用 mood，否则从 face 映射
  const moodValue = mood || (face ? faceToMood[face] : undefined);
  const iconSrc = moodValue ? moodIconMap[moodValue] : undefined;

  return (
    <div
      className={`relative transition-all duration-300 transform ${
        selected ? "scale-110" : "hover:scale-105 active:scale-95"
      }`}
      style={{
        width: size,
        height: size,
      }}
    >
      {iconSrc ? (
        <img
          src={iconSrc}
          alt={moodValue}
          className="w-full h-full object-contain"
          draggable={false}
        />
      ) : (
        <div
          className="w-full h-full rounded-full bg-gray-200 flex items-center justify-center"
          style={{ fontSize: size * 0.4 }}
        >
          ?
        </div>
      )}
    </div>
  );
};

export default MoodCircle;
