import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ThemeToggle } from '../components/ThemeToggle';
import { ResumeDropzone } from '../components/ResumeDropzone';
import { ScoreGauge } from '../components/ScoreGauge';
import { uploadResume } from '../lib/api';
import { useInterviewStore } from '../state/interviewStore';
import { useInterviewFlow } from '../hooks/useInterviewFlow';

export function ResumeAnalyzer() {
  const navigate = useNavigate();
  const { resumeData, setResumeData, isResumeLoading, setResumeLoading } = useInterviewStore();
  const { initResumeInterview } = useInterviewFlow();

  const [candidateName, setCandidateName] = useState('Alex Mercer');
  const [targetRole, setTargetRole] = useState('Python Full Stack Developer');
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  const handleFileUpload = async (file) => {
    setResumeLoading(true);
    setErrorMessage(null);

    try {
      const response = await uploadResume(file);
      if (response.analysis) {
        setResumeData({
          ...response.analysis,
          fileName: file.name,
          fileSize: file.size,
        });
      } else {
        throw new Error('No analysis data received.');
      }
    } catch (err) {
      console.error('Resume upload error:', err);
      setErrorMessage(err.message || 'Failed to analyze resume. Please ensure the backend is active and retry.');
    } finally {
      setResumeLoading(false);
    }
  };

  const handleStartInterviewFromResume = async () => {
    if (!resumeData?.resume_text) return;

    setIsGeneratingQuestions(true);
    setErrorMessage(null);

    try {
      await initResumeInterview(
        resumeData.resume_text,
        candidateName.trim() || 'Candidate',
        targetRole.trim() || 'Software Engineer'
      );
    } catch (err) {
      console.error('Failed to generate resume questions:', err);
      setErrorMessage(err.message || 'Failed to start interview from resume.');
    } finally {
      setIsGeneratingQuestions(false);
    }
  };

  const atsScore =
    resumeData && typeof resumeData.ats_score === 'number'
      ? resumeData.ats_score
      : resumeData && !isNaN(parseInt(resumeData.ats_score))
      ? parseInt(resumeData.ats_score)
      : null;

  return (
    <div className="min-h-screen bg-bg text-ink flex flex-col font-body">
      {/* Top Header Bar */}
      <header className="w-full max-w-7xl mx-auto px-6 py-5 flex items-center justify-between border-b border-border">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="p-2 rounded-xl bg-surface border border-border text-ink-muted hover:text-ink hover:border-signal-indigo/50 transition-colors"
            title="Back to Landing"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display font-bold text-xl text-ink">Resume ATS Diagnostic Scan</h1>
              <span className="font-mono text-[10px] uppercase text-cyan-pulse bg-cyan-pulse/10 border border-cyan-pulse/30 px-2 py-0.5 rounded font-semibold">
                DIAGNOSTIC ENGINE
              </span>
            </div>
            <p className="font-mono text-xs text-ink-muted">
              Deep semantic inspection & interview synthesis
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle />
        </div>
      </header>

      {/* Main Diagnostic Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN: Resume Upload & Preview (5 cols on lg) */}
        <section className="lg:col-span-5 space-y-6 lg:sticky lg:top-8">
          <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-border">
              <span className="font-mono text-xs uppercase tracking-wider text-ink-muted font-semibold">
                DOCUMENT INGESTION
              </span>
              {resumeData?.fileName && (
                <span className="font-mono text-xs text-verified-teal truncate max-w-[180px]">
                  {resumeData.fileName}
                </span>
              )}
            </div>

            <ResumeDropzone
              onFileSelected={handleFileUpload}
              isLoading={isResumeLoading}
            />

            {/* Candidate Customization inputs for interview generation */}
            {resumeData && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 pt-5 border-t border-border space-y-4"
              >
                <div className="font-mono text-xs uppercase tracking-wider text-ink-muted">
                  INTERVIEW GENERATION PARAMETERS
                </div>

                <div>
                  <label className="block font-mono text-xs text-ink-muted mb-1">
                    Candidate Name
                  </label>
                  <input
                    type="text"
                    value={candidateName}
                    onChange={(e) => setCandidateName(e.target.value)}
                    placeholder="Candidate Name"
                    className="w-full px-3.5 py-2 rounded-xl bg-surface-2 border border-border text-ink text-sm focus:outline-none focus:border-signal-indigo font-sans"
                  />
                </div>

                <div>
                  <label className="block font-mono text-xs text-ink-muted mb-1">
                    Target Role
                  </label>
                  <input
                    type="text"
                    value={targetRole}
                    onChange={(e) => setTargetRole(e.target.value)}
                    placeholder="Target Role"
                    className="w-full px-3.5 py-2 rounded-xl bg-surface-2 border border-border text-ink text-sm focus:outline-none focus:border-signal-indigo font-sans"
                  />
                </div>

                {/* Primary CTA */}
                <motion.button
                  type="button"
                  onClick={handleStartInterviewFromResume}
                  disabled={isGeneratingQuestions}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full mt-2 py-3.5 px-4 rounded-xl bg-signal-indigo text-white font-medium text-sm flex items-center justify-center gap-2.5 shadow-lg shadow-signal-indigo/25 hover:opacity-95 transition-all"
                >
                  {isGeneratingQuestions ? (
                    <>
                      <svg className="w-4 h-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                      </svg>
                      <span>Generating 12 Tailored Questions...</span>
                    </>
                  ) : (
                    <>
                      <span>Take Interview from Resume</span>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </>
                  )}
                </motion.button>
              </motion.div>
            )}
          </div>

          {errorMessage && (
            <div className="p-4 rounded-xl bg-coral-low/10 border border-coral-low/30 text-coral-low text-xs font-mono">
              {errorMessage}
            </div>
          )}
        </section>

        {/* RIGHT COLUMN: Diagnostic Report & ATS Gauge (7 cols on lg) */}
        <section className="lg:col-span-7 space-y-6">
          {resumeData ? (
            <div className="space-y-6">
              {/* ATS Top Score Card */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-surface border border-border rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-sm"
              >
                <div className="flex-1 text-center sm:text-left">
                  <span className="font-mono text-xs uppercase tracking-wider text-cyan-pulse font-semibold">
                    BENCHMARK SCORECARD
                  </span>
                  <h2 className="font-display text-2xl sm:text-3xl font-bold text-ink mt-1 mb-2">
                    {atsScore !== null && atsScore >= 80
                      ? 'Exceptional ATS Compatibility'
                      : atsScore !== null && atsScore >= 60
                      ? 'Solid Foundation with Optimization Gaps'
                      : 'High Friction / Needs Immediate Refinement'}
                  </h2>
                  <p className="text-sm text-ink-muted leading-relaxed">
                    Evaluated for keyword distribution, structural clarity, and algorithmic screening pass-rates.
                  </p>
                </div>

                {atsScore !== null && (
                  <div className="flex-shrink-0">
                    <ScoreGauge
                      value={atsScore}
                      max={100}
                      size={140}
                      strokeWidth={10}
                      label="ATS Match"
                      unit="%"
                    />
                  </div>
                )}
              </motion.div>

              {/* Detailed Breakdown Streaming Container */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="bg-surface border border-border rounded-2xl p-6 sm:p-8 shadow-sm"
              >
                <div className="flex items-center justify-between pb-4 mb-6 border-b border-border">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-signal-indigo" />
                    <h3 className="font-mono text-xs uppercase tracking-wider text-ink-muted font-semibold">
                      DEEP SCAN REPORT & WHY MARKS WERE DEDUCTED
                    </h3>
                  </div>
                </div>

                {/* Render the backend analysis HTML or text cleanly */}
                <div className="prose prose-sm dark:prose-invert max-w-none text-ink leading-relaxed space-y-4">
                  {resumeData.analysis ? (
                    <div
                      className="analysis-html-content font-body [&>h2]:font-display [&>h2]:text-lg [&>h2]:font-bold [&>h2]:mt-6 [&>h2]:mb-2 [&>h2]:text-ink [&>h3]:font-display [&>h3]:text-base [&>h3]:font-semibold [&>h3]:mt-4 [&>h3]:mb-1 [&>h3]:text-ink [&>p]:text-ink-muted [&>p]:leading-relaxed [&>ul]:list-disc [&>ul]:pl-5 [&>ul]:space-y-1.5 [&>ul>li]:text-ink-muted [&>strong]:text-ink [&>strong]:font-semibold"
                      dangerouslySetInnerHTML={{ __html: resumeData.analysis }}
                    />
                  ) : (
                    <p className="text-ink-muted italic font-mono text-xs">
                      No text breakdown generated.
                    </p>
                  )}
                </div>
              </motion.div>
            </div>
          ) : (
            /* Empty State Placeholder */
            <div className="bg-surface border border-border rounded-2xl p-12 text-center flex flex-col items-center justify-center min-h-[420px]">
              <div className="w-16 h-16 rounded-2xl bg-surface-2 text-ink-muted flex items-center justify-center mb-4">
                <svg className="w-8 h-8 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="font-display text-lg font-bold text-ink mb-1">
                Awaiting Resume File
              </h3>
              <p className="text-sm text-ink-muted max-w-sm">
                Upload your resume on the left to trigger the automated diagnostic scanner and view your full ATS breakdown.
              </p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
