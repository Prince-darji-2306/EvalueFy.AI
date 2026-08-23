import React from 'react';
import { motion } from 'framer-motion';

export function getScoreColor(score) {
  const num = typeof score === 'number' ? score : parseFloat(score) || 0;
  if (num >= 8) {
    return {
      bg: 'bg-verified-teal/15',
      text: 'text-verified-teal',
      border: 'border-verified-teal/30',
      label: 'Strong',
      ringColor: 'var(--verified-teal)',
    };
  }
  if (num >= 5) {
    return {
      bg: 'bg-amber-mid/15',
      text: 'text-amber-mid',
      border: 'border-amber-mid/30',
      label: 'Adequate',
      ringColor: 'var(--amber-mid)',
    };
  }
  return {
    bg: 'bg-coral-low/15',
    text: 'text-coral-low',
    border: 'border-coral-low/30',
    label: 'Needs Growth',
    ringColor: 'var(--coral-low)',
  };
}

export function ScoreBadge({ score, max = 10, showLabel = false, size = 'md' }) {
  const color = getScoreColor(score);
  const formattedScore = typeof score === 'number' ? score.toFixed(score % 1 === 0 ? 0 : 1) : score;

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5 font-semibold',
  };

  return (
    <motion.div
      initial={{ scale: 0.85, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`inline-flex items-center gap-1.5 rounded-full font-mono border ${color.bg} ${color.text} ${color.border} ${sizeClasses[size] || sizeClasses.md}`}
    >
      <span className="font-semibold">{formattedScore}</span>
      <span className="opacity-60 text-[0.8em]">/{max}</span>
      {showLabel && (
        <span className="ml-1 pl-1.5 border-l border-current/20 text-[0.85em] font-sans font-medium">
          {color.label}
        </span>
      )}
    </motion.div>
  );
}
