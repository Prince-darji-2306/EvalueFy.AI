import React from 'react';
import { motion } from 'framer-motion';

export function ProgressPips({ current = 1, total = 5, orientation = 'vertical', isFollowUp = false }) {
  const pips = Array.from({ length: Math.max(total, current) }, (_, i) => i + 1);

  return (
    <div
      className={`flex ${
        orientation === 'vertical' ? 'flex-col items-center gap-3 py-2' : 'flex-row items-center gap-2'
      } select-none`}
      aria-label={`Question progress: step ${current} of ${total}`}
    >
      {pips.map((step) => {
        const isCompleted = step < current;
        const isCurrent = step === current;

        return (
          <div key={step} className="relative flex items-center justify-center group">
            <motion.div
              initial={false}
              animate={{
                scale: isCurrent ? 1.35 : 1,
                backgroundColor: isCurrent
                  ? 'var(--signal-indigo)'
                  : isCompleted
                  ? 'var(--cyan-pulse)'
                  : 'var(--border)',
              }}
              transition={{ duration: 0.25 }}
              className={`rounded-full transition-all ${
                orientation === 'vertical' ? 'w-2 h-2' : 'w-2 h-2'
              } ${
                isCurrent
                  ? 'shadow-[0_0_8px_var(--signal-indigo)]'
                  : isCompleted
                  ? 'opacity-80'
                  : 'opacity-40'
              }`}
            />

            {/* Subtle Pulse ring on current active pip */}
            {isCurrent && (
              <motion.div
                className="absolute inset-0 rounded-full border border-signal-indigo pointer-events-none"
                animate={{ scale: [1, 2.2, 1], opacity: [0.8, 0, 0.8] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              />
            )}

            {/* Hover Tooltip for subtle clarity */}
            <div className="absolute left-full ml-3 px-2 py-0.5 rounded bg-surface border border-border text-[11px] font-mono text-ink-muted whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 shadow-sm">
              {isCompleted ? `Q${step} (Completed)` : isCurrent ? (isFollowUp ? `Q${step} (Follow-up)` : `Q${step} (Active)`) : `Q${step}`}
            </div>
          </div>
        );
      })}
    </div>
  );
}
