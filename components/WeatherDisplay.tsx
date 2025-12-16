import React, { useState, useEffect } from 'react';
import { Cloud, Sun, CloudRain, CloudSnow, Wind } from 'lucide-react';
import { WeatherConfig } from '../types';

interface JinriShiciData {
  status: string;
  message: string;
  data: {
    weatherData?: {
      temperature?: number;
      humidity?: number;
      weather?: string;
      wind?: string;
      airQuality?: string;
      region?: string;
    };
    tags?: string[];
    poetryTokens?: string[];
    inspirationTokens?: string[];
    // 可能API直接返回region在data层级
    region?: string;
    // 或者返回其他位置信息字段
    location?: string;
    city?: string;
    province?: string;
  };
}

interface WeatherDisplayProps {
  config?: WeatherConfig;
}

const WeatherDisplay: React.FC<WeatherDisplayProps> = ({ config }) => {
  const [weatherData, setWeatherData] = useState<JinriShiciData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isHovering, setIsHovering] = useState(false);

  // 天气图标映射
  const getWeatherIcon = (weather: string) => {
    // 根据天气描述返回相应图标
    const weatherLower = weather.toLowerCase();
    if (weatherLower.includes('晴') || weatherLower.includes('sunny')) {
      return <Sun className="w-4 h-4 text-yellow-500" />;
    } else if (weatherLower.includes('云') || weatherLower.includes('cloud')) {
      return <Cloud className="w-4 h-4 text-gray-500" />;
    } else if (weatherLower.includes('雨') || weatherLower.includes('rain')) {
      return <CloudRain className="w-4 h-4 text-blue-500" />;
    } else if (weatherLower.includes('雪') || weatherLower.includes('snow')) {
      return <CloudSnow className="w-4 h-4 text-blue-300" />;
    } else if (weatherLower.includes('风') || weatherLower.includes('wind')) {
      return <Wind className="w-4 h-4 text-gray-600" />;
    } else {
      return <Sun className="w-4 h-4 text-yellow-500" />; // 默认图标
    }
  };

  // 获取天气数据
  useEffect(() => {
    if (!config || !config.enabled) {
      return;
    }

    const fetchWeather = async () => {
      setLoading(true);
      setError(null);

      try {
        // 获取今日诗词API的天气数据
        const response = await fetch('https://v2.jinrishici.com/info');

        if (!response.ok) {
          throw new Error(`JinriShici API error: ${response.status}`);
        }

        const data: JinriShiciData = await response.json();

  
        if (data.status === 'success') {
          setWeatherData(data);
        } else {
          setError(data.message || '获取天气数据失败');
        }
      } catch (err) {
        console.error('Failed to fetch weather from JinriShici:', err);
        setError('天气数据获取失败');
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();

    // 每10分钟更新一次天气数据
    const interval = setInterval(fetchWeather, 10 * 60 * 1000);

    return () => clearInterval(interval);
  }, [config]);

  // 如果没有配置或禁用了，则不显示组件
  if (!config || !config.enabled) {
    return null;
  }

  if (loading) {
    return (
      <div className="hidden xl:flex items-center gap-2 px-3 py-2 bg-slate-50 dark:bg-slate-700/30 rounded-full text-xs text-slate-500 dark:text-slate-400 h-[36px] min-w-[40px] leading-none">
        <Cloud className="w-4 h-4 animate-pulse" />
        <span className="hidden 2xl:inline">加载天气中...</span>
      </div>
    );
  }

  if (error || !weatherData) {
    return (
      <div className="hidden xl:flex items-center gap-2 px-3 py-2 bg-slate-50 dark:bg-slate-700/30 rounded-full text-xs text-slate-500 dark:text-slate-400 h-[36px] min-w-[40px] leading-none">
        <Cloud className="w-4 h-4" />
        <span className="hidden 2xl:inline">天气不可用</span>
      </div>
    );
  }

  // 获取当前天气信息
  const getCurrentWeather = () => {
    if (!weatherData || !weatherData.data) {
      return { temperature: '--', weather: '未知', humidity: '--', airQuality: '--' };
    }

    const weatherInfo = weatherData.data.weatherData || {};
    return {
      temperature: weatherInfo.temperature ?? '--',
      weather: weatherInfo.weather ?? '未知',
      humidity: weatherInfo.humidity ?? '--',
      airQuality: weatherInfo.airQuality ?? '--'
    };
  };

  const currentWeather = getCurrentWeather();

  // 获取城市信息
  const getCityInfo = () => {
    if (!weatherData || !weatherData.data) {
      return '未知城市';
    }

    const data = weatherData.data;

    // 尝试多种可能的位置信息路径
    let locationInfo = null;

    // 1. 尝试从 weatherData.region 获取
    if (data.weatherData?.region) {
      locationInfo = data.weatherData.region;
    }
    // 2. 尝试从直接的 region 字段获取
    else if (data.region) {
      locationInfo = data.region;
    }
    // 3. 尝试从 location 字段获取
    else if (data.location) {
      locationInfo = data.location;
    }
    // 4. 尝试组合城市和省份
    else if (data.city || data.province) {
      locationInfo = [data.province, data.city].filter(Boolean).join('·');
    }

    if (locationInfo) {
      // 如果包含竖线或其他分隔符，进行格式化
      const formatted = locationInfo.replace(/[|｜]/g, '·');
      return formatted;
    }

    return '未知位置';
  };

  return (
    <div
      className="hidden xl:flex items-center gap-2 px-3 py-2 bg-slate-50 dark:bg-slate-700/30 rounded-full text-xs relative h-[36px] min-w-[40px] leading-none group"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {getWeatherIcon(currentWeather.weather)}
      <span className="font-medium text-slate-700 dark:text-slate-300">
        {currentWeather.temperature}°C
      </span>
      <span className="text-slate-500 dark:text-slate-400 hidden 2xl:inline">
        {currentWeather.weather}
      </span>

      {/* Tooltip - 只在hover时显示城市信息 */}
      {isHovering && (
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-2 py-1 bg-slate-800 dark:bg-slate-600 text-white text-xs rounded whitespace-nowrap z-50">
          <div className="relative">
            {getCityInfo()}
            {/* Tooltip箭头 - 指向上方 */}
            <div className="absolute -top-1 left-1/2 transform -translate-x-1/2">
              <div className="border-4 border-transparent border-b-slate-800 dark:border-b-slate-600"></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WeatherDisplay;