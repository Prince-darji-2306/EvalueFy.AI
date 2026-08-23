import React, { useState } from 'react';
import { motion } from 'framer-motion';

export function TranscriptPanel({
  transcript = '',
  interimTranscript = '',
  onChange,
  onSubmit,
  onClear,
  isListening = false,
  isEvaluating = false,
  onToggleMic,
  disabled = false,
}) {
  const [isEditing, setIsEditing] = useState(false);

  const combinedText = interimTranscript
    ? `${transcript}${transcript ? ' ' : ''}${interimTranscript}`
    : transcript;

  const hasText = !!combinedText.trim();

  return (
    <div className="w-full max-w-2xl bg-surface border border-border rounded-2xl p-5 shadow-sm">
      {/* Header bar */}
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <div
            className={`w-2.5 h-2.5 rounded-full ${
              isListening
                ? 'bg-cyan-pulse animate-ping'
                : isEvaluating
                ? 'bg-signal-indigo animate-spin'
                : hasText
                ? 'bg-verified-teal'
                : 'bg-border'
            }`}
          />
          <span className="font-mono text-xs text-ink-muted uppercase tracking-wider">
            {isListening
              ? 'Live Voice Capture...'
              : isEvaluating
              ? 'AI Diagnostic Analysis...'
              : hasText
              ? 'Answer Draft Ready'
              : 'Answer by Voice or Type'}
          </span>
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-2">
          {hasText && (
            <button
              type="button"
              onClick={() => setIsEditing(!isEditing)}
              disabled={isEvaluating}
              className="text-xs font-mono px-2.5 py-1 rounded-md bg-surface-2 hover:bg-border/60 text-ink-muted hover:text-ink transition-colors"
            >
              {isEditing ? 'Preview Mode' : 'Edit Text'}
            </button>
          )}

          {hasText && (
            <button
              type="button"
              onClick={onClear}
              disabled={isEvaluating || isListening}
              className="text-xs font-mono px-2.5 py-1 rounded-md bg-surface-2 hover:bg-coral-low/10 text-ink-muted hover:text-coral-low transition-colors"
              title="Clear transcript"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Transcript Body: Live text or Editable Textarea */}
      <div className="min-h-[100px] max-h-[180px] overflow-y-auto rounded-xl bg-surface-2/60 border border-border/70 p-3.5 text-sm transition-all focus-within:border-signal-indigo/50">
        {isEditing ? (
          <textarea
            value={transcript}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Type or refine your answer here..."
            disabled={isEvaluating}
            rows={4}
            className="w-full bg-transparent text-ink placeholder-ink-muted/60 focus:outline-none resize-none font-body leading-relaxed"
          />
        ) : (
          <div
            onClick={() => setIsEditing(true)}
            className="cursor-text min-h-[80px]"
          >
            {combinedText ? (
              <p className="text-ink leading-relaxed font-body">
                {transcript}
                {interimTranscript && (
                  <span className="text-ink-muted italic ml-1 opacity-70">
                    {interimTranscript}
                  </span>
                )}
              </p>
            ) : (
              <p className="text-ink-muted/60 italic font-body">
                {isListening
                  ? 'Speak now — your voice is being transcribed in real-time...'
                  : 'Click the voice orb above to speak, or tap here to type your answer directly.'}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Footer controls: Mic toggle + Submit */}
      <div className="flex items-center justify-between gap-4 mt-4 pt-3 border-t border-border">
        {/* Toggle Mic button */}
        <button
          type="button"
          onClick={onToggleMic}
          disabled={isEvaluating || disabled}
          className={`px-4 py-2.5 rounded-xl font-mono text-xs font-medium flex items-center gap-2 border transition-all ${
            isListening
              ? 'bg-cyan-pulse/15 border-cyan-pulse text-cyan-pulse hover:bg-cyan-pulse/25'
              : 'bg-surface-2 border-border text-ink hover:border-signal-indigo/50 hover:bg-surface-2/80'
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              isListening ? 'bg-cyan-pulse animate-pulse' : 'bg-ink-muted'
            }`}
          />
          {isListening ? 'PAUSE MIC' : 'SPEAK (MIC)'}
        </button>

        {/* Submit button */}
        <motion.button
          type="button"
          onClick={onSubmit}
          disabled={!hasText || isEvaluating || disabled}
          whileHover={hasText && !isEvaluating ? { scale: 1.02 } : {}}
          whileTap={hasText && !isEvaluating ? { scale: 0.98 } : {}}
          className={`px-6 py-2.5 rounded-xl font-medium text-sm flex items-center gap-2 transition-all shadow-sm ${
            !hasText || isEvaluating || disabled
              ? 'bg-border text-ink-muted cursor-not-allowed opacity-60'
              : 'bg-signal-indigo text-white hover:opacity-95 shadow-signal-indigo/25 shadow-md'
          }`}
        >
          {isEvaluating ? (
            <>
              <svg
                className="w-4 h-4 animate-spin text-white"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                />
              </svg>
              <span>Analyzing Answer...</span>
            </>
          ) : (
            <>
              <span>Submit Answer</span>
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M14 5l7 7m0 0l-7 7m7-7H3"
                />
              </svg>
            </>
          )}
        </motion.button>
      </div>
    </div>
  );
}
