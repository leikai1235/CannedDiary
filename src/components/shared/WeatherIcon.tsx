import React from "react";
import { Weather } from "../../types";

// 导入天气图标
import sunnyIcon from "../../assets/weather/sunny.png";
import cloudyIcon from "../../assets/weather/cloudy.png";
import overcastIcon from "../../assets/weather/overcast.png";
import lightRainIcon from "../../assets/weather/lightRain.png";
import heavyRainIcon from "../../assets/weather/heavyRain.png";
import thunderstormIcon from "../../assets/weather/thunderstorm.png";
import snowyIcon from "../../assets/weather/snowy.png";
import windyIcon from "../../assets/weather/windy.png";
import foggyIcon from "../../assets/weather/foggy.png";

const weatherIconMap: Record<Weather, string> = {
  sunny: sunnyIcon,
  cloudy: cloudyIcon,
  overcast: overcastIcon,
  lightRain: lightRainIcon,
  heavyRain: heavyRainIcon,
  thunderstorm: thunderstormIcon,
  snowy: snowyIcon,
  windy: windyIcon,
  foggy: foggyIcon,
};

interface WeatherIconProps {
  type: string;
  size?: number;
  selected?: boolean;
}

const WeatherIcon: React.FC<WeatherIconProps> = ({
  type,
  size = 48,
  selected = false,
}) => {
  const iconSrc = weatherIconMap[type as Weather];

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
          alt={type}
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

export default WeatherIcon;
