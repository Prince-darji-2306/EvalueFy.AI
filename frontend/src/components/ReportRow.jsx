import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ScoreBadge } from './ScoreBadge';

export function ReportRow({ index = 0, question = '', answer = '', review = null, isFollowUp = false }) {
  const [isOpen, setIsOpen] = useState(false);
  const score = review?.score ?? 0;
  const reason = review?.reason || '';
  const improvements = review?.improvements || 'No specific improvements recorded.';
  const formattedIndex = String(index + 1).padStart(2, '0');

  return (
    <div className="bg-surface border border-border rounded-xl overflow-hidden transition-all duration-200 hover:border-signal-indigo/30">
      {/* Summary Header (Click to expand) */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-4 sm:p-5 flex items-center justify-between gap-4 text-left transition-colors hover:bg-surface-2/40"
      >
        <div className="flex items-start sm:items-center gap-3 sm:gap-4 flex-1 min-w-0">
          <span className="font-mono text-xs text-ink-muted bg-surface-2 px-2 py-1 rounded border border-border flex-shrink-0">
            #{formattedIndex}
          </span>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              {isFollowUp && (
                <span className="font-mono text-[10px] uppercase tracking-wider font-semibold text-amber-mid bg-amber-mid/10 px-2 py-0.5 rounded border border-amber-mid/30">
                  Follow-Up
                </span>
              )}
            </div>
            <p className="text-sm sm:text-base font-medium text-ink truncate sm:whitespace-normal line-clamp-1 sm:line-clamp-2">
              {question}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          <ScoreBadge score={score} showLabel />

          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            className="text-ink-muted"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </motion.div>
        </div>
      </button>

      {/* Expanded Feedback Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="border-t border-border bg-surface-2/30 px-5 py-4 space-y-4 text-sm"
          >
            {/* Candidate Answer snippet if provided */}
            {answer && (
              <div>
                <span className="font-mono text-xs uppercase tracking-wider text-ink-muted block mb-1">
                  Candidate Answer
                </span>
                <p className="text-ink text-sm bg-surface p-3 rounded-lg border border-border leading-relaxed font-body">
                  {answer}
                </p>
              </div>
            )}

            {/* Evaluation Reason */}
            {reason && (
              <div>
                <span className="font-mono text-xs uppercase tracking-wider text-ink-muted block mb-1">
                  Evaluator Rationale
                </span>
                <p className="text-ink-muted text-sm leading-relaxed">
                  {reason}
                </p>
              </div>
            )}

            {/* Constructive Improvements */}
            <div>
              <span className="font-mono text-xs uppercase tracking-wider text-signal-indigo block mb-1">
                Targeted Recommendation / Action Item
              </span>
              <div className="p-3.5 rounded-lg bg-surface border border-signal-indigo/20 text-ink leading-relaxed">
                {improvements}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
