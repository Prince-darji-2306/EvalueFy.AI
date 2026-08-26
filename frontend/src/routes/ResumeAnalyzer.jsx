import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
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
        if (response.analysis.name && response.analysis.name !== 'Candidate') {
          setCandidateName(response.analysis.name);
        }
        if (response.analysis.role && response.analysis.role !== 'Software Engineer') {
          setTargetRole(response.analysis.role);
        }
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

  // Helper for dynamic tier styling
  const getTierMeta = (score) => {
    if (score === null) return null;
    if (score >= 80) {
      return {
        badge: 'OPTIMIZED TIER (TOP 10%)',
        badgeClass: 'bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 border-emerald-500/25',
        title: 'High ATS Screening Compatibility',
        desc: 'Strong keyword match, clean single-column hierarchy, and quantifiable impact across sections.',
        keywordMatch: '92% Strong',
        formatting: 'Clean & Structured',
        impactScore: 'High Density',
      };
    }
    if (score >= 60) {
      return {
        badge: 'MODERATE TIER (POTENTIAL GAPS)',
        badgeClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25',
        title: 'Solid Foundation with Keyword Gaps',
        desc: 'Parsable structure detected, but missing critical role-specific keywords or quantifiable achievements.',
        keywordMatch: '68% Average',
        formatting: 'Acceptable',
        impactScore: 'Moderate',
      };
    }
    return {
      badge: 'ACTION REQUIRED (FILTER RISK)',
      badgeClass: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/25',
      title: 'High Screening Friction Detected',
      desc: 'Significant formatting, header parsing, or keyword density penalties detected that risk automated rejection.',
      keywordMatch: '45% Low',
      formatting: 'Complex / Table Risks',
      impactScore: 'Low Quantification',
    };
  };

  const tierMeta = getTierMeta(atsScore);

  return (
    <div className="min-h-screen bg-bg text-ink flex flex-col font-body">
      {/* Top Header Bar */}
      <header className="w-full max-w-7xl mx-auto px-6 py-5 flex items-center justify-between border-b border-border">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="p-2 rounded-xl bg-surface border border-border text-ink-muted hover:text-ink hover:border-cyan-pulse/50 transition-colors"
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
        {/* LEFT COLUMN: Resume Upload & Parameters (5 cols on lg) */}
        <section className="lg:col-span-5 space-y-6 lg:sticky lg:top-8">
          <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-border">
              <span className="font-mono text-xs uppercase tracking-wider text-ink-muted font-semibold">
                DOCUMENT INGESTION
              </span>
              {resumeData?.fileName && (
                <span className="font-mono text-xs text-cyan-pulse truncate max-w-[180px]">
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
                    className="w-full px-3.5 py-2 rounded-xl bg-surface-2 border border-border text-ink text-sm focus:outline-none focus:border-cyan-pulse font-sans transition-colors"
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
                    className="w-full px-3.5 py-2 rounded-xl bg-surface-2 border border-border text-ink text-sm focus:outline-none focus:border-cyan-pulse font-sans transition-colors"
                  />
                </div>

                {/* Primary CTA */}
                <motion.button
                  type="button"
                  onClick={handleStartInterviewFromResume}
                  disabled={isGeneratingQuestions}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  className="w-full mt-2 py-3.5 px-4 rounded-xl bg-gradient-to-r from-signal-indigo to-cyan-pulse/90 text-white font-medium text-sm flex items-center justify-center gap-2.5 shadow-lg shadow-cyan-pulse/15 hover:opacity-95 transition-all"
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
              {/* Refined ATS Score Showcase Card */}
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-surface via-surface to-surface-2 border border-border p-6 sm:p-8 shadow-sm"
              >
                <div className="flex flex-col sm:flex-row items-center justify-between gap-6 relative z-10">
                  <div className="flex-1 text-center sm:text-left space-y-2.5">
                    {tierMeta && (
                      <div className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider font-semibold px-2.5 py-1 rounded-full border mb-1">
                        <span className={`px-2 py-0.5 rounded-full border ${tierMeta.badgeClass}`}>
                          {tierMeta.badge}
                        </span>
                      </div>
                    )}

                    <h2 className="font-display text-xl sm:text-2xl font-bold text-ink leading-tight">
                      {tierMeta ? tierMeta.title : 'ATS Diagnostic Evaluation'}
                    </h2>
                    
                    <p className="text-xs sm:text-sm text-ink-muted leading-relaxed max-w-md">
                      {tierMeta ? tierMeta.desc : 'Evaluated for semantic keyword density, parsing hygiene, and recruiter readability.'}
                    </p>

                    {/* Mini Diagnostic Pillars */}
                    {tierMeta && (
                      <div className="pt-3 grid grid-cols-3 gap-2 border-t border-border/60">
                        <div className="bg-surface-2/60 rounded-lg p-2 text-left border border-border/40">
                          <div className="text-[10px] font-mono text-ink-muted uppercase">Keywords</div>
                          <div className="text-xs font-semibold text-ink font-mono mt-0.5">{tierMeta.keywordMatch}</div>
                        </div>
                        <div className="bg-surface-2/60 rounded-lg p-2 text-left border border-border/40">
                          <div className="text-[10px] font-mono text-ink-muted uppercase">Structure</div>
                          <div className="text-xs font-semibold text-ink font-mono mt-0.5">{tierMeta.formatting}</div>
                        </div>
                        <div className="bg-surface-2/60 rounded-lg p-2 text-left border border-border/40">
                          <div className="text-[10px] font-mono text-ink-muted uppercase">Impact</div>
                          <div className="text-xs font-semibold text-ink font-mono mt-0.5">{tierMeta.impactScore}</div>
                        </div>
                      </div>
                    )}
                  </div>

                  {atsScore !== null && (
                    <div className="flex-shrink-0 p-2">
                      <ScoreGauge
                        value={atsScore}
                        max={100}
                        size={148}
                        strokeWidth={9}
                        label="ATS Match"
                        unit="%"
                      />
                    </div>
                  )}
                </div>
              </motion.div>

              {/* Detailed Breakdown Report Container */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="bg-surface border border-border rounded-2xl p-6 sm:p-8 shadow-sm"
              >
                <div className="flex items-center justify-between pb-4 mb-6 border-b border-border">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-cyan-pulse animate-pulse" />
                    <h3 className="font-mono text-xs uppercase tracking-wider text-ink font-semibold">
                      DEEP SCAN REPORT & WHY MARKS WERE DEDUCTED
                    </h3>
                  </div>
                </div>

                {/* Render the backend analysis HTML cleanly */}
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
                <svg className="w-8 h-8 opacity-40 text-cyan-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
