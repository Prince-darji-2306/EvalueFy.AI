import { create } from 'zustand';

export const useInterviewStore = create((set, get) => ({
  // Candidate Info
  candidateName: 'Alex Mercer',
  candidateRole: 'Full Stack Engineer',
  interviewMode: 'standard', // 'standard' | 'resume'

  // Current Question State
  currentQuestion: null,
  questionHistory: [], // Array of { question, answer, review, isFollowUp }
  isFollowUp: false,
  questionNumber: 1,
  totalEstimatedQuestions: 5,

  // Status & Live Interactivity
  status: 'idle', // 'idle' | 'listening' | 'evaluating' | 'reviewed' | 'completed'
  liveTranscript: '',
  editableTranscript: '',
  isMicActive: false,
  errorMessage: null,

  // Review & Scorecard State
  lastReview: null, // { score, reason, improvements, follow_up }
  finalReport: null, // { candidate_name, role, average_score, total_questions, summary, feedback }

  // Resume Analyzer State
  resumeData: null, // { ats_score, analysis, resume_text, fileName }
  isResumeLoading: false,

  // Actions
  setCandidate: (name, role, mode = 'standard') =>
    set({
      candidateName: name,
      candidateRole: role,
      interviewMode: mode,
      totalEstimatedQuestions: mode === 'resume' ? 12 : 5,
    }),

  setResumeData: (data) =>
    set({
      resumeData: data,
    }),

  setResumeLoading: (loading) =>
    set({
      isResumeLoading: loading,
    }),

  startInterview: (initialQuestion, mode = 'standard') =>
    set({
      currentQuestion: initialQuestion,
      interviewMode: mode,
      questionNumber: 1,
      totalEstimatedQuestions: mode === 'resume' ? 12 : 5,
      questionHistory: [],
      lastReview: null,
      finalReport: null,
      status: 'idle',
      liveTranscript: '',
      editableTranscript: '',
      isFollowUp: false,
      errorMessage: null,
    }),

  setLiveTranscript: (text) =>
    set({
      liveTranscript: text,
      editableTranscript: text,
    }),

  setEditableTranscript: (text) =>
    set({
      editableTranscript: text,
    }),

  setMicActive: (isActive) =>
    set({
      isMicActive: isActive,
    }),

  setStatus: (status) =>
    set({
      status,
    }),

  setError: (msg) =>
    set({
      errorMessage: msg,
    }),

  processReviewResult: ({ review, next_question, is_follow_up, interview_complete, report, currentAnswer }) => {
    const state = get();
    const currentQ = state.currentQuestion;
    const historyEntry = {
      question: currentQ,
      answer: currentAnswer,
      review: review || null,
      isFollowUp: state.isFollowUp,
    };

    const newHistory = [...state.questionHistory, historyEntry];

    if (interview_complete || report) {
      // If report is not already populated with averages, construct fallback
      let reportData = report;
      if (!reportData) {
        const scores = newHistory.map((h) => h.review?.score).filter((s) => typeof s === 'number');
        const avg = scores.length ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : '0.0';
        reportData = {
          candidate_name: state.candidateName,
          role: state.candidateRole,
          average_score: Number(avg),
          total_questions: newHistory.length,
          summary: `Interview session completed across ${newHistory.length} question iterations with an average diagnostic score of ${avg}/10.`,
          feedback: newHistory.map((h) => ({
            question: h.question,
            score: h.review?.score || 0,
            improvements: h.review?.improvements || 'No specific improvements provided.',
          })),
        };
      }

      set({
        questionHistory: newHistory,
        lastReview: review,
        finalReport: reportData,
        currentQuestion: null,
        status: 'completed',
        liveTranscript: '',
        editableTranscript: '',
        isMicActive: false,
      });
    } else {
      set({
        questionHistory: newHistory,
        lastReview: review,
        currentQuestion: next_question || 'Next question loading...',
        isFollowUp: !!is_follow_up,
        questionNumber: state.questionNumber + (is_follow_up ? 0 : 1),
        status: 'idle',
        liveTranscript: '',
        editableTranscript: '',
        isMicActive: false,
      });
    }
  },

  resetSession: () =>
    set({
      currentQuestion: null,
      questionHistory: [],
      isFollowUp: false,
      questionNumber: 1,
      status: 'idle',
      liveTranscript: '',
      editableTranscript: '',
      isMicActive: false,
      lastReview: null,
      finalReport: null,
      errorMessage: null,
    }),
}));
