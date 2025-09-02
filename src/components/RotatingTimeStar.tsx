'use client';

import { useEffect, useState } from 'react';

export default function RotatingTimeStar({ size = 60 }: { size?: number }) {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Calculate rotation based on seconds (360 degrees per minute)
  const secondsRotation = (currentTime.getSeconds() * 6); // 6 degrees per second
  
  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      {/* Outer rotating star ring */}
      <div 
        className="absolute inset-0 flex items-center justify-center text-yellow-300/80"
        style={{
          transform: `rotate(${secondsRotation}deg)`,
          transition: 'transform 1s ease-in-out',
          fontSize: `${size * 0.8}px`
        }}
      >
        ⭐
      </div>
      
      {/* Inner star constellation */}
      <div className="absolute inset-0 flex items-center justify-center">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="absolute text-white/60"
            style={{
              fontSize: `${size * 0.1}px`,
              transform: `rotate(${i * 45}deg) translateY(-${size * 0.25}px)`,
              animation: `gentleTwinkle ${2 + i * 0.5}s infinite ease-in-out`,
              animationDelay: `${i * 0.2}s`
            }}
          >
            ✦
          </div>
        ))}
      </div>
      
      {/* Center time display */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div 
          className="text-white/80 font-bold text-center leading-none"
          style={{ fontSize: `${size * 0.15}px` }}
        >
          <div>{currentTime.getHours().toString().padStart(2, '0')}</div>
          <div className="animate-pulse">:</div>
          <div>{currentTime.getMinutes().toString().padStart(2, '0')}</div>
        </div>
      </div>

      {/* Cosmic ring effect */}
      <div 
        className="absolute inset-0 rounded-full border border-white/20"
        style={{
          animation: 'gentlePulse 4s infinite ease-in-out',
          width: `${size * 0.9}px`,
          height: `${size * 0.9}px`,
          margin: `${size * 0.05}px`
        }}
      />
      
      {/* Outer glow */}
      <div 
        className="absolute inset-0 rounded-full bg-gradient-to-r from-yellow-400/20 to-pink-400/20 blur-sm"
        style={{
          animation: 'gentlePulse 6s infinite ease-in-out',
        }}
      />
    </div>
  );
}