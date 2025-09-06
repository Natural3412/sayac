'use client';

import { useState, useEffect } from 'react';
import { getDailyLoveMessage, getThemeColors, LoveMessage } from '@/utils/dailyLoveMessages';

export default function DailyLoveBox() {
  const [todayMessage, setTodayMessage] = useState<LoveMessage | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const message = getDailyLoveMessage();
    setTodayMessage(message);
  }, []);

  if (!mounted || !todayMessage) return null;

  const [fromColor, toColor] = getThemeColors(todayMessage.theme);
  const today = new Date();

  return (
    <div className="w-full max-w-xs mx-auto relative group">
      {/* Soft glow effect */}
      <div className="absolute -inset-1 bg-gradient-to-r from-pink-500/30 to-purple-500/30 rounded-2xl blur-lg opacity-75 group-hover:opacity-100 transition-all duration-500" />
      
      <div 
        className={`relative bg-gradient-to-br ${fromColor} ${toColor} rounded-2xl p-3 shadow-2xl border border-white/20 backdrop-blur-sm transform transition-all duration-500 hover:scale-105`}
      >
        {/* Compact Layout */}
        <div className="flex items-center justify-between mb-2">
          <div className="text-white/90 font-semibold text-center">
            <div className="text-lg font-bold">{today.getDate()}</div>
            <div className="text-xs opacity-80">
              {today.toLocaleDateString('tr-TR', { month: 'short' }).toUpperCase()}
            </div>
          </div>
          
          {/* Photo Section */}
          <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm border border-white/30 overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src={`/love-photos/${todayMessage.imageFile}`}
              alt="Daily love photo"
              width={64}
              height={64}
              className="rounded-lg object-cover w-full h-full"
              onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                const img = e.target as HTMLImageElement;
                img.innerHTML = '💕';
              }}
            />
          </div>
        </div>

        {/* Theme indicator only */}
        <div className="flex items-center justify-center">
          <div className="w-1.5 h-1.5 bg-white/70 rounded-full mr-1.5" />
          <span className="text-white/70 text-xs font-medium uppercase tracking-wider">
            {todayMessage.theme}
          </span>
        </div>

        {/* Romantic sparkles */}
        <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-white/60 rounded-full animate-ping"
              style={{
                left: `${20 + i * 15}%`,
                top: `${20 + (i % 2) * 60}%`,
                animationDelay: `${i * 0.8}s`,
                animationDuration: '2s'
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
