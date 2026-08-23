import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export function QuestionCard({
  question,
  questionNumber = 1,
  totalQuestions = 5,
  isFollowUp = false,
  role = 'Full Stack Engineer',
}) {
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  const speakQuestion = () => {
    if (!('speechSynthesis' in window) || !question) return;

    if (isPlayingAudio) {
      window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(question);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.onend = () => setIsPlayingAudio(false);
    utterance.onerror = () => setIsPlayingAudio(false);
    setIsPlayingAudio(true);
    window.speechSynthesis.speak(utterance);
  };

  const formattedNum = String(questionNumber).padStart(2, '0');
  const formattedTotal = String(totalQuestions).padStart(2, '0');

  return (
    <motion.div
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.3 }}
      className="w-full max-w-2xl bg-surface border border-border rounded-2xl p-6 shadow-sm backdrop-blur-sm relative overflow-hidden"
    >
      {/* Top Meta Bar */}
      <div className="flex items-center justify-between gap-3 mb-4 pb-3 border-b border-border">
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Question Sequence Badge */}
          <span className="font-mono text-xs text-ink-muted bg-surface-2 px-2.5 py-1 rounded-md border border-border">
            PROMPT [{formattedNum} / {formattedTotal}]
          </span>

          {/* Role pill */}
          <span className="font-mono text-xs text-signal-indigo bg-signal-indigo/10 px-2.5 py-1 rounded-md border border-signal-indigo/20">
            {role}
          </span>

          {/* Follow-up distinct badge */}
          <AnimatePresence>
            {isFollowUp && (
              <motion.span
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className="inline-flex items-center gap-1.5 font-mono text-xs font-semibold text-amber-mid bg-amber-mid/10 border border-amber-mid/30 px-2.5 py-1 rounded-md shadow-sm"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-amber-mid animate-ping" />
                DYNAMIC FOLLOW-UP
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        {/* Text-to-Speech Button */}
        {'speechSynthesis' in window && question && (
          <button
            type="button"
            onClick={speakQuestion}
            title={isPlayingAudio ? 'Stop reading' : 'Read question aloud'}
            className={`p-2 rounded-lg border transition-all text-xs font-mono flex items-center gap-1.5 ${
              isPlayingAudio
                ? 'bg-signal-indigo text-white border-signal-indigo'
                : 'bg-surface-2 border-border text-ink-muted hover:text-ink hover:border-signal-indigo/50'
            }`}
          >
            <svg
              className={`w-4 h-4 ${isPlayingAudio ? 'animate-pulse' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M15.536 8.464a5 5 0 010 7.072M18.364 5.636a9 9 0 010 12.728M11 5L6 9H2v6h4l5 4V5z"
              />
            </svg>
            <span className="hidden sm:inline">{isPlayingAudio ? 'MUTE' : 'AUDIO'}</span>
          </button>
        )}
      </div>

      {/* Main Question Text */}
      <h2 className="text-lg sm:text-xl font-medium text-ink leading-relaxed tracking-tight">
        {question || 'Preparing your tailored question...'}
      </h2>
    </motion.div>
  );
}
