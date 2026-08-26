import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ThemeToggle } from '../components/ThemeToggle';
import { useInterviewStore } from '../state/interviewStore';
import { useInterviewFlow } from '../hooks/useInterviewFlow';

export function Landing() {
  const navigate = useNavigate();
  const { initCandidateInterview } = useInterviewFlow();
  const { candidateName, candidateRole, setCandidate } = useInterviewStore();

  const [isSetupOpen, setIsSetupOpen] = useState(false);
  const [name, setName] = useState(candidateName || 'Alex Mercer');
  const [role, setRole] = useState(candidateRole || 'Python Developer');
  const [isStarting, setIsStarting] = useState(false);

  const handleStartPractice = async (e) => {
    e.preventDefault();
    if (!name.trim() || !role.trim()) return;

    setIsStarting(true);
    try {
      setCandidate(name.trim(), role.trim(), 'standard');
      await initCandidateInterview(name.trim(), role.trim());
      navigate('/interview');
    } catch (err) {
      console.error(err);
    } finally {
      setIsStarting(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg text-ink flex flex-col relative overflow-hidden font-body">
      {/* Top Utility Nav */}
      <header className="w-full max-w-7xl mx-auto px-6 py-5 flex items-center justify-between z-20 border-b border-border/60">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-signal-indigo flex items-center justify-center shadow-md shadow-signal-indigo/20">
            <span className="font-display font-bold text-white text-base">E</span>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-display font-bold tracking-tight text-lg text-ink">
                EvalueFy<span className="text-signal-indigo">.AI</span>
              </span>
              <span className="font-mono text-[10px] uppercase text-cyan-pulse bg-cyan-pulse/10 border border-cyan-pulse/20 px-1.5 py-0.2 rounded font-semibold">
                v2.0
              </span>
            </div>
            <span className="font-mono text-[11px] text-ink-muted leading-none">
              AI Mock Interview & Resume Diagnostic Studio
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle />
        </div>
      </header>

      {/* Main Split Screen */}
      <main className="flex-1 max-w-7xl w-full mx-auto grid grid-cols-1 lg:grid-cols-2 relative z-10">
        {/* Spine Divider (Central Line) */}
        <div className="hidden lg:block absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-px bg-border z-10">
          <div className="sticky top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-surface border border-border flex items-center justify-center shadow-sm">
            <span className="font-mono text-xs text-ink-muted">OR</span>
          </div>
        </div>

        {/* LEFT HALF: Practice Interview */}
        <motion.section
          whileHover={{ y: -4, backgroundColor: 'var(--surface)' }}
          transition={{ duration: 0.25 }}
          className="p-8 sm:p-12 lg:p-16 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-border cursor-pointer group transition-colors"
          onClick={() => setIsSetupOpen(true)}
        >
          <div>
            <div className="flex items-center gap-2 mb-6">
              <span className="font-mono text-xs font-semibold uppercase tracking-wider text-signal-indigo bg-signal-indigo/10 px-2.5 py-1 rounded border border-signal-indigo/20">
                PATHWAY // 01
              </span>
              <span className="font-mono text-xs text-ink-muted">ROLE-DRIVEN SIMULATION</span>
            </div>

            <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-ink mb-4 group-hover:text-signal-indigo transition-colors">
              Practice Interview
            </h1>

            <p className="text-base sm:text-lg text-ink-muted leading-relaxed max-w-md mb-8">
              Simulate high-stakes technical and behavioral rounds with dynamic follow-ups, live voice analysis, and instant scoring.
            </p>

            <ul className="space-y-3 font-mono text-xs sm:text-sm text-ink-muted mb-8">
              <li className="flex items-center gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-signal-indigo" />
                Adaptive AI questioning engine
              </li>
              <li className="flex items-center gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-signal-indigo" />
                Real-time voice amplitude & STT capture
              </li>
              <li className="flex items-center gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-signal-indigo" />
                Dynamic follow-up drill-downs when score &lt; 6
              </li>
              <li className="flex items-center gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-signal-indigo" />
                Full diagnostic scorecard & improvement roadmap
              </li>
            </ul>
          </div>

          <div className="pt-6">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsSetupOpen(true);
              }}
              className="inline-flex items-center gap-3 px-6 py-3.5 rounded-xl bg-signal-indigo text-white font-medium text-sm sm:text-base shadow-lg shadow-signal-indigo/25 group-hover:shadow-signal-indigo/40 group-hover:scale-[1.02] transition-all"
            >
              <span>Launch Practice Interview</span>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>
          </div>
        </motion.section>

        {/* RIGHT HALF: Resume Check */}
        <motion.section
          whileHover={{ y: -4, backgroundColor: 'var(--surface)' }}
          transition={{ duration: 0.25 }}
          className="p-8 sm:p-12 lg:p-16 flex flex-col justify-between cursor-pointer group transition-colors"
          onClick={() => navigate('/resume-analyzer')}
        >
          <div>
            <div className="flex items-center gap-2 mb-6">
              <span className="font-mono text-xs font-semibold uppercase tracking-wider text-cyan-pulse bg-cyan-pulse/10 px-2.5 py-1 rounded border border-cyan-pulse/20">
                PATHWAY // 02
              </span>
              <span className="font-mono text-xs text-ink-muted">ATS SCAN & TAILORED ROUNDS</span>
            </div>

            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-ink mb-4 group-hover:text-cyan-pulse transition-colors">
              Resume Check
            </h2>

            <p className="text-base sm:text-lg text-ink-muted leading-relaxed max-w-md mb-8">
              Upload your PDF resume to compute an instant ATS benchmark, uncover format deductions, and generate 12 customized questions.
            </p>

            <ul className="space-y-3 font-mono text-xs sm:text-sm text-ink-muted mb-8">
              <li className="flex items-center gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-pulse" />
                Comprehensive 0–100% ATS score audit
              </li>
              <li className="flex items-center gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-pulse" />
                Formatting & deduction vulnerability breakdown
              </li>
              <li className="flex items-center gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-pulse" />
                12 Tailored questions (9 Technical + 3 General)
              </li>
              <li className="flex items-center gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-pulse" />
                Direct 1-click transition into live interview room
              </li>
            </ul>
          </div>

          <div className="pt-6">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                navigate('/resume-analyzer');
              }}
              className="inline-flex items-center gap-3 px-6 py-3.5 rounded-xl bg-surface-2 border border-border hover:border-cyan-pulse text-ink font-medium text-sm sm:text-base group-hover:scale-[1.02] transition-all shadow-sm"
            >
              <span>Scan Resume & Benchmark ATS</span>
              <svg className="w-4 h-4 text-cyan-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>
          </div>
        </motion.section>
      </main>

      {/* Candidate Setup Modal */}
      <AnimatePresence>
        {isSetupOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.92, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 10 }}
              className="w-full max-w-md bg-surface border border-border rounded-2xl p-6 sm:p-8 shadow-2xl relative"
            >
              <div className="flex items-center justify-between mb-6 pb-3 border-b border-border">
                <div>
                  <h3 className="font-display text-xl font-bold text-ink">Interview Setup</h3>
                  <p className="font-mono text-xs text-ink-muted mt-0.5">Customize your session profile</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsSetupOpen(false)}
                  className="p-1 rounded-lg text-ink-muted hover:text-ink hover:bg-surface-2"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleStartPractice} className="space-y-4">
                <div>
                  <label className="block font-mono text-xs uppercase tracking-wider text-ink-muted mb-1.5">
                    Candidate Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Alex Mercer"
                    className="w-full px-4 py-2.5 rounded-xl bg-surface-2 border border-border text-ink focus:border-signal-indigo text-sm font-sans focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block font-mono text-xs uppercase tracking-wider text-ink-muted mb-1.5">
                    Target Role / Domain
                  </label>
                  <input
                    type="text"
                    required
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    placeholder="e.g. Python Developer / Backend Engineer"
                    className="w-full px-4 py-2.5 rounded-xl bg-surface-2 border border-border text-ink focus:border-signal-indigo text-sm font-sans focus:outline-none transition-colors"
                  />
                </div>

                <div className="pt-4 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsSetupOpen(false)}
                    className="px-4 py-2.5 rounded-xl border border-border text-ink-muted hover:text-ink text-sm font-mono"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={isStarting}
                    className="px-6 py-2.5 rounded-xl bg-signal-indigo text-white font-medium text-sm flex items-center gap-2 shadow-md shadow-signal-indigo/25 hover:opacity-95"
                  >
                    {isStarting ? (
                      <>
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                        </svg>
                        <span>Initializing...</span>
                      </>
                    ) : (
                      <>
                        <span>Enter Studio</span>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
