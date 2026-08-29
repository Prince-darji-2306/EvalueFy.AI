import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ThemeToggle } from '../components/ThemeToggle';
import { AppLogo } from '../components/AppLogo';
import { VoiceOrb } from '../components/VoiceOrb/VoiceOrb';
import { useAudioAnalyser } from '../components/VoiceOrb/useAudioAnalyser';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { useInterviewFlow } from '../hooks/useInterviewFlow';
import { QuestionCard } from '../components/QuestionCard';
import { TranscriptPanel } from '../components/TranscriptPanel';
import { ProgressPips } from '../components/ProgressPips';
import { ScoreBadge } from '../components/ScoreBadge';

export function InterviewRoom() {
  const navigate = useNavigate();
  const {
    candidateName,
    candidateRole,
    currentQuestion,
    questionNumber,
    totalEstimatedQuestions,
    isFollowUp,
    status,
    setStatus,
    submitAnswer,
    initCandidateInterview,
    feedbackToast,
    dismissFeedbackToast,
    errorMessage,
    finalReport,
  } = useInterviewFlow();

  // Local state for fallback transcript
  const [localText, setLocalText] = useState('');
  const [isMicOn, setIsMicOn] = useState(false);

  // Setup STT hook
  const {
    isListening: isSTTListening,
    transcript,
    interimTranscript,
    startListening: startSTT,
    stopListening: stopSTT,
    resetTranscript,
    setManualTranscript,
    error: sttError,
  } = useSpeechRecognition({
    onTranscriptChange: (newText) => {
      setLocalText(newText);
    },
  });

  // Setup Web Audio API Analyser hook (runs independently of STT)
  const { amplitude, spectrum, audioError } = useAudioAnalyser(isMicOn);

  const hasInitializedRef = React.useRef(false);

  // If no active question (e.g. initial landing on /interview without state), initialize standard interview once
  useEffect(() => {
    if (
      !currentQuestion &&
      status !== 'completed' &&
      status !== 'evaluating' &&
      !finalReport &&
      !hasInitializedRef.current
    ) {
      hasInitializedRef.current = true;
      initCandidateInterview(candidateName || 'Candidate', candidateRole || 'Software Engineer');
    }
  }, [currentQuestion, status, finalReport, candidateName, candidateRole, initCandidateInterview]);

  // Toggle Microphone
  const toggleMic = () => {
    if (isMicOn) {
      setIsMicOn(false);
      stopSTT();
      setStatus('idle');
    } else {
      setIsMicOn(true);
      startSTT();
      setStatus('listening');
    }
  };

  // Submit current answer
  const handleSubmit = async () => {
    const textToSubmit = (localText + (interimTranscript ? ` ${interimTranscript}` : '')).trim();
    if (!textToSubmit) return;

    // Turn off mic while analyzing
    if (isMicOn) {
      setIsMicOn(false);
      stopSTT();
    }

    await submitAnswer(textToSubmit);
    // Reset local transcript for the next question
    setLocalText('');
    resetTranscript();
  };

  // Handle clearing answer
  const handleClearTranscript = () => {
    setLocalText('');
    resetTranscript();
  };

  const orbStatus = status === 'evaluating' ? 'evaluating' : isMicOn ? 'listening' : 'idle';

  return (
    <div className="min-h-screen bg-bg text-ink flex flex-col justify-between font-body relative overflow-x-hidden">
      {/* Background Studio Glow Elements */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-signal-indigo/[0.04] rounded-full blur-3xl pointer-events-none" />

      {/* Top Header Bar */}
      <header className="w-full max-w-7xl mx-auto px-6 py-4 flex items-center justify-between z-20 border-b border-border/70 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="p-2 rounded-xl bg-surface border border-border text-ink-muted hover:text-ink hover:border-signal-indigo/50 transition-colors"
            title="Exit Interview Room"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>

          <div className="flex items-center gap-3">
            <AppLogo className="w-8 h-8 rounded-lg shadow-sm" />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display font-bold text-base text-ink">EvalueFy Studio</span>
                <span className="w-2 h-2 rounded-full bg-verified-teal animate-pulse" />
                <span className="font-mono text-xs text-ink-muted hidden sm:inline">LIVE SESSION</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-mono text-ink-muted">
                <span>{candidateName}</span>
                <span>•</span>
                <span className="text-signal-indigo">{candidateRole}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle />
        </div>
      </header>

      {/* Main Studio Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-4 sm:py-6 flex items-center justify-center relative z-10">
        <div className="w-full max-w-4xl flex items-center justify-between gap-6">
          {/* Slim Vertical Progress Rail (Left Pinned) */}
          <div className="hidden md:flex flex-col items-center justify-center p-3 rounded-2xl bg-surface/50 border border-border/50 backdrop-blur-sm self-center">
            <div className="font-mono text-[9px] uppercase tracking-widest text-ink-muted/70 mb-2 rotate-180 [writing-mode:vertical-lr]">
              PROGRESS
            </div>
            <ProgressPips
              current={questionNumber}
              total={totalEstimatedQuestions}
              orientation="vertical"
              isFollowUp={isFollowUp}
            />
          </div>

          {/* Central Studio Stack: Question -> Orb -> Transcript */}
          <div className="flex-1 flex flex-col items-center justify-center space-y-2.5 sm:space-y-3">
            {/* Transient Evaluation Feedback Toast */}
            <AnimatePresence>
              {feedbackToast && (
                <motion.div
                  initial={{ opacity: 0, y: -20, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -20, scale: 0.9 }}
                  className="w-full max-w-2xl bg-surface border border-signal-indigo/40 rounded-2xl p-4 shadow-xl flex items-center justify-between gap-4 z-30"
                >
                  <div className="flex items-center gap-3">
                    <ScoreBadge score={feedbackToast.score} size="lg" showLabel />
                    <div className="text-xs text-ink-muted max-w-md">
                      <span className="font-semibold text-ink font-mono mr-1">AI Evaluator:</span>
                      {feedbackToast.reason || feedbackToast.improvements}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={dismissFeedbackToast}
                    className="text-ink-muted hover:text-ink p-1 font-mono text-xs"
                  >
                    ✕
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* 1. Floating Question Card */}
            <QuestionCard
              question={currentQuestion}
              questionNumber={questionNumber}
              totalQuestions={totalEstimatedQuestions}
              isFollowUp={isFollowUp}
              role={candidateRole}
            />

            {/* 2. Signature 64-Bar Radial Ring */}
            <div className="py-0">
              <VoiceOrb
                status={orbStatus}
                amplitude={amplitude}
                spectrum={spectrum}
                onClick={toggleMic}
                disabled={status === 'evaluating'}
              />
            </div>

            {/* 3. Live Transcript & Editable Fallback */}
            <TranscriptPanel
              transcript={localText}
              interimTranscript={interimTranscript}
              onChange={(txt) => {
                setLocalText(txt);
                setManualTranscript(txt);
              }}
              onSubmit={handleSubmit}
              onClear={handleClearTranscript}
              isListening={isMicOn}
              isEvaluating={status === 'evaluating'}
              onToggleMic={toggleMic}
            />

            {/* Audio / Mic Notices if any */}
            {(audioError || sttError || errorMessage) && (
              <div className="w-full max-w-2xl p-3 rounded-xl bg-coral-low/10 border border-coral-low/30 text-coral-low text-xs font-mono text-center">
                {errorMessage || audioError || sttError}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer Utility Bar */}
      <footer className="w-full max-w-7xl mx-auto px-6 py-3 flex items-center justify-between text-xs font-mono text-ink-muted border-t border-border/50">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-signal-indigo" />
            AI Dynamic Scoring Active
          </span>
          <span className="hidden sm:inline">•</span>
          <span className="hidden sm:inline">Automatic Follow-up for scores &lt; 6.0</span>
        </div>

        <button
          type="button"
          onClick={() => {
            if (window.confirm('Are you sure you want to end this interview session early?')) {
              navigate('/scorecard');
            }
          }}
          className="hover:text-coral-low transition-colors"
        >
          End Session Early →
        </button>
      </footer>
    </div>
  );
}
