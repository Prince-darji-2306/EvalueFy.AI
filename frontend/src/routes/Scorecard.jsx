import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ThemeToggle } from '../components/ThemeToggle';
import { ScoreGauge } from '../components/ScoreGauge';
import { ReportRow } from '../components/ReportRow';
import { useInterviewStore } from '../state/interviewStore';

export function Scorecard() {
  const navigate = useNavigate();
  const {
    candidateName,
    candidateRole,
    questionHistory,
    finalReport,
    resetSession,
  } = useInterviewStore();

  // Compute average score from finalReport or fallback question history
  const answeredItems = finalReport?.feedback?.length
    ? finalReport.feedback.map((f, i) => ({
        question: f.question,
        answer: questionHistory[i]?.answer || '',
        review: {
          score: f.score,
          reason: questionHistory[i]?.review?.reason || '',
          improvements: f.improvements,
        },
        isFollowUp: questionHistory[i]?.isFollowUp || false,
      }))
    : questionHistory;

  const averageScore =
    finalReport?.average_score !== undefined
      ? Number(finalReport.average_score)
      : answeredItems.length > 0
      ? Number(
          (
            answeredItems.reduce((acc, curr) => acc + (curr.review?.score || 0), 0) /
            answeredItems.length
          ).toFixed(1)
        )
      : 0;

  const totalQuestions = finalReport?.total_questions || answeredItems.length;

  const qualitativeSummary =
    finalReport?.summary ||
    `Candidate demonstrated strong core technical competency with ${totalQuestions} evaluation rounds completed.`;

  const handleRestart = () => {
    resetSession();
    navigate('/');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-bg text-ink flex flex-col font-body">
      {/* Top Header Bar */}
      <header className="w-full max-w-5xl mx-auto px-6 py-5 flex items-center justify-between border-b border-border print:hidden">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-signal-indigo flex items-center justify-center text-white font-display font-bold">
            E
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display font-bold text-lg text-ink">Diagnostic Scorecard</h1>
              <span className="font-mono text-[10px] uppercase text-verified-teal bg-verified-teal/10 border border-verified-teal/20 px-2 py-0.5 rounded font-semibold">
                AUDIT FINALIZED
              </span>
            </div>
            <span className="font-mono text-xs text-ink-muted">
              {candidateName} • {candidateRole}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handlePrint}
            className="p-2.5 rounded-xl bg-surface border border-border text-ink-muted hover:text-ink hover:border-signal-indigo/50 transition-colors text-xs font-mono flex items-center gap-1.5"
            title="Export or Print Scorecard"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            <span className="hidden sm:inline">Export</span>
          </button>
          <ThemeToggle />
        </div>
      </header>

      {/* Main Scorecard Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-6 sm:p-8 space-y-8">
        {/* Top Summary Banner */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-surface border border-border rounded-2xl p-6 sm:p-8 shadow-sm grid grid-cols-1 md:grid-cols-12 gap-8 items-center"
        >
          {/* Left / Center Summary details (8 cols) */}
          <div className="md:col-span-8 space-y-3">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs uppercase tracking-wider text-signal-indigo font-semibold">
                EXECUTIVE SUMMARY & INSIGHTS
              </span>
            </div>

            <h2 className="font-display text-2xl sm:text-3xl font-bold text-ink tracking-tight">
              {averageScore >= 8
                ? 'Strong Mastery Demonstrated'
                : averageScore >= 5
                ? 'Competent Foundation with Actionable Polish'
                : 'Needs Structural Skill Reinforcement'}
            </h2>

            <p className="text-sm sm:text-base text-ink-muted leading-relaxed font-body">
              {qualitativeSummary}
            </p>

            <div className="pt-2 flex items-center gap-4 text-xs font-mono text-ink-muted">
              <span className="bg-surface-2 px-3 py-1.5 rounded-lg border border-border">
                Candidate: <strong className="text-ink">{candidateName}</strong>
              </span>
              <span className="bg-surface-2 px-3 py-1.5 rounded-lg border border-border">
                Role: <strong className="text-ink">{candidateRole}</strong>
              </span>
              <span className="bg-surface-2 px-3 py-1.5 rounded-lg border border-border">
                Rounds: <strong className="text-ink">{totalQuestions}</strong>
              </span>
            </div>
          </div>

          {/* Right Circular Score Gauge (4 cols) */}
          <div className="md:col-span-4 flex flex-col items-center justify-center p-2 border-t md:border-t-0 md:border-l border-border/80 pt-6 md:pt-0">
            <ScoreGauge
              value={averageScore}
              max={10}
              size={150}
              strokeWidth={11}
              label="Overall Diagnostic"
              unit="/10"
              precision={1}
            />
          </div>
        </motion.div>

        {/* Per-Question Detailed Breakdown */}
        <section className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-border">
            <h3 className="font-mono text-xs uppercase tracking-wider text-ink-muted font-semibold">
              QUESTION-BY-QUESTION DIAGNOSTIC BREAKDOWN ({answeredItems.length})
            </h3>
            <span className="font-mono text-xs text-ink-muted">Click row to inspect feedback</span>
          </div>

          {answeredItems.length > 0 ? (
            <div className="space-y-3">
              {answeredItems.map((item, index) => (
                <ReportRow
                  key={index}
                  index={index}
                  question={item.question}
                  answer={item.answer}
                  review={item.review}
                  isFollowUp={item.isFollowUp}
                />
              ))}
            </div>
          ) : (
            <div className="p-8 text-center bg-surface border border-border rounded-xl text-ink-muted text-sm font-mono">
              No interview responses recorded in this session.
            </div>
          )}
        </section>

        {/* Action Controls */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-border print:hidden">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-surface-2 hover:bg-border/60 text-ink font-medium text-sm border border-border transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>Back to Home</span>
          </button>

          <button
            type="button"
            onClick={handleRestart}
            className="w-full sm:w-auto px-8 py-3 rounded-xl bg-signal-indigo text-white font-medium text-sm shadow-md shadow-signal-indigo/25 hover:opacity-95 transition-all flex items-center justify-center gap-2"
          >
            <span>Start New Interview</span>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </button>
        </div>
      </main>
    </div>
  );
}
