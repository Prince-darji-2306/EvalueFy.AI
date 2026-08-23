import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useInterviewStore } from '../state/interviewStore';
import { submitAnswerReview, startCandidateInterview, startResumeInterview } from '../lib/api';

export function useInterviewFlow() {
  const navigate = useNavigate();
  const store = useInterviewStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackToast, setFeedbackToast] = useState(null); // transient review badge

  // Start standard interview with candidate name & role
  const initCandidateInterview = useCallback(
    async (name, role) => {
      try {
        store.setError(null);
        store.setCandidate(name, role, 'standard');
        const res = await startCandidateInterview(name, role);
        if (res.question) {
          store.startInterview(res.question, 'standard');
        } else {
          throw new Error('No question returned from server.');
        }
      } catch (err) {
        console.error('Init standard interview error:', err);
        store.setError(err.message || 'Failed to start interview.');
      }
    },
    [store]
  );

  // Start interview from parsed resume
  const initResumeInterview = useCallback(
    async (resumeText, name, role) => {
      try {
        store.setError(null);
        store.setCandidate(name, role, 'resume');
        const res = await startResumeInterview(resumeText, name, role);
        if (res.question) {
          store.startInterview(res.question, 'resume');
          navigate('/interview');
        } else {
          throw new Error('No question returned from resume generator.');
        }
      } catch (err) {
        console.error('Init resume interview error:', err);
        store.setError(err.message || 'Failed to generate interview from resume.');
      }
    },
    [store, navigate]
  );

  // Submit current answer for review
  const submitAnswer = useCallback(
    async (answerText) => {
      const currentQ = store.currentQuestion;
      if (!currentQ || !answerText.trim()) return;

      setIsSubmitting(true);
      store.setStatus('evaluating');
      store.setError(null);

      try {
        const result = await submitAnswerReview(currentQ, answerText.trim());

        if (result.error) {
          throw new Error(result.error);
        }

        // Show brief feedback toast/badge
        if (result.review) {
          setFeedbackToast({
            score: result.review.score,
            reason: result.review.reason,
            improvements: result.review.improvements,
          });
        }

        store.processReviewResult({
          review: result.review,
          next_question: result.next_question,
          is_follow_up: result.is_follow_up,
          interview_complete: result.interview_complete,
          report: result.report,
          currentAnswer: answerText.trim(),
        });

        if (result.interview_complete) {
          setTimeout(() => {
            navigate('/scorecard');
          }, 1200);
        }
      } catch (err) {
        console.error('Submit answer error:', err);
        store.setError(err.message || 'Error evaluating answer. Please retry.');
        store.setStatus('idle');
      } finally {
        setIsSubmitting(false);
      }
    },
    [store, navigate]
  );

  return {
    ...store,
    isSubmitting,
    feedbackToast,
    dismissFeedbackToast: () => setFeedbackToast(null),
    initCandidateInterview,
    initResumeInterview,
    submitAnswer,
  };
}
