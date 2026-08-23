import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { getScoreColor } from './ScoreBadge';

export function ScoreGauge({
  value = 0, // e.g. 85 for ATS or 8.4 for interview score
  max = 100,
  size = 160,
  strokeWidth = 10,
  label = 'ATS Match',
  unit = '%',
  precision = 0,
}) {
  const [displayValue, setDisplayValue] = useState(0);

  const numericValue = typeof value === 'number' ? value : parseFloat(value) || 0;
  const percentage = Math.min(100, Math.max(0, (numericValue / max) * 100));

  // Determine color based on normalized score (0 to 10 scale equivalent)
  const normalizedForColor = (numericValue / max) * 10;
  const colorToken = getScoreColor(normalizedForColor).ringColor;

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  // Count-up animation on load/change
  useEffect(() => {
    let start = 0;
    const end = numericValue;
    const duration = 1200; // ms
    const stepTime = 20;
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
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke="var(--surface-2)"
          strokeWidth={strokeWidth}
        />
        {/* Animated Progress Ring */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke={colorToken}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
          style={{
            filter: `drop-shadow(0 0 6px ${colorToken})`,
          }}
        />
      </svg>

      {/* Center Readout */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <div className="flex items-baseline font-mono">
          <span className="text-3xl font-bold tracking-tight text-ink font-display">
            {displayValue.toFixed(precision)}
          </span>
          {unit && <span className="text-base text-ink-muted ml-0.5 font-mono">{unit}</span>}
        </div>
        {label && (
          <span className="text-[11px] uppercase tracking-wider text-ink-muted font-mono mt-0.5">
            {label}
          </span>
        )}
      </div>
    </div>
  );
}
