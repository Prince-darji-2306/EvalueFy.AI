import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export function ScoreGauge({
  value = 0,
  max = 100,
  size = 150,
  strokeWidth = 9,
  label = 'ATS Match',
  unit = '%',
  precision = 0,
  showGrade = true,
}) {
  const [displayValue, setDisplayValue] = useState(0);

  const numericValue = typeof value === 'number' ? value : parseFloat(value) || 0;
  const percentage = Math.min(100, Math.max(0, (numericValue / max) * 100));

  // Determine tiered gradient palette based on score
  const getGradientConfig = (scoreRatio) => {
    if (scoreRatio >= 0.8) {
      return {
        id: 'gauge-high',
        gradientStart: '#22D3EE', // Cyan
        gradientEnd: '#10B981',   // Emerald
        glowColor: 'rgba(34, 211, 238, 0.35)',
        badgeBg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
        badgeText: 'Optimal Match',
        gradeText: 'A+',
      };
    }
    if (scoreRatio >= 0.6) {
      return {
        id: 'gauge-mid',
        gradientStart: '#F59E0B', // Amber
        gradientEnd: '#FBBF24',   // Warm Gold
        glowColor: 'rgba(245, 158, 11, 0.3)',
        badgeBg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
        badgeText: 'Moderate Match',
        gradeText: 'B',
      };
    }
    return {
      id: 'gauge-low',
      gradientStart: '#F43F5E', // Rose
      gradientEnd: '#FB923C',   // Orange Coral
      glowColor: 'rgba(244, 63, 94, 0.3)',
      badgeBg: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
      badgeText: 'Action Required',
      gradeText: 'C',
    };
  };

  const ratio = numericValue / max;
  const config = getGradientConfig(ratio);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  // Smooth count-up animation
  useEffect(() => {
    let start = 0;
    const end = numericValue;
    const duration = 1200;
    const stepTime = 16;
    const totalSteps = duration / stepTime;
    const increment = (end - start) / totalSteps;

    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if ((increment >= 0 && current >= end) || (increment < 0 && current <= end)) {
        setDisplayValue(end);
        clearInterval(timer);
      } else {
        setDisplayValue(current);
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [numericValue]);

  return (
    <div className="flex flex-col items-center justify-center relative select-none">
      {/* Ambient Radial Halo */}
      <div
        className="absolute inset-0 rounded-full blur-2xl opacity-40 pointer-events-none transition-all duration-700"
        style={{
          background: `radial-gradient(circle, ${config.glowColor} 0%, transparent 70%)`,
        }}
      />

      <svg width={size} height={size} className="transform -rotate-90 relative z-10">
        <defs>
          <linearGradient id={config.id} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={config.gradientStart} />
            <stop offset="100%" stopColor={config.gradientEnd} />
          </linearGradient>
        </defs>

        {/* Background Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke="var(--surface-2)"
          strokeWidth={strokeWidth}
          strokeDasharray="4 4"
          className="opacity-70"
        />

        {/* Animated Gradient Progress Ring */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke={`url(#${config.id})`}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.3, ease: [0.16, 1, 0.3, 1] }}
          style={{
            filter: `drop-shadow(0 0 8px ${config.glowColor})`,
          }}
        />
      </svg>

      {/* Center Numeric Readout */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center z-20 pointer-events-none">
        <div className="flex items-baseline justify-center">
          <span className="text-3xl sm:text-4xl font-bold tracking-tight text-ink font-display">
            {displayValue.toFixed(precision)}
          </span>
          {unit && (
            <span className="text-sm font-semibold text-ink-muted ml-0.5 font-mono">
              {unit}
            </span>
          )}
        </div>
        {label && (
          <span className="text-[10px] uppercase font-mono tracking-widest text-ink-muted mt-0.5">
            {label}
          </span>
        )}
      </div>
    </div>
  );
}
